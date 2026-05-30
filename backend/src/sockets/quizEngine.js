const Room = require('../models/Room');
const Question = require('../models/Question');
const PlayerSession = require('../models/PlayerSession');
const { calculateScore, formatLeaderboard } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * QuizEngine manages the live state for a single Room.
 *
 * Responsibilities:
 *  - Tracks which question is active
 *  - Runs the per-question countdown timer
 *  - Collects and scores answers as they arrive
 *  - Emits question, leaderboard-update, and quiz-end events
 *  - Persists scores and sessions to MongoDB
 *
 * One QuizEngine instance is created per room when the host starts the quiz,
 * and is stored in the quizEngines Map in quizHandler.js.
 */
class QuizEngine {
  /**
   * @param {string}   roomId    - MongoDB Room _id (string)
   * @param {Server}   io        - Socket.io Server instance
   * @param {number}   durationSec - Seconds per question
   */
  constructor(roomId, io, durationSec = 15) {
    this.roomId = roomId;
    this.io = io;
    this.durationSec = durationSec;
    this.durationMs = durationSec * 1000;

    this.questions = [];          // Populated on start()
    this.currentIndex = -1;       // Which question is active (-1 = not started)
    this.questionStartTime = null; // Date.now() when current question was sent

    // answeredThisQuestion: Set of userId strings who already answered
    this.answeredThisQuestion = new Set();

    // In-memory score map: userId → { username, avatar, score }
    this.scores = new Map();

    this.questionTimer = null;    // setTimeout handle for auto-advance
    this.isRunning = false;
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  /**
   * Load questions + player roster from DB, then send the first question.
   */
  async start() {
    const room = await Room.findById(this.roomId).populate('questions');
    if (!room) throw new Error(`Room ${this.roomId} not found`);

    this.questions = room.questions;
    if (!this.questions.length) throw new Error('Room has no questions');

    // Pre-populate score map from existing players
    room.players.forEach((p) => {
      this.scores.set(p.userId.toString(), {
        userId: p.userId.toString(),
        username: p.username,
        avatar: p.avatar,
        score: 0,
      });
    });

    // Mark room as live
    room.status = 'live';
    room.startedAt = new Date();
    await room.save();

    this.isRunning = true;
    logger.info(`QuizEngine started for room ${this.roomId}`);

    // Notify all clients the quiz is beginning
    this.io.to(this.roomId).emit('quiz-starting', {
      totalQuestions: this.questions.length,
      durationSec: this.durationSec,
    });

    // Short delay so clients can prepare the UI
    setTimeout(() => this._sendQuestion(), 3000);
  }

  // ── Question flow ─────────────────────────────────────────────────────────

  /**
   * Emits the current question to all room clients.
   * Options are sent WITHOUT the correct answer — revealed after the timer.
   */
  _sendQuestion() {
    if (!this.isRunning) return;

    this.currentIndex++;
    if (this.currentIndex >= this.questions.length) {
      return this._endQuiz();
    }

    const q = this.questions[this.currentIndex];
    this.answeredThisQuestion.clear();
    this.questionStartTime = Date.now();

    // Update room's currentQuestionIndex in DB (non-blocking)
    Room.findByIdAndUpdate(this.roomId, {
      currentQuestionIndex: this.currentIndex,
    }).exec();

    // Emit question payload (NO correctOptionIndex)
    this.io.to(this.roomId).emit('question', {
      questionIndex: this.currentIndex,
      totalQuestions: this.questions.length,
      questionId: q._id,
      questionText: q.questionText,
      options: q.options.map((o) => o.text),
      difficulty: q.difficulty,
      durationSec: this.durationSec,
    });

    logger.debug(`Room ${this.roomId}: sent question ${this.currentIndex + 1}/${this.questions.length}`);

    // Auto-advance after timer expires
    this.questionTimer = setTimeout(
      () => this._revealAnswer(),
      this.durationMs
    );
  }

  // ── Answer handling ───────────────────────────────────────────────────────

  /**
   * Called when a player submits an answer via socket.
   *
   * @param {string} userId          - Player's MongoDB user ID (string)
   * @param {number} selectedIndex   - 0-3 selected option index
   * @param {Object} sessionData     - { username, avatar } for score init
   */
  async handleAnswer(userId, selectedIndex, sessionData = {}) {
    if (!this.isRunning || this.currentIndex < 0) return;
    if (this.answeredThisQuestion.has(userId)) return; // No double answers

    this.answeredThisQuestion.add(userId);

    const q = this.questions[this.currentIndex];
    const isCorrect = selectedIndex === q.correctOptionIndex;
    const timeTakenMs = Date.now() - this.questionStartTime;
    const points = calculateScore(isCorrect, timeTakenMs, this.durationMs);

    // ── Update in-memory score ───────────────────────────────────────────
    if (!this.scores.has(userId)) {
      this.scores.set(userId, {
        userId,
        username: sessionData.username || 'Player',
        avatar: sessionData.avatar || null,
        score: 0,
      });
    }
    this.scores.get(userId).score += points;

    // ── Persist answer to PlayerSession (upsert) ─────────────────────────
    try {
      await PlayerSession.findOneAndUpdate(
        { userId, roomId: this.roomId },
        {
          $setOnInsert: { username: sessionData.username || 'Player' },
          $push: {
            answers: {
              questionId: q._id,
              questionIndex: this.currentIndex,
              selectedOptionIndex: selectedIndex,
              isCorrect,
              timeTakenMs,
              pointsEarned: points,
            },
          },
          $inc: { totalScore: points },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      logger.error(`Failed to persist answer for user ${userId}: ${err.message}`);
    }

    // ── Broadcast live leaderboard update ────────────────────────────────
    const leaderboard = formatLeaderboard(Array.from(this.scores.values()));
    this.io.to(this.roomId).emit('leaderboard-update', { leaderboard });

    // If everyone has answered, advance immediately
    if (this.answeredThisQuestion.size >= this.scores.size) {
      clearTimeout(this.questionTimer);
      this._revealAnswer();
    }
  }

  // ── Reveal & advance ──────────────────────────────────────────────────────

  /**
   * Reveals the correct answer + explanation, then schedules the next question.
   */
  _revealAnswer() {
    if (!this.isRunning) return;
    clearTimeout(this.questionTimer); // No-op if already cleared

    const q = this.questions[this.currentIndex];

    this.io.to(this.roomId).emit('answer-reveal', {
      questionIndex: this.currentIndex,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      leaderboard: formatLeaderboard(Array.from(this.scores.values())),
    });

    // Delay before next question (gives UI time to show answer)
    const isLast = this.currentIndex === this.questions.length - 1;
    setTimeout(() => {
      if (isLast) {
        this._endQuiz();
      } else {
        this.io.to(this.roomId).emit('next-question', {
          nextIndex: this.currentIndex + 1,
        });
        this._sendQuestion();
      }
    }, 4000);
  }

  // ── End quiz ──────────────────────────────────────────────────────────────

  /**
   * Finalises the quiz: persists ranks, marks room completed, emits quiz-end.
   */
  async _endQuiz() {
    if (!this.isRunning) return;
    this.isRunning = false;
    clearTimeout(this.questionTimer);

    const finalLeaderboard = formatLeaderboard(Array.from(this.scores.values()));

    // ── Persist final scores & ranks to DB ───────────────────────────────
    try {
      const room = await Room.findById(this.roomId);
      if (room) {
        room.status = 'completed';
        room.endedAt = new Date();
        finalLeaderboard.forEach(({ userId, score, rank }) => {
          room.addScore(userId, 0); // ensure player exists
          const p = room.getPlayer(userId);
          if (p) p.score = score;
        });
        await room.save();
      }

      // Update PlayerSession finalRank for each player
      const rankUpdates = finalLeaderboard.map(({ userId, rank }) =>
        PlayerSession.findOneAndUpdate(
          { userId, roomId: this.roomId },
          { finalRank: rank, completedAt: new Date() }
        ).exec()
      );
      await Promise.all(rankUpdates);

      // Update User.stats for each player
      const winner = finalLeaderboard[0];
      const User = require('../models/User');
      const userUpdates = finalLeaderboard.map(async ({ userId, score }) => {
        const user = await User.findById(userId);
        if (user) {
          await user.updateStats(score, userId === winner?.userId);
        }
      });
      await Promise.allSettled(userUpdates);

    } catch (err) {
      logger.error(`Error finalising quiz for room ${this.roomId}: ${err.message}`);
    }

    // ── Emit quiz-end to all clients ─────────────────────────────────────
    this.io.to(this.roomId).emit('quiz-end', {
      finalLeaderboard,
      roomId: this.roomId,
    });

    logger.info(`Quiz ended for room ${this.roomId}. Winner: ${finalLeaderboard[0]?.username}`);
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  /**
   * Registers a player in the score map when they join mid-session or reconnect.
   */
  registerPlayer(userId, username, avatar) {
    if (!this.scores.has(userId)) {
      this.scores.set(userId, { userId, username, avatar, score: 0 });
    }
  }

  /**
   * Called from the host socket event to trigger manual advance.
   */
  forceNext() {
    if (!this.isRunning) return;
    clearTimeout(this.questionTimer);
    this._revealAnswer();
  }
}

module.exports = QuizEngine;

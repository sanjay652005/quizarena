const Room = require('../models/Room');
const QuizEngine = require('./quizEngine');
const { formatLeaderboard } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Map<roomId, QuizEngine>
 * Stores live engine instances for active quiz rooms.
 * Cleared when the quiz ends.
 */
const quizEngines = new Map();

/**
 * Registers all Socket.io event handlers for one connected client.
 *
 * Events handled:
 *   join-room        → player/host joins the socket room
 *   start-quiz       → host starts the quiz (creates QuizEngine)
 *   submit-answer    → player submits an answer
 *   force-next       → host manually advances to next question
 *   leave-room       → explicit disconnect from a room
 *   disconnect       → socket closed (mark player offline)
 *
 * @param {Socket} socket - Authenticated socket (socket.user set by middleware)
 * @param {Server} io     - Socket.io Server instance
 */
const registerQuizHandlers = (socket, io) => {
  const { user } = socket; // Injected by socketAuthMiddleware

  // ── join-room ─────────────────────────────────────────────────────────────
  // Client sends: { roomCode }
  socket.on('join-room', async ({ roomCode }) => {
    try {
      if (!roomCode) return socket.emit('error', { message: 'Room code required' });

      const room = await Room.findOne({ code: roomCode.toUpperCase() });
      if (!room) return socket.emit('error', { message: 'Room not found' });

      const roomId = room._id.toString();

      // ── Join the socket.io room channel ──────────────────────────────
      await socket.join(roomId);
      socket.currentRoomId = roomId;
      socket.currentRoomCode = roomCode;

      // ── Update player's socketId in DB ───────────────────────────────
      await Room.findOneAndUpdate(
        { _id: roomId, 'players.userId': user._id },
        { $set: { 'players.$.socketId': socket.id, 'players.$.isConnected': true } }
      );

      // ── Register with engine if quiz is already live ──────────────────
      const engine = quizEngines.get(roomId);
      if (engine) {
        engine.registerPlayer(
          user._id.toString(),
          user.username,
          user.avatar
        );
      }

      // ── Notify room that someone joined ──────────────────────────────
      const updatedRoom = await Room.findById(roomId);
      io.to(roomId).emit('player-joined', {
        player: {
          userId: user._id,
          username: user.username,
          avatar: user.avatar,
        },
        players: updatedRoom.players,
        playerCount: updatedRoom.players.length,
      });

      // ── Send current room state back to the joining client ───────────
      socket.emit('room-state', {
        roomId,
        code: room.code,
        topic: room.topic,
        status: room.status,
        hostUsername: room.hostUsername,
        players: updatedRoom.players,
        questionCount: room.questions.length,
      });

      logger.info(`${user.username} joined room ${roomCode}`);
    } catch (err) {
      logger.error(`join-room error: ${err.message}`);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // ── start-quiz ────────────────────────────────────────────────────────────
  // Host only. Client sends: { roomId }
  socket.on('start-quiz', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.host.toString() !== user._id.toString()) {
        return socket.emit('error', { message: 'Only the host can start the quiz' });
      }
      if (room.status !== 'waiting') {
        return socket.emit('error', { message: 'Quiz is already running or completed' });
      }
      if (!room.questions.length) {
        return socket.emit('error', { message: 'Generate questions before starting' });
      }

      // ── Create and start engine ───────────────────────────────────────
      const engine = new QuizEngine(roomId, io, room.questionDurationSec);
      quizEngines.set(roomId, engine);

      // Clean up engine from map when quiz ends
      const originalEnd = engine._endQuiz.bind(engine);
      engine._endQuiz = async () => {
        await originalEnd();
        quizEngines.delete(roomId);
        logger.info(`Engine removed for room ${roomId}`);
      };

      await engine.start();
    } catch (err) {
      logger.error(`start-quiz error: ${err.message}`);
      socket.emit('error', { message: err.message || 'Failed to start quiz' });
    }
  });

  // ── submit-answer ─────────────────────────────────────────────────────────
  // Client sends: { roomId, selectedOptionIndex }
  socket.on('submit-answer', async ({ roomId, selectedOptionIndex }) => {
    try {
      const engine = quizEngines.get(roomId);
      if (!engine) return socket.emit('error', { message: 'Quiz is not active' });

      await engine.handleAnswer(
        user._id.toString(),
        selectedOptionIndex,
        { username: user.username, avatar: user.avatar }
      );

      // Ack back to the submitting player
      socket.emit('answer-received', {
        questionIndex: engine.currentIndex,
        selectedOptionIndex,
      });
    } catch (err) {
      logger.error(`submit-answer error: ${err.message}`);
      socket.emit('error', { message: 'Failed to record answer' });
    }
  });

  // ── force-next ────────────────────────────────────────────────────────────
  // Host only — manually skip to the next question
  socket.on('force-next', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room || room.host.toString() !== user._id.toString()) {
        return socket.emit('error', { message: 'Unauthorized' });
      }
      const engine = quizEngines.get(roomId);
      if (engine) engine.forceNext();
    } catch (err) {
      logger.error(`force-next error: ${err.message}`);
    }
  });

  // ── leave-room ────────────────────────────────────────────────────────────
  socket.on('leave-room', async ({ roomId }) => {
    try {
      await socket.leave(roomId);
      await _markPlayerDisconnected(roomId, user._id);
      io.to(roomId).emit('player-left', {
        userId: user._id,
        username: user.username,
      });
      socket.currentRoomId = null;
    } catch (err) {
      logger.error(`leave-room error: ${err.message}`);
    }
  });

  // ── disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    try {
      const roomId = socket.currentRoomId;
      if (roomId) {
        await _markPlayerDisconnected(roomId, user._id);
        io.to(roomId).emit('player-left', {
          userId: user._id,
          username: user.username,
        });
      }
      logger.info(`${user.username} disconnected`);
    } catch (err) {
      logger.error(`disconnect handler error: ${err.message}`);
    }
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const _markPlayerDisconnected = async (roomId, userId) => {
  await Room.findOneAndUpdate(
    { _id: roomId, 'players.userId': userId },
    {
      $set: {
        'players.$.isConnected': false,
        'players.$.socketId': null,
      },
    }
  );
};

module.exports = { registerQuizHandlers, quizEngines };

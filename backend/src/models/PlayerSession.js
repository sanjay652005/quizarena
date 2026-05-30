const mongoose = require('mongoose');

// Individual answer record for one question in one session
const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  questionIndex: { type: Number, required: true },
  selectedOptionIndex: { type: Number, default: null }, // null = unanswered (timeout)
  isCorrect: { type: Boolean, default: false },
  timeTakenMs: { type: Number, default: null }, // ms from question start to answer
  pointsEarned: { type: Number, default: 0 },
  answeredAt: { type: Date, default: Date.now },
});

/**
 * PlayerSession tracks a single player's full participation in one Room session.
 * One document per (player × room) pair.
 */
const playerSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: { type: String, required: true },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    totalScore: { type: Number, default: 0 },
    finalRank: { type: Number, default: null },
    answers: [answerSchema],
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound index — one session doc per player per room
playerSessionSchema.index({ userId: 1, roomId: 1 }, { unique: true });

// ── Method: record one answer ─────────────────────────────────────────────────
playerSessionSchema.methods.recordAnswer = function (answerData) {
  this.answers.push(answerData);
  this.totalScore += answerData.pointsEarned || 0;
};

module.exports = mongoose.model('PlayerSession', playerSessionSchema);

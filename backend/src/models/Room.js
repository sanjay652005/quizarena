const mongoose = require('mongoose');

// Embedded sub-doc for each player inside a room
const playerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  avatar: { type: String, default: null },
  socketId: { type: String, default: null },
  score: { type: Number, default: 0 },
  isConnected: { type: Boolean, default: true },
  joinedAt: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hostUsername: { type: String, required: true },
    topic: {
      type: String,
      required: [true, 'Quiz topic is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'live', 'completed'],
      default: 'waiting',
    },
    players: [playerSchema],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    // Runtime state — which question is currently active (index, not ID)
    currentQuestionIndex: { type: Number, default: -1 },
    maxPlayers: { type: Number, default: 50 },
    questionDurationSec: { type: Number, default: 15 },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Virtual: player count ────────────────────────────────────────────────────
roomSchema.virtual('playerCount').get(function () {
  return this.players.length;
});

// ── Helper: find a player in this room by userId ─────────────────────────────
roomSchema.methods.getPlayer = function (userId) {
  return this.players.find((p) => p.userId.toString() === userId.toString());
};

// ── Helper: update a player's score ─────────────────────────────────────────
roomSchema.methods.addScore = function (userId, points) {
  const player = this.getPlayer(userId);
  if (player) player.score += points;
};

module.exports = mongoose.model('Room', roomSchema);

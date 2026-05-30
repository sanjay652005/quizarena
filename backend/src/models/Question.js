const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false },
});

const questionSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      validate: {
        validator: (opts) => opts.length === 4,
        message: 'Each question must have exactly 4 options',
      },
    },
    // Index of the correct option (0-3) — denormalized for fast lookup during quiz
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      default: null, // Shown after the answer is revealed
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    // Reference to the Room that generated/uses this question set
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    // AI-generated flag for analytics
    aiGenerated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);

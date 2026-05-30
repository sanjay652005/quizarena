const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Room = require('../models/Room');
const { generateQuiz } = require('../services/aiService');

/**
 * POST /api/quiz/generate
 * Host triggers AI question generation for their room.
 * Body: { topic, roomId }
 *
 * Flow:
 *   1. Verify the requesting user is the host of the room
 *   2. Call Claude AI to generate 10 MCQs
 *   3. Persist questions & attach their IDs to the room doc
 *   4. Return questions (without exposing correctOptionIndex to players — that
 *      happens only through Socket events during the live quiz)
 */
const generate = catchAsync(async (req, res) => {
  const { topic, roomId } = req.body;

  // ── Verify room belongs to this host ───────────────────────────────────
  const room = await Room.findById(roomId);
  if (!room) throw new AppError('Room not found.', 404);
  if (room.host.toString() !== req.user._id.toString()) {
    throw new AppError('Only the host of this room can generate questions.', 403);
  }
  if (room.status !== 'waiting') {
    throw new AppError('Questions can only be generated before the quiz starts.', 400);
  }

  // ── Generate via AI ────────────────────────────────────────────────────
  const questions = await generateQuiz(topic, roomId);

  // ── Attach question IDs to the room ───────────────────────────────────
  room.questions = questions.map((q) => q._id);
  room.topic = topic; // Allow overriding topic at generate time
  await room.save();

  res.status(200).json({
    status: 'success',
    message: `${questions.length} questions generated successfully.`,
    data: {
      questionCount: questions.length,
      // Strip correct answers — clients get them only during the live quiz
      questions: questions.map((q) => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options.map((o) => ({ text: o.text })),
        difficulty: q.difficulty,
      })),
    },
  });
});

module.exports = { generate };

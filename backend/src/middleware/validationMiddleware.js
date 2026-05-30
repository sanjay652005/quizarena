const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Runs after express-validator chain.
 * If there are validation errors, throws an AppError with all messages joined.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join('. ');
    return next(new AppError(messages, 422));
  }
  next();
};

// ── Auth validation chains ────────────────────────────────────────────────────

const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3–20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .optional()
    .isIn(['host', 'player'])
    .withMessage('Role must be "host" or "player"'),
];

const loginRules = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Room validation chains ────────────────────────────────────────────────────

const createRoomRules = [
  body('topic')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Topic must be 3–100 characters'),
  body('maxPlayers')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('maxPlayers must be between 2 and 100'),
  body('questionDurationSec')
    .optional()
    .isInt({ min: 5, max: 60 })
    .withMessage('Question duration must be 5–60 seconds'),
];

// ── Quiz validation chains ────────────────────────────────────────────────────

const generateQuizRules = [
  body('topic')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Topic must be 3–100 characters'),
  body('roomId')
    .notEmpty()
    .withMessage('roomId is required')
    .isMongoId()
    .withMessage('roomId must be a valid MongoDB ObjectId'),
];

// ── Email invite validation ───────────────────────────────────────────────────

const inviteRules = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('roomCode').trim().notEmpty().withMessage('Room code is required'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createRoomRules,
  generateQuizRules,
  inviteRules,
};

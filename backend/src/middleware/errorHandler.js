const logger = require('../utils/logger');

/**
 * Normalises Mongoose/JWT/Validation errors into our AppError shape,
 * then sends a consistent JSON error response to the client.
 *
 * In production, unexpected (non-operational) errors are hidden from the client.
 */

// ── Mongoose: duplicate key ───────────────────────────────────────────────────
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return {
    statusCode: 409,
    message: `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" is already taken.`,
  };
};

// ── Mongoose: validation errors ──────────────────────────────────────────────
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return { statusCode: 400, message: messages.join('. ') };
};

// ── Mongoose: cast error (bad ObjectId) ──────────────────────────────────────
const handleCastError = (err) => ({
  statusCode: 400,
  message: `Invalid value for field "${err.path}": ${err.value}`,
});

// ── Express-validator array errors ───────────────────────────────────────────
const handleExpressValidatorErrors = (errors) => ({
  statusCode: 422,
  message: errors.map((e) => e.msg).join('. '),
});

const errorHandler = (err, req, res, next) => {
  // Default to 500
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Normalise known error types ───────────────────────────────────────────
  if (err.code === 11000) {
    ({ statusCode, message } = handleDuplicateKeyError(err));
  } else if (err.name === 'ValidationError') {
    ({ statusCode, message } = handleValidationError(err));
  } else if (err.name === 'CastError') {
    ({ statusCode, message } = handleCastError(err));
  } else if (Array.isArray(err.errors)) {
    // express-validator errors array injected as err.errors
    ({ statusCode, message } = handleExpressValidatorErrors(err.errors));
  }

  // Always log server errors (5xx) with stack trace
  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  }

  // In production, don't leak stack traces for unexpected errors
  const isDev = process.env.NODE_ENV === 'development';
  const isOperational = err.isOperational;

  res.status(statusCode).json({
    status: String(statusCode).startsWith('4') ? 'fail' : 'error',
    message: isDev || isOperational ? message : 'Something went wrong. Please try again.',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;

/**
 * Operational error with HTTP status.
 * Used throughout controllers/services to produce consistent error responses.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Flag so global handler knows this is expected
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

/**
 * Eliminates try/catch boilerplate in async Express handlers.
 * Any thrown error is automatically forwarded to next() → global error handler.
 */
const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = catchAsync;

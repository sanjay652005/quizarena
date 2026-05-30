const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches the decoded user object to req.user.
 */
const protect = catchAsync(async (req, res, next) => {
  // 1. Extract token from header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please authenticate.', 401));
  }

  // 2. Verify token signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  // 3. Check the user still exists in DB (handles deleted accounts)
  const currentUser = await User.findById(decoded.id);
  if (!currentUser || !currentUser.isActive) {
    return next(new AppError('The user associated with this token no longer exists.', 401));
  }

  // 4. Attach to request for downstream handlers
  req.user = currentUser;
  next();
});

/**
 * Role-based access guard.
 * Usage: restrictTo('host')  OR  restrictTo('host', 'player')
 *
 * Must be used AFTER protect middleware.
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permission to perform this action.', 403)
    );
  }
  next();
};

module.exports = { protect, restrictTo };

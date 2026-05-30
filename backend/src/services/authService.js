const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Signs a JWT for the given user ID.
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Registers a new user, returns { user, token }.
 */
const registerUser = async ({ username, email, password, role }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    if (existing.email === email) throw new AppError('Email is already registered.', 409);
    throw new AppError('Username is already taken.', 409);
  }

  const user = await User.create({ username, email, password, role: role || 'player' });
  const token = signToken(user._id);

  // Strip sensitive fields before returning
  user.password = undefined;
  return { user, token };
};

/**
 * Authenticates a user by email/password, returns { user, token }.
 */
const loginUser = async ({ email, password }) => {
  // Explicitly select password (it's excluded by default in the schema)
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Incorrect email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact support.', 403);
  }

  const token = signToken(user._id);
  user.password = undefined;
  return { user, token };
};

module.exports = { signToken, registerUser, loginUser };

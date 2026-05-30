const catchAsync = require('../utils/catchAsync');
const { registerUser, loginUser } = require('../services/authService');

/**
 * POST /api/auth/register
 * Body: { username, email, password, role? }
 */
const register = catchAsync(async (req, res) => {
  const { username, email, password, role } = req.body;
  const { user, token } = await registerUser({ username, email, password, role });

  res.status(201).json({
    status: 'success',
    message: 'Account created successfully.',
    data: { user, token },
  });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await loginUser({ email, password });

  res.status(200).json({
    status: 'success',
    message: 'Logged in successfully.',
    data: { user, token },
  });
});

/**
 * GET /api/auth/me
 * Protected — returns current user profile.
 */
const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
});

module.exports = { register, login, getMe };

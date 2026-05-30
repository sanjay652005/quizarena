const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Socket.io middleware — runs before any event handler.
 * Extracts and verifies the JWT from the handshake auth object.
 * Attaches `socket.user` on success, or calls next(err) on failure.
 *
 * Client sends:  socket = io(URL, { auth: { token: 'Bearer <jwt>' } })
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const raw = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
    if (!raw) return next(new Error('Authentication required'));

    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return next(new Error('User not found'));

    socket.user = user; // Attach for all downstream handlers
    next();
  } catch (err) {
    logger.warn(`Socket auth failed: ${err.message}`);
    next(new Error('Invalid or expired token'));
  }
};

module.exports = socketAuthMiddleware;

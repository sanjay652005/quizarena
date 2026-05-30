const socketAuthMiddleware = require('./socketAuth');
const { registerQuizHandlers } = require('./quizHandler');
const logger = require('../utils/logger');

/**
 * Initialises Socket.io on the given `io` instance.
 * Applies authentication middleware and registers all event handlers.
 *
 * @param {Server} io - Socket.io Server instance
 */
const initSockets = (io) => {
  // ── Global auth middleware (runs before any connection) ───────────────────
  io.use(socketAuthMiddleware);

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.user?.username})`);

    // Register all quiz-specific events for this socket
    registerQuizHandlers(socket, io);
  });

  logger.info('Socket.io initialised');
};

module.exports = initSockets;

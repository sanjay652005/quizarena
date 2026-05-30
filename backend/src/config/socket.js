const { Server } = require('socket.io');

/**
 * Creates and configures the Socket.io server.
 * Attached to the existing HTTP server so both Express and WS share the port.
 */
const createSocketServer = (httpServer) => {
  return new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });
};

module.exports = createSocketServer;

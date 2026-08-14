let io;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CUSTOMER_FRONTEND_URL || 'http://localhost:3000',
        process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001',
      ],
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room based on user type
    socket.on('join', (data) => {
      if (data.role === 'admin') {
        socket.join('admin-room');
      }
      if (data.customerId) {
        socket.join(`customer-${data.customerId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initSocket, getIO };

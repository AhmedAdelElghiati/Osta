const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Job = require('../models/Job');
const DirectConversation = require('../models/DirectConversation');
const User = require('../models/User');

const attachChatSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:4200',
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select('_id role isActive isBanned');
      if (!user || !user.isActive || user.isBanned || !['customer', 'artisan'].includes(user.role)) {
        return next(new Error('Unauthorized'));
      }

      socket.data.user = { id: String(user._id), role: user.role };
      return next();
    } catch (_error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.user.id}`);
    socket.on('chat:join', async (jobId) => {
      const direct = typeof jobId === 'string' && jobId.startsWith('direct:');
      const id = direct ? jobId.slice(7) : jobId;
      if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
        socket.emit('chat:error', { message: 'المحادثة دي مش موجودة.' });
        return;
      }

      try {
        const user = await User.findById(socket.data.user.id).select('isActive isBanned');
        if (!user || !user.isActive || user.isBanned) { socket.disconnect(true); return; }
        const ownerField = socket.data.user.role === 'customer' ? 'customerId' : 'artisanId';
        const job = await (direct ? DirectConversation : Job).findOne({ _id: id, [ownerField]: socket.data.user.id }).select('_id');
        if (!job) {
          socket.emit('chat:error', { message: 'غير مسموح بفتح المحادثة دي.' });
          return;
        }

        socket.join(`${direct ? 'direct' : 'job'}:${job._id}`);
        socket.emit('chat:joined', { jobId });
      } catch (_error) {
        socket.emit('chat:error', { message: 'تعذر الاتصال بالمحادثة.' });
      }
    });

    socket.on('chat:leave', (jobId) => {
      if (typeof jobId === 'string' && jobId.startsWith('direct:') && mongoose.isValidObjectId(jobId.slice(7))) {
        socket.leave(jobId); return;
      }
      if (typeof jobId === 'string' && mongoose.isValidObjectId(jobId)) {
        socket.leave(`job:${jobId}`);
      }
    });
  });

  app.set('io', io);
  return io;
};

module.exports = { attachChatSocket };

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const User = require('../user/user.model');
const TourJourney = require('./tourJourney.model');
const permissionService = require('../../services/permissionService');
const { canUserViewJourney } = require('./journey.helper');

/**
 * Khởi tạo Socket.IO cho module Hành trình Tour
 * - Xác thực JWT khi client kết nối
 * - Kiểm tra quyền xem hành trình ở backend trước khi cho phép join room `journey:{journeyId}`
 */
function initJourneySocket(io) {
  if (!io) return;

  // Middleware xác thực JWT cho kết nối Socket.IO
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization || '';
      const rawToken =
        socket.handshake.auth?.token ||
        (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!rawToken) {
        return next(new Error('Unauthorized: Thiếu token xác thực'));
      }

      const decoded = jwt.verify(rawToken, JWT_SECRET);
      const user = await User.findOne({ _id: decoded.id, deleted_at: null })
        .populate('role_id')
        .select('-password_hash');

      if (!user || user.status !== 'ACTIVE') {
        return next(new Error('Unauthorized: Tài khoản không hợp lệ hoặc bị khóa'));
      }

      user.permissions = await permissionService.getEffectivePermissions(user);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Unauthorized: Token không hợp lệ hoặc đã hết hạn'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('journey:join', async (payload, callback) => {
      try {
        const journeyId = typeof payload === 'string' ? payload : payload?.journeyId;
        if (!journeyId) {
          if (typeof callback === 'function') callback({ ok: false, message: 'Thiếu journeyId' });
          return;
        }

        const journey = await TourJourney.findOne({ _id: journeyId, deleted_at: null }).lean();
        if (!journey) {
          if (typeof callback === 'function') callback({ ok: false, message: 'Hành trình không tồn tại' });
          return;
        }

        const allowed = await canUserViewJourney(socket.user, journey);
        if (!allowed) {
          if (typeof callback === 'function') {
            callback({ ok: false, message: 'Bạn không có quyền theo dõi hành trình này' });
          }
          return;
        }

        const room = `journey:${journey._id.toString()}`;
        await socket.join(room);
        if (typeof callback === 'function') callback({ ok: true, room });
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ ok: false, message: err.message || 'Không thể tham gia kênh hành trình' });
        }
      }
    });

    socket.on('journey:leave', async (payload) => {
      const journeyId = typeof payload === 'string' ? payload : payload?.journeyId;
      if (journeyId) {
        await socket.leave(`journey:${journeyId}`);
      }
    });
  });
}

/**
 * Helper phát sự kiện tới room của một hành trình
 * Luôn được gọi SAU KHI dữ liệu đã lưu thành công vào MongoDB.
 */
function emitJourneyEvent(io, journeyId, eventName, data) {
  if (!io || !journeyId) return;
  io.to(`journey:${journeyId.toString()}`).emit(eventName, {
    journeyId: journeyId.toString(),
    ...data,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  initJourneySocket,
  emitJourneyEvent,
};


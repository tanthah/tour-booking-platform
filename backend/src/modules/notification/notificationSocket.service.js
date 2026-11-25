const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const User = require('../user/user.model');

/**
 * Khởi tạo Socket.IO namespace cho thông báo Customer.
 *
 * Client kết nối:
 *   const socket = io(BASE_URL, { auth: { token: '<JWT>' } });
 *
 * Sau khi kết nối thành công, server tự join client vào room:
 *   `customer:{userId}`
 *
 * Client lắng nghe các event:
 *   - notification:new   → thông báo mới (lưu DB + bell)
 *   - notification:data  → cập nhật UI realtime (không lưu DB, vd: ảnh tour)
 */
function initNotificationSocket(io) {
  if (!io) return;

  // Middleware xác thực JWT trước khi accept kết nối socket
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization || '';
      const rawToken =
        socket.handshake.auth?.token ||
        (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!rawToken) {
        // Cho phép kết nối anonymous nhưng không join room customer
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(rawToken, JWT_SECRET);
      const user = await User.findOne({ _id: decoded.id, deleted_at: null })
        .select('_id roles role_id status full_name')
        .lean();

      if (!user || user.status !== 'ACTIVE') {
        socket.user = null;
        return next();
      }

      socket.user = user;
      next();
    } catch {
      // Token lỗi → vẫn kết nối nhưng không join room (graceful degradation)
      socket.user = null;
      next();
    }
  });

  io.on('connection', async (socket) => {
    // Nếu xác thực thành công → join room riêng của customer
    if (socket.user) {
      const userId = socket.user._id.toString();
      const room = `customer:${userId}`;
      await socket.join(room);
      console.log(`[NotificationSocket] User ${userId} joined room: ${room}`);
    }

    // Client yêu cầu join room thủ công (trường hợp token gửi muộn)
    socket.on('notification:join', async ({ token } = {}, callback) => {
      try {
        if (!token) {
          if (typeof callback === 'function') callback({ ok: false, message: 'Thiếu token' });
          return;
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ _id: decoded.id, deleted_at: null, status: 'ACTIVE' })
          .select('_id status')
          .lean();

        if (!user) {
          if (typeof callback === 'function') callback({ ok: false, message: 'Tài khoản không hợp lệ' });
          return;
        }

        const room = `customer:${user._id.toString()}`;
        await socket.join(room);
        socket.user = user;

        if (typeof callback === 'function') callback({ ok: true, room });
      } catch (err) {
        if (typeof callback === 'function') callback({ ok: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
      }
    });

    // Client rời room (logout)
    socket.on('notification:leave', async () => {
      if (socket.user) {
        const room = `customer:${socket.user._id.toString()}`;
        await socket.leave(room);
      }
    });

    socket.on('disconnect', () => {
      if (socket.user) {
        console.log(`[NotificationSocket] User ${socket.user._id} disconnected`);
      }
    });
  });
}

module.exports = { initNotificationSocket };

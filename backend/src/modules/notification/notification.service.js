const Notification = require('./notification.model');
const EVENTS = require('./notificationEvents');

// ============================================================
//  SINGLETON: lưu io instance được khởi tạo từ server.js
// ============================================================
let _io = null;

/**
 * Gọi 1 lần duy nhất trong server.js sau khi tạo io.
 * @param {object} io - Socket.IO Server instance
 */
const setIO = (io) => {
  _io = io;
};

// ============================================================
//  NỘI DUNG THÔNG BÁO theo từng sự kiện
//  Mỗi builder nhận data từ module nghiệp vụ → trả về { title, body, link }
// ============================================================

const contentBuilders = {
  // ----------------------------------------------------------
  // ĐẶT TOUR THÀNH CÔNG
  // data: { orderCode, tourName, totalAmount }
  // ----------------------------------------------------------
  [EVENTS.ORDER_CREATED]: (data) => ({
    title: 'Đặt tour thành công!',
    body: `Đơn hàng #${data.orderCode} cho tour "${data.tourName}" đã được tạo thành công. Vui lòng hoàn tất thanh toán để xác nhận chỗ.`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // THANH TOÁN THÀNH CÔNG
  // data: { orderCode, tourName, paidAmount, transactionId }
  // ----------------------------------------------------------
  [EVENTS.PAYMENT_SUCCESS]: (data) => ({
    title: 'Thanh toán thành công!',
    body: `Thanh toán ${data.paidAmount?.toLocaleString('vi-VN')}đ cho đơn #${data.orderCode} đã được xác nhận. Chúc bạn có chuyến đi vui vẻ!`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // HỆ THỐNG ĐÃ NHẬN YÊU CẦU HỦY CỦA KHÁCH
  // data: { orderCode, tourName }
  // ----------------------------------------------------------
  [EVENTS.CANCEL_REQUESTED]: (data) => ({
    title: 'Yêu cầu hủy đã được tiếp nhận',
    body: `Chúng tôi đã nhận được yêu cầu hủy tour cho đơn hàng #${data.orderCode}. Nhân viên sẽ xử lý và phản hồi sớm nhất có thể.`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // YÊU CẦU HỦY ĐƯỢC DUYỆT
  // data: { orderCode, refundAmount, cancelFeePercent }
  // ----------------------------------------------------------
  [EVENTS.CANCEL_APPROVED]: (data) => ({
    title: 'Yêu cầu hủy tour được chấp nhận',
    body: `Yêu cầu hủy đơn #${data.orderCode} đã được phê duyệt. ${data.refundAmount > 0
        ? `Số tiền hoàn trả: ${data.refundAmount?.toLocaleString('vi-VN')}đ (phí hủy ${data.cancelFeePercent}%).`
        : 'Đơn hàng chưa phát sinh thanh toán nên không có hoàn tiền.'
      }`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // YÊU CẦU HỦY BỊ TỪ CHỐI
  // data: { orderCode, reason }
  // ----------------------------------------------------------
  [EVENTS.CANCEL_REJECTED]: (data) => ({
    title: 'Yêu cầu hủy tour bị từ chối',
    body: `Yêu cầu hủy đơn #${data.orderCode} đã bị từ chối. Lý do: ${data.reason || 'Không có lý do cụ thể'}. Vui lòng liên hệ hỗ trợ nếu cần thêm thông tin.`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // HOÀN TIỀN THÀNH CÔNG
  // data: { orderCode, refundAmount, paymentMethod }
  // ----------------------------------------------------------
  [EVENTS.REFUND_SUCCESS]: (data) => ({
    title: 'Hoàn tiền thành công',
    body: `Số tiền ${data.refundAmount?.toLocaleString('vi-VN')}đ từ đơn #${data.orderCode} đã được hoàn trả thành công qua ${data.paymentMethod || 'phương thức thanh toán ban đầu'}.`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // LỊCH KHỞI HÀNH THAY ĐỔI
  // data: { tourName, oldDate, newDate, reason, departureId }
  // ----------------------------------------------------------
  [EVENTS.DEPARTURE_CHANGED]: (data) => ({
    title: 'Lịch khởi hành tour đã thay đổi',
    body: `Tour "${data.tourName}" của bạn có thay đổi lịch khởi hành. ${data.reason ? `Lý do: ${data.reason}.` : ''} Vui lòng kiểm tra chi tiết.`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // LỊCH KHỞI HÀNH BỊ HỦY
  // data: { tourName, departureDate, reason }
  // ----------------------------------------------------------
  [EVENTS.DEPARTURE_CANCELLED]: (data) => ({
    title: 'Chuyến đi đã bị hủy',
    body: `Rất tiếc, chuyến tour "${data.tourName}" đã bị hủy. ${data.reason ? `Lý do: ${data.reason}.` : ''} Chúng tôi sẽ liên hệ hỗ trợ bạn sớm nhất.`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // ĐIỂM TẬP TRUNG THAY ĐỔI
  // data: { tourName, oldMeetingPoint, newMeetingPoint, reason }
  // ----------------------------------------------------------
  [EVENTS.MEETING_POINT_CHANGED]: (data) => ({
    title: 'Cập nhật điểm tập trung',
    body: `Điểm tập trung cho tour "${data.tourName}" đã thay đổi sang: ${data.newMeetingPoint}. ${data.reason ? `Lý do: ${data.reason}.` : ''}`,
    link: `/don-hang/${data.orderId}`,
  }),

  // ----------------------------------------------------------
  // THIỆP CÁ NHÂN ĐƯỢC PHÁT HÀNH
  // data: { tourName, cardId }
  // ----------------------------------------------------------
  [EVENTS.CARD_PUBLISHED]: (data) => ({
    title: 'Thiệp kỷ niệm của bạn đã sẵn sàng!',
    body: `Thiệp điện tử cá nhân từ chuyến tour "${data.tourName}" đã được phát hành. Hãy xem và lưu lại kỷ niệm đẹp nhé!`,
    link: `/thiet/${data.cardId}`,
  }),

  // ----------------------------------------------------------
  // ẢNH HÀNH TRÌNH – KHÔNG LƯU BẢN GHI BELL, chỉ emit socket
  // ----------------------------------------------------------
  [EVENTS.PHOTO_ADDED]: () => null,
};

// ============================================================
//  HÀM CHÍNH: Gửi thông báo cho Customer
// ============================================================

/**
 * Tạo bản ghi thông báo trong MongoDB và emit socket đến client.
 *
 * @param {string} eventType  - Loại sự kiện (dùng NOTIFICATION_EVENTS constant)
 * @param {string} userId     - ObjectId (string) của người nhận
 * @param {object} data       - Dữ liệu ngữ cảnh của sự kiện
 * @returns {Promise<Notification|null>} Bản ghi đã lưu hoặc null nếu không lưu bell
 */
const sendCustomerNotification = async (eventType, userId, data = {}) => {
  try {
    const builder = contentBuilders[eventType];
    if (!builder) {
      console.warn(`[Notification] Không có builder cho eventType: ${eventType}`);
      return null;
    }

    const content = builder(data);

    // Sự kiện PHOTO_ADDED chỉ emit socket, không lưu DB
    if (!content) {
      emitToCustomer(userId, eventType, { eventType, ...data });
      return null;
    }

    // Lưu vào MongoDB
    const notification = await Notification.create({
      recipientId: userId,
      recipientType: 'customer',
      eventType,
      title: content.title,
      body: content.body,
      link: content.link || null,
      metadata: data,
      isRead: false,
    });

    // Emit socket realtime đến đúng room của user
    emitToCustomer(userId, 'notification:new', {
      _id: notification._id,
      eventType,
      title: content.title,
      body: content.body,
      link: content.link || null,
      metadata: data,
      isRead: false,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    // Không để lỗi thông báo làm vỡ luồng nghiệp vụ chính
    console.error(`[Notification] Lỗi gửi thông báo [${eventType}] cho user ${userId}:`, err.message);
    return null;
  }
};

/**
 * Emit socket đến room riêng của 1 customer.
 * Room name: `customer:{userId}`
 */
const emitToCustomer = (userId, eventName, payload) => {
  if (!_io || !userId) return;
  _io.to(`customer:${userId.toString()}`).emit(eventName, {
    ...payload,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================
//  CÁC HÀM TIỆN ÍCH CHO CONTROLLER (CRUD)
// ============================================================

/**
 * Lấy danh sách thông báo của 1 user, phân trang.
 */
const getNotificationsForUser = async (userId, { page = 1, limit = 20, isRead } = {}) => {
  const skip = (page - 1) * limit;
  const baseFilter = { recipientId: userId, recipientType: 'customer' };
  const filter = isRead === undefined ? baseFilter : { ...baseFilter, isRead };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...baseFilter, isRead: false }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
};

/**
 * Đếm số thông báo chưa đọc (dùng cho badge).
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({
    recipientId: userId,
    recipientType: 'customer',
    isRead: false,
  });
};

/**
 * Đánh dấu 1 thông báo đã đọc.
 * Chỉ cho phép nếu notification thuộc về userId.
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) {
    const err = new Error('Thông báo không tồn tại hoặc bạn không có quyền.');
    err.statusCode = 404;
    throw err;
  }
  return notification;
};

/**
 * Đánh dấu tất cả thông báo của user là đã đọc.
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipientId: userId, recipientType: 'customer', isRead: false },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
};

/**
 * Xóa 1 thông báo (chỉ chủ sở hữu).
 */
const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipientId: userId,
  });
  if (!notification) {
    const err = new Error('Thông báo không tồn tại hoặc bạn không có quyền.');
    err.statusCode = 404;
    throw err;
  }
  return notification;
};

module.exports = {
  setIO,
  sendCustomerNotification,
  emitToCustomer,
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

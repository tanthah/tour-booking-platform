const { sendMail } = require('../../config/mailer');
const { FRONTEND_URL } = require('../../config/env');
const User = require('../user/user.model');
const NotificationEmailLog = require('./notificationEmailLog.model');

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const formatMoney = (amount) => (
  Number.isFinite(Number(amount)) ? `${Number(amount).toLocaleString('vi-VN')}đ` : ''
);

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('vi-VN', { dateStyle: 'long', timeStyle: 'short' });
};

const absoluteUrl = (path) => {
  if (!path) return '';
  const base = (FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const renderEmail = ({ title, intro, details = [], ctaLabel, ctaPath, accent = '#ea580c' }) => {
  const rows = details
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([label, value]) => `
      <tr>
        <td style="padding:9px 12px;color:#64748b;border-bottom:1px solid #e2e8f0;width:38%;">${escapeHtml(label)}</td>
        <td style="padding:9px 12px;color:#1e293b;border-bottom:1px solid #e2e8f0;font-weight:600;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');
  const button = ctaLabel && ctaPath ? `
    <p style="margin:26px 0 8px;text-align:center;">
      <a href="${escapeHtml(absoluteUrl(ctaPath))}" style="display:inline-block;padding:12px 22px;border-radius:9px;background:${accent};color:#fff;text-decoration:none;font-weight:700;">${escapeHtml(ctaLabel)}</a>
    </p>
  ` : '';

  return `
    <div style="margin:0;padding:28px 12px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#334155;">
      <div style="max-width:600px;margin:0 auto;overflow:hidden;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
        <div style="padding:25px 28px;background:linear-gradient(135deg,${accent},#fb923c);color:#fff;">
          <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:.9;">TourGo</div>
          <h1 style="margin:8px 0 0;font-size:23px;line-height:1.35;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;color:#1e293b;font-size:16px;">Xin chào ${escapeHtml(intro.name || 'Quý khách')},</p>
          <p style="margin:0 0 20px;color:#475569;line-height:1.7;">${escapeHtml(intro.message || '')}</p>
          ${rows ? `<table role="presentation" style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;">${rows}</table>` : ''}
          ${button}
          ${intro.note ? `<p style="margin:22px 0 0;color:#64748b;font-size:13px;line-height:1.6;">${escapeHtml(intro.note)}</p>` : ''}
        </div>
        <div style="padding:16px 24px;background:#f8fafc;color:#94a3b8;text-align:center;font-size:12px;">© 2026 TourGo · Chúc bạn có những chuyến đi tuyệt vời.</div>
      </div>
    </div>
  `;
};

const orderPath = (data) => (data.orderId ? `/don-hang/${encodeURIComponent(data.orderId)}` : '/ho-so-ca-nhan?tab=orders');

const customerTemplates = {
  ORDER_CREATED: (data, user) => ({
    subject: `🎉 Đặt tour thành công${data.orderCode ? ` - ${data.orderCode}` : ''} | TourGo`,
    html: renderEmail({
      title: 'TourGo đã nhận đơn đặt tour của bạn',
      intro: { name: user.full_name, message: 'Đơn đặt tour của bạn đã được tạo. Vui lòng kiểm tra thông tin và hoàn tất thanh toán để giữ chỗ.' },
      details: [['Mã đơn', data.orderCode], ['Tour', data.tourName], ['Khởi hành', formatDate(data.departureDate)], ['Tổng tiền', formatMoney(data.totalAmount)]],
      ctaLabel: 'Xem đơn hàng',
      ctaPath: orderPath(data),
    }),
  }),
  PAYMENT_SUCCESS: (data, user) => ({
    subject: `✅ Thanh toán thành công${data.orderCode ? ` - ${data.orderCode}` : ''} | TourGo`,
    html: renderEmail({
      title: 'Thanh toán của bạn đã được xác nhận',
      intro: { name: user.full_name, message: 'TourGo đã nhận được khoản thanh toán cho đơn tour của bạn.' },
      details: [['Mã đơn', data.orderCode], ['Tour', data.tourName], ['Số tiền', formatMoney(data.paidAmount)], ['Phương thức', data.paymentMethod], ['Mã giao dịch', data.transactionId]],
      ctaLabel: 'Xem đơn hàng',
      ctaPath: orderPath(data),
    }),
  }),
  CANCEL_REQUESTED: (data, user) => ({
    subject: `Đã nhận yêu cầu hủy tour${data.orderCode ? ` - ${data.orderCode}` : ''} | TourGo`,
    html: renderEmail({
      title: 'TourGo đã nhận yêu cầu hủy',
      intro: { name: user.full_name, message: 'Yêu cầu hủy tour của bạn đã được ghi nhận. Chúng tôi sẽ cập nhật kết quả xử lý qua tài khoản và email này.' },
      details: [['Mã đơn', data.orderCode], ['Tour', data.tourName], ['Lý do', data.reason]],
      ctaLabel: 'Xem đơn hàng',
      ctaPath: orderPath(data),
    }),
  }),
  CANCEL_APPROVED: (data, user) => ({
    subject: `Yêu cầu hủy được chấp nhận${data.orderCode ? ` - ${data.orderCode}` : ''} | TourGo`,
    html: renderEmail({
      title: 'Yêu cầu hủy tour đã được chấp nhận',
      intro: { name: user.full_name, message: 'Yêu cầu hủy đơn tour của bạn đã được chấp nhận.' },
      details: [['Mã đơn', data.orderCode], ['Tour', data.tourName], ['Số tiền dự kiến hoàn', formatMoney(data.refundAmount)], ['Phí hủy', data.cancelFeePercent != null ? `${data.cancelFeePercent}%` : ''], ['Ghi chú', data.reason]],
      ctaLabel: 'Xem đơn hàng',
      ctaPath: orderPath(data),
    }),
  }),
  CANCEL_REJECTED: (data, user) => ({
    subject: `Cập nhật yêu cầu hủy${data.orderCode ? ` - ${data.orderCode}` : ''} | TourGo`,
    html: renderEmail({
      title: 'Yêu cầu hủy tour chưa được chấp nhận',
      intro: { name: user.full_name, message: 'Yêu cầu hủy đơn tour của bạn chưa được chấp nhận. Vui lòng xem lý do và liên hệ bộ phận hỗ trợ nếu cần.' },
      details: [['Mã đơn', data.orderCode], ['Tour', data.tourName], ['Lý do', data.reason]],
      ctaLabel: 'Xem đơn hàng',
      ctaPath: orderPath(data),
      accent: '#dc2626',
    }),
  }),
  REFUND_SUCCESS: (data, user) => ({
    subject: `💰 Hoàn tiền thành công${data.orderCode ? ` - ${data.orderCode}` : ''} | TourGo`,
    html: renderEmail({
      title: 'Khoản hoàn tiền đã được xử lý',
      intro: { name: user.full_name, message: 'Khoản tiền hoàn của bạn đã được xử lý thành công.' },
      details: [['Mã đơn', data.orderCode], ['Số tiền hoàn', formatMoney(data.refundAmount)], ['Phương thức', data.paymentMethod], ['Mã giao dịch', data.transactionId]],
      ctaLabel: 'Xem đơn hàng',
      ctaPath: orderPath(data),
    }),
  }),
  DEPARTURE_CHANGED: (data, user) => ({
    subject: `📢 Lịch khởi hành thay đổi${data.orderCode ? ` - ${data.orderCode}` : ''} | TourGo`,
    html: renderEmail({
      title: 'Lịch khởi hành tour đã thay đổi',
      intro: { name: user.full_name, message: 'TourGo cập nhật thông tin mới cho chuyến đi của bạn.' },
      details: [['Mã đơn', data.orderCode], ['Tour', data.tourName], ['Ngày cũ', formatDate(data.oldDate)], ['Ngày mới', formatDate(data.newDate)], ['Lý do', data.reason]],
      ctaLabel: 'Xem đơn hàng',
      ctaPath: orderPath(data),
    }),
  }),
  DEPARTURE_CANCELLED: (data, user) => ({
    subject: `Thông báo chuyến đi bị hủy${data.orderCode ? ` - ${data.orderCode}` : ''} | TourGo`,
    html: renderEmail({
      title: 'TourGo rất tiếc phải thông báo chuyến đi bị hủy',
      intro: { name: user.full_name, message: 'Chúng tôi sẽ liên hệ để hướng dẫn phương án đổi chuyến hoặc hoàn tiền.' },
      details: [['Mã đơn', data.orderCode], ['Tour', data.tourName], ['Ngày khởi hành', formatDate(data.departureDate)], ['Lý do', data.reason]],
      ctaLabel: 'Xem đơn hàng',
      ctaPath: orderPath(data),
      accent: '#dc2626',
    }),
  }),
  PASSWORD_CHANGED: (data, user) => ({
    subject: '🔒 Mật khẩu TourGo đã được thay đổi',
    html: renderEmail({
      title: 'Mật khẩu tài khoản đã thay đổi',
      details: [['Thời gian', formatDate(data.changedAt || new Date())]],
      intro: { name: user.full_name, message: 'Mật khẩu tài khoản TourGo của bạn vừa được cập nhật thành công.', note: 'Nếu bạn không thực hiện thay đổi này, hãy liên hệ bộ phận hỗ trợ ngay.' },
      accent: '#475569',
    }),
  }),
};

const getEventReference = (eventType, userId, data) => {
  const reference = data.eventId
    || data.transactionId
    || data.refundId
    || data.orderId
    || data.departureId
    || data.cardId
    || userId;
  const variation = eventType === 'DEPARTURE_CHANGED'
    ? `${data.oldDate || ''}:${data.newDate || ''}`
    : '';
  return `${eventType}:${userId}:${reference}:${variation}`;
};

const claimEmailLog = async (values) => {
  const existing = await NotificationEmailLog.findOne({ event_key: values.event_key });
  if (existing?.status === 'SENT') return null;
  if (existing?.status === 'SENDING' && Date.now() - existing.updated_at.getTime() < 5 * 60 * 1000) {
    return null;
  }

  if (existing) {
    return NotificationEmailLog.findOneAndUpdate(
      { _id: existing._id, status: existing.status, updated_at: existing.updated_at },
      { $set: { ...values, status: 'SENDING', last_error: null } },
      { new: true }
    );
  }

  try {
    return await NotificationEmailLog.create({ ...values, status: 'SENDING' });
  } catch (error) {
    if (error.code === 11000) return null;
    throw error;
  }
};

const sendCustomerEventEmail = async (eventType, userId, data = {}) => {
  const build = customerTemplates[eventType];
  if (!build || !userId) return null;

  const user = await User.findById(userId).select('email full_name').lean();
  if (!user) return null;
  const recipientEmail = data.recipientEmail || user.email;
  if (!recipientEmail) return null;
  const recipient = { ...user, full_name: data.recipientName || user.full_name };

  const { subject, html } = build(data, recipient);
  const eventKey = getEventReference(eventType, userId.toString(), data);
  const log = await claimEmailLog({
    event_key: eventKey,
    event_type: eventType,
    recipient_id: user._id,
    recipient_email: recipientEmail,
    subject,
  });
  if (!log) return null;

  try {
    const info = await sendMail(recipientEmail, subject, html);
    log.status = 'SENT';
    log.provider_message_id = info?.messageId || null;
    log.sent_at = new Date();
    log.last_error = null;
    await log.save();
    return info;
  } catch (error) {
    log.status = 'FAILED';
    log.last_error = error.message?.slice(0, 1000) || 'Gửi email thất bại';
    await log.save();
    throw error;
  }
};

module.exports = { sendCustomerEventEmail };

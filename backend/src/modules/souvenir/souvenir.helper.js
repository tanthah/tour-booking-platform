const Order = require('../order/order.model');
const TourDeparture = require('../tour/tourDeparture.model');
const TourJourney = require('../journey/tourJourney.model');
const permissionService = require('../../services/permissionService');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const cloudinary = require('../../config/cloudinary');

const VALID_ORDER_STATUSES = ['DEPOSIT_CONFIRMED', 'CONFIRMED', 'COMPLETED'];
const VALID_PAYMENT_STATUSES = ['DEPOSIT_PAID', 'PAID'];

/**
 * Tạo HTTP Error có statusCode tương thích với global error handler
 */
function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Kiểm tra người dùng có quyền Admin thiệp kỷ niệm không
 */
async function isSouvenirAdmin(user) {
  if (!user) return false;
  const roleCode = user.role_id?.code?.toLowerCase() || '';
  if (roleCode === 'admin') return true;
  if (Array.isArray(user.roles) && user.roles.includes('ADMIN')) return true;
  return await permissionService.hasPermission(user, PERMISSIONS.SOUVENIR_CARD_REVIEW);
}

/**
 * Kiểm tra người dùng có quyền Quản lý/Biên tập thiệp kỷ niệm không (Admin hoặc Staff)
 */
async function canManageSouvenir(user) {
  if (!user) return false;
  if (await isSouvenirAdmin(user)) return true;
  return await permissionService.hasPermission(user, PERMISSIONS.SOUVENIR_ALBUM_VIEW);
}

/**
 * Kiểm tra khách hàng có đơn đặt hợp lệ cho đợt khởi hành này không
 */
async function hasValidOrderForDeparture(userId, departureId) {
  if (!userId || !departureId) return false;
  const order = await Order.findOne({
    user_id: userId,
    'items.departure_id': departureId,
    order_status: { $in: VALID_ORDER_STATUSES },
    payment_status: { $in: VALID_PAYMENT_STATUSES },
    cancel_type: null,
  })
    .select('_id')
    .lean();
  return !!order;
}

/**
 * Lấy danh sách toàn bộ hành khách hợp lệ của một đợt khởi hành
 * Lọc theo departure_id trong items, loại bỏ các đơn đã hủy hoặc hoàn tiền (BR16)
 */
async function getValidDepartureCustomers(departureId) {
  if (!departureId) return [];

  const orders = await Order.find({
    'items.departure_id': departureId,
    order_status: { $in: VALID_ORDER_STATUSES },
    payment_status: { $in: VALID_PAYMENT_STATUSES },
    cancel_type: null,
  })
    .select('_id order_code user_id customer_info items booking_customers')
    .populate('user_id', 'full_name email phone')
    .lean();

  const customers = [];

  for (const order of orders) {
    // Tìm các items có departure_id khớp
    const matchingItemIds = new Set(
      (order.items || [])
        .filter((item) => item.departure_id && item.departure_id.toString() === departureId.toString())
        .map((item) => item._id.toString())
    );

    // Lọc booking_customers thuộc các item đó
    (order.booking_customers || []).forEach((bc) => {
      if (bc.order_item_id && matchingItemIds.has(bc.order_item_id.toString())) {
        customers.push({
          order_id: order._id,
          order_code: order.order_code,
          owner_user_id: order.user_id?._id || order.user_id,
          owner_email: order.user_id?.email || order.customer_info?.email || null,
          order_item_id: bc.order_item_id,
          booking_customer_id: bc._id,
          full_name: bc.full_name,
          phone: bc.phone,
          email: bc.email || order.customer_info?.email || null,
          date_of_birth: bc.date_of_birth,
          gender: bc.gender,
          id_number: bc.id_number,
          note: bc.note,
        });
      }
    });
  }

  return customers;
}

/**
 * Kiểm tra đợt khởi hành đã hoàn thành chưa (BR01)
 * Thỏa mãn nếu:
 * 1. TourDeparture status === 'COMPLETED'
 * HOẶC 2. TourJourney có status === 'COMPLETED' và completed_at != null
 */
async function isDepartureCompleted(departureId) {
  const departure = await TourDeparture.findById(departureId).lean();
  if (!departure || departure.deleted_at) {
    return { completed: false, departure: null, reason: 'Đợt khởi hành không tồn tại' };
  }

  if (departure.status === 'COMPLETED') {
    return { completed: true, departure };
  }

  const journey = await TourJourney.findOne({
    departure_id: departureId,
    deleted_at: null,
  }).lean();

  if (journey && journey.status === 'COMPLETED' && journey.completed_at) {
    return { completed: true, departure, journey };
  }

  return {
    completed: false,
    departure,
    journey,
    reason: 'Đợt khởi hành hoặc hành trình chưa ở trạng thái hoàn thành (COMPLETED)',
  };
}

/**
 * Tạo URL an toàn có chữ ký / có hạn dùng cho ảnh cá nhân
 * Ngăn chặn lộ URL tĩnh công khai của ảnh cá nhân (Security Requirement)
 */
function generateSecurePhotoUrl(photo, options = {}) {
  if (!photo || !photo.public_id) {
    return photo?.url || '';
  }

  // Nếu là ảnh công khai trong album chung (SHARED)
  if (photo.visibility === 'SHARED') {
    return photo.url;
  }

  // Nếu là ảnh cá nhân (PERSONAL_ONLY), tạo signed URL có hạn dùng (mặc định 1 giờ)
  const expiresInSeconds = options.expiresInSeconds || 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  try {
    return cloudinary.url(photo.public_id, {
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
      type: 'upload',
      transformation: options.transformation || [{ quality: 'auto', fetch_format: 'auto' }],
    });
  } catch (err) {
    // Fallback: bảo mật bằng proxy endpoint nội bộ
    return `/api/souvenirs/photos/${photo._id}/view`;
  }
}

/**
 * Render template lời chúc cá nhân hóa
 */
function renderGreetingTemplate(template, params = {}) {
  if (!template) return '';
  let result = template;
  result = result.replace(/\{\{\s*customer_name\s*\}\}/g, params.customer_name || 'Quý khách');
  result = result.replace(/\{\{\s*tour_name\s*\}\}/g, params.tour_name || 'chuyến đi');
  result = result.replace(/\{\{\s*departure_date\s*\}\}/g, params.departure_date || '');
  result = result.replace(/\{\{\s*departure_location\s*\}\}/g, params.departure_location || '');
  return result;
}

/**
 * Kiểm tra khách hàng có quyền xem thiệp không
 * Chỉ chủ đơn (order.user_id) và thiệp ở trạng thái PUBLISHED mới được xem (BR04, BR05, BR15)
 */
function canCustomerViewCard(user, card) {
  if (!user || !card) return false;
  if (card.status !== 'PUBLISHED') return false;
  if (card.deleted_at) return false;

  const ownerId = card.owner_user_id?._id
    ? card.owner_user_id._id.toString()
    : card.owner_user_id?.toString();

  return ownerId === user._id.toString();
}

/**
 * Kiểm tra khách hàng có quyền xem một ảnh cụ thể không
 */
async function canCustomerViewPhoto(user, photo, departureId) {
  if (!user || !photo) return false;
  if (photo.deleted_at) return false;

  // 1. Ảnh SHARED: Khách phải có ít nhất 1 thiệp PUBLISHED trong đợt khởi hành này (BR04)
  if (photo.visibility === 'SHARED') {
    return await hasValidOrderForDeparture(user._id, departureId || photo.departure_id);
  }

  // 2. Ảnh PERSONAL_ONLY: Khách phải là chủ đơn của khách được gắn trong assigned_customers (BR05)
  if (photo.visibility === 'PERSONAL_ONLY') {
    if (!Array.isArray(photo.assigned_customers) || photo.assigned_customers.length === 0) {
      return false;
    }

    // Kiểm tra xem user có phải chủ của bất kỳ order_id nào trong assigned_customers
    const assignedOrderIds = photo.assigned_customers.map((c) => c.order_id);
    const orderMatch = await Order.findOne({
      _id: { $in: assignedOrderIds },
      user_id: user._id,
      order_status: { $in: VALID_ORDER_STATUSES },
      payment_status: { $in: VALID_PAYMENT_STATUSES },
    })
      .select('_id')
      .lean();

    return !!orderMatch;
  }

  return false;
}

module.exports = {
  VALID_ORDER_STATUSES,
  VALID_PAYMENT_STATUSES,
  createHttpError,
  isSouvenirAdmin,
  canManageSouvenir,
  hasValidOrderForDeparture,
  getValidDepartureCustomers,
  isDepartureCompleted,
  generateSecurePhotoUrl,
  renderGreetingTemplate,
  canCustomerViewCard,
  canCustomerViewPhoto,
};


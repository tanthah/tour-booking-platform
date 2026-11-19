const Order = require('../order/order.model');
const TourJourney = require('./tourJourney.model');
const JourneyStop = require('./journeyStop.model');
const permissionService = require('../../services/permissionService');
const { PERMISSIONS } = require('../../utils/permissionCodes');

const VALID_CUSTOMER_ORDER_STATUSES = ['DEPOSIT_CONFIRMED', 'CONFIRMED', 'COMPLETED'];

/**
 * Kiểm tra user có quyền Admin hoặc journey.admin không
 */
async function isJourneyAdmin(user) {
  if (!user) return false;
  const roleCode = user.role_id?.code?.toLowerCase() || '';
  if (roleCode === 'admin') return true;
  if (Array.isArray(user.roles) && user.roles.includes('ADMIN')) return true;
  return await permissionService.hasPermission(user, PERMISSIONS.JOURNEY_ADMIN);
}

/**
 * Kiểm tra user có phải hướng dẫn viên được phân công của hành trình không
 */
function isAssignedGuide(user, journey) {
  if (!user || !journey || !journey.guide_id) return false;
  const guideId = journey.guide_id._id ? journey.guide_id._id.toString() : journey.guide_id.toString();
  return guideId === user._id.toString();
}

/**
 * Kiểm tra khách hàng có đơn đặt tour hợp lệ cho đợt khởi hành này không
 */
async function hasValidOrderForDeparture(userId, departureId) {
  if (!userId || !departureId) return false;
  const order = await Order.findOne({
    user_id: userId,
    'items.departure_id': departureId,
    order_status: { $in: VALID_CUSTOMER_ORDER_STATUSES },
  })
    .select('_id')
    .lean();
  return !!order;
}

/**
 * Kiểm tra quyền xem hành trình (Admin, Guide được phân công, hoặc Khách hàng có đơn hợp lệ)
 */
async function canUserViewJourney(user, journey) {
  if (!user || !journey) return false;
  if (await isJourneyAdmin(user)) return true;
  if (isAssignedGuide(user, journey)) return true;
  const depId = journey.departure_id?._id || journey.departure_id;
  return await hasValidOrderForDeparture(user._id, depId);
}

/**
 * Lấy danh sách user_id khách hàng có đơn hợp lệ cho đợt khởi hành
 */
async function getJourneyRecipientIds(departureId) {
  const orders = await Order.find({
    'items.departure_id': departureId,
    order_status: { $in: VALID_CUSTOMER_ORDER_STATUSES },
  })
    .select('user_id')
    .lean();

  const uniqueIds = new Set();
  for (const order of orders) {
    if (order.user_id) {
      uniqueIds.add(order.user_id.toString());
    }
  }
  return Array.from(uniqueIds);
}

/**
 * Tính toán và cập nhật tiến độ hành trình:
 * completed / (total - skipped) * 100%
 */
async function recalculateJourneyProgress(journeyId) {
  const stops = await JourneyStop.find({ journey_id: journeyId }).sort({ order: 1 }).lean();
  const totalStops = stops.length;
  const skippedCount = stops.filter((s) => s.status === 'SKIPPED').length;
  const completedCount = stops.filter((s) => s.status === 'COMPLETED').length;
  const activeTotal = totalStops - skippedCount;

  const progress = activeTotal > 0 ? Math.round((completedCount / activeTotal) * 100) : 0;

  await TourJourney.updateOne({ _id: journeyId }, { $set: { progress } });

  return {
    progress,
    stats: {
      total_stops: totalStops,
      active_stops: activeTotal,
      completed_stops: completedCount,
      skipped_stops: skippedCount,
    },
  };
}

/**
 * Chuyển đổi Date sang chuỗi ngày địa phương YYYY-MM-DD (mặc định Asia/Ho_Chi_Minh)
 */
function toLocalDateStr(dateInput, timeZone = 'Asia/Ho_Chi_Minh') {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Lấy tọa độ mặc định theo điểm đến của tour (khi tạo stop từ itinerary chưa có tọa độ)
 */
function getFallbackCoordsForTour(tour) {
  const dest = `${tour?.destination_location || ''} ${tour?.title || ''}`.toLowerCase();
  const presets = [
    { keys: ['đà lạt', 'da lat', 'lâm đồng'], lat: 11.9404, lng: 108.4583 },
    { keys: ['đà nẵng', 'da nang'], lat: 16.0544, lng: 108.2022 },
    { keys: ['hội an', 'hoi an'], lat: 15.8801, lng: 108.338 },
    { keys: ['huế', 'hue'], lat: 16.4637, lng: 107.5909 },
    { keys: ['nha trang', 'khánh hòa'], lat: 12.2388, lng: 109.1967 },
    { keys: ['phú quốc', 'phu quoc'], lat: 10.2899, lng: 103.984 },
    { keys: ['hạ long', 'ha long', 'quảng ninh'], lat: 20.9101, lng: 107.1839 },
    { keys: ['sapa', 'sa pa', 'lào cai'], lat: 22.3364, lng: 103.8438 },
    { keys: ['hà nội', 'ha noi'], lat: 21.0285, lng: 105.8542 },
    { keys: ['hồ chí minh', 'sài gòn', 'tp.hcm', 'hcm'], lat: 10.7769, lng: 106.7009 },
    { keys: ['vũng tàu', 'vung tau'], lat: 10.346, lng: 107.0843 },
    { keys: ['cần thơ', 'can tho'], lat: 10.0452, lng: 105.7469 },
    { keys: ['quy nhơn', 'quy nhon'], lat: 13.7829, lng: 109.2197 },
    { keys: ['ninh bình', 'ninh binh', 'tràng an'], lat: 20.2506, lng: 105.9745 },
    { keys: ['bangkok', 'thái lan', 'thailand'], lat: 13.7563, lng: 100.5018 },
    { keys: ['singapore'], lat: 1.3521, lng: 103.8198 },
    { keys: ['tokyo', 'nhật bản', 'japan'], lat: 35.6762, lng: 139.6503 },
    { keys: ['seoul', 'hàn quốc', 'korea'], lat: 37.5665, lng: 126.978 },
  ];

  for (const p of presets) {
    if (p.keys.some((k) => dest.includes(k))) {
      return { lat: p.lat, lng: p.lng };
    }
  }
  return { lat: 16.0544, lng: 108.2022 };
}

/**
 * Tạo đối tượng Error kèm HTTP statusCode
 */
function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

module.exports = {
  VALID_CUSTOMER_ORDER_STATUSES,
  isJourneyAdmin,
  isAssignedGuide,
  hasValidOrderForDeparture,
  canUserViewJourney,
  getJourneyRecipientIds,
  recalculateJourneyProgress,
  toLocalDateStr,
  getFallbackCoordsForTour,
  createHttpError,
};


const Cart = require('./cart.model');
const Tour = require('../tour/tour.model');

/**
 * Lấy hoặc tạo giỏ hàng ACTIVE cho user hiện tại
 * Nếu chưa có giỏ ACTIVE thì tạo mới
 */
const getOrCreateActiveCart = async (userId) => {
  let cart = await Cart.findOne({ user_id: userId, status: 'ACTIVE' });
  if (!cart) {
    cart = await Cart.create({ user_id: userId, status: 'ACTIVE', items: [] });
  }
  return cart;
};

/**
 * Lấy giỏ hàng kèm thông tin tour và tính tạm tính từ backend
 * Backend luôn tính giá dựa trên giá hiện tại của tour, không lưu giá trong cart
 */
const getCart = async (userId) => {
  const cart = await getOrCreateActiveCart(userId);

  // Populate thông tin tour cho từng item
  await cart.populate({
    path: 'items.tour_id',
    select: 'title code price main_image departure_date departure_location remaining_slots status duration',
  });

  let subtotal = 0;
  const itemsWithPrice = cart.items.map((item) => {
    const tour = item.tour_id;
    if (!tour) return null;

    const itemTotal = tour.price * item.quantity;
    subtotal += itemTotal;

    // Kiểm tra tour đã qua ngày khởi hành chưa
    const isDeparturePassed = tour.departure_date
      ? new Date(tour.departure_date) < new Date()
      : false;

    // Kiểm tra tour còn hoạt động không
    const isAvailable = ['ACTIVE', 'PUBLISHED'].includes(tour.status)
      && tour.remaining_slots > 0;

    return {
      _id: item._id,
      tour_id: tour._id,
      title: tour.title,
      code: tour.code,
      price: tour.price,
      main_image: tour.main_image,
      departure_date: tour.departure_date,
      departure_location: tour.departure_location,
      remaining_slots: tour.remaining_slots,
      duration: tour.duration,
      status: tour.status,
      quantity: item.quantity,
      item_total: itemTotal,
      is_departure_passed: isDeparturePassed,
      is_available: isAvailable,
    };
  }).filter(Boolean);

  return {
    _id: cart._id,
    status: cart.status,
    items: itemsWithPrice,
    item_count: itemsWithPrice.length,
    subtotal,
    discount: 0,
    total: subtotal,
  };
};

/**
 * Thêm tour vào giỏ hàng
 * Nếu tour đã tồn tại trong giỏ thì gộp (tăng số lượng)
 */
const addItem = async (userId, tourId, quantity = 1) => {
  // Kiểm tra tour tồn tại và còn hoạt động
  const tour = await Tour.findOne({
    _id: tourId,
    deleted_at: null,
    status: { $in: ['ACTIVE', 'PUBLISHED'] },
  });

  if (!tour) {
    throw { statusCode: 404, message: 'Tour không tồn tại hoặc không còn hoạt động.' };
  }

  if (tour.remaining_slots <= 0) {
    throw { statusCode: 400, message: 'Tour đã hết chỗ.' };
  }

  const cart = await getOrCreateActiveCart(userId);

  // Kiểm tra tour đã có trong giỏ chưa, nếu có thì gộp số lượng
  const existingItem = cart.items.find(
    (item) => item.tour_id.toString() === tourId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ tour_id: tourId, quantity });
  }

  await cart.save();
  return getCart(userId);
};

/**
 * Cập nhật số lượng của một item trong giỏ hàng
 * Kiểm tra item thuộc giỏ của user hiện tại (chống IDOR)
 */
const updateItem = async (userId, itemId, quantity) => {
  const cart = await getOrCreateActiveCart(userId);

  const item = cart.items.id(itemId);
  if (!item) {
    throw { statusCode: 404, message: 'Không tìm thấy item trong giỏ hàng.' };
  }

  item.quantity = quantity;
  await cart.save();
  return getCart(userId);
};

/**
 * Xóa một item khỏi giỏ hàng
 * Kiểm tra item thuộc giỏ của user hiện tại (chống IDOR)
 */
const removeItem = async (userId, itemId) => {
  const cart = await getOrCreateActiveCart(userId);

  const item = cart.items.id(itemId);
  if (!item) {
    throw { statusCode: 404, message: 'Không tìm thấy item trong giỏ hàng.' };
  }

  cart.items.pull(itemId);
  await cart.save();
  return getCart(userId);
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};

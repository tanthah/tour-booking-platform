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
    select: 'title code price price_adult price_child price_baby main_image departure_date departure_location remaining_slots status duration',
  });

  let subtotal = 0;
  const itemsWithPrice = cart.items.map((item) => {
    const tour = item.tour_id;
    if (!tour) return null;

    const adultPrice = tour.price_adult || tour.price || 0;
    const childPrice = tour.price_child || Math.round(adultPrice * 0.7);
    const babyPrice = tour.price_baby || Math.round(adultPrice * 0.3);

    const qtyAdult = item.quantity_adult !== undefined && item.quantity_adult !== null
      ? item.quantity_adult
      : (item.quantity || 1);
    const qtyChild = item.quantity_child || 0;
    const qtyBaby = item.quantity_baby || 0;

    const itemTotal = (qtyAdult * adultPrice) + (qtyChild * childPrice) + (qtyBaby * babyPrice);
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
      price: adultPrice,
      price_adult: adultPrice,
      price_child: childPrice,
      price_baby: babyPrice,
      main_image: tour.main_image,
      departure_date: tour.departure_date,
      departure_location: tour.departure_location,
      remaining_slots: tour.remaining_slots,
      duration: tour.duration,
      status: tour.status,
      quantity: qtyAdult + qtyChild + qtyBaby,
      quantity_adult: qtyAdult,
      quantity_child: qtyChild,
      quantity_baby: qtyBaby,
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
const addItem = async (userId, tourId, passengerData = {}) => {
  // Kiểm tra tour tồn tại và còn hoạt động
  const tour = await Tour.findOne({
    _id: tourId,
    deleted_at: null,
    status: { $in: ['ACTIVE', 'PUBLISHED'] },
  });

  if (!tour) {
    throw { statusCode: 404, message: 'Tour không tồn tại hoặc không còn hoạt động.' };
  }

  let qtyAdult = 1;
  let qtyChild = 0;
  let qtyBaby = 0;

  if (typeof passengerData === 'number') {
    qtyAdult = passengerData;
  } else if (typeof passengerData === 'object' && passengerData !== null) {
    qtyAdult = Number(passengerData.quantity_adult ?? passengerData.quantity ?? 1);
    qtyChild = Number(passengerData.quantity_child ?? 0);
    qtyBaby = Number(passengerData.quantity_baby ?? 0);
  }

  const requestedTotal = qtyAdult + qtyChild + qtyBaby;
  if (tour.remaining_slots < requestedTotal) {
    throw { statusCode: 400, message: `Tour chỉ còn ${tour.remaining_slots} chỗ trống.` };
  }

  const cart = await getOrCreateActiveCart(userId);

  // Kiểm tra tour đã có trong giỏ chưa, nếu có thì gộp số lượng
  const existingItem = cart.items.find(
    (item) => item.tour_id.toString() === tourId.toString()
  );

  if (existingItem) {
    const currentAdult = existingItem.quantity_adult !== undefined && existingItem.quantity_adult !== null
      ? existingItem.quantity_adult
      : (existingItem.quantity || 1);
    const currentChild = existingItem.quantity_child || 0;
    const currentBaby = existingItem.quantity_baby || 0;

    const newAdult = currentAdult + qtyAdult;
    const newChild = currentChild + qtyChild;
    const newBaby = currentBaby + qtyBaby;
    const newTotal = newAdult + newChild + newBaby;

    if (tour.remaining_slots && newTotal > tour.remaining_slots) {
      throw { statusCode: 400, message: `Tổng số hành khách vượt quá số chỗ còn lại (${tour.remaining_slots} chỗ).` };
    }

    existingItem.quantity_adult = newAdult;
    existingItem.quantity_child = newChild;
    existingItem.quantity_baby = newBaby;
    existingItem.quantity = newTotal;
  } else {
    cart.items.push({
      tour_id: tourId,
      quantity: requestedTotal,
      quantity_adult: qtyAdult,
      quantity_child: qtyChild,
      quantity_baby: qtyBaby,
    });
  }

  await cart.save();
  return getCart(userId);
};

/**
 * Cập nhật số lượng của một item trong giỏ hàng
 * Kiểm tra item thuộc giỏ của user hiện tại (chống IDOR)
 */
const updateItem = async (userId, itemId, updateData) => {
  const cart = await getOrCreateActiveCart(userId);

  const item = cart.items.id(itemId);
  if (!item) {
    throw { statusCode: 404, message: 'Không tìm thấy item trong giỏ hàng.' };
  }

  const tour = await Tour.findById(item.tour_id);
  if (!tour) {
    throw { statusCode: 404, message: 'Tour không tồn tại.' };
  }

  let qtyAdult = item.quantity_adult !== undefined && item.quantity_adult !== null
    ? item.quantity_adult
    : (item.quantity || 1);
  let qtyChild = item.quantity_child || 0;
  let qtyBaby = item.quantity_baby || 0;

  if (typeof updateData === 'number') {
    qtyAdult = updateData;
  } else if (typeof updateData === 'object' && updateData !== null) {
    if (updateData.quantity_adult !== undefined) qtyAdult = Number(updateData.quantity_adult);
    if (updateData.quantity_child !== undefined) qtyChild = Number(updateData.quantity_child);
    if (updateData.quantity_baby !== undefined) qtyBaby = Number(updateData.quantity_baby);
    if (updateData.quantity !== undefined && updateData.quantity_adult === undefined) {
      qtyAdult = Number(updateData.quantity);
    }
  }

  if (qtyAdult < 1) {
    throw { statusCode: 400, message: 'Số lượng người lớn tối thiểu là 1.' };
  }
  if (qtyChild < 0 || qtyBaby < 0) {
    throw { statusCode: 400, message: 'Số lượng trẻ em và em bé không được âm.' };
  }

  const totalPassengers = qtyAdult + qtyChild + qtyBaby;
  if (tour.remaining_slots && totalPassengers > tour.remaining_slots) {
    throw { statusCode: 400, message: `Số lượng hành khách vượt quá số chỗ còn lại (${tour.remaining_slots} chỗ).` };
  }

  item.quantity_adult = qtyAdult;
  item.quantity_child = qtyChild;
  item.quantity_baby = qtyBaby;
  item.quantity = totalPassengers;

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

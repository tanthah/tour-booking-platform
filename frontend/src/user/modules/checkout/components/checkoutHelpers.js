/**
 * Helper functions cho Checkout flow
 */

/**
 * Trích xuất ngày sinh định dạng YYYY-MM-DD từ đối tượng user
 */
export const extractDobString = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Tải thông tin người dùng từ API hoặc localStorage
 */
export const loadInitialCustomer = async (axiosClient) => {
  try {
    const userRes = await axiosClient.get('/auth/me');
    if (userRes?.data) {
      const u = userRes.data;
      return {
        full_name: u.full_name || '',
        phone: u.phone || '',
        email: u.email || '',
        date_of_birth: extractDobString(u.date_of_birth),
        id_number: u.id_number || '',
        gender: u.gender || 'MALE',
        note: '',
      };
    }
  } catch {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    return {
      full_name: stored.full_name || '',
      phone: stored.phone || '',
      email: stored.email || '',
      date_of_birth: extractDobString(stored.date_of_birth),
      id_number: stored.id_number || '',
      gender: stored.gender || 'MALE',
      note: '',
    };
  }

  return {
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    id_number: '',
    gender: 'MALE',
    note: '',
  };
};

/**
 * Khởi tạo danh sách hành khách từ các cart items được chọn
 */
export const createInitialPassengers = (filteredItems, bookerInfo) => {
  const initialPassengers = [];

  filteredItems.forEach((item) => {
    const qtyAdult = item.quantity_adult ?? item.quantity ?? 1;
    const qtyChild = item.quantity_child ?? 0;
    const qtyBaby = item.quantity_baby ?? 0;

    const addPax = (qty, type, label) => {
      for (let i = 0; i < qty; i++) {
        initialPassengers.push({
          cart_item_id: item._id,
          item_title: item.title,
          passenger_type: type,
          type_label: label,
          full_name: '',
          phone: '',
          email: '',
          gender: 'MALE',
          date_of_birth: '',
          id_number: '',
          note: '',
        });
      }
    };

    addPax(qtyAdult, 'ADULT', 'Người lớn');
    addPax(qtyChild, 'CHILD', 'Trẻ em');
    addPax(qtyBaby, 'BABY', 'Em bé');
  });

  // Tự động gán thông tin người đặt cho hành khách đầu tiên nếu là Người lớn
  if (initialPassengers.length > 0 && initialPassengers[0].passenger_type === 'ADULT') {
    initialPassengers[0] = {
      ...initialPassengers[0],
      full_name: bookerInfo.full_name || '',
      phone: bookerInfo.phone || '',
      email: bookerInfo.email || '',
      gender: bookerInfo.gender || 'MALE',
      date_of_birth: bookerInfo.date_of_birth || '',
      id_number: bookerInfo.id_number || '',
    };
  }

  return initialPassengers;
};

/**
 * Chuẩn bị payload gửi lên API POST /orders
 */
export const buildOrderPayload = (customerInfo, selectedCartItems, passengers, paymentMethod, couponCode, paymentType = 'FULL') => {
  const normalizedType = (paymentType === 'DEPOSIT' || paymentType === 'DEPOSIT_30') ? 'DEPOSIT_30' : 'FULL';
  return {
    customer_info: {
      full_name: customerInfo.full_name.trim(),
      phone: customerInfo.phone.trim(),
      email: customerInfo.email.trim() || undefined,
      note: customerInfo.note.trim() || undefined,
    },
    selected_items: selectedCartItems.map((it) => it._id),
    booking_customers: passengers.map((p) => ({
      cart_item_id: p.cart_item_id,
      full_name: p.full_name.trim(),
      phone: p.phone.trim(),
      email: p.email.trim() || undefined,
      gender: p.gender || undefined,
      date_of_birth: p.date_of_birth || undefined,
      id_number: p.id_number.trim() || undefined,
      note: p.note.trim() || undefined,
    })),
    payment_method: paymentMethod,
    payment_type: normalizedType,
    coupon_code: couponCode || undefined,
  };
};


/**
 * Gọi API kiểm tra và tính toán giảm giá coupon
 */
export const validateAndApplyCoupon = async (axiosClient, { code, subtotal, selectedCartItems }) => {
  const tourIds = selectedCartItems.map((it) => it.tour_id?._id || it.tour_id);
  const res = await axiosClient.post('/coupons/validate', {
    code,
    subtotal,
    tour_ids: tourIds,
    items: selectedCartItems,
  });
  return res?.data || res;
};

/**
 * Gọi API gợi ý mã giảm giá tốt nhất cho giỏ hàng
 */
export const fetchBestCouponRecommendation = async (axiosClient, { subtotal, selectedCartItems }) => {
  const tourIds = selectedCartItems.map((it) => it.tour_id?._id || it.tour_id);
  const res = await axiosClient.post('/coupons/recommend', {
    subtotal,
    tour_ids: tourIds,
    items: selectedCartItems,
  });
  return res?.data || res;
};

/**
 * Ràng buộc nghiệp vụ thông minh: Kiểm tra điều kiện đặt cọc và khả năng đặt tour
 * - Còn <= 5 ngày (D-5 → D-1): canBook = false, không nhận đặt mới
 * - Còn 6-15 ngày (D-15 → D-6): canBook = true, không cho cọc, bắt buộc 100%
 * - Còn >= 16 ngày (> D-15): canBook = true, cho phép cọc 30%, hạn thanh toán đủ là D-16
 */
export const checkDepositEligibility = (selectedCartItems) => {
  if (!selectedCartItems || selectedCartItems.length === 0) {
    return { canBook: true, allowed: true, daysRemaining: null, paymentDeadline: null, reason: '' };
  }

  let earliestDate = null;
  selectedCartItems.forEach((it) => {
    if (it.departure_date) {
      const d = new Date(it.departure_date);
      if (!isNaN(d.getTime())) {
        if (!earliestDate || d < earliestDate) {
          earliestDate = d;
        }
      }
    }
  });

  if (!earliestDate) {
    return { canBook: true, allowed: true, daysRemaining: null, paymentDeadline: null, reason: '' };
  }

  const now = new Date();
  const depMidnight = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), earliestDate.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((depMidnight - nowMidnight) / (24 * 60 * 60 * 1000));

  if (diffDays <= 5) {
    return {
      canBook: false,
      allowed: false,
      daysRemaining: diffDays,
      earliestDate,
      paymentDeadline: null,
      reason: 'Tour khởi hành trong vòng 5 ngày tới (D-5 → D-1), hệ thống không còn nhận đặt mới để chốt danh sách điều hành.',
    };
  }

  if (diffDays <= 15) {
    return {
      canBook: true,
      allowed: false,
      daysRemaining: diffDays,
      earliestDate,
      paymentDeadline: null,
      reason: 'Tour khởi hành trong vòng 6–15 ngày tới, bắt buộc thanh toán toàn bộ 100% để đảm bảo dịch vụ.',
    };
  }

  const deadline = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), earliestDate.getDate() - 16, 23, 59, 59);

  return {
    canBook: true,
    allowed: true,
    daysRemaining: diffDays,
    earliestDate,
    paymentDeadline: deadline,
    reason: '',
  };
};

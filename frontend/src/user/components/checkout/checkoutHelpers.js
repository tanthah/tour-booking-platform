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
export const buildOrderPayload = (customerInfo, selectedCartItems, passengers, paymentMethod, couponCode) => {
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
    coupon_code: couponCode || undefined,
  };
};

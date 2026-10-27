import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosClient from '../config/axiosClient';
import { validateCustomerInfo, validateAllPassengers } from '../components/checkout/checkoutValidation';
import { extractDobString, createInitialPassengers, buildOrderPayload, loadInitialCustomer, validateAndApplyCoupon, fetchBestCouponRecommendation } from '../components/checkout/checkoutHelpers';

/**
 * Custom Hook useCheckout - Quản lý State & Logic cho Trang Đặt Tour
 * Tuân thủ quy định: file < 300 dòng
 */
export const useCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCartItems, setSelectedCartItems] = useState([]);

  // Thông tin người đặt tour
  const [customerInfo, setCustomerInfo] = useState({
    full_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    id_number: '',
    gender: 'MALE',
    note: '',
  });

  // Chỉ duy nhất khách 1 có thể dùng thông tin người đặt hoặc nhập thông tin mới
  const [useBookerInfo, setUseBookerInfo] = useState(true);
  const [customerErrors, setCustomerErrors] = useState({});
  const [passengerErrors, setPassengerErrors] = useState({});

  const [passengers, setPassengers] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập để tiến hành đặt tour.');
      navigate('/gio-hang');
      return;
    }

    const initCheckout = async () => {
      try {
        setLoading(true);
        const loadedCustomer = await loadInitialCustomer(axiosClient);
        setCustomerInfo(loadedCustomer);

        // Tải giỏ hàng
        const cartRes = await axiosClient.get('/cart');
        const items = cartRes?.data?.items || [];
        const stateSelectedIds = location.state?.selectedItems;

        let filtered = items;
        if (Array.isArray(stateSelectedIds) && stateSelectedIds.length > 0) {
          filtered = items.filter((it) => stateSelectedIds.includes(it._id));
        }

        if (filtered.length === 0) {
          setErrorMsg('Không có tour nào được chọn để thanh toán.');
          setLoading(false);
          return;
        }

        setSelectedCartItems(filtered);

        // Khởi tạo danh sách khách đi tour
        const initialPassengers = createInitialPassengers(filtered, loadedCustomer);
        setPassengers(initialPassengers);
        setUseBookerInfo(true);
      } catch (err) {
        setErrorMsg(err.message || 'Lỗi khi tải thông tin giỏ hàng.');
      } finally {
        setLoading(false);
      }
    };

    initCheckout();
  }, [location.state, navigate]);

  // Đồng bộ thông tin người đặt sang hành khách 1 nếu đang bật useBookerInfo
  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo((prev) => {
      const next = { ...prev, [field]: value };
      if (useBookerInfo) {
        setPassengers((pList) => {
          const nextList = [...pList];
          if (nextList[0]) {
            nextList[0] = { ...nextList[0], [field]: value };
          }
          return nextList;
        });
      }
      return next;
    });

    if (customerErrors[field]) {
      setCustomerErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Cập nhật thông tin từng hành khách
  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (passengerErrors[index]?.[field]) {
      setPassengerErrors((prev) => {
        const next = { ...prev };
        if (next[index]) {
          const fErrors = { ...next[index] };
          delete fErrors[field];
          if (Object.keys(fErrors).length === 0) delete next[index];
          else next[index] = fErrors;
        }
        return next;
      });
    }
  };

  // Bật/tắt dùng thông tin người đặt cho Khách 1
  const handleToggleBookerInfo = (shouldUse) => {
    setUseBookerInfo(shouldUse);
    setPassengers((prev) => {
      const updated = [...prev];
      if (updated[0]) {
        const bookerData = shouldUse
          ? { full_name: customerInfo.full_name || '', phone: customerInfo.phone || '', email: customerInfo.email || '', gender: customerInfo.gender || 'MALE', date_of_birth: customerInfo.date_of_birth || '', id_number: customerInfo.id_number || '' }
          : { full_name: '', phone: '', email: '', gender: 'MALE', date_of_birth: '', id_number: '' };
        updated[0] = { ...updated[0], ...bookerData };
      }
      return updated;
    });

    setPassengerErrors((prev) => {
      const next = { ...prev };
      delete next[0];
      return next;
    });
  };

  const subtotal = selectedCartItems.reduce((sum, item) => sum + (item.item_total || 0), 0);

  // Xử lý áp dụng mã giảm giá từ API backend
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      const data = await validateAndApplyCoupon(axiosClient, { code, subtotal, selectedCartItems });
      setDiscount(data.discountAmount || 0);
      setAppliedCoupon(code);
      setCouponMessage(`Áp dụng "${code}" (-${data.coupon?.discount_percent}%) thành công! Giảm ${(data.discountAmount || 0).toLocaleString('vi-VN')} đ`);
      setCouponError(false);
    } catch (err) {
      setDiscount(0);
      setAppliedCoupon('');
      setCouponMessage(err?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      setCouponError(true);
    }
  };

  // Tự động tìm và áp dụng mã giảm giá tốt nhất cho đơn hàng
  const handleRecommendCoupon = async () => {
    try {
      const data = await fetchBestCouponRecommendation(axiosClient, { subtotal, selectedCartItems });
      if (data?.bestCoupon) {
        const b = data.bestCoupon;
        setCouponCode(b.code);
        setDiscount(b.discount_amount || 0);
        setAppliedCoupon(b.code);
        setCouponMessage(`Đã áp dụng mã tốt nhất "${b.code}" (-${b.discount_percent}%). Giảm ${(b.discount_amount || 0).toLocaleString('vi-VN')} đ`);
        setCouponError(false);
      } else {
        setCouponMessage('Chưa có mã giảm giá phù hợp cho các tour trong đơn.');
        setCouponError(true);
      }
    } catch (err) {
      setCouponMessage(err?.message || 'Không thể tìm mã giảm giá phù hợp.');
      setCouponError(true);
    }
  };

  // Hủy mã giảm giá
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon('');
    setCouponMessage('');
    setCouponError(false);
  };

  const totalAmount = Math.max(0, subtotal - discount);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Kiểm tra ràng buộc người đặt
    const custVal = validateCustomerInfo(customerInfo);
    if (!custVal.isValid) {
      setCustomerErrors(custVal.errors);
      setErrorMsg('Vui lòng kiểm tra lại thông tin người đặt tour.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Kiểm tra ràng buộc từng hành khách
    const passVal = validateAllPassengers(passengers);
    if (!passVal.isValid) {
      setPassengerErrors(passVal.passengerErrors);
      setErrorMsg(`Vui lòng hoàn tất thông tin cho Hành khách ${passVal.firstErrorIndex + 1}.`);
      window.scrollTo({ top: 220, behavior: 'smooth' });
      return;
    }

    const payload = buildOrderPayload(customerInfo, selectedCartItems, passengers, paymentMethod, appliedCoupon);

    try {
      setSubmitting(true);
      const res = await axiosClient.post('/orders', payload);
      const order = res?.data;

      window.dispatchEvent(new Event('cartUpdated'));

      if (order && order._id) {
        navigate(`/don-hang/${order._id}`, { state: { justCreated: true } });
      } else {
        navigate('/ho-so-ca-nhan');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Đặt tour không thành công. Vui lòng kiểm tra lại.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    errorMsg,
    setErrorMsg,
    selectedCartItems,
    customerInfo,
    customerErrors,
    handleCustomerInfoChange,
    passengers,
    passengerErrors,
    handlePassengerChange,
    useBookerInfo,
    handleToggleBookerInfo,
    paymentMethod,
    setPaymentMethod,
    subtotal,
    totalAmount,
    couponCode,
    setCouponCode,
    discount,
    appliedCoupon,
    couponMessage,
    couponError,
    handleApplyCoupon,
    handleRecommendCoupon,
    handleRemoveCoupon,
    handleSubmitOrder,
  };
};

export default useCheckout;

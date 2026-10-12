import { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosClient from '../config/axiosClient';
import useCart from '../hooks/useCart';
import CartItem from '../components/CartItem';
import '../assets/styles/cart.css';

/**
 * CartPage - Trang Giỏ hàng
 * Hiển thị danh sách tour đã thêm, số lượng hành khách, mã giảm giá,
 * thông tin khách hàng, phương thức thanh toán
 */
const CartPage = () => {
  const { cart, loading, error, actionLoading, updateQuantity, removeItem } = useCart();

  // Danh sách item được chọn để thanh toán
  const [selectedItems, setSelectedItems] = useState([]);
  // Mã giảm giá
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  // Thông tin khách hàng (lấy từ tài khoản đăng nhập)
  const [customerInfo, setCustomerInfo] = useState({
    full_name: '',
    phone: '',
    note: '',
  });
  // Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState('MOMO');

  // Lấy thông tin khách hàng từ tài khoản đăng nhập
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axiosClient.get('/auth/me');
        if (res?.success && res.data) {
          setCustomerInfo((prev) => ({
            ...prev,
            full_name: res.data.full_name || '',
            phone: res.data.phone || '',
          }));
        }
      } catch {
        // Sử dụng dữ liệu từ localStorage nếu API lỗi
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          setCustomerInfo((prev) => ({
            ...prev,
            full_name: storedUser.full_name || '',
            phone: storedUser.phone || '',
          }));
        } catch { /* bỏ qua */ }
      }
    };

    const token = localStorage.getItem('token');
    if (token) fetchUserInfo();
  }, []);

  // Tự động chọn tất cả item khi giỏ hàng được tải
  useEffect(() => {
    if (cart?.items?.length > 0) {
      setSelectedItems(cart.items.map((item) => item._id));
    }
  }, [cart]);

  // Chọn hoặc bỏ chọn một item
  const toggleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Tính tổng tiền các item được chọn
  const calculateSelectedTotal = () => {
    if (!cart?.items) return 0;
    return cart.items
      .filter((item) => selectedItems.includes(item._id))
      .reduce((sum, item) => sum + item.item_total, 0);
  };

  const subtotal = calculateSelectedTotal();
  const total = Math.max(0, subtotal - discount);

  // Áp dụng mã giảm giá (demo)
  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === 'TOURMUAHE2024') {
      setDiscount(Math.round(subtotal * 0.1));
    } else {
      setDiscount(0);
      alert('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    }
  };

  // Format ngày tháng
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Liên hệ';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  // Trạng thái loading
  if (loading) {
    return (
      <div className="cart-page-wrapper d-flex justify-content-center align-items-center">
        <Spinner animation="border" style={{ color: '#ea580c' }} />
      </div>
    );
  }

  // Chưa đăng nhập hoặc lỗi
  if (error) {
    return (
      <div className="cart-page-wrapper">
        <Container>
          <div className="cart-card cart-empty">
            <div className="cart-empty-title">{error}</div>
            <Link to="/" className="cart-empty-btn">Về Trang Chủ</Link>
          </div>
        </Container>
      </div>
    );
  }

  // Giỏ hàng trống
  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <Container>
          <div className="cart-card cart-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <div className="cart-empty-title">Giỏ hàng của bạn đang trống</div>
            <div className="cart-empty-desc">Hãy khám phá các tour du lịch hấp dẫn</div>
            <Link to="/tour-trong-nuoc" className="cart-empty-btn">Khám phá Tour</Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      <Container>
        {/* Tiêu đề và link quay lại */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="cart-page-title">Giỏ Hàng</h1>
          <Link to="/tour-trong-nuoc" className="cart-back-link">
            Quay lại mua hàng &rsaquo;
          </Link>
        </div>

        {/* Danh sách item trong giỏ */}
        <div className="cart-card">
          {cart.items.map((item) => (
            <CartItem
              key={item._id}
              item={item}
              isSelected={selectedItems.includes(item._id)}
              onToggleSelect={toggleSelectItem}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              actionLoading={actionLoading}
            />
          ))}

          {/* Mã giảm giá */}
          <div className="cart-coupon-wrapper">
            <input
              type="text"
              className="cart-coupon-input"
              placeholder="Nhập mã giảm giá"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button
              className="cart-coupon-btn"
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim()}
            >
              Dùng Mã
            </button>
          </div>

          {/* Tổng thanh toán */}
          <div className="mt-4 pt-3 border-top">
            <div className="cart-summary-row">
              <span>Tổng tiền:</span>
              <span style={{ fontWeight: 700 }}>{subtotal.toLocaleString('vi-VN')} đ</span>
            </div>
            {discount > 0 && (
              <div className="cart-summary-row">
                <span>Giảm:</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>-{discount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="cart-summary-row">
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Thanh toán:</span>
              <span className="cart-summary-total">{total.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Thông tin khách hàng */}
        <div className="cart-card">
          <h3 className="cart-section-title">Thông Tin Khách Hàng</h3>
          <Row className="g-3">
            <Col md={6}>
              <input
                type="text"
                className="cart-form-input"
                placeholder="Họ và tên"
                value={customerInfo.full_name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, full_name: e.target.value })}
              />
            </Col>
            <Col md={6}>
              <input
                type="text"
                className="cart-form-input"
                placeholder="Số điện thoại"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              />
            </Col>
            <Col xs={12}>
              <textarea
                className="cart-form-textarea"
                placeholder="Ghi chú"
                value={customerInfo.note}
                onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
              />
            </Col>
          </Row>
        </div>

        {/* Phương thức thanh toán */}
        <div className="cart-card">
          <h3 className="cart-section-title">Chọn Phương Thức Thanh Toán</h3>
          <label
            className={`cart-payment-option ${paymentMethod === 'MOMO' ? 'selected' : ''}`}
            onClick={() => setPaymentMethod('MOMO')}
          >
            <input
              type="radio"
              className="cart-payment-radio"
              name="payment"
              value="MOMO"
              checked={paymentMethod === 'MOMO'}
              onChange={() => setPaymentMethod('MOMO')}
            />
            Ví MoMo
          </label>
        </div>

        {/* Nút đặt tour */}
        <button
          className="cart-checkout-btn"
          disabled={selectedItems.length === 0 || actionLoading}
        >
          {actionLoading ? 'Đang xử lý...' : `Đặt Tour (${selectedItems.length} tour)`}
        </button>
      </Container>
    </div>
  );
};

export default CartPage;

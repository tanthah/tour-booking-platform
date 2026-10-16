import { useState, useEffect, useRef } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import CartItem from '../components/CartItem';
import '../assets/styles/cart.css';

/**
 * CartPage - Trang Giỏ hàng
 * Hiển thị danh sách tour đã thêm, số lượng hành khách, mã giảm giá,
 * và điều hướng sang trang Đặt tour (Checkout)
 */
const CartPage = () => {
  const navigate = useNavigate();
  const { cart, loading, error, actionLoading, updateQuantity, removeItem } = useCart();

  // Danh sách item được chọn để thanh toán
  const [selectedItems, setSelectedItems] = useState([]);

  const isInitialLoaded = useRef(false);

  // Tự động chọn tất cả item khi giỏ hàng được tải lần đầu,
  // và bảo lưu lựa chọn của người dùng khi cập nhật số lượng
  useEffect(() => {
    if (cart?.items?.length > 0 && !isInitialLoaded.current) {
      setSelectedItems(cart.items.map((item) => item._id));
      isInitialLoaded.current = true;
    } else if (cart?.items) {
      setSelectedItems((prev) => prev.filter((id) => cart.items.some((item) => item._id === id)));
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

  const total = calculateSelectedTotal();

  // Tiến hành chuyển sang trang Checkout
  const handleProceedToCheckout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Vui lòng đăng nhập tài khoản để tiến hành đặt tour.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một tour trong giỏ để đặt.');
      return;
    }
    navigate('/checkout', { state: { selectedItems } });
  };

  if (loading) {
    return (
      <div className="cart-page-wrapper d-flex justify-content-center align-items-center">
        <Spinner animation="border" style={{ color: '#ea580c' }} />
      </div>
    );
  }

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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="cart-page-title">Giỏ Hàng</h1>
          <Link to="/tour-trong-nuoc" className="cart-back-link">
            Quay lại mua hàng &rsaquo;
          </Link>
        </div>

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

          {/* Tổng thanh toán */}
          <div className="mt-4 pt-3 border-top">
            <div className="cart-summary-row">
              <span style={{ fontWeight: 700, fontSize: '15px' }}>Tổng thanh toán ({selectedItems.length} tour đã chọn):</span>
              <span className="cart-summary-total">{total.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          {/* Nút đặt tour */}
          <button
            className="cart-checkout-btn"
            disabled={selectedItems.length === 0 || actionLoading}
            onClick={handleProceedToCheckout}
          >
            {actionLoading
              ? 'Đang xử lý...'
              : `Tiến Hành Đặt Tour (${selectedItems.length} tour đã chọn)`}
          </button>
        </div>
      </Container>
    </div>
  );
};

export default CartPage;

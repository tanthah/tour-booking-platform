import { useState, useEffect, useRef } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Info,
  CreditCard,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import useCart from '../hooks/useCart';
import CartItem from '../modules/cart/components/CartItem';
import '../assets/styles/cart.css';

/**
 * CartPage - Trang Giỏ hàng tour du lịch
 * Hiển thị danh sách tour đã thêm, số lượng hành khách và điều hướng sang Checkout
 */
const CartPage = () => {
  const navigate = useNavigate();
  const { cart, loading, error, actionLoading, updateQuantity, removeItem, clearCart } = useCart();

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

  // Xóa toàn bộ tour trong giỏ
  const handleClearAll = () => {
    if (!cart?.items?.length) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ tour trong giỏ hàng?')) {
      clearCart();
    }
  };

  // Tính tổng tiền và tổng số khách của các tour được chọn
  const selectedCartItems = (cart?.items || []).filter((item) => selectedItems.includes(item._id));
  const total = selectedCartItems.reduce((sum, item) => sum + (item.item_total || 0), 0);
  const totalSelectedPassengers = selectedCartItems.reduce(
    (sum, item) => sum + (item.quantity || ((item.quantity_adult || 1) + (item.quantity_child || 0) + (item.quantity_baby || 0))),
    0
  );

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
            <ShoppingCart size={58} color="#94a3b8" strokeWidth={1.5} />
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
        <div className="cart-shell">
          {/* Header trên cùng của giỏ hàng */}
          <div className="cart-shell-header">
            <div className="cart-shell-title-group">
              <div className="cart-header-icon-wrap">
                <ShoppingCart size={24} className="cart-header-icon" />
                <span className="cart-header-icon-badge">{cart.items.length}</span>
              </div>
              <h1 className="cart-shell-title">Giỏ hàng tour du lịch</h1>
              <span className="cart-selected-pill">
                <span className="cart-selected-dot">{selectedItems.length}</span>
                <span>tour đã chọn</span>
              </span>
            </div>

            <button
              type="button"
              className="cart-clear-all-btn"
              onClick={handleClearAll}
              disabled={actionLoading}
            >
              <Trash2 size={15} />
              <span>Xóa tất cả</span>
            </button>
          </div>

          {/* Danh sách các tour trong giỏ */}
          <div className="cart-items-list">
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
          </div>

          {/* Thanh tổng kết & hành động phía dưới */}
          <div className="cart-shell-footer">
            <div className="cart-note-box">
              <div className="cart-note-icon">
                <Info size={18} />
              </div>
              <div>
                <div className="cart-note-title">Lưu ý</div>
                <div className="cart-note-text">
                  Vui lòng kiểm tra kỹ thông tin tour, số lượng khách trước khi thanh toán.
                </div>
              </div>
            </div>

            <div className="cart-checkout-summary">
              <div className="cart-total-block">
                <div className="cart-total-row">
                  <span className="cart-total-heading">Tổng cộng:</span>
                  <span className="cart-summary-total">{total.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="cart-total-sub">
                  Đã chọn {selectedItems.length} tour ({totalSelectedPassengers} hành khách)
                </div>
              </div>

              <div className="cart-footer-actions">
                <button
                  type="button"
                  className="cart-pay-now-btn"
                  disabled={selectedItems.length === 0 || actionLoading}
                  onClick={handleProceedToCheckout}
                >
                  <CreditCard size={17} />
                  <span>{actionLoading ? 'Đang xử lý...' : 'Thanh toán ngay'}</span>
                  {!actionLoading && <ArrowRight size={16} />}
                </button>

                <Link to="/tour-trong-nuoc" className="cart-continue-btn">
                  <ArrowLeft size={15} />
                  <span>Tiếp tục chọn tour</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CartPage;

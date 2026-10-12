import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../config/axiosClient';

/**
 * Custom hook quản lý logic giỏ hàng
 * Gọi API backend để lấy, thêm, sửa, xóa item trong giỏ
 */
const useCart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Lấy giỏ hàng từ backend
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosClient.get('/cart');
      if (res?.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải giỏ hàng.');
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cập nhật số lượng item
  const updateQuantity = async (itemId, quantity) => {
    try {
      setActionLoading(true);
      const res = await axiosClient.patch(`/cart/items/${itemId}`, { quantity });
      if (res?.success && res.data) {
        setCart(res.data);
      }
    } catch (err) {
      alert(err.message || 'Không thể cập nhật số lượng.');
    } finally {
      setActionLoading(false);
    }
  };

  // Xóa item khỏi giỏ
  const removeItem = async (itemId) => {
    try {
      setActionLoading(true);
      const res = await axiosClient.delete(`/cart/items/${itemId}`);
      if (res?.success && res.data) {
        setCart(res.data);
        window.dispatchEvent(new Event('cartUpdated'));
      }
    } catch (err) {
      alert(err.message || 'Không thể xóa item.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCart();
    } else {
      setLoading(false);
      setError('Vui lòng đăng nhập để xem giỏ hàng.');
      setCart(null);
    }
  }, [fetchCart]);

  return {
    cart,
    loading,
    error,
    actionLoading,
    fetchCart,
    updateQuantity,
    removeItem,
  };
};

export default useCart;

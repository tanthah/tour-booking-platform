const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const {
  addItemValidation,
  updateItemValidation,
  removeItemValidation,
} = require('./cart.validation');

// Tất cả route giỏ hàng đều yêu cầu đăng nhập với quyền CUSTOMER
const auth = [authenticate, authorize('CUSTOMER', 'ADMIN', 'STAFF')];

// Lấy giỏ hàng hiện tại (kèm tạm tính do backend tính)
router.get('/', ...auth, cartController.getCart);

// Thêm tour vào giỏ hàng (gộp nếu đã có)
router.post('/items', ...auth, addItemValidation, cartController.addItem);

// Cập nhật số lượng item trong giỏ
router.patch('/items/:itemId', ...auth, updateItemValidation, cartController.updateItem);

// Xóa tour khỏi giỏ hàng
router.delete('/items/:itemId', ...auth, removeItemValidation, cartController.removeItem);

module.exports = router;

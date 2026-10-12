const { validationResult } = require('express-validator');
const cartService = require('./cart.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Hàm helper kiểm tra và xử lý lỗi Validation từ express-validator
 */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    ApiResponse.error(res, 400, 'Dữ liệu không hợp lệ', formattedErrors);
    return false;
  }
  return true;
};

/**
 * Controller: Lấy giỏ hàng hiện tại của user đang đăng nhập
 * HTTP Method: GET /api/cart
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  ApiResponse.success(res, 200, 'Lấy giỏ hàng thành công', cart);
});

/**
 * Controller: Thêm tour vào giỏ hàng (gộp nếu đã có)
 * HTTP Method: POST /api/cart/items
 */
const addItem = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const { tour_id, quantity } = req.body;
  const cart = await cartService.addItem(req.user._id, tour_id, quantity || 1);
  ApiResponse.success(res, 200, 'Thêm tour vào giỏ hàng thành công', cart);
});

/**
 * Controller: Cập nhật số lượng item trong giỏ hàng
 * HTTP Method: PATCH /api/cart/items/:itemId
 */
const updateItem = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const { quantity } = req.body;
  const cart = await cartService.updateItem(req.user._id, req.params.itemId, quantity);
  ApiResponse.success(res, 200, 'Cập nhật số lượng thành công', cart);
});

/**
 * Controller: Xóa item khỏi giỏ hàng
 * HTTP Method: DELETE /api/cart/items/:itemId
 */
const removeItem = asyncHandler(async (req, res) => {
  if (!handleValidation(req, res)) return;
  const cart = await cartService.removeItem(req.user._id, req.params.itemId);
  ApiResponse.success(res, 200, 'Xóa tour khỏi giỏ hàng thành công', cart);
});

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
};

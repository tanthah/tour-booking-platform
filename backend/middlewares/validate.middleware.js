const { validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

/**
 * Middleware tự động kiểm tra kết quả validation của express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.error(res, 400, 'Dữ liệu không hợp lệ', errors.array());
  }
  next();
};

module.exports = validate;

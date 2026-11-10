const ApiResponse = require('../utils/apiResponse');
const { NODE_ENV } = require('../config/env');

/**
 * Global Error Handling Middleware: Xử lý ngoại lệ và bắt lỗi tập trung cho ứng dụng Express
 * Chuẩn hóa format phản hồi lỗi (Response Format) và mã trạng thái HTTP Status Code
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi hệ thống';
  let errors = [];

  // Xử lý lỗi validation dữ liệu từ Mongoose Schema (Mongoose ValidationError)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Dữ liệu không hợp lệ';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Xử lý lỗi trùng lặp dữ liệu Unique Index trong MongoDB (Mongoose Duplicate Key Error E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field === 'email' ? 'Email' : field === 'phone' ? 'Số điện thoại' : field} đã tồn tại trong hệ thống`;
  }

  // Xử lý lỗi ép kiểu dữ liệu sai định dạng (ví dụ: ObjectId không hợp lệ)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Dữ liệu không hợp lệ';
  }

  // Khái quát hóa và ẩn thông tin chi tiết lỗi Server (Internal Server Error) trong môi trường Production
  if (NODE_ENV === 'production' && statusCode === 500) {
    message = 'Lỗi hệ thống. Vui lòng thử lại sau.';
  }

  return ApiResponse.error(res, statusCode, message, errors);
};

module.exports = errorMiddleware;

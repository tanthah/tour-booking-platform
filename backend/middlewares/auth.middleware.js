const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const User = require('../modules/user/user.model');
const ApiResponse = require('../utils/apiResponse');

// Middleware Authentication: Xác thực JWT Access Token từ Header Authorization

const authenticate = async (req, res, next) => {
  try {
    let token;

    // Lấy Bearer token từ Header Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(res, 401, 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.');
    }

    // Giải mã và verify signature của JWT Token với JWT_SECRET
    const decoded = jwt.verify(token, JWT_SECRET);

    // Truy vấn thông tin User từ Database (loại trừ các tài khoản đã bị xóa mềm deleted_at)
    const user = await User.findOne({ _id: decoded.id, deleted_at: null }).select('-password_hash');

    if (!user) {
      return ApiResponse.error(res, 401, 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    if (user.status !== 'ACTIVE') {
      return ApiResponse.error(res, 403, 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.');
    }

    // Gắn thông tin User đã xác thực vào Object Request để các middleware/controller tiếp theo sử dụng
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(res, 401, 'Token không hợp lệ.');
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 401, 'Token đã hết hạn. Vui lòng đăng nhập lại.');
    }
    next(error);
  }
};

/**
 * Middleware Authorization: Phân quyền truy cập dựa trên Role của User
 * @param  {...string} roles - Danh sách Role được cấp quyền (ví dụ: 'ADMIN', 'STAFF', 'CUSTOMER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 401, 'Bạn chưa đăng nhập.');
    }

    // Kiểm tra xem User hiện tại có sở hữu ít nhất một Role hợp lệ hay không
    let userRoles = [];
    if (req.user.roles && Array.isArray(req.user.roles) && req.user.roles.length > 0) {
      userRoles = req.user.roles;
    } else if (req.user.role) {
      userRoles = [req.user.role];
    }
    
    const allowedRoles = roles.map(r => r.toUpperCase());
    const hasRole = userRoles.some((role) => allowedRoles.includes(role.toUpperCase()));

    if (!hasRole) {
      return ApiResponse.error(res, 403, 'Bạn không có quyền thực hiện hành động này.');
    }

    next();
  };
};

module.exports = { authenticate, authorize };

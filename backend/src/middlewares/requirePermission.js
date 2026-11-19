const ApiResponse = require('../utils/apiResponse');
const permissionService = require('../services/permissionService');

/**
 * Middleware kiểm tra quyền truy cập dựa trên permission codes
 * @param {string|string[]} permissions - Mã quyền hoặc mảng mã quyền cần kiểm tra (OR logic)
 */
const requirePermission = (...permissions) => {
  const flattenedPermissions = permissions.flat();

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return ApiResponse.error(res, 401, 'Bạn chưa đăng nhập.');
      }

      // Kiểm tra xem User có quyền thông qua permissionService
      const hasAccess = await permissionService.hasPermission(req.user, flattenedPermissions);

      if (!hasAccess) {
        return ApiResponse.error(res, 403, 'Bạn không có quyền thực hiện hành động này.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = requirePermission;

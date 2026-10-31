const adminUserService = require('./adminUser.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

class AdminUserController {
  // Lấy danh sách người dùng
  listUsers = asyncHandler(async (req, res) => {
    const { page, limit, role_id, status, search } = req.query;
    const result = await adminUserService.listUsers({ page, limit, role_id, status, search });
    return ApiResponse.success(res, 200, 'Lấy danh sách người dùng thành công', result);
  });

  // Xem chi tiết người dùng
  getUserById = asyncHandler(async (req, res) => {
    const user = await adminUserService.getUserById(req.params.id);
    return ApiResponse.success(res, 200, 'Lấy thông tin người dùng thành công', user);
  });

  // Khóa / mở khóa tài khoản
  changeStatus = asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const result = await adminUserService.changeStatus({
      actor: req.user,
      targetId: req.params.id,
      status,
      reason,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ApiResponse.success(res, 200, result.message, result.user);
  });

  // Thay đổi vai trò (Role)
  changeRole = asyncHandler(async (req, res) => {
    const { role_id, reason } = req.body;
    const result = await adminUserService.changeRole({
      actor: req.user,
      targetId: req.params.id,
      roleId: role_id,
      reason,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ApiResponse.success(res, 200, result.message, result.user);
  });

  // Cấu hình quyền ngoại lệ (Overrides)
  setPermissionOverrides = asyncHandler(async (req, res) => {
    const { overrides, reason } = req.body;
    const result = await adminUserService.setPermissionOverrides({
      actor: req.user,
      targetId: req.params.id,
      overrides,
      reason,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ApiResponse.success(res, 200, result.message, result);
  });
}

module.exports = new AdminUserController();

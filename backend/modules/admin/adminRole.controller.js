const adminRoleService = require('./adminRole.service');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

class AdminRoleController {
  // Lấy danh sách vai trò
  listRoles = asyncHandler(async (req, res) => {
    const roles = await adminRoleService.listRoles();
    return ApiResponse.success(res, 200, 'Lấy danh sách vai trò thành công', roles);
  });

  // Lấy chi tiết vai trò
  getRoleById = asyncHandler(async (req, res) => {
    const role = await adminRoleService.getRoleById(req.params.id);
    return ApiResponse.success(res, 200, 'Lấy thông tin vai trò thành công', role);
  });

  // Tạo vai trò mới
  createRole = asyncHandler(async (req, res) => {
    const { name, code, description, permissions } = req.body;
    const role = await adminRoleService.createRole({
      actor: req.user,
      name,
      code,
      description,
      permissions,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ApiResponse.success(res, 201, 'Tạo vai trò mới thành công', role);
  });

  // Cập nhật thông tin vai trò
  updateRole = asyncHandler(async (req, res) => {
    const { name, description, is_active } = req.body;
    const role = await adminRoleService.updateRole({
      actor: req.user,
      id: req.params.id,
      name,
      description,
      is_active,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ApiResponse.success(res, 200, 'Cập nhật thông tin vai trò thành công', role);
  });

  // Gán danh sách quyền cho vai trò
  setRolePermissions = asyncHandler(async (req, res) => {
    const { permissions } = req.body;
    const role = await adminRoleService.setRolePermissions({
      actor: req.user,
      id: req.params.id,
      permissions,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return ApiResponse.success(res, 200, 'Cập nhật danh sách quyền của vai trò thành công', role);
  });

  // Lấy danh mục quyền catalog
  getPermissionCatalog = asyncHandler(async (req, res) => {
    const catalog = adminRoleService.getPermissionCatalog();
    return ApiResponse.success(res, 200, 'Lấy danh mục quyền thành công', catalog);
  });
}

module.exports = new AdminRoleController();

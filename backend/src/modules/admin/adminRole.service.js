const Role = require('../role/role.model');
const User = require('../user/user.model');
const auditLogService = require('../audit/auditLog.service');
const { ALL_PERMISSIONS, PERMISSION_GROUPS } = require('../../utils/permissionCodes');

class AdminRoleService {
  /**
   * Lấy danh sách tất cả vai trò kèm số lượng tài khoản đang sử dụng
   */
  async listRoles() {
    const roles = await Role.find().sort({ is_system: -1, created_at: 1 }).lean();

    // Đếm số người dùng theo từng role
    const userCounts = await User.aggregate([
      { $match: { deleted_at: null } },
      { $group: { _id: '$role_id', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    userCounts.forEach((item) => {
      if (item._id) countMap[item._id.toString()] = item.count;
    });

    return roles.map((r) => ({
      ...r,
      user_count: countMap[r._id.toString()] || 0,
    }));
  }

  /**
   * Lấy chi tiết vai trò theo ID
   */
  async getRoleById(id) {
    const role = await Role.findById(id).lean();
    if (!role) {
      const error = new Error('Vai trò không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    return role;
  }

  /**
   * Tạo vai trò mới (Custom Role)
   */
  async createRole({ actor, name, code, description = '', permissions = [], ip = '', userAgent = '' }) {
    const existing = await Role.findOne({ code: code.toLowerCase() });
    if (existing) {
      const error = new Error(`Mã vai trò '${code}' đã tồn tại`);
      error.statusCode = 409;
      throw error;
    }

    // Kiểm tra tính hợp lệ của permissions
    const invalidPerms = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalidPerms.length > 0) {
      const error = new Error(`Danh sách chứa quyền không hợp lệ: ${invalidPerms.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const role = new Role({
      name,
      code: code.toLowerCase(),
      description,
      is_system: false,
      is_active: true,
      permissions,
    });

    await role.save();

    await auditLogService.log({
      actor_user_id: actor._id,
      action: 'CREATE_ROLE',
      resource: 'Role',
      old_value: null,
      new_value: role.toObject(),
      reason: 'Tạo vai trò mới',
      ip_address: ip,
      user_agent: userAgent,
    });

    return role;
  }

  /**
   * Cập nhật thông tin vai trò
   */
  async updateRole({ actor, id, name, description, is_active, ip = '', userAgent = '' }) {
    const role = await Role.findById(id);
    if (!role) {
      const error = new Error('Vai trò không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Role hệ thống không được vô hiệu hóa
    if (role.is_system && is_active === false) {
      const error = new Error('Không thể vô hiệu hóa vai trò mặc định của hệ thống');
      error.statusCode = 400;
      throw error;
    }

    const oldValue = { name: role.name, description: role.description, is_active: role.is_active };

    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (is_active !== undefined) role.is_active = is_active;

    await role.save();

    await auditLogService.log({
      actor_user_id: actor._id,
      action: 'UPDATE_ROLE',
      resource: 'Role',
      old_value: oldValue,
      new_value: { name: role.name, description: role.description, is_active: role.is_active },
      reason: 'Cập nhật thông tin vai trò',
      ip_address: ip,
      user_agent: userAgent,
    });

    return role;
  }

  /**
   * Cập nhật danh sách quyền cho vai trò
   */
  async setRolePermissions({ actor, id, permissions, ip = '', userAgent = '' }) {
    const role = await Role.findById(id);
    if (!role) {
      const error = new Error('Vai trò không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    if (role.code === 'admin') {
      const error = new Error('Vai trò Quản trị viên (admin) luôn mặc định sở hữu tất cả các quyền');
      error.statusCode = 400;
      throw error;
    }

    // Xác thực permissions
    const invalidPerms = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalidPerms.length > 0) {
      const error = new Error(`Danh sách chứa quyền không hợp lệ: ${invalidPerms.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const oldPermissions = [...role.permissions];
    role.permissions = permissions;
    await role.save();

    await auditLogService.log({
      actor_user_id: actor._id,
      action: 'UPDATE_ROLE_PERMISSIONS',
      resource: 'Role',
      old_value: { code: role.code, permissions: oldPermissions },
      new_value: { code: role.code, permissions },
      reason: 'Cập nhật quyền hạn cho vai trò',
      ip_address: ip,
      user_agent: userAgent,
    });

    return role;
  }

  /**
   * Lấy danh mục toàn bộ quyền hạn trong hệ thống
   */
  getPermissionCatalog() {
    return {
      permissions: ALL_PERMISSIONS,
      groups: PERMISSION_GROUPS,
    };
  }
}

module.exports = new AdminRoleService();

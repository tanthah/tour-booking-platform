const User = require('../user/user.model');
const Role = require('../role/role.model');
const auditLogService = require('../audit/auditLog.service');
const permissionService = require('../../services/permissionService');
const { ALL_PERMISSIONS } = require('../../utils/permissionCodes');

class AdminUserService {
  /**
   * Danh sách người dùng (phân trang, lọc theo status, role, tìm kiếm tên/email/phone)
   */
  async listUsers({ page = 1, limit = 20, role_id, status, search }) {
    const filter = { deleted_at: null };

    if (role_id) filter.role_id = role_id;
    if (status) filter.status = status;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { full_name: regex },
        { email: regex },
        { phone: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('role_id', 'code name description is_system is_active')
        .select('-password_hash')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      items: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Xem chi tiết 1 người dùng theo ID
   */
  async getUserById(id) {
    const user = await User.findOne({ _id: id, deleted_at: null })
      .populate('role_id', 'code name description is_system is_active permissions')
      .select('-password_hash');

    if (!user) {
      const error = new Error('Người dùng không tồn tại hoặc đã bị xóa');
      error.statusCode = 404;
      throw error;
    }

    const effectivePermissions = await permissionService.getEffectivePermissions(user);
    const userObj = user.toObject();
    userObj.effective_permissions = effectivePermissions;

    return userObj;
  }

  /**
   * Khóa hoặc mở khóa trạng thái tài khoản người dùng
   */
  async changeStatus({ actor, targetId, status, reason = '', ip = '', userAgent = '' }) {
    const target = await User.findOne({ _id: targetId, deleted_at: null }).populate('role_id');
    if (!target) {
      const error = new Error('Người dùng không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Không cho phép tự khóa chính mình
    if (actor._id.toString() === target._id.toString() && status !== 'ACTIVE') {
      const error = new Error('Bạn không thể tự khóa hoặc vô hiệu hóa tài khoản của chính mình');
      error.statusCode = 400;
      throw error;
    }

    // Bảo vệ Quản trị viên cuối cùng
    const isTargetAdmin = target.role_id?.code === 'admin' || (target.roles && target.roles.includes('ADMIN'));
    if (isTargetAdmin && status !== 'ACTIVE') {
      const activeAdminCount = await this._countActiveAdmins();
      if (activeAdminCount <= 1) {
        const error = new Error('Không thể khóa hoặc vô hiệu hóa Quản trị viên duy nhất đang hoạt động');
        error.statusCode = 400;
        throw error;
      }
    }

    const oldStatus = target.status;
    target.status = status;
    await target.save();

    // Ghi AuditLog
    await auditLogService.log({
      actor_user_id: actor._id,
      target_user_id: target._id,
      action: 'CHANGE_STATUS',
      resource: 'User',
      old_value: { status: oldStatus },
      new_value: { status },
      reason,
      ip_address: ip,
      user_agent: userAgent,
    });

    return {
      message: `Cập nhật trạng thái người dùng thành ${status} thành công`,
      user: {
        _id: target._id,
        status: target.status,
      },
    };
  }

  /**
   * Thay đổi vai trò (Role) của người dùng
   */
  async changeRole({ actor, targetId, roleId, reason = '', ip = '', userAgent = '' }) {
    const target = await User.findOne({ _id: targetId, deleted_at: null }).populate('role_id');
    if (!target) {
      const error = new Error('Người dùng không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Cấm tự đổi vai trò của chính mình
    if (actor._id.toString() === target._id.toString()) {
      const error = new Error('Bạn không thể tự thay đổi vai trò của chính mình');
      error.statusCode = 400;
      throw error;
    }

    const newRole = await Role.findById(roleId);
    if (!newRole || !newRole.is_active) {
      const error = new Error('Vai trò mới không tồn tại hoặc đã bị vô hiệu hóa');
      error.statusCode = 400;
      throw error;
    }

    // Cấm Staff tự gán role Admin cho người khác
    const isActorAdmin = actor.role_id?.code === 'admin' || (actor.roles && actor.roles.includes('ADMIN'));
    if (newRole.code === 'admin' && !isActorAdmin) {
      const error = new Error('Chỉ Quản trị viên mới có quyền chỉ định vai trò Quản trị viên');
      error.statusCode = 403;
      throw error;
    }

    // Bảo vệ Quản trị viên cuối cùng
    const isTargetAdmin = target.role_id?.code === 'admin' || (target.roles && target.roles.includes('ADMIN'));
    if (isTargetAdmin && newRole.code !== 'admin') {
      const activeAdminCount = await this._countActiveAdmins();
      if (activeAdminCount <= 1) {
        const error = new Error('Không thể chuyển vai trò của Quản trị viên duy nhất đang hoạt động');
        error.statusCode = 400;
        throw error;
      }
    }

    const oldRole = target.role_id ? { _id: target.role_id._id, code: target.role_id.code, name: target.role_id.name } : null;

    target.role_id = newRole._id;
    // Đồng bộ trường roles cho tương thích
    if (newRole.code === 'admin') {
      target.roles = ['ADMIN'];
    } else if (newRole.code.includes('staff')) {
      target.roles = ['STAFF'];
    } else {
      target.roles = ['CUSTOMER'];
    }

    await target.save();

    // Ghi AuditLog
    await auditLogService.log({
      actor_user_id: actor._id,
      target_user_id: target._id,
      action: 'CHANGE_ROLE',
      resource: 'User',
      old_value: oldRole,
      new_value: { _id: newRole._id, code: newRole.code, name: newRole.name },
      reason,
      ip_address: ip,
      user_agent: userAgent,
    });

    return {
      message: `Đã thay đổi vai trò của người dùng sang [${newRole.name}] thành công`,
      user: {
        _id: target._id,
        role: {
          _id: newRole._id,
          code: newRole.code,
          name: newRole.name,
        },
      },
    };
  }

  /**
   * Cấu hình quyền riêng ngoại lệ (Permission Overrides) cho người dùng
   */
  async setPermissionOverrides({ actor, targetId, overrides, reason = '', ip = '', userAgent = '' }) {
    const target = await User.findOne({ _id: targetId, deleted_at: null });
    if (!target) {
      const error = new Error('Người dùng không tồn tại');
      error.statusCode = 404;
      throw error;
    }

    // Cấm tự override quyền cho chính mình
    if (actor._id.toString() === target._id.toString()) {
      const error = new Error('Bạn không thể tự cấu hình quyền riêng cho chính mình');
      error.statusCode = 400;
      throw error;
    }

    // Xác thực danh sách permissions
    for (const item of overrides) {
      if (!ALL_PERMISSIONS.includes(item.permission)) {
        const error = new Error(`Mã quyền không hợp lệ: ${item.permission}`);
        error.statusCode = 400;
        throw error;
      }
    }

    const oldOverrides = target.permission_overrides || [];
    target.permission_overrides = overrides;
    await target.save();

    // Ghi AuditLog
    await auditLogService.log({
      actor_user_id: actor._id,
      target_user_id: target._id,
      action: 'SET_PERMISSION_OVERRIDE',
      resource: 'User',
      old_value: oldOverrides,
      new_value: overrides,
      reason,
      ip_address: ip,
      user_agent: userAgent,
    });

    const effectivePermissions = await permissionService.getEffectivePermissions(target);

    return {
      message: 'Cập nhật quyền riêng của người dùng thành công',
      permission_overrides: target.permission_overrides,
      effective_permissions: effectivePermissions,
    };
  }

  /**
   * Đếm số lượng Admin đang active trong hệ thống
   */
  async _countActiveAdmins() {
    const adminRole = await Role.findOne({ code: 'admin' });
    if (!adminRole) return 0;

    return await User.countDocuments({
      status: 'ACTIVE',
      deleted_at: null,
      $or: [{ role_id: adminRole._id }, { roles: 'ADMIN' }],
    });
  }
}

module.exports = new AdminUserService();

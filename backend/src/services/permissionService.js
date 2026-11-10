const Role = require('../modules/role/role.model');
const { ALL_PERMISSIONS } = require('../utils/permissionCodes');

class PermissionService {
  /**
   * Lấy Role đầy đủ của User (tự động load nếu user.role_id chỉ là ObjectId)
   * @param {Object} user
   * @returns {Promise<Object|null>}
   */
  async getPopulatedRole(user) {
    if (!user) return null;
    if (user.role_id && typeof user.role_id === 'object' && user.role_id.code) {
      return user.role_id;
    }
    if (user.role_id) {
      return await Role.findById(user.role_id).lean();
    }
    // Backward compatibility: nếu user có roles: ['ADMIN']
    if (user.roles && user.roles.includes('ADMIN')) {
      return await Role.findOne({ code: 'admin' }).lean();
    }
    if (user.roles && user.roles.includes('STAFF')) {
      return await Role.findOne({ code: 'tour_staff' }).lean();
    }
    if (user.roles && user.roles.includes('CUSTOMER')) {
      return await Role.findOne({ code: 'customer' }).lean();
    }
    return null;
  }

  /**
   * Tính danh sách toàn bộ quyền hiệu lực của người dùng
   * (Kết hợp Role permissions + User overrides ALLOW/DENY)
   * @param {Object} user - User document
   * @returns {Promise<string[]>} Danh sách mã quyền hiệu lực
   */
  async getEffectivePermissions(user) {
    if (!user || user.status !== 'ACTIVE' || user.deleted_at) {
      return [];
    }

    const role = await this.getPopulatedRole(user);
    if (!role || role.is_active === false) {
      return [];
    }

    // Tập hợp quyền cơ sở từ Role
    let basePermissions = new Set();

    // Super Admin role có toàn bộ quyền hệ thống
    if (role.code === 'admin') {
      ALL_PERMISSIONS.forEach((p) => basePermissions.add(p));
    } else if (Array.isArray(role.permissions)) {
      role.permissions.forEach((p) => basePermissions.add(p));
    }

    // Áp dụng Permission Overrides của User
    if (Array.isArray(user.permission_overrides)) {
      for (const override of user.permission_overrides) {
        if (!override || !override.permission) continue;
        if (override.effect === 'DENY') {
          basePermissions.delete(override.permission);
        } else if (override.effect === 'ALLOW') {
          basePermissions.add(override.permission);
        }
      }
    }

    return Array.from(basePermissions);
  }

  /**
   * Kiểm tra người dùng có một hoặc nhiều quyền nhất định hay không
   * @param {Object} user - User document
   * @param {string|string[]} requiredPermission - Mã quyền hoặc mảng mã quyền cần kiểm tra (OR logic)
   * @returns {Promise<boolean>}
   */
  async hasPermission(user, requiredPermission) {
    if (!user || user.status !== 'ACTIVE' || user.deleted_at) {
      return false;
    }

    // Kiểm tra override trước
    const overrides = user.permission_overrides || [];
    const permsToCheck = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];

    const effective = await this.getEffectivePermissions(user);
    const effectiveSet = new Set(effective);

    // Thỏa mãn nếu user sở hữu ít nhất một trong các quyền yêu cầu
    return permsToCheck.some((p) => effectiveSet.has(p));
  }
}

module.exports = new PermissionService();

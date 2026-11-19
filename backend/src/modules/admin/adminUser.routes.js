const express = require('express');
const router = express.Router();
const adminUserController = require('./adminUser.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const {
  listUsersValidation,
  userIdParamValidation,
  changeStatusValidation,
  changeRoleValidation,
  setPermissionOverridesValidation,
} = require('./adminUser.validation');

// Tất cả route trong module đều yêu cầu đăng nhập
router.use(authenticate);

// Danh sách tài khoản người dùng
router.get(
  '/',
  requirePermission(PERMISSIONS.USER_VIEW),
  listUsersValidation,
  adminUserController.listUsers
);

// Chi tiết một người dùng
router.get(
  '/:id',
  requirePermission(PERMISSIONS.USER_VIEW),
  userIdParamValidation,
  adminUserController.getUserById
);

// Khóa hoặc mở khóa tài khoản
router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.USER_MANAGE),
  changeStatusValidation,
  adminUserController.changeStatus
);

// Thay đổi vai trò người dùng
router.patch(
  '/:id/role',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  changeRoleValidation,
  adminUserController.changeRole
);

// Xem quyền hiệu lực & overrides của người dùng
router.get(
  '/:id/permissions',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  userIdParamValidation,
  adminUserController.getUserById
);

// Thiết lập quyền riêng ngoại lệ (overrides)
router.put(
  '/:id/permission-overrides',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  setPermissionOverridesValidation,
  adminUserController.setPermissionOverrides
);

module.exports = router;

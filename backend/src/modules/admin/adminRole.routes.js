const express = require('express');
const router = express.Router();
const adminRoleController = require('./adminRole.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const {
  roleIdParamValidation,
  createRoleValidation,
  updateRoleValidation,
  setRolePermissionsValidation,
} = require('./adminRole.validation');

// Tất cả route trong module đều yêu cầu đăng nhập
router.use(authenticate);

// Lấy danh mục quyền hệ thống
router.get(
  '/catalog/permissions',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  adminRoleController.getPermissionCatalog
);

// Lấy danh sách các vai trò
router.get(
  '/',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  adminRoleController.listRoles
);

// Tạo vai trò mới
router.post(
  '/',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  createRoleValidation,
  adminRoleController.createRole
);

// Chi tiết vai trò theo ID
router.get(
  '/:id',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  roleIdParamValidation,
  adminRoleController.getRoleById
);

// Cập nhật thông tin vai trò
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  updateRoleValidation,
  adminRoleController.updateRole
);

// Cập nhật danh sách quyền của vai trò
router.put(
  '/:id/permissions',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  setRolePermissionsValidation,
  adminRoleController.setRolePermissions
);

module.exports = router;

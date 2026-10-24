const express = require('express');
const router = express.Router();

const adminUserRoutes = require('./adminUser.routes');
const adminRoleRoutes = require('./adminRole.routes');
const adminAuditRoutes = require('./adminAudit.routes');
const adminRoleController = require('./adminRole.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');

// Quản lý người dùng: /api/admin/users
router.use('/users', adminUserRoutes);

// Quản lý vai trò: /api/admin/roles
router.use('/roles', adminRoleRoutes);

// Danh mục quyền catalog: /api/admin/permissions
router.get(
  '/permissions',
  authenticate,
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  adminRoleController.getPermissionCatalog
);

// Nhật ký kiểm toán: /api/admin/audit-logs
router.use('/audit-logs', adminAuditRoutes);

module.exports = router;

const express = require('express');
const router = express.Router();
const settingController = require('./setting.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');

// Public route: Lấy thông tin cài đặt (Header/Footer sử dụng)
router.get('/public', settingController.getSettings);

// Protected route: Cập nhật thông tin cài đặt (yêu cầu quyền settings.manage)
router.put('/', authenticate, requirePermission(PERMISSIONS.SETTINGS_MANAGE), settingController.updateSettings);

module.exports = router;

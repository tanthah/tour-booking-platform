const express = require('express');
const router = express.Router();
const settingController = require('./setting.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

// Public route: Lấy thông tin cài đặt (Header/Footer sử dụng)
router.get('/public', settingController.getSettings);

// Protected route: Admin cập nhật thông tin cài đặt
router.put('/', authenticate, authorize('ADMIN'), settingController.updateSettings);

module.exports = router;

const express = require('express');
const router = express.Router();
const { upload } = require('../../middlewares/upload.middleware');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const uploadController = require('./upload.controller');

// Endpoint upload mot anh (yeu cau dang nhap + quyen upload.image)
router.post(
  '/image',
  authenticate,
  requirePermission(PERMISSIONS.UPLOAD_IMAGE),
  upload.single('image'),
  uploadController.uploadImage
);

// Endpoint upload nhieu anh (toi da 10 anh, yeu cau dang nhap + quyen upload.image)
router.post(
  '/images',
  authenticate,
  requirePermission(PERMISSIONS.UPLOAD_IMAGE),
  upload.array('images', 10),
  uploadController.uploadMultipleImages
);

module.exports = router;

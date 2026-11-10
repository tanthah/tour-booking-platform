const express = require('express');
const router = express.Router();
const { upload } = require('../../middlewares/upload.middleware');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const uploadController = require('./upload.controller');

// Endpoint upload mot anh (yeu cau dang nhap + quyen ADMIN/STAFF)
router.post(
  '/image',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  upload.single('image'),
  uploadController.uploadImage
);

// Endpoint upload nhieu anh (toi da 10 anh, yeu cau dang nhap + quyen ADMIN/STAFF)
router.post(
  '/images',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  upload.array('images', 10),
  uploadController.uploadMultipleImages
);

module.exports = router;

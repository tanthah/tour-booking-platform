const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../../../middlewares/auth.middleware');
const requirePermission = require('../../../middlewares/requirePermission');
const validate = require('../../../middlewares/validate.middleware');
const { PERMISSIONS } = require('../../../utils/permissionCodes');
const albumController = require('../controllers/album.controller');
const {
  createAlbumValidation,
  updateAlbumValidation,
  assignPhotoValidation,
  removeAssignmentValidation,
} = require('../validations/souvenir.validation');

// Multer memory storage cho upload ảnh album (tối đa 20 ảnh/lần, 10MB/ảnh)
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Chỉ chấp nhận file ảnh định dạng JPEG, PNG hoặc WebP');
    error.statusCode = 400;
    cb(error, false);
  }
};
const uploadMultiPhotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
}).array('photos', 20);

router.use(authenticate);

// Danh sách đợt khởi hành hoàn thành đủ điều kiện tạo album
router.get(
  '/departures',
  requirePermission(PERMISSIONS.SOUVENIR_ALBUM_VIEW),
  albumController.getCompletedDepartures
);

// Tạo Album mới cho đợt khởi hành
router.post(
  '/',
  requirePermission(PERMISSIONS.SOUVENIR_ALBUM_CREATE),
  createAlbumValidation,
  validate,
  albumController.createAlbum
);

// Chi tiết Album
router.get(
  '/:albumId',
  requirePermission(PERMISSIONS.SOUVENIR_ALBUM_VIEW),
  albumController.getAlbumDetail
);

// Cập nhật Album
router.put(
  '/:albumId',
  requirePermission(PERMISSIONS.SOUVENIR_ALBUM_UPDATE),
  updateAlbumValidation,
  validate,
  albumController.updateAlbum
);

// Tải ảnh lên Album
router.post(
  '/:albumId/photos',
  requirePermission(PERMISSIONS.SOUVENIR_PHOTO_UPLOAD),
  uploadMultiPhotos,
  albumController.uploadPhotos
);

// Lấy danh sách ảnh trong Album
router.get(
  '/:albumId/photos',
  requirePermission(PERMISSIONS.SOUVENIR_ALBUM_VIEW),
  albumController.getAlbumPhotos
);

// Cập nhật thông tin ảnh
router.put(
  '/photos/:photoId',
  requirePermission(PERMISSIONS.SOUVENIR_PHOTO_UPLOAD),
  albumController.updatePhoto
);

// Xóa ảnh khỏi Album
router.delete(
  '/photos/:photoId',
  requirePermission(PERMISSIONS.SOUVENIR_PHOTO_DELETE),
  albumController.deletePhoto
);

// Gắn ảnh cho khách hàng
router.post(
  '/photos/:photoId/assign',
  requirePermission(PERMISSIONS.SOUVENIR_PHOTO_ASSIGN),
  assignPhotoValidation,
  validate,
  albumController.assignPhoto
);

// Gỡ ảnh khỏi khách hàng
router.delete(
  '/photos/:photoId/assign',
  requirePermission(PERMISSIONS.SOUVENIR_PHOTO_ASSIGN),
  removeAssignmentValidation,
  validate,
  albumController.removePhotoAssignment
);

// Danh sách khách hàng của đợt khởi hành + số ảnh gắn
router.get(
  '/:albumId/customers',
  requirePermission(PERMISSIONS.SOUVENIR_ALBUM_VIEW),
  albumController.getDepartureCustomers
);

module.exports = router;


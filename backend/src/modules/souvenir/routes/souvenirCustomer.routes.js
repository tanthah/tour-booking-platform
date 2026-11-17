const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middlewares/auth.middleware');
const souvenirCustomerController = require('../controllers/souvenirCustomer.controller');

router.use(authenticate);

// Danh sách thiệp đã phát hành của tôi
router.get('/my-cards', souvenirCustomerController.getMyCards);

// Chi tiết thiệp (tìm theo public_code hoặc cardId)
router.get('/my-cards/:identifier', souvenirCustomerController.getMyCardDetail);

// Album ảnh chung của đoàn
router.get('/my-cards/:identifier/album', souvenirCustomerController.getMyCardSharedAlbum);

// Tải 1 ảnh (kiểm tra quyền nghiêm ngặt)
router.get('/photos/:photoId/download', souvenirCustomerController.downloadSinglePhoto);

// Tải toàn bộ album ảnh (ZIP Streaming)
router.get('/my-cards/:identifier/download-album', souvenirCustomerController.downloadAlbumZip);

module.exports = router;


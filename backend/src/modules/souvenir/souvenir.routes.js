const express = require('express');
const router = express.Router();

const albumRoutes = require('./routes/album.routes');
const souvenirCardRoutes = require('./routes/souvenirCard.routes');
const cardAdminRoutes = require('./routes/cardAdmin.routes');
const souvenirCustomerRoutes = require('./routes/souvenirCustomer.routes');

// Mount routes khách hàng (khách xem thiệp, album đoàn, tải ảnh)
router.use('/', souvenirCustomerRoutes);

// Mount routes duyệt & quản trị Admin (duyệt, yêu cầu sửa, phát hành, thu hồi, resend email)
router.use('/', cardAdminRoutes);

// Mount routes biên tập thiệp của Nhân viên (tạo, sửa, xem trước, gửi duyệt)
router.use('/', souvenirCardRoutes);

// Mount routes quản lý Album & ảnh (tải ảnh, phân loại, gắn khách)
router.use('/albums', albumRoutes);
router.use('/', albumRoutes);

module.exports = router;


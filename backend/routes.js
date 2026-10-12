const express = require('express');
const router = express.Router();

// Import router của các sub-module
const userRoutes = require('./modules/user/user.routes');
const tourRoutes = require('./modules/tour/tour.routes');
const categoryRoutes = require('./modules/category/category.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const cartRoutes = require('./modules/cart/cart.routes');

// Đăng ký các Endpoint phân hệ User & Authentication theo prefix /auth
router.use('/auth', userRoutes);

// Đăng ký các Endpoint phân hệ Tour theo prefix /tours
router.use('/tours', tourRoutes);

// Đăng ký các Endpoint phân hệ Danh mục theo prefix /categories
router.use('/categories', categoryRoutes);

// Đăng ký các Endpoint Upload ảnh theo prefix /upload
router.use('/upload', uploadRoutes);

// Đăng ký các Endpoint phân hệ Giỏ hàng theo prefix /cart
router.use('/cart', cartRoutes);

module.exports = router;

const express = require('express');
const router = express.Router();

// Import router của các sub-module
const userRoutes = require('./modules/user/user.routes');
const tourRoutes = require('./modules/tour/tour.routes');
const departureRoutes = require('./modules/tour/tourDeparture.routes');
const categoryRoutes = require('./modules/category/category.routes');
const uploadRoutes = require('./modules/upload/upload.routes');
const cartRoutes = require('./modules/cart/cart.routes');
const orderRoutes = require('./modules/order/order.routes');
const settingRoutes = require('./modules/setting/setting.routes');
const couponRoutes = require('./modules/coupon/coupon.routes');

// Đăng ký các Endpoint phân hệ User & Authentication theo prefix /auth
router.use('/auth', userRoutes);

// Đăng ký các Endpoint phân hệ Tour theo prefix /tours (bao gồm đợt khởi hành nested)
router.use('/tours', tourRoutes);

// Đăng ký các Endpoint Đợt khởi hành theo prefix /departures (dùng departure ID)
router.use('/departures', departureRoutes);

// Đăng ký các Endpoint phân hệ Danh mục theo prefix /categories
router.use('/categories', categoryRoutes);

// Đăng ký các Endpoint Upload ảnh theo prefix /upload
router.use('/upload', uploadRoutes);

// Đăng ký các Endpoint phân hệ Giỏ hàng theo prefix /cart
router.use('/cart', cartRoutes);

// Đăng ký các Endpoint phân hệ Đơn hàng theo prefix /orders
router.use('/orders', orderRoutes);

// Đăng ký các Endpoint phân hệ Cài đặt chung theo prefix /settings
router.use('/settings', settingRoutes);

// Đăng ký các Endpoint phân hệ Mã giảm giá theo prefix /coupons
router.use('/coupons', couponRoutes);

module.exports = router;

const express = require('express');
const router = express.Router();

// Import router của các sub-module
const userRoutes = require('./modules/user/user.routes');
const tourRoutes = require('./modules/tour/tour.routes');

// Đăng ký các Endpoint phân hệ User & Authentication theo prefix /auth
router.use('/auth', userRoutes);

// Đăng ký các Endpoint phân hệ Tour theo prefix /tours
router.use('/tours', tourRoutes);

module.exports = router;

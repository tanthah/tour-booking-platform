const express = require('express');
const router = express.Router();

// Import router của các sub-module
const userRoutes = require('./modules/user/user.routes');

// Đăng ký các Endpoint phân hệ User & Authentication theo prefix /auth
router.use('/auth', userRoutes);

module.exports = router;

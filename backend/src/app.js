const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Cấu hình các Middleware cơ bản (CORS, JSON Parser, URL-encoded Parser)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Đăng ký tập trung các API Routes
app.use('/api', routes);

// Route Health Check để kiểm tra trạng thái hoạt động của Server
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware xử lý lỗi tập trung (Error Handler Middleware - phải đặt sau tất cả các routes)
app.use(errorMiddleware);

module.exports = app;

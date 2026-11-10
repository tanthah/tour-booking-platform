const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');
const { expirePendingPayments } = require('./modules/payment/paymentRefund.service');

// Kết nối MongoDB database và khởi động HTTP Express server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);

      // Quét giải phóng chỗ giữ tạm cho các giao dịch ZaloPay hết hạn (mỗi 60s)
      setInterval(async () => {
        try {
          await expirePendingPayments();
        } catch (err) {
          console.error('[Payment Expire Error]:', err.message);
        }
      }, 60 * 1000);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

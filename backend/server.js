const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');

// Kết nối MongoDB database và khởi động HTTP Express server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

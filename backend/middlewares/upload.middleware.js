const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Cấu hình Multer sử dụng Memory Storage (lưu file tạm trong bộ nhớ RAM)
const storage = multer.memoryStorage();

/**
 * Bộ lọc file: chỉ cho phép upload các định dạng ảnh hợp lệ
 */
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

// Middleware Multer xử lý upload file đơn (single file)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn dung lượng tối đa 5MB
  },
});

/**
 * Hàm upload buffer ảnh lên Cloudinary và trả về kết quả
 * @param {Buffer} fileBuffer - Buffer dữ liệu file ảnh
 * @param {string} folder - Thư mục lưu trên Cloudinary
 * @returns {Promise<object>} Kết quả upload từ Cloudinary (secure_url, public_id, ...)
 */
const uploadToCloudinary = (fileBuffer, folder = 'tour-booking') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Hàm xóa ảnh trên Cloudinary theo public_id
 * @param {string} publicId - Public ID của ảnh trên Cloudinary
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Lỗi khi xóa ảnh trên Cloudinary:', error.message);
    throw error;
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };


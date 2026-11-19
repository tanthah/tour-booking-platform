const { uploadToCloudinary } = require('../../middlewares/upload.middleware');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * Controller: Upload một ảnh lên Cloudinary và trả về URL
 * HTTP Method: POST /api/upload/image
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 400, 'Vui lòng chọn file ảnh để upload');
  }

  const result = await uploadToCloudinary(req.file.buffer, 'tour-booking');

  ApiResponse.success(res, 200, 'Upload ảnh thành công', {
    url: result.secure_url,
    public_id: result.public_id,
  });
});

/**
 * Controller: Upload nhiều ảnh lên Cloudinary và trả về danh sách URL
 * HTTP Method: POST /api/upload/images
 */
const uploadMultipleImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return ApiResponse.error(res, 400, 'Vui lòng chọn ít nhất 1 file ảnh để upload');
  }

  const uploadPromises = req.files.map((file) =>
    uploadToCloudinary(file.buffer, 'tour-booking')
  );
  const results = await Promise.all(uploadPromises);

  const images = results.map((result) => ({
    url: result.secure_url,
    public_id: result.public_id,
  }));

  ApiResponse.success(res, 200, 'Upload ảnh thành công', images);
});

module.exports = { uploadImage, uploadMultipleImages };


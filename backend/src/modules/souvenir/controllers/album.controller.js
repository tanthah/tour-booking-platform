const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/apiResponse');
const albumService = require('../services/album.service');

const getCompletedDepartures = asyncHandler(async (req, res) => {
  const result = await albumService.getCompletedDepartures(req.query);
  return ApiResponse.success(res, 200, 'Lấy danh sách đợt khởi hành hoàn thành thành công', result);
});

const createAlbum = asyncHandler(async (req, res) => {
  const album = await albumService.createAlbum(req.body.departure_id, req.user, req.body);
  return ApiResponse.success(res, 201, 'Tạo Album kỷ niệm thành công', album);
});

const getAlbumDetail = asyncHandler(async (req, res) => {
  const result = await albumService.getAlbumDetail(req.params.albumId);
  return ApiResponse.success(res, 200, 'Lấy chi tiết Album thành công', result);
});

const updateAlbum = asyncHandler(async (req, res) => {
  const album = await albumService.updateAlbum(req.params.albumId, req.body);
  return ApiResponse.success(res, 200, 'Cập nhật Album thành công', album);
});

const uploadPhotos = asyncHandler(async (req, res) => {
  const result = await albumService.uploadPhotos(
    req.params.albumId,
    req.user,
    req.files,
    req.body
  );
  return ApiResponse.success(res, 201, 'Tải ảnh lên thành công', result);
});

const getAlbumPhotos = asyncHandler(async (req, res) => {
  const result = await albumService.getAlbumPhotos(req.params.albumId, req.query);
  return ApiResponse.success(res, 200, 'Lấy danh sách ảnh thành công', result);
});

const updatePhoto = asyncHandler(async (req, res) => {
  const photo = await albumService.updatePhoto(req.params.photoId, req.body);
  return ApiResponse.success(res, 200, 'Cập nhật ảnh thành công', photo);
});

const deletePhoto = asyncHandler(async (req, res) => {
  const force = req.query.force === 'true' || req.body.force === true;
  const result = await albumService.deletePhoto(req.params.photoId, force);
  return ApiResponse.success(res, 200, result.message || 'Xóa ảnh thành công', result);
});

const assignPhoto = asyncHandler(async (req, res) => {
  const photo = await albumService.assignPhotoToCustomers(
    req.params.photoId,
    req.body.assignments
  );
  return ApiResponse.success(res, 200, 'Gắn ảnh riêng cho khách hàng thành công', photo);
});

const removePhotoAssignment = asyncHandler(async (req, res) => {
  const photo = await albumService.removePhotoAssignment(
    req.params.photoId,
    req.body.booking_customer_id
  );
  return ApiResponse.success(res, 200, 'Gỡ ảnh riêng khỏi khách hàng thành công', photo);
});

const getDepartureCustomers = asyncHandler(async (req, res) => {
  const customers = await albumService.getDepartureCustomersWithPhotos(req.params.albumId);
  return ApiResponse.success(res, 200, 'Lấy danh sách hành khách thành công', customers);
});

module.exports = {
  getCompletedDepartures,
  createAlbum,
  getAlbumDetail,
  updateAlbum,
  uploadPhotos,
  getAlbumPhotos,
  updatePhoto,
  deletePhoto,
  assignPhoto,
  removePhotoAssignment,
  getDepartureCustomers,
};


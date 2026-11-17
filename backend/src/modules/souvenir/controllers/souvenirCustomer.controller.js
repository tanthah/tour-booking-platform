const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/apiResponse');
const souvenirCustomerService = require('../services/souvenirCustomer.service');

const getMyCards = asyncHandler(async (req, res) => {
  const result = await souvenirCustomerService.getMyCards(req.user._id, req.query);
  return ApiResponse.success(res, 200, 'Lấy danh sách thiệp kỷ niệm thành công', result);
});

const getMyCardDetail = asyncHandler(async (req, res) => {
  const result = await souvenirCustomerService.getMyCardDetail(req.params.identifier, req.user._id);
  return ApiResponse.success(res, 200, 'Lấy chi tiết thiệp kỷ niệm thành công', result);
});

const getMyCardSharedAlbum = asyncHandler(async (req, res) => {
  const result = await souvenirCustomerService.getMyCardSharedAlbum(
    req.params.identifier,
    req.user._id,
    req.query
  );
  return ApiResponse.success(res, 200, 'Lấy ảnh album chung của đoàn thành công', result);
});

const downloadSinglePhoto = asyncHandler(async (req, res) => {
  const result = await souvenirCustomerService.getPhotoDownload(req.params.photoId, req.user._id);
  return ApiResponse.success(res, 200, 'Tạo liên kết tải ảnh thành công', result);
});

const downloadAlbumZip = asyncHandler(async (req, res) => {
  await souvenirCustomerService.streamAlbumZip(req.params.identifier, req.user._id, res);
});

module.exports = {
  getMyCards,
  getMyCardDetail,
  getMyCardSharedAlbum,
  downloadSinglePhoto,
  downloadAlbumZip,
};


const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/apiResponse');
const souvenirCardService = require('../services/souvenirCard.service');

const createCard = asyncHandler(async (req, res) => {
  const card = await souvenirCardService.createCard(req.body, req.user);
  return ApiResponse.success(res, 201, 'Tạo thiệp điện tử thành công', card);
});

const batchCreateCards = asyncHandler(async (req, res) => {
  const result = await souvenirCardService.batchCreateCards(req.params.albumId, req.user);
  return ApiResponse.success(res, 201, 'Tạo thiệp hàng loạt thành công', result);
});

const getCardDetail = asyncHandler(async (req, res) => {
  const card = await souvenirCardService.getCardDetail(req.params.cardId);
  return ApiResponse.success(res, 200, 'Lấy chi tiết thiệp thành công', card);
});

const updateCard = asyncHandler(async (req, res) => {
  const card = await souvenirCardService.updateCard(req.params.cardId, req.user, req.body);
  return ApiResponse.success(res, 200, 'Cập nhật thiệp thành công', card);
});

const previewCard = asyncHandler(async (req, res) => {
  const result = await souvenirCardService.previewCard(req.params.cardId);
  return ApiResponse.success(res, 200, 'Xem trước thiệp thành công', result);
});

const getAlbumCards = asyncHandler(async (req, res) => {
  const result = await souvenirCardService.getAlbumCards(req.params.albumId, req.query);
  return ApiResponse.success(res, 200, 'Lấy danh sách thiệp thành công', result);
});

const submitReview = asyncHandler(async (req, res) => {
  const card = await souvenirCardService.submitReview(req.params.cardId, req.user);
  return ApiResponse.success(res, 200, 'Gửi thiệp sang Admin duyệt thành công', card);
});

const batchSubmitReview = asyncHandler(async (req, res) => {
  const result = await souvenirCardService.batchSubmitReview(req.params.albumId, req.user);
  return ApiResponse.success(res, 200, 'Gửi duyệt hàng loạt thành công', result);
});

module.exports = {
  createCard,
  batchCreateCards,
  getCardDetail,
  updateCard,
  previewCard,
  getAlbumCards,
  submitReview,
  batchSubmitReview,
};


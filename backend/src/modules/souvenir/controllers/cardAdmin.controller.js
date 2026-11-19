const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/apiResponse');
const souvenirCardService = require('../services/souvenirCard.service');

const getPendingReviews = asyncHandler(async (req, res) => {
  const result = await souvenirCardService.getPendingReviews(req.query);
  return ApiResponse.success(res, 200, 'Lấy danh sách thiệp chờ duyệt thành công', result);
});

const approveCard = asyncHandler(async (req, res) => {
  const card = await souvenirCardService.adminApprove(
    req.params.cardId,
    req.user,
    req.body.comment
  );
  return ApiResponse.success(res, 200, 'Duyệt thiệp thành công', card);
});

const requestRevision = asyncHandler(async (req, res) => {
  const card = await souvenirCardService.adminRequestRevision(
    req.params.cardId,
    req.user,
    req.body.reason
  );
  return ApiResponse.success(res, 200, 'Yêu cầu chỉnh sửa thiệp thành công', card);
});

const publishCard = asyncHandler(async (req, res) => {
  const card = await souvenirCardService.adminPublish(req.params.cardId, req.user);
  return ApiResponse.success(res, 200, 'Phát hành thiệp thành công', card);
});

const batchPublish = asyncHandler(async (req, res) => {
  const result = await souvenirCardService.batchPublish(req.params.albumId, req.user);
  return ApiResponse.success(res, 200, 'Phát hành hàng loạt thành công', result);
});

const revokeCard = asyncHandler(async (req, res) => {
  const card = await souvenirCardService.adminRevoke(
    req.params.cardId,
    req.user,
    req.body.reason
  );
  return ApiResponse.success(res, 200, 'Thu hồi thiệp thành công', card);
});

module.exports = {
  getPendingReviews,
  approveCard,
  requestRevision,
  publishCard,
  batchPublish,
  revokeCard,
};


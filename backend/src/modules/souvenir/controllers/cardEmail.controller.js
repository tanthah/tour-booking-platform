const asyncHandler = require('../../../utils/asyncHandler');
const ApiResponse = require('../../../utils/apiResponse');
const cardEmailService = require('../services/cardEmail.service');

const resendCardEmail = asyncHandler(async (req, res) => {
  const result = await cardEmailService.resendEmail(req.params.cardId, req.user);
  return ApiResponse.success(res, 200, 'Gửi lại email thông báo thành công', result);
});

const getCardEmailLogs = asyncHandler(async (req, res) => {
  const logs = await cardEmailService.getCardEmailLogs(req.params.cardId);
  return ApiResponse.success(res, 200, 'Lấy lịch sử gửi email thành công', logs);
});

module.exports = {
  resendCardEmail,
  getCardEmailLogs,
};


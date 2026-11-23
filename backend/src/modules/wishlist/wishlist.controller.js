const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const wishlistService = require('./wishlist.service');

const getWishlist = asyncHandler(async (req, res) => {
  const tours = await wishlistService.getWishlist(req.user._id);
  ApiResponse.success(res, 200, 'Lấy danh sách yêu thích thành công', { tours });
});

const addTour = asyncHandler(async (req, res) => {
  const tourId = await wishlistService.addTour(req.user._id, req.params.tourId);
  ApiResponse.success(res, 200, 'Đã thêm tour vào danh sách yêu thích', { tourId });
});

const removeTour = asyncHandler(async (req, res) => {
  await wishlistService.removeTour(req.user._id, req.params.tourId);
  ApiResponse.success(res, 200, 'Đã xóa tour khỏi danh sách yêu thích');
});

module.exports = { getWishlist, addTour, removeTour };

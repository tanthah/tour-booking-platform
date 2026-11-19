/**
 * Higher-Order Function bọc các hàm bất đồng bộ (async/await) trong Express Controller/Middleware
 * Tự động catch các lỗi bất đồng bộ và chuyển tiếp tới Error Handling Middleware qua hàm next()
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

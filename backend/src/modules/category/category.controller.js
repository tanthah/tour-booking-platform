const { validationResult } = require('express-validator');
const categoryService = require('./category.service');
 const ApiResponse = require('../../utils/apiResponse');
 const asyncHandler = require('../../utils/asyncHandler');

 /**
  * Hàm helper kiểm tra và xử lý lỗi Validation từ express-validator
  */
 const handleValidation = (req, res) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
     const formattedErrors = errors.array().map((err) => ({
       field: err.path,
       message: err.msg,
     }));
     ApiResponse.error(res, 400, 'Dữ liệu không hợp lệ', formattedErrors);
     return false;
   }
   return true;
 };

 /**
  * Controller: Tạo danh mục mới
  * HTTP Method: POST /api/categories
  */
 const createCategory = asyncHandler(async (req, res) => {
   if (!handleValidation(req, res)) return;
   const category = await categoryService.createCategory(req.body);
   ApiResponse.success(res, 201, 'Tạo danh mục thành công', category);
 });

 /**
  * Controller: Lấy danh sách tất cả danh mục (có phân trang, lọc, tìm kiếm)
  * HTTP Method: GET /api/categories
  */
 const getAllCategories = asyncHandler(async (req, res) => {
   if (!handleValidation(req, res)) return;
   const result = await categoryService.getAllCategories(req.query);
   ApiResponse.success(res, 200, 'Lấy danh sách danh mục thành công', result);
 });

 /**
  * Controller: Lấy danh sách danh mục đang hoạt động (dùng cho dropdown)
  * HTTP Method: GET /api/categories/active
  */
 const getActiveCategories = asyncHandler(async (req, res) => {
   const categories = await categoryService.getActiveCategories();
   ApiResponse.success(res, 200, 'Lấy danh sách danh mục hoạt động thành công', categories);
 });

 /**
  * Controller: Lấy chi tiết danh mục theo ID
  * HTTP Method: GET /api/categories/:id
  */
 const getCategoryById = asyncHandler(async (req, res) => {
   if (!handleValidation(req, res)) return;
   const category = await categoryService.getCategoryById(req.params.id);
   ApiResponse.success(res, 200, 'Lấy chi tiết danh mục thành công', category);
 });

 /**
  * Controller: Cập nhật thông tin danh mục
  * HTTP Method: PUT /api/categories/:id
  */
 const updateCategory = asyncHandler(async (req, res) => {
   if (!handleValidation(req, res)) return;
   const category = await categoryService.updateCategory(req.params.id, req.body);
   ApiResponse.success(res, 200, 'Cập nhật danh mục thành công', category);
 });

 /**
  * Controller: Xóa mềm danh mục
  * HTTP Method: DELETE /api/categories/:id
  */
 const deleteCategory = asyncHandler(async (req, res) => {
   if (!handleValidation(req, res)) return;
   const result = await categoryService.softDeleteCategory(req.params.id);
   ApiResponse.success(res, 200, result.message, null);
 });

 module.exports = {
   createCategory,
   getAllCategories,
   getActiveCategories,
   getCategoryById,
   updateCategory,
   deleteCategory,
 };


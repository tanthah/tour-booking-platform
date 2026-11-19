const { body, param } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

const roleIdParamValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID vai trò không hợp lệ'),
  validate,
];

const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên vai trò không được để trống')
    .isLength({ max: 100 })
    .withMessage('Tên vai trò không vượt quá 100 ký tự'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Mã vai trò không được để trống')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Mã vai trò chỉ chứa chữ thường, số và dấu gạch dưới'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Mô tả không vượt quá 255 ký tự'),
  body('permissions')
    .optional()
    .isArray()
    .withMessage('Danh sách quyền phải là một mảng'),
  body('permissions.*')
    .isString()
    .trim(),
  validate,
];

const updateRoleValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID vai trò không hợp lệ'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tên vai trò không được để trống')
    .isLength({ max: 100 })
    .withMessage('Tên vai trò không vượt quá 100 ký tự'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Mô tả không vượt quá 255 ký tự'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active phải là boolean'),
  validate,
];

const setRolePermissionsValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID vai trò không hợp lệ'),
  body('permissions')
    .isArray()
    .withMessage('Danh sách quyền phải là một mảng'),
  body('permissions.*')
    .isString()
    .trim(),
  validate,
];

module.exports = {
  roleIdParamValidation,
  createRoleValidation,
  updateRoleValidation,
  setRolePermissionsValidation,
};

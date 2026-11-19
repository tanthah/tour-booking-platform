const { query, body, param } = require('express-validator');
const validate = require('../../middlewares/validate.middleware');

const listUsersValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số trang phải là số nguyên dương'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng mỗi trang từ 1 đến 100'),
  query('status')
    .optional()
    .isIn(['PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'LOCKED'])
    .withMessage('Trạng thái không hợp lệ'),
  query('role_id')
    .optional()
    .isMongoId()
    .withMessage('ID vai trò không hợp lệ'),
  query('search')
    .optional()
    .isString()
    .trim(),
  validate,
];

const userIdParamValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID người dùng không hợp lệ'),
  validate,
];

const changeStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID người dùng không hợp lệ'),
  body('status')
    .isIn(['ACTIVE', 'INACTIVE', 'LOCKED'])
    .withMessage('Trạng thái phải là ACTIVE, INACTIVE hoặc LOCKED'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Lý do không quá 255 ký tự'),
  validate,
];

const changeRoleValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID người dùng không hợp lệ'),
  body('role_id')
    .isMongoId()
    .withMessage('ID vai trò mới không hợp lệ'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Lý do không quá 255 ký tự'),
  validate,
];

const setPermissionOverridesValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID người dùng không hợp lệ'),
  body('overrides')
    .isArray()
    .withMessage('overrides phải là một mảng'),
  body('overrides.*.permission')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Mã quyền không được để trống'),
  body('overrides.*.effect')
    .isIn(['ALLOW', 'DENY'])
    .withMessage('Hiệu lực phải là ALLOW hoặc DENY'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Lý do không quá 255 ký tự'),
  validate,
];

module.exports = {
  listUsersValidation,
  userIdParamValidation,
  changeStatusValidation,
  changeRoleValidation,
  setPermissionOverridesValidation,
};

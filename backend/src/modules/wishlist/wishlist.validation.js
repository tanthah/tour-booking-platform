const { param } = require('express-validator');

const tourIdValidation = [
  param('tourId').isMongoId().withMessage('Tour ID không hợp lệ'),
];

module.exports = { tourIdValidation };

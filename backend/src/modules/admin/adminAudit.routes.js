const express = require('express');
const router = express.Router();
const auditLogService = require('../audit/auditLog.service');
const { authenticate } = require('../../middlewares/auth.middleware');
const requirePermission = require('../../middlewares/requirePermission');
const { PERMISSIONS } = require('../../utils/permissionCodes');
const ApiResponse = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

// Tất cả route trong module đều yêu cầu đăng nhập
router.use(authenticate);

// Truy vấn danh sách Audit Log
router.get(
  '/',
  requirePermission(PERMISSIONS.AUDIT_VIEW),
  asyncHandler(async (req, res) => {
    const { page, limit, actor_id, target_id, action, resource, from_date, to_date } = req.query;
    const result = await auditLogService.getLogs({
      page,
      limit,
      actor_id,
      target_id,
      action,
      resource,
      from_date,
      to_date,
    });
    return ApiResponse.success(res, 200, 'Lấy danh sách nhật ký kiểm toán thành công', result);
  })
);

module.exports = router;

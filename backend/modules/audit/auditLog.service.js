const AuditLog = require('./auditLog.model');

class AuditLogService {
  /**
   * Ghi log thao tác hệ thống
   */
  async log({
    actor_user_id,
    target_user_id = null,
    action,
    resource,
    old_value = null,
    new_value = null,
    reason = '',
    ip_address = '',
    user_agent = '',
  }) {
    try {
      const record = new AuditLog({
        actor_user_id,
        target_user_id,
        action,
        resource,
        old_value,
        new_value,
        reason,
        ip_address,
        user_agent,
      });
      return await record.save();
    } catch (error) {
      console.error('Lỗi khi ghi AuditLog:', error.message);
      // Không ném lỗi ra ngoài làm hỏng luồng chính, nhưng ghi console
      return null;
    }
  }

  /**
   * Truy vấn lịch sử Audit Log có phân trang và bộ lọc
   */
  async getLogs({
    page = 1,
    limit = 20,
    actor_id,
    target_id,
    action,
    resource,
    from_date,
    to_date,
  }) {
    const filter = {};

    if (actor_id) filter.actor_user_id = actor_id;
    if (target_id) filter.target_user_id = target_id;
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    if (from_date || to_date) {
      filter.created_at = {};
      if (from_date) filter.created_at.$gte = new Date(from_date);
      if (to_date) filter.created_at.$lte = new Date(to_date);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor_user_id', 'full_name email roles')
        .populate('target_user_id', 'full_name email roles')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      items: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  }
}

module.exports = new AuditLogService();

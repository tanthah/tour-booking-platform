const JourneyNotification = require('./journeyNotification.model');
const { getJourneyRecipientIds } = require('./journey.helper');

class JourneyNotificationService {
  /**
   * Tạo và lưu thông báo cho toàn bộ khách hàng có đơn hợp lệ trong hành trình,
   * sau đó trả về thông báo vừa tạo để phát realtime qua Socket.IO.
   */
  async createAndBroadcast({ io, journeyId, departureId, type, title, message, metadata = {} }) {
    try {
      const recipientIds = await getJourneyRecipientIds(departureId);
      if (!recipientIds.length) return [];

      const docs = recipientIds.map((recipientId) => ({
        journey_id: journeyId,
        recipient_id: recipientId,
        type,
        title,
        message,
        metadata,
        is_read: false,
      }));

      const created = await JourneyNotification.insertMany(docs);

      if (io && created.length > 0) {
        // Phát sự kiện thông báo vào room của journey (mỗi client tự kiểm tra hoặc hiển thị chung)
        const sampleNotif = created[0].toObject();
        io.to(`journey:${journeyId.toString()}`).emit('journey:notification', {
          journeyId: journeyId.toString(),
          notification: {
            ...sampleNotif,
            type,
            title,
            message,
            metadata,
            created_at: sampleNotif.created_at || new Date(),
          },
        });
      }

      return created;
    } catch (error) {
      console.error('[JourneyNotificationService] Lỗi tạo thông báo:', error.message);
      return [];
    }
  }

  /**
   * Lấy danh sách thông báo của người dùng trong một hành trình
   */
  async getUserJourneyNotifications(journeyId, userId, limit = 50) {
    return JourneyNotification.find({
      journey_id: journeyId,
      recipient_id: userId,
    })
      .sort({ created_at: -1 })
      .limit(Math.min(100, Number(limit) || 50))
      .lean();
  }

  /**
   * Đánh dấu một thông báo đã đọc (chỉ chủ sở hữu thông báo)
   */
  async markAsRead(journeyId, notifId, userId) {
    const notif = await JourneyNotification.findOneAndUpdate(
      { _id: notifId, journey_id: journeyId, recipient_id: userId },
      { $set: { is_read: true, read_at: new Date() } },
      { new: true }
    ).lean();
    return notif;
  }

  /**
   * Đánh dấu toàn bộ thông báo của hành trình là đã đọc
   */
  async markAllAsRead(journeyId, userId) {
    const result = await JourneyNotification.updateMany(
      { journey_id: journeyId, recipient_id: userId, is_read: false },
      { $set: { is_read: true, read_at: new Date() } }
    );
    return { modifiedCount: result.modifiedCount || 0 };
  }
}

module.exports = new JourneyNotificationService();


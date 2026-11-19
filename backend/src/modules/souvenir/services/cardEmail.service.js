const crypto = require('crypto');
const { sendMail } = require('../../../config/mailer');
const CardEmailLog = require('../models/cardEmailLog.model');
const SouvenirCard = require('../models/souvenirCard.model');
const { createHttpError } = require('../souvenir.helper');

/**
 * Tạo giao diện HTML cho email thông báo thiệp kỷ niệm
 */
function buildSouvenirEmailHtml({ recipientName, tourName, cards = [], webBaseUrl = 'http://localhost:5173' }) {
  const cardsHtml = cards
    .map(
      (c) => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:14px; display:flex; align-items:center;">
        <div style="flex:1;">
          <h4 style="margin:0 0 6px; color:#1e293b; font-size:16px;">👤 Thiệp dành cho: <strong>${c.recipient_name}</strong></h4>
          <p style="margin:0 0 8px; font-size:13px; color:#64748b;">Tour: ${tourName}</p>
          <a href="${webBaseUrl}/account/souvenirs/${c.public_code}" 
             style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:8px 18px; border-radius:8px; font-weight:600; font-size:13px;">
             ✨ Mở xem thiệp kỷ niệm
          </a>
        </div>
      </div>
    `
    )
    .join('');

  return `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; max-width:620px; margin:0 auto; padding:30px 16px; background-color:#f1f5f9;">
      <div style="background:linear-gradient(135deg,#2563eb 0%,#7c3aed 100%); padding:32px 24px; border-radius:16px 16px 0 0; text-align:center; color:#ffffff;">
        <h1 style="margin:0; font-size:24px; letter-spacing:-0.5px;">🎉 Kỷ Niệm Chuyến Đi Cùng TourGo</h1>
        <p style="margin:8px 0 0; font-size:14px; opacity:0.9;">Cảm ơn bạn đã lựa chọn và đồng hành cùng TourGo!</p>
      </div>
      <div style="background:#ffffff; padding:32px 28px; border-radius:0 0 16px 16px; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
        <h2 style="color:#1e293b; font-size:20px; margin:0 0 12px;">Kính gửi quý khách ${recipientName},</h2>
        <p style="color:#475569; font-size:14px; line-height:1.7; margin:0 0 20px;">
          Chuyến đi <strong>${tourName}</strong> vừa qua đã khép lại với biết bao khoảnh khắc đáng nhớ. Đội ngũ TourGo xin gửi tặng quý khách bộ thiệp điện tử kỷ niệm cùng trọn vẹn album ảnh đẹp của cả đoàn!
        </p>

        <h3 style="color:#334155; font-size:15px; margin:0 0 14px; border-bottom:2px solid #e2e8f0; padding-bottom:8px;">
          Danh sách thiệp của bạn:
        </h3>
        ${cardsHtml}

        <p style="color:#94a3b8; font-size:12px; line-height:1.6; margin:24px 0 0; border-top:1px dashed #cbd5e1; padding-top:16px;">
          🔒 <em>Lưu ý bảo mật:</em> Quý khách cần đăng nhập tài khoản TourGo đã đặt tour để xem thiệp và album ảnh đoàn.<br>
          Mọi thắc mắc hoặc yêu cầu hỗ trợ, vui lòng liên hệ hotline TourGo: 1900-TOURGO.
        </p>
      </div>
      <p style="text-align:center; color:#94a3b8; font-size:12px; margin-top:18px;">
        © 2026 TourGo Platform. Mọi quyền được bảo lưu.
      </p>
    </div>
  `;
}

class CardEmailService {
  /**
   * Gửi email thông báo cho một hoặc nhiều thiệp theo nhóm địa chỉ email (BR09, BR19)
   * Nhóm các thiệp có chung recipient_email thành 1 email duy nhất (BR19)
   */
  async sendCardsNotification(cardIds = [], triggeredBy = null) {
    if (!cardIds || cardIds.length === 0) return { sent: 0, failed: 0, skipped: 0 };

    const cards = await SouvenirCard.find({
      _id: { $in: cardIds },
      status: 'PUBLISHED', // BR09: Chỉ thiệp PUBLISHED mới gửi email
      deleted_at: null,
    }).lean();

    if (cards.length === 0) {
      return { sent: 0, failed: 0, skipped: cardIds.length };
    }

    // Nhóm theo recipient_email
    const emailGroups = new Map();

    for (const card of cards) {
      const email = (card.recipient_email || '').trim().toLowerCase();
      if (!email) {
        // Cập nhật trạng thái NO_EMAIL
        await SouvenirCard.findByIdAndUpdate(card._id, { email_status: 'NO_EMAIL' });
        continue;
      }

      if (!emailGroups.has(email)) {
        emailGroups.set(email, {
          email,
          recipientName: card.customer_snapshot?.full_name || card.recipient_name,
          tourName: card.tour_info_snapshot?.tour_name || 'chuyến đi',
          cards: [],
        });
      }
      emailGroups.get(email).cards.push(card);
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const [email, group] of emailGroups.entries()) {
      const currentCardIds = group.cards.map((c) => c._id);

      // Tạo idempotency key chống gửi trùng
      const idempotencyKey = crypto
        .createHash('sha256')
        .update(`${email}_${currentCardIds.sort().join('_')}_${Date.now()}`)
        .digest('hex');

      // Đánh dấu SENDING
      await SouvenirCard.updateMany(
        { _id: { $in: currentCardIds } },
        { email_status: 'SENDING' }
      );

      const emailLog = new CardEmailLog({
        card_id: currentCardIds[0],
        recipient_email: email,
        recipient_name: group.recipientName,
        subject: `🎉 [TourGo] Thiệp điện tử kỷ niệm chuyến đi ${group.tourName}`,
        delivery_status: 'PENDING',
        idempotency_key: idempotencyKey,
        triggered_by: triggeredBy?._id || triggeredBy,
      });
      await emailLog.save();

      try {
        const html = buildSouvenirEmailHtml({
          recipientName: group.recipientName,
          tourName: group.tourName,
          cards: group.cards,
        });

        const sendResult = await sendMail(
          email,
          `🎉 [TourGo] Thiệp điện tử kỷ niệm chuyến đi ${group.tourName}`,
          html
        );

        emailLog.delivery_status = 'SENT';
        emailLog.sent_at = new Date();
        emailLog.provider_message_id = sendResult?.messageId || null;
        await emailLog.save();

        await SouvenirCard.updateMany(
          { _id: { $in: currentCardIds } },
          { email_status: 'SENT', email_sent_at: new Date() }
        );

        sentCount += group.cards.length;
      } catch (err) {
        emailLog.delivery_status = 'FAILED';
        emailLog.last_error = err.message;
        await emailLog.save();

        // BR10: Gửi email thất bại KHÔNG làm thiệp quay lại trạng thái chưa phát hành
        await SouvenirCard.updateMany(
          { _id: { $in: currentCardIds } },
          { email_status: 'FAILED' }
        );

        failedCount += group.cards.length;
      }
    }

    return {
      sent: sentCount,
      failed: failedCount,
      total_cards: cards.length,
    };
  }

  /**
   * Gửi lại email khi thất bại (BR10, BR11)
   */
  async resendEmail(cardId, user) {
    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null });
    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp điện tử');
    }

    if (card.status !== 'PUBLISHED') {
      throw createHttpError(400, 'Chỉ có thể gửi email cho thiệp đã phát hành (PUBLISHED)');
    }

    if (!card.recipient_email) {
      throw createHttpError(400, 'Thiệp không có địa chỉ email người nhận');
    }

    return await this.sendCardsNotification([card._id], user);
  }

  /**
   * Lấy lịch sử gửi email của thiệp
   */
  async getCardEmailLogs(cardId) {
    return await CardEmailLog.find({ card_id: cardId })
      .sort({ created_at: -1 })
      .lean();
  }
}

module.exports = new CardEmailService();


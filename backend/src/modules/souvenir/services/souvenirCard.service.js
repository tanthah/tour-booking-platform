const mongoose = require('mongoose');
const SouvenirCard = require('../models/souvenirCard.model');
const Album = require('../models/album.model');
const AlbumPhoto = require('../models/albumPhoto.model');
const CardTemplate = require('../models/cardTemplate.model');
const TourDeparture = require('../../tour/tourDeparture.model');
const Tour = require('../../tour/tour.model');
const TourJourney = require('../../journey/tourJourney.model');
const Order = require('../../order/order.model');
const auditLogService = require('../../audit/auditLog.service');
const cardEmailService = require('./cardEmail.service');
const {
  createHttpError,
  getValidDepartureCustomers,
  renderGreetingTemplate,
} = require('../souvenir.helper');
const { resolvePublicId, safeDeleteFromCloudinary } = require('../../../utils/cloudinaryHelper');

const DEFAULT_GREETING =
  'Kính gửi {{customer_name}},\nTourGo xin chân thành cảm ơn Quý khách đã đồng hành cùng chúng tôi trong hành trình {{tour_name}} khởi hành ngày {{departure_date}}. Kính chúc Quý khách luôn ngập tràn niềm vui, hạnh phúc và có thêm thật nhiều chuyến đi ý nghĩa!';

class SouvenirCardService {
  /**
   * Tạo thiệp đơn lẻ cho 1 hành khách trong đợt khởi hành
   */
  async createCard(data, user) {
    const { album_id, order_id, order_item_id, booking_customer_id } = data;

    if (!album_id || !order_id || !order_item_id || !booking_customer_id) {
      throw createHttpError(400, 'Thiếu thông tin bắt buộc để tạo thiệp');
    }

    const album = await Album.findOne({ _id: album_id, deleted_at: null });
    if (!album) {
      throw createHttpError(404, 'Không tìm thấy Album');
    }

    // BR03: Kiểm tra thiệp duy nhất theo bộ (order_id, order_item_id, booking_customer_id)
    const existing = await SouvenirCard.findOne({
      order_id,
      order_item_id,
      booking_customer_id,
      deleted_at: null,
    });
    if (existing) {
      throw createHttpError(409, 'Thiệp cho hành khách này trong đơn đã tồn tại');
    }

    const order = await Order.findById(order_id).lean();
    if (!order) {
      throw createHttpError(404, 'Đơn hàng không tồn tại');
    }

    const customer = (order.booking_customers || []).find(
      (c) => c._id.toString() === booking_customer_id.toString()
    );
    if (!customer) {
      throw createHttpError(404, 'Không tìm thấy thông tin hành khách trong đơn hàng');
    }

    const item = (order.items || []).find(
      (it) => it._id.toString() === order_item_id.toString()
    );
    if (!item) {
      throw createHttpError(404, 'Không tìm thấy hạng mục tour trong đơn hàng');
    }

    const departure = await TourDeparture.findById(album.departure_id).lean();
    const tour = await Tour.findById(album.tour_id).lean();
    const journey = await TourJourney.findOne({
      departure_id: album.departure_id,
      deleted_at: null,
    }).lean();

    const departureDate = departure?.start_datetime || item.departure_date;
    const endDate = journey?.completed_at || null;
    const depDateStr = departureDate
      ? new Date(departureDate).toLocaleDateString('vi-VN')
      : '';

    // Lấy template hoặc dùng mặc định
    let templateText = DEFAULT_GREETING;
    if (data.template_id) {
      const template = await CardTemplate.findById(data.template_id).lean();
      if (template) templateText = template.greeting_template;
    }

    const tourName = tour?.title || tour?.name || item.tour_name || 'chuyến đi';

    const greetingMessage = renderGreetingTemplate(templateText, {
      customer_name: customer.full_name,
      tour_name: tourName,
      departure_date: depDateStr,
      departure_location: item.departure_location || '',
    });

    // Lấy các ảnh cá nhân đã được gắn cho khách này trong album
    const assignedPhotos = await AlbumPhoto.find({
      album_id: album._id,
      deleted_at: null,
      'assigned_customers.booking_customer_id': customer._id,
    }).select('_id');

    const personalPhotoIds = assignedPhotos.map((p) => p._id);

    // Xác định email nhận thiệp theo thứ tự ưu tiên (Mục 2.3):
    // 1. email hành khách -> 2. email liên hệ đơn -> 3. email chủ đơn
    const recipientEmail =
      customer.email || order.customer_info?.email || null;

    const card = new SouvenirCard({
      album_id: album._id,
      departure_id: album.departure_id,
      tour_id: album.tour_id,
      order_id: order._id,
      order_item_id: item._id,
      booking_customer_id: customer._id,
      owner_user_id: order.user_id,
      recipient_name: customer.full_name,
      recipient_email: recipientEmail,
      customer_snapshot: {
        full_name: customer.full_name,
        phone: customer.phone,
        email: customer.email,
        date_of_birth: customer.date_of_birth,
        gender: customer.gender,
      },
      tour_info_snapshot: {
        tour_name: tour?.title || tour?.name || item.tour_name,
        tour_code: tour?.code || item.tour_code,
        departure_date: departureDate,
        end_date: endDate,
        duration: tour?.duration || item.duration,
        departure_location: item.departure_location || '',
        meeting_point: departure?.meeting_point || item.meeting_point || '',
      },
      cover_photo: data.cover_photo || album.cover_photo || { url: '', public_id: '', thumbnail_url: '' },
      greeting_message: greetingMessage,
      personal_message: data.personal_message?.trim() || '',
      personal_photo_ids: personalPhotoIds,
      status: 'DRAFT',
      created_by: user._id,
    });

    await card.save();

    await auditLogService.log({
      actor_user_id: user._id,
      action: 'SOUVENIR_CARD_CREATED',
      resource: `SouvenirCard:${card._id}`,
      new_value: { card_id: card._id, recipient: card.recipient_name },
    });

    return card;
  }

  /**
   * Tạo thiệp hàng loạt (Batch) cho toàn bộ khách trong đợt khởi hành chưa có thiệp
   */
  async batchCreateCards(albumId, user) {
    const album = await Album.findOne({ _id: albumId, deleted_at: null });
    if (!album) {
      throw createHttpError(404, 'Không tìm thấy Album');
    }

    const customers = await getValidDepartureCustomers(album.departure_id);
    const createdCards = [];
    const skipped = [];

    for (const c of customers) {
      const existing = await SouvenirCard.findOne({
        order_id: c.order_id,
        order_item_id: c.order_item_id,
        booking_customer_id: c.booking_customer_id,
        deleted_at: null,
      });

      if (existing) {
        skipped.push({
          booking_customer_id: c.booking_customer_id,
          name: c.full_name,
          reason: 'Đã có thiệp',
        });
        continue;
      }

      try {
        const card = await this.createCard(
          {
            album_id: album._id,
            order_id: c.order_id,
            order_item_id: c.order_item_id,
            booking_customer_id: c.booking_customer_id,
          },
          user
        );
        createdCards.push(card);
      } catch (err) {
        skipped.push({
          booking_customer_id: c.booking_customer_id,
          name: c.full_name,
          reason: err.message,
        });
      }
    }

    return {
      created_count: createdCards.length,
      skipped_count: skipped.length,
      created: createdCards,
      skipped,
    };
  }

  /**
   * Lấy chi tiết thiệp (Dành cho Staff/Admin)
   */
  async getCardDetail(cardId) {
    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null })
      .populate('album_id', 'title cover_photo allow_download status')
      .populate('tour_id', 'name code main_image duration')
      .populate('departure_id', 'start_datetime meeting_point')
      .populate('personal_photo_ids')
      .populate('created_by', 'full_name email')
      .populate('reviewed_by', 'full_name email')
      .populate('published_by', 'full_name email')
      .lean();

    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp điện tử');
    }

    return card;
  }

  /**
   * Chỉnh sửa thiệp (Chỉ khi DRAFT hoặc REVISION_REQUESTED)
   */
  async updateCard(cardId, user, data = {}) {
    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null });
    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp điện tử');
    }

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(card.status)) {
      throw createHttpError(
        400,
        `Không thể sửa thiệp ở trạng thái ${card.status}. Chỉ được sửa khi DRAFT hoặc REVISION_REQUESTED.`
      );
    }

    const oldCoverPublicId = resolvePublicId(
      card.cover_photo?.url,
      card.cover_photo?.public_id
    );

    if (data.cover_photo) card.cover_photo = data.cover_photo;
    if (data.personal_message !== undefined) card.personal_message = data.personal_message.trim();
    if (data.greeting_message !== undefined) card.greeting_message = data.greeting_message.trim();
    if (Array.isArray(data.personal_photo_ids)) card.personal_photo_ids = data.personal_photo_ids;
    if (data.recipient_email !== undefined) card.recipient_email = (data.recipient_email || '').trim().toLowerCase();

    card.version += 1;
    await card.save();

    const newCoverPublicId = resolvePublicId(
      card.cover_photo?.url,
      card.cover_photo?.public_id
    );
    if (oldCoverPublicId && oldCoverPublicId !== newCoverPublicId) {
      const [usedInAlbum, usedInPhoto, usedInOtherCard] = await Promise.all([
        Album.exists({ 'cover_photo.public_id': oldCoverPublicId, deleted_at: null }),
        AlbumPhoto.exists({ public_id: oldCoverPublicId, deleted_at: null }),
        SouvenirCard.exists({
          _id: { $ne: card._id },
          'cover_photo.public_id': oldCoverPublicId,
          deleted_at: null,
        }),
      ]);
      if (!usedInAlbum && !usedInPhoto && !usedInOtherCard) {
        await safeDeleteFromCloudinary(oldCoverPublicId);
      }
    }

    return card;
  }

  /**
   * Xem trước thiệp (Mô phỏng trải nghiệm khách hàng)
   */
  async previewCard(cardId) {
    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null })
      .populate('personal_photo_ids')
      .lean();

    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp');
    }

    // Lấy ảnh album chung (SHARED)
    const sharedPhotos = await AlbumPhoto.find({
      album_id: card.album_id,
      visibility: 'SHARED',
      deleted_at: null,
    })
      .select('url thumbnail_url category caption')
      .sort({ sort_order: 1, created_at: -1 })
      .lean();

    return {
      card: {
        _id: card._id,
        public_code: card.public_code,
        recipient_name: card.recipient_name,
        tour_info: card.tour_info_snapshot,
        cover_photo: card.cover_photo,
        greeting_message: card.greeting_message,
        personal_message: card.personal_message,
        status: card.status,
      },
      shared_photos: sharedPhotos,
      personal_photos: card.personal_photo_ids || [],
    };
  }

  /**
   * Lấy danh sách thiệp của một Album
   */
  async getAlbumCards(albumId, options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const query = {
      album_id: albumId,
      deleted_at: null,
    };

    if (options.status) {
      query.status = options.status;
    }

    if (options.search) {
      query.recipient_name = { $regex: options.search, $options: 'i' };
    }

    const total = await SouvenirCard.countDocuments(query);
    const cards = await SouvenirCard.find(query)
      .populate('created_by', 'full_name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Gửi thiệp sang Admin chờ duyệt (DRAFT / REVISION_REQUESTED -> PENDING_REVIEW)
   */
  async submitReview(cardId, user) {
    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null });
    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp');
    }

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(card.status)) {
      throw createHttpError(
        400,
        `Chỉ có thể gửi duyệt thiệp ở trạng thái DRAFT hoặc REVISION_REQUESTED (hiện tại: ${card.status})`
      );
    }

    // Kiểm tra ảnh bìa hợp lệ
    if (!card.cover_photo?.url) {
      throw createHttpError(400, 'Thiệp chưa có ảnh bìa hợp lệ');
    }

    const fromStatus = card.status;
    card.status = 'PENDING_REVIEW';
    card.submitted_at = new Date();
    card.submitted_by = user._id;

    card.review_history.push({
      action: 'SUBMIT',
      actor_id: user._id,
      from_status: fromStatus,
      to_status: 'PENDING_REVIEW',
      comment: 'Nhân viên gửi yêu cầu duyệt',
      created_at: new Date(),
    });

    await card.save();

    await auditLogService.log({
      actor_user_id: user._id,
      action: 'SOUVENIR_CARD_SUBMITTED',
      resource: `SouvenirCard:${card._id}`,
    });

    return card;
  }

  /**
   * Gửi duyệt hàng loạt tất cả thiệp nháp trong album
   */
  async batchSubmitReview(albumId, user) {
    const cards = await SouvenirCard.find({
      album_id: albumId,
      status: { $in: ['DRAFT', 'REVISION_REQUESTED'] },
      deleted_at: null,
    });

    let submitted = 0;
    const errors = [];

    for (const card of cards) {
      try {
        await this.submitReview(card._id, user);
        submitted++;
      } catch (err) {
        errors.push({ card_id: card._id, error: err.message });
      }
    }

    return { submitted, failed: errors.length, errors };
  }

  /**
   * Admin duyệt thiệp (PENDING_REVIEW -> APPROVED)
   */
  async adminApprove(cardId, user, comment = '') {
    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null });
    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp');
    }

    if (card.status !== 'PENDING_REVIEW') {
      throw createHttpError(400, `Chỉ có thể duyệt thiệp ở trạng thái PENDING_REVIEW (hiện tại: ${card.status})`);
    }

    const fromStatus = card.status;
    card.status = 'APPROVED';
    card.reviewed_at = new Date();
    card.reviewed_by = user._id;
    card.review_comment = comment.trim();

    card.review_history.push({
      action: 'APPROVE',
      actor_id: user._id,
      from_status: fromStatus,
      to_status: 'APPROVED',
      comment: comment.trim() || 'Admin duyệt nội dung',
      created_at: new Date(),
    });

    await card.save();

    await auditLogService.log({
      actor_user_id: user._id,
      action: 'SOUVENIR_CARD_APPROVED',
      resource: `SouvenirCard:${card._id}`,
      reason: comment,
    });

    return card;
  }

  /**
   * Admin yêu cầu chỉnh sửa (PENDING_REVIEW -> REVISION_REQUESTED)
   */
  async adminRequestRevision(cardId, user, reason) {
    if (!reason || !reason.trim()) {
      throw createHttpError(400, 'Lý do yêu cầu chỉnh sửa là bắt buộc');
    }

    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null });
    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp');
    }

    if (card.status !== 'PENDING_REVIEW') {
      throw createHttpError(400, `Chỉ có thể yêu cầu sửa thiệp đang PENDING_REVIEW (hiện tại: ${card.status})`);
    }

    const fromStatus = card.status;
    card.status = 'REVISION_REQUESTED';
    card.reviewed_at = new Date();
    card.reviewed_by = user._id;
    card.review_comment = reason.trim();

    card.review_history.push({
      action: 'REQUEST_REVISION',
      actor_id: user._id,
      from_status: fromStatus,
      to_status: 'REVISION_REQUESTED',
      comment: reason.trim(),
      created_at: new Date(),
    });

    await card.save();

    await auditLogService.log({
      actor_user_id: user._id,
      action: 'SOUVENIR_CARD_REVISION_REQUESTED',
      resource: `SouvenirCard:${card._id}`,
      reason,
    });

    return card;
  }

  /**
   * Admin phát hành thiệp (APPROVED -> PUBLISHED) (BR08, BR09)
   * Tự động kích hoạt gửi email thông báo sau khi phát hành thành công
   */
  async adminPublish(cardId, user) {
    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null });
    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp');
    }

    if (card.status !== 'APPROVED') {
      throw createHttpError(400, `Chỉ có thể phát hành thiệp đã được duyệt (APPROVED) (hiện tại: ${card.status})`);
    }

    const fromStatus = card.status;
    card.status = 'PUBLISHED';
    card.published_at = new Date();
    card.published_by = user._id;

    card.review_history.push({
      action: 'PUBLISH',
      actor_id: user._id,
      from_status: fromStatus,
      to_status: 'PUBLISHED',
      comment: 'Admin phát hành thiệp',
      created_at: new Date(),
    });

    await card.save();

    await auditLogService.log({
      actor_user_id: user._id,
      action: 'SOUVENIR_CARD_PUBLISHED',
      resource: `SouvenirCard:${card._id}`,
    });

    // Kích hoạt gửi email bất đồng bộ (fire-and-forget or awaited)
    cardEmailService.sendCardsNotification([card._id], user).catch((err) => {
      console.error('Lỗi gửi email thiệp:', err.message);
    });

    return card;
  }

  /**
   * Admin phát hành hàng loạt thiệp đã APPROVED trong album
   */
  async batchPublish(albumId, user) {
    const approvedCards = await SouvenirCard.find({
      album_id: albumId,
      status: 'APPROVED',
      deleted_at: null,
    });

    if (approvedCards.length === 0) {
      return { published_count: 0, message: 'Không có thiệp nào ở trạng thái APPROVED để phát hành' };
    }

    const cardIds = [];
    for (const card of approvedCards) {
      card.status = 'PUBLISHED';
      card.published_at = new Date();
      card.published_by = user._id;
      card.review_history.push({
        action: 'PUBLISH',
        actor_id: user._id,
        from_status: 'APPROVED',
        to_status: 'PUBLISHED',
        comment: 'Admin phát hành hàng loạt',
        created_at: new Date(),
      });
      await card.save();
      cardIds.push(card._id);
    }

    // Kích hoạt gửi email gộp (BR19)
    cardEmailService.sendCardsNotification(cardIds, user).catch((err) => {
      console.error('Lỗi gửi email phát hành batch:', err.message);
    });

    return {
      published_count: cardIds.length,
      card_ids: cardIds,
    };
  }

  /**
   * Admin thu hồi thiệp (PUBLISHED -> REVOKED) (BR15)
   */
  async adminRevoke(cardId, user, reason) {
    if (!reason || !reason.trim()) {
      throw createHttpError(400, 'Lý do thu hồi thiệp là bắt buộc');
    }

    const card = await SouvenirCard.findOne({ _id: cardId, deleted_at: null });
    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp');
    }

    if (card.status !== 'PUBLISHED') {
      throw createHttpError(400, `Chỉ có thể thu hồi thiệp đã phát hành (PUBLISHED) (hiện tại: ${card.status})`);
    }

    const fromStatus = card.status;
    card.status = 'REVOKED';
    card.revoked_at = new Date();
    card.revoked_by = user._id;
    card.revoke_reason = reason.trim();

    card.review_history.push({
      action: 'REVOKE',
      actor_id: user._id,
      from_status: fromStatus,
      to_status: 'REVOKED',
      comment: reason.trim(),
      created_at: new Date(),
    });

    await card.save();

    await auditLogService.log({
      actor_user_id: user._id,
      action: 'SOUVENIR_CARD_REVOKED',
      resource: `SouvenirCard:${card._id}`,
      reason,
    });

    return card;
  }

  /**
   * Admin lấy danh sách thiệp chờ duyệt
   */
  async getPendingReviews(options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const query = {
      status: 'PENDING_REVIEW',
      deleted_at: null,
    };

    if (options.album_id) {
      query.album_id = options.album_id;
    }

    const total = await SouvenirCard.countDocuments(query);
    const cards = await SouvenirCard.find(query)
      .populate('album_id', 'title')
      .populate('submitted_by', 'full_name email')
      .sort({ submitted_at: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      cards,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new SouvenirCardService();

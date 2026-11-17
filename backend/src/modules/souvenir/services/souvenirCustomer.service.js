const mongoose = require('mongoose');
const SouvenirCard = require('../models/souvenirCard.model');
const Album = require('../models/album.model');
const AlbumPhoto = require('../models/albumPhoto.model');
const https = require('https');
const http = require('http');
const {
  createHttpError,
  hasValidOrderForDeparture,
  canCustomerViewCard,
  canCustomerViewPhoto,
  generateSecurePhotoUrl,
} = require('../souvenir.helper');

class SouvenirCustomerService {
  /**
   * Lấy danh sách các thiệp kỷ niệm đã phát hành của khách hàng hiện tại
   * (Chỉ lấy các thiệp có owner_user_id === user._id và status === 'PUBLISHED')
   */
  async getMyCards(userId, options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const query = {
      owner_user_id: userId,
      status: 'PUBLISHED',
      deleted_at: null,
    };

    const total = await SouvenirCard.countDocuments(query);
    const cards = await SouvenirCard.find(query)
      .select(
        '_id public_code recipient_name tour_info_snapshot cover_photo status customer_viewed published_at personal_photo_ids'
      )
      .sort({ published_at: -1, created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedCards = cards.map((c) => ({
      _id: c._id,
      public_code: c.public_code,
      recipient_name: c.recipient_name,
      tour_name: c.tour_info_snapshot?.tour_name,
      tour_code: c.tour_info_snapshot?.tour_code,
      departure_date: c.tour_info_snapshot?.departure_date,
      end_date: c.tour_info_snapshot?.end_date,
      cover_photo: c.cover_photo,
      personal_photo_count: (c.personal_photo_ids || []).length,
      customer_viewed: c.customer_viewed,
      published_at: c.published_at,
    }));

    return {
      cards: formattedCards,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Xem chi tiết thiệp kỷ niệm (Kiểm tra nghiêm ngặt quyền sở hữu và trạng thái)
   * Cho phép tìm bằng public_code hoặc cardId
   */
  async getMyCardDetail(identifier, userId) {
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId
      ? { $or: [{ _id: identifier }, { public_code: identifier }] }
      : { public_code: identifier };

    query.deleted_at = null;

    const card = await SouvenirCard.findOne(query)
      .populate('album_id', 'title cover_photo allow_download status')
      .populate('personal_photo_ids')
      .lean();

    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp kỷ niệm');
    }

    // BR15: Thiệp chưa hoặc không còn ở trạng thái PUBLISHED thì chặn truy cập
    if (card.status !== 'PUBLISHED') {
      throw createHttpError(403, 'Thiệp kỷ niệm này chưa được phát hành hoặc đã bị thu hồi');
    }

    // BR05: Kiểm tra chỉ chủ đơn mới có quyền xem
    if (!canCustomerViewCard({ _id: userId }, card)) {
      throw createHttpError(403, 'Bạn không có quyền truy cập thiệp kỷ niệm này');
    }

    // Ghi nhận lần xem đầu tiên và tăng view count
    await SouvenirCard.findByIdAndUpdate(card._id, {
      customer_viewed: true,
      $inc: { view_count: 1 },
      $setOnInsert: { first_viewed_at: new Date() },
    });

    // Tạo secure URL cho các ảnh cá nhân
    const securedPersonalPhotos = (card.personal_photo_ids || []).map((p) => ({
      _id: p._id,
      url: generateSecurePhotoUrl(p),
      thumbnail_url: p.thumbnail_url || p.url,
      caption: p.caption,
      category: p.category,
    }));

    return {
      card: {
        _id: card._id,
        public_code: card.public_code,
        recipient_name: card.recipient_name,
        tour_info: card.tour_info_snapshot,
        cover_photo: card.cover_photo,
        greeting_message: card.greeting_message,
        personal_message: card.personal_message,
        published_at: card.published_at,
        allow_download: card.album_id?.allow_download !== false,
      },
      personal_photos: securedPersonalPhotos,
      album: {
        _id: card.album_id?._id,
        title: card.album_id?.title,
        cover_photo: card.album_id?.cover_photo,
      },
    };
  }

  /**
   * Lấy ảnh Album chung của đoàn cho khách hàng (BR04: Chỉ thành viên đoàn được xem)
   */
  async getMyCardSharedAlbum(identifier, userId, options = {}) {
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId
      ? { $or: [{ _id: identifier }, { public_code: identifier }] }
      : { public_code: identifier };

    query.deleted_at = null;
    const card = await SouvenirCard.findOne(query).lean();
    if (!card) {
      throw createHttpError(404, 'Không tìm thấy thiệp kỷ niệm');
    }

    if (card.status !== 'PUBLISHED') {
      throw createHttpError(403, 'Thiệp chưa được phát hành hoặc đã bị thu hồi');
    }

    if (!canCustomerViewCard({ _id: userId }, card)) {
      throw createHttpError(403, 'Bạn không có quyền xem album của thiệp này');
    }

    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 30);
    const skip = (page - 1) * limit;

    const photoQuery = {
      album_id: card.album_id,
      visibility: 'SHARED', // Chỉ lấy ảnh chung của đoàn
      deleted_at: null,
    };

    if (options.category && ['GROUP', 'LOCATION', 'ACTIVITY'].includes(options.category)) {
      photoQuery.category = options.category;
    }

    const total = await AlbumPhoto.countDocuments(photoQuery);
    const photos = await AlbumPhoto.find(photoQuery)
      .select('_id url thumbnail_url category caption sort_order created_at')
      .sort({ sort_order: 1, created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return {
      photos,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tải 1 ảnh đơn lẻ (BR13: Khách chỉ được tải ảnh mà họ có quyền xem)
   */
  async getPhotoDownload(photoId, userId) {
    const photo = await AlbumPhoto.findOne({ _id: photoId, deleted_at: null }).lean();
    if (!photo) {
      throw createHttpError(404, 'Không tìm thấy ảnh');
    }

    // Kiểm tra album có cho phép tải không
    const album = await Album.findById(photo.album_id).lean();
    if (!album || album.allow_download === false) {
      throw createHttpError(403, 'Album này không cho phép tải ảnh xuống');
    }

    // Kiểm tra quyền xem ảnh
    const canView = await canCustomerViewPhoto({ _id: userId }, photo, photo.departure_id);
    if (!canView) {
      throw createHttpError(403, 'Bạn không có quyền tải ảnh này');
    }

    const downloadUrl = generateSecurePhotoUrl(photo, { expiresInSeconds: 1800 });

    return {
      photo_id: photo._id,
      download_url: downloadUrl,
      filename: photo.original_filename || `photo_${photo._id}.jpg`,
      mime_type: photo.mime_type,
    };
  }

  /**
   * Tải toàn bộ album ảnh (ZIP Streaming) (BR13)
   * Chỉ đóng gói ảnh chung của đoàn + ảnh cá nhân của chính khách hàng này
   */
  async streamAlbumZip(identifier, userId, res) {
    let archiver;
    try {
      archiver = require('archiver');
    } catch (e) {
      throw createHttpError(500, 'Module nén ZIP chưa sẵn sàng trên máy chủ');
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId
      ? { $or: [{ _id: identifier }, { public_code: identifier }] }
      : { public_code: identifier };

    query.deleted_at = null;
    const card = await SouvenirCard.findOne(query).lean();
    if (!card || card.status !== 'PUBLISHED' || !canCustomerViewCard({ _id: userId }, card)) {
      throw createHttpError(403, 'Không có quyền tải album của thiệp này');
    }

    const album = await Album.findById(card.album_id).lean();
    if (!album || album.allow_download === false) {
      throw createHttpError(403, 'Album không cho phép tải xuống');
    }

    // Lấy ảnh chung (SHARED)
    const sharedPhotos = await AlbumPhoto.find({
      album_id: card.album_id,
      visibility: 'SHARED',
      deleted_at: null,
    }).lean();

    // Lấy ảnh cá nhân riêng của khách này
    const personalPhotos = await AlbumPhoto.find({
      _id: { $in: card.personal_photo_ids || [] },
      deleted_at: null,
    }).lean();

    const allPhotos = [...sharedPhotos, ...personalPhotos];

    if (allPhotos.length === 0) {
      throw createHttpError(400, 'Album không có ảnh nào để tải');
    }

    const zipFilename = `TourGo_Album_${card.tour_info_snapshot?.tour_code || 'Tour'}_${Date.now()}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    archive.on('error', (err) => {
      console.error('Lỗi khi nén ZIP:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Lỗi nén tệp' });
      }
    });

    for (let i = 0; i < allPhotos.length; i++) {
      const p = allPhotos[i];
      const folderName = p.visibility === 'PERSONAL_ONLY' ? 'Anh_Rieng_Cua_Toi' : `Anh_Doan_${p.category}`;
      const ext = (p.original_filename && p.original_filename.split('.').pop()) || 'jpg';
      const entryName = `${folderName}/photo_${i + 1}_${p._id}.${ext}`;

      try {
        const stream = await new Promise((resolve, reject) => {
          const client = p.url.startsWith('https') ? https : http;
          client
            .get(p.url, (response) => {
              if (response.statusCode === 200) {
                resolve(response);
              } else {
                reject(new Error(`Tải ảnh thất bại: status ${response.statusCode}`));
              }
            })
            .on('error', reject);
        });

        archive.append(stream, { name: entryName });
      } catch (streamErr) {
        console.warn(`Bỏ qua ảnh ${p._id} do lỗi mạng:`, streamErr.message);
      }
    }

    await archive.finalize();
  }
}

module.exports = new SouvenirCustomerService();


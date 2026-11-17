const mongoose = require('mongoose');
const Album = require('../models/album.model');
const AlbumPhoto = require('../models/albumPhoto.model');
const SouvenirCard = require('../models/souvenirCard.model');
const TourDeparture = require('../../tour/tourDeparture.model');
const Tour = require('../../tour/tour.model');
const TourJourney = require('../../journey/tourJourney.model');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../../middlewares/upload.middleware');
const cloudinary = require('../../../config/cloudinary');
const {
  createHttpError,
  isDepartureCompleted,
  getValidDepartureCustomers,
} = require('../souvenir.helper');

class AlbumService {
  /**
   * Danh sách đợt khởi hành đã hoàn thành và đủ điều kiện tạo/quản lý album (BR01)
   */
  async getCompletedDepartures(options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 10);
    const skip = (page - 1) * limit;

    // Tìm các journeys đã hoàn thành
    const completedJourneys = await TourJourney.find({
      status: 'COMPLETED',
      completed_at: { $ne: null },
      deleted_at: null,
    })
      .select('departure_id tour_id completed_at')
      .lean();

    const completedDepartureIdsFromJourneys = completedJourneys.map((j) => j.departure_id);

    // Lọc departures có status = 'COMPLETED' hoặc nằm trong completedJourneys
    const filter = {
      deleted_at: null,
      $or: [
        { status: 'COMPLETED' },
        { _id: { $in: completedDepartureIdsFromJourneys } },
      ],
    };

    if (options.search) {
      // Tìm tour theo tên nếu có search
      const matchingTours = await Tour.find({
        $or: [
          { title: { $regex: options.search, $options: 'i' } },
          { name: { $regex: options.search, $options: 'i' } },
        ],
        deleted_at: null,
      })
        .select('_id')
        .lean();
      const tourIds = matchingTours.map((t) => t._id);
      filter.product_id = { $in: tourIds };
    }

    const total = await TourDeparture.countDocuments(filter);
    const departures = await TourDeparture.find(filter)
      .populate('product_id', 'title name code main_image duration')
      .sort({ start_datetime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Gắn thêm thông tin album hiện có & số khách
    const resultItems = await Promise.all(
      departures.map(async (dep) => {
        const album = await Album.findOne({
          departure_id: dep._id,
          deleted_at: null,
        })
          .select('_id title status photo_count cover_photo allow_download created_at')
          .lean();

        const cardsCount = await SouvenirCard.countDocuments({
          departure_id: dep._id,
          deleted_at: null,
        });

        const publishedCardsCount = await SouvenirCard.countDocuments({
          departure_id: dep._id,
          status: 'PUBLISHED',
          deleted_at: null,
        });

        const customers = await getValidDepartureCustomers(dep._id);

        return {
          departure_id: dep._id,
          tour: dep.product_id,
          start_datetime: dep.start_datetime,
          meeting_point: dep.meeting_point,
          status: dep.status,
          total_customers: customers.length,
          has_album: !!album,
          album: album || null,
          cards_count: cardsCount,
          published_cards_count: publishedCardsCount,
        };
      })
    );

    return {
      items: resultItems,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Tạo Album mới cho một đợt khởi hành (BR01, BR02)
   */
  async createAlbum(departureId, user, data = {}) {
    if (!departureId) {
      throw createHttpError(400, 'Mã đợt khởi hành (departureId) là bắt buộc');
    }

    // BR01: Chỉ đợt khởi hành đã hoàn thành mới đủ điều kiện tạo album
    const check = await isDepartureCompleted(departureId);
    if (!check.completed) {
      throw createHttpError(400, check.reason || 'Đợt khởi hành chưa hoàn thành');
    }

    // BR02: Mỗi đợt khởi hành chỉ có tối đa 1 album chính
    const existing = await Album.findOne({
      departure_id: departureId,
      deleted_at: null,
    });
    if (existing) {
      throw createHttpError(409, 'Đợt khởi hành này đã có album. Vui lòng mở album hiện có');
    }

    const departure = check.departure;
    const tour = await Tour.findById(departure.product_id).lean();
    if (!tour) {
      throw createHttpError(404, 'Tour tương ứng không tồn tại');
    }

    const startDateStr = new Date(departure.start_datetime).toLocaleDateString('vi-VN');
    const tourTitle = tour.title || tour.name || 'Tour';
    const defaultTitle = data.title?.trim() || `Album kỷ niệm - ${tourTitle} (${startDateStr})`;

    const album = new Album({
      departure_id: departureId,
      tour_id: tour._id,
      title: defaultTitle,
      description: data.description?.trim() || '',
      cover_photo: data.cover_photo || { url: '', public_id: '', thumbnail_url: '' },
      allow_download: data.allow_download !== undefined ? data.allow_download : true,
      status: 'ACTIVE',
      created_by: user._id,
    });

    await album.save();
    return album;
  }

  /**
   * Lấy chi tiết Album + thống kê ảnh
   */
  async getAlbumDetail(albumId) {
    const album = await Album.findOne({ _id: albumId, deleted_at: null })
      .populate('tour_id', 'title name code main_image duration')
      .populate('departure_id', 'start_datetime meeting_point status')
      .populate('created_by', 'full_name email')
      .lean();

    if (!album) {
      throw createHttpError(404, 'Không tìm thấy Album');
    }

    // Thống kê số lượng ảnh theo category
    const stats = await AlbumPhoto.aggregate([
      { $match: { album_id: album._id, deleted_at: null } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const photoStats = {
      TOTAL: 0,
      GROUP: 0,
      LOCATION: 0,
      ACTIVITY: 0,
      PERSONAL: 0,
    };

    stats.forEach((s) => {
      if (photoStats[s._id] !== undefined) {
        photoStats[s._id] = s.count;
      }
      photoStats.TOTAL += s.count;
    });

    const customers = await getValidDepartureCustomers(album.departure_id._id);

    return {
      album,
      photo_stats: photoStats,
      customer_count: customers.length,
    };
  }

  /**
   * Cập nhật thông tin Album
   */
  async updateAlbum(albumId, data = {}) {
    const album = await Album.findOne({ _id: albumId, deleted_at: null });
    if (!album) {
      throw createHttpError(404, 'Không tìm thấy Album');
    }

    if (album.status === 'ARCHIVED') {
      throw createHttpError(400, 'Album đã được lưu trữ (ARCHIVED), không thể chỉnh sửa');
    }

    if (data.title) album.title = data.title.trim();
    if (data.description !== undefined) album.description = data.description.trim();
    if (data.allow_download !== undefined) album.allow_download = Boolean(data.allow_download);
    if (data.cover_photo) album.cover_photo = data.cover_photo;
    if (data.status && ['ACTIVE', 'ARCHIVED', 'DRAFT'].includes(data.status)) {
      album.status = data.status;
    }

    album.version += 1;
    await album.save();
    return album;
  }

  /**
   * Tải ảnh lên Album (Hỗ trợ upload hàng loạt)
   */
  async uploadPhotos(albumId, user, files = [], options = {}) {
    if (!files || files.length === 0) {
      throw createHttpError(400, 'Vui lòng chọn ít nhất 1 file ảnh để tải lên');
    }

    const album = await Album.findOne({ _id: albumId, deleted_at: null });
    if (!album) {
      throw createHttpError(404, 'Không tìm thấy Album');
    }

    if (album.status === 'ARCHIVED') {
      throw createHttpError(400, 'Album đã lưu trữ, không thể tải thêm ảnh');
    }

    const category = options.category || 'GROUP';
    const visibility = category === 'PERSONAL' ? 'PERSONAL_ONLY' : options.visibility || 'SHARED';
    const caption = (options.caption || '').trim();

    const uploadedPhotos = [];
    const errors = [];

    for (const file of files) {
      try {
        const uploadResult = await uploadToCloudinary(file.buffer, 'tourgo/souvenirs/albums');

        // Tạo URL thumbnail 300x300
        const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
          width: 300,
          height: 300,
          crop: 'fill',
          quality: 'auto',
          fetch_format: 'auto',
          secure: true,
        });

        const photo = new AlbumPhoto({
          album_id: album._id,
          departure_id: album.departure_id,
          url: uploadResult.secure_url,
          thumbnail_url: thumbnailUrl,
          public_id: uploadResult.public_id,
          original_filename: file.originalname || 'photo.jpg',
          file_size: file.size || 0,
          mime_type: file.mimetype || 'image/jpeg',
          width: uploadResult.width || 0,
          height: uploadResult.height || 0,
          category,
          visibility,
          caption,
          uploaded_by: user._id,
        });

        await photo.save();
        uploadedPhotos.push(photo);
      } catch (err) {
        errors.push({
          file: file.originalname,
          error: err.message,
        });
      }
    }

    // Cập nhật lại tổng số ảnh của Album
    const totalPhotos = await AlbumPhoto.countDocuments({
      album_id: album._id,
      deleted_at: null,
    });
    album.photo_count = totalPhotos;

    // Nếu album chưa có ảnh bìa, tự động lấy ảnh đầu tiên làm bìa
    if (!album.cover_photo?.url && uploadedPhotos.length > 0) {
      album.cover_photo = {
        url: uploadedPhotos[0].url,
        public_id: uploadedPhotos[0].public_id,
        thumbnail_url: uploadedPhotos[0].thumbnail_url,
      };
    }

    await album.save();

    return {
      uploaded: uploadedPhotos,
      failed: errors,
      total_uploaded: uploadedPhotos.length,
      total_failed: errors.length,
    };
  }

  /**
   * Lấy danh sách ảnh trong Album (hỗ trợ lọc theo category, visibility, phân trang)
   */
  async getAlbumPhotos(albumId, options = {}) {
    const album = await Album.findOne({ _id: albumId, deleted_at: null });
    if (!album) {
      throw createHttpError(404, 'Không tìm thấy Album');
    }

    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.max(1, parseInt(options.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const query = {
      album_id: albumId,
      deleted_at: null,
    };

    if (options.category) {
      query.category = options.category;
    }

    if (options.visibility) {
      query.visibility = options.visibility;
    }

    if (options.booking_customer_id) {
      query['assigned_customers.booking_customer_id'] = options.booking_customer_id;
    }

    const total = await AlbumPhoto.countDocuments(query);
    const photos = await AlbumPhoto.find(query)
      .populate('uploaded_by', 'full_name email')
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
   * Cập nhật thông tin ảnh (chú thích, category, visibility)
   */
  async updatePhoto(photoId, data = {}) {
    const photo = await AlbumPhoto.findOne({ _id: photoId, deleted_at: null });
    if (!photo) {
      throw createHttpError(404, 'Không tìm thấy ảnh');
    }

    if (data.caption !== undefined) photo.caption = data.caption.trim();
    if (data.category) {
      photo.category = data.category;
      if (photo.category === 'PERSONAL') {
        photo.visibility = 'PERSONAL_ONLY';
      }
    }
    if (data.visibility && ['SHARED', 'PERSONAL_ONLY'].includes(data.visibility)) {
      photo.visibility = data.visibility;
    }
    if (data.sort_order !== undefined) photo.sort_order = Number(data.sort_order) || 0;

    await photo.save();
    return photo;
  }

  /**
   * Xóa ảnh khỏi Album (BR14: Cảnh báo nếu đang dùng trong thiệp)
   */
  async deletePhoto(photoId, force = false) {
    const photo = await AlbumPhoto.findOne({ _id: photoId, deleted_at: null });
    if (!photo) {
      throw createHttpError(404, 'Không tìm thấy ảnh');
    }

    // Kiểm tra xem ảnh có đang được dùng làm ảnh bìa hoặc ảnh cá nhân của thiệp nào không
    const usedInCards = await SouvenirCard.countDocuments({
      deleted_at: null,
      $or: [
        { 'cover_photo.public_id': photo.public_id },
        { personal_photo_ids: photo._id },
      ],
    });

    if (usedInCards > 0 && !force) {
      return {
        warning: true,
        used_in_cards_count: usedInCards,
        message: `Ảnh này đang được sử dụng trong ${usedInCards} thiệp điện tử. Xóa ảnh có thể làm mất hiển thị trên thiệp. Xác nhận force=true để tiếp tục.`,
      };
    }

    photo.deleted_at = new Date();
    await photo.save();

    // Giảm số lượng ảnh của Album
    await Album.findByIdAndUpdate(photo.album_id, {
      $inc: { photo_count: -1 },
    });

    // Xóa liên kết trong các thiệp nếu có
    if (usedInCards > 0) {
      await SouvenirCard.updateMany(
        { personal_photo_ids: photo._id },
        { $pull: { personal_photo_ids: photo._id } }
      );
    }

    return {
      success: true,
      message: 'Đã xóa ảnh thành công',
    };
  }

  /**
   * Gắn ảnh cá nhân cho hành khách (BR05)
   */
  async assignPhotoToCustomers(photoId, assignments = []) {
    if (!assignments || assignments.length === 0) {
      throw createHttpError(400, 'Danh sách hành khách gắn ảnh không được rỗng');
    }

    const photo = await AlbumPhoto.findOne({ _id: photoId, deleted_at: null });
    if (!photo) {
      throw createHttpError(404, 'Không tìm thấy ảnh');
    }

    // Tự động chuyển category sang PERSONAL và visibility PERSONAL_ONLY
    photo.category = 'PERSONAL';
    photo.visibility = 'PERSONAL_ONLY';

    const existingAssignedMap = new Set(
      (photo.assigned_customers || []).map((c) => c.booking_customer_id.toString())
    );

    for (const a of assignments) {
      if (!a.order_id || !a.order_item_id || !a.booking_customer_id) {
        continue;
      }
      const bcIdStr = a.booking_customer_id.toString();
      if (!existingAssignedMap.has(bcIdStr)) {
        photo.assigned_customers.push({
          order_id: a.order_id,
          order_item_id: a.order_item_id,
          booking_customer_id: a.booking_customer_id,
        });
        existingAssignedMap.add(bcIdStr);
      }
    }

    await photo.save();

    // Đồng bộ thêm photoId vào personal_photo_ids của SouvenirCard tương ứng nếu thiệp đã tạo
    for (const a of assignments) {
      await SouvenirCard.findOneAndUpdate(
        {
          order_id: a.order_id,
          booking_customer_id: a.booking_customer_id,
          deleted_at: null,
        },
        {
          $addToSet: { personal_photo_ids: photo._id },
        }
      );
    }

    return photo;
  }

  /**
   * Gỡ gắn ảnh khỏi hành khách mà không xóa ảnh gốc khỏi Album
   */
  async removePhotoAssignment(photoId, bookingCustomerId) {
    if (!bookingCustomerId) {
      throw createHttpError(400, 'bookingCustomerId là bắt buộc');
    }

    const photo = await AlbumPhoto.findOne({ _id: photoId, deleted_at: null });
    if (!photo) {
      throw createHttpError(404, 'Không tìm thấy ảnh');
    }

    photo.assigned_customers = (photo.assigned_customers || []).filter(
      (c) => c.booking_customer_id.toString() !== bookingCustomerId.toString()
    );

    // Nếu không còn ai được gắn, có thể giữ category hoặc không
    await photo.save();

    // Gỡ khỏi thiệp tương ứng
    await SouvenirCard.findOneAndUpdate(
      {
        booking_customer_id: bookingCustomerId,
        deleted_at: null,
      },
      {
        $pull: { personal_photo_ids: photo._id },
      }
    );

    return photo;
  }

  /**
   * Lấy danh sách khách hàng của đợt khởi hành kèm số lượng ảnh riêng đã gắn
   */
  async getDepartureCustomersWithPhotos(albumId) {
    const album = await Album.findOne({ _id: albumId, deleted_at: null });
    if (!album) {
      throw createHttpError(404, 'Không tìm thấy Album');
    }

    const customers = await getValidDepartureCustomers(album.departure_id);

    // Đếm số ảnh riêng và trạng thái thiệp của từng khách
    const enrichedCustomers = await Promise.all(
      customers.map(async (c) => {
        const photoCount = await AlbumPhoto.countDocuments({
          album_id: album._id,
          deleted_at: null,
          'assigned_customers.booking_customer_id': c.booking_customer_id,
        });

        const card = await SouvenirCard.findOne({
          order_id: c.order_id,
          booking_customer_id: c.booking_customer_id,
          deleted_at: null,
        })
          .select('_id public_code status email_status cover_photo')
          .lean();

        return {
          ...c,
          personal_photos_count: photoCount,
          card: card || null,
        };
      })
    );

    return enrichedCustomers;
  }
}

module.exports = new AlbumService();

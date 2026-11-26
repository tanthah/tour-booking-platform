/**
 * Script Migration: Trích xuất và bổ sung Cloudinary public_id từ URL ảnh cũ
 * Cho các collection: users, tours, categories, settings, articles
 *
 * Cách chạy:
 *   node src/scripts/migrate_add_public_ids.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const { MONGO_URI } = require('../config/env');
const { extractPublicIdFromUrl } = require('../utils/cloudinaryHelper');

async function migrateUsers(db) {
  const col = db.collection('users');
  const cursor = col.find({ avatar_url: { $exists: true, $nin: [null, ''] } });
  let updated = 0;

  while (await cursor.hasNext()) {
    const user = await cursor.next();
    if (user.avatar_public_id) continue;
    const publicId = extractPublicIdFromUrl(user.avatar_url);
    if (publicId) {
      await col.updateOne({ _id: user._id }, { $set: { avatar_public_id: publicId } });
      updated += 1;
    }
  }
  console.log(`✅ Users: đã cập nhật avatar_public_id cho ${updated} bản ghi`);
}

async function migrateCategories(db) {
  const col = db.collection('categories');
  const cursor = col.find({ image: { $exists: true, $nin: [null, ''] } });
  let updated = 0;

  while (await cursor.hasNext()) {
    const cat = await cursor.next();
    if (cat.image_public_id) continue;
    const publicId = extractPublicIdFromUrl(cat.image);
    if (publicId) {
      await col.updateOne({ _id: cat._id }, { $set: { image_public_id: publicId } });
      updated += 1;
    }
  }
  console.log(`✅ Categories: đã cập nhật image_public_id cho ${updated} bản ghi`);
}

async function migrateTours(db) {
  const col = db.collection('tours');
  const cursor = col.find({});
  let updated = 0;

  while (await cursor.hasNext()) {
    const tour = await cursor.next();
    const setFields = {};

    if (tour.main_image && !tour.main_image_public_id) {
      const pid = extractPublicIdFromUrl(tour.main_image);
      if (pid) setFields.main_image_public_id = pid;
    }

    if (Array.isArray(tour.gallery) && tour.gallery.length > 0) {
      const existingIds = Array.isArray(tour.gallery_public_ids) ? tour.gallery_public_ids : [];
      const nextIds = tour.gallery.map(
        (url, idx) => existingIds[idx] || extractPublicIdFromUrl(url) || ''
      );
      const hasChanges =
        nextIds.length !== existingIds.length ||
        nextIds.some((id, idx) => id !== (existingIds[idx] || ''));
      if (hasChanges) {
        setFields.gallery_public_ids = nextIds;
      }
    }

    if (Array.isArray(tour.itinerary) && tour.itinerary.length > 0) {
      let itineraryChanged = false;
      const nextItinerary = tour.itinerary.map((day) => {
        if (!day) return day;
        const nextDay = { ...day };
        if (day.image && !day.image_public_id) {
          const pid = extractPublicIdFromUrl(day.image);
          if (pid) {
            nextDay.image_public_id = pid;
            itineraryChanged = true;
          }
        }
        if (Array.isArray(day.images) && day.images.length > 0) {
          const existingDayIds = Array.isArray(day.images_public_ids) ? day.images_public_ids : [];
          const nextDayIds = day.images.map(
            (url, idx) => existingDayIds[idx] || extractPublicIdFromUrl(url) || ''
          );
          if (
            nextDayIds.length !== existingDayIds.length ||
            nextDayIds.some((id, idx) => id !== (existingDayIds[idx] || ''))
          ) {
            nextDay.images_public_ids = nextDayIds;
            itineraryChanged = true;
          }
        }
        return nextDay;
      });
      if (itineraryChanged) {
        setFields.itinerary = nextItinerary;
      }
    }

    if (Object.keys(setFields).length > 0) {
      await col.updateOne({ _id: tour._id }, { $set: setFields });
      updated += 1;
    }
  }
  console.log(`✅ Tours: đã cập nhật public_id cho ${updated} bản ghi`);
}

async function migrateSettings(db) {
  const col = db.collection('settings');
  const cursor = col.find({ logo_url: { $exists: true, $nin: [null, ''] } });
  let updated = 0;

  while (await cursor.hasNext()) {
    const setting = await cursor.next();
    if (setting.logo_public_id) continue;
    const publicId = extractPublicIdFromUrl(setting.logo_url);
    if (publicId) {
      await col.updateOne({ _id: setting._id }, { $set: { logo_public_id: publicId } });
      updated += 1;
    }
  }
  console.log(`✅ Settings: đã cập nhật logo_public_id cho ${updated} bản ghi`);
}

async function migrateArticles(db) {
  const col = db.collection('articles');
  const cursor = col.find({});
  let updated = 0;

  while (await cursor.hasNext()) {
    const article = await cursor.next();
    const setFields = {};

    if (article.cover_image?.url && !article.cover_image.public_id) {
      const pid = extractPublicIdFromUrl(article.cover_image.url);
      if (pid) {
        setFields['cover_image.public_id'] = pid;
      }
    }

    if (Array.isArray(article.content) && article.content.length > 0) {
      let contentChanged = false;
      const nextContent = article.content.map((block) => {
        if (block?.type === 'image' && block?.data?.file?.url && !block.data.file.public_id) {
          const pid = extractPublicIdFromUrl(block.data.file.url);
          if (pid) {
            contentChanged = true;
            return {
              ...block,
              data: {
                ...block.data,
                file: { ...block.data.file, public_id: pid },
              },
            };
          }
        }
        return block;
      });
      if (contentChanged) {
        setFields.content = nextContent;
      }
    }

    if (Object.keys(setFields).length > 0) {
      await col.updateOne({ _id: article._id }, { $set: setFields });
      updated += 1;
    }
  }
  console.log(`✅ Articles: đã bổ sung public_id cho ${updated} bản ghi`);
}

async function runMigration() {
  console.log('🔄 Bắt đầu Migration bổ sung Cloudinary public_id...');
  const dbUri = MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tour_booking_db';
  await mongoose.connect(dbUri);
  console.log('✅ Đã kết nối MongoDB');

  try {
    const db = mongoose.connection.db;
    await migrateUsers(db);
    await migrateCategories(db);
    await migrateTours(db);
    await migrateSettings(db);
    await migrateArticles(db);
    console.log('🎉 Hoàn tất Migration!');
  } finally {
    await mongoose.disconnect();
  }
}

runMigration().catch((err) => {
  console.error('❌ Migration thất bại:', err);
  process.exit(1);
});

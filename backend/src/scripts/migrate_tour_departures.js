/**
 * Script di chuyển dữ liệu (Data Migration) cho Module TourDeparture v2
 * Thực hiện:
 * 1. Chuyển departure_date (+ start_time) -> start_datetime
 * 2. Chuyển meeting_point_address -> meeting_point
 * 3. Gỡ bỏ các trường vận chuyển/đi lại đã loại bỏ:
 *    departure_location, vehicle, end_location, meeting_point_map_url, meeting_time, start_time, contact_info
 * 4. Giữ nguyên: total_slots, booked_slots, reserved_slots, status, product_id
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const { MONGO_URI } = require('../config/env');

async function migrate() {
  console.log('🔄 Bắt đầu Migration TourDeparture v2...');
  const dbUri = MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tour_booking_db';
  await mongoose.connect(dbUri);
  console.log('✅ Đã kết nối MongoDB:', dbUri);

  const db = mongoose.connection.db;
  const collection = db.collection('tourdepartures');

  const cursor = collection.find({});
  let totalCount = 0;
  let migratedCount = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    totalCount++;

    const updates = {};
    const unsets = {};

    // 1. Chuyển đổi start_datetime
    if (!doc.start_datetime && doc.departure_date) {
      let date = new Date(doc.departure_date);
      if (doc.start_time && typeof doc.start_time === 'string' && doc.start_time.includes(':')) {
        const [hours, minutes] = doc.start_time.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          date.setHours(hours, minutes, 0, 0);
        }
      }
      updates.start_datetime = date;
    }

    // 2. Chuyển đổi meeting_point
    if (!doc.meeting_point && (doc.meeting_point_address || doc.departure_location)) {
      updates.meeting_point = (doc.meeting_point_address || doc.departure_location || 'Địa điểm tập trung').trim();
    }

    // 3. Đảm bảo total_slots
    if (doc.total_slots === undefined || doc.total_slots === null) {
      updates.total_slots = 30;
    }

    // 4. Các trường cần unset
    const fieldsToUnset = [
      'departure_location',
      'vehicle',
      'end_location',
      'meeting_point_map_url',
      'meeting_time',
      'start_time',
      'contact_info',
    ];

    fieldsToUnset.forEach((field) => {
      if (doc[field] !== undefined) {
        unsets[field] = '';
      }
    });

    const updateOp = {};
    if (Object.keys(updates).length > 0) {
      updateOp.$set = updates;
    }
    if (Object.keys(unsets).length > 0) {
      updateOp.$unset = unsets;
    }

    if (Object.keys(updateOp).length > 0) {
      await collection.updateOne({ _id: doc._id }, updateOp);
      migratedCount++;
    }
  }

  console.log(`🎉 Hoàn tất Migration: ${migratedCount}/${totalCount} documents đã được cập nhật.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  migrate().catch((err) => {
    console.error('❌ Lỗi Migration:', err);
    process.exit(1);
  });
}

module.exports = migrate;


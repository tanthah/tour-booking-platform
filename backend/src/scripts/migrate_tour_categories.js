/**
 * Script di chuyển dữ liệu (Migration) cho Module Tour & Category
 * 1. Khởi tạo/Đảm bảo 2 root categories: 'Tour trong nước' (DOMESTIC) và 'Tour nước ngoài' (INTERNATIONAL)
 * 2. Khởi tạo các danh mục con mặc định tương ứng với các vùng cũ (nếu chưa có)
 * 3. Cập nhật các tour hiện có: map (category + region) -> category_id
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const { MONGO_URI } = require('../config/env');

async function migrateTourCategories() {
  console.log('🔄 Bắt đầu Migration Tour & Category...');
  const dbUri = MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tour_booking_db';
  await mongoose.connect(dbUri);
  console.log('✅ Đã kết nối MongoDB:', dbUri);

  const db = mongoose.connection.db;
  const categoriesCol = db.collection('categories');
  const toursCol = db.collection('tours');

  // 1. Root categories
  let domesticRoot = await categoriesCol.findOne({
    $or: [{ code: 'DOMESTIC' }, { slug: 'tour-trong-nuoc' }, { name: 'Tour trong nước' }],
    deleted_at: null,
  });

  if (!domesticRoot) {
    const res = await categoriesCol.insertOne({
      name: 'Tour trong nước',
      slug: 'tour-trong-nuoc',
      code: 'DOMESTIC',
      parent_id: null,
      position: 1,
      image: '',
      description: 'Các tour du lịch khám phá danh lam thắng cảnh khắp Việt Nam',
      status: 'ACTIVE',
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    domesticRoot = await categoriesCol.findOne({ _id: res.insertedId });
    console.log('✨ Đã tạo danh mục gốc: Tour trong nước (DOMESTIC)');
  } else {
    // Đảm bảo code và parent_id đúng
    await categoriesCol.updateOne(
      { _id: domesticRoot._id },
      { $set: { code: 'DOMESTIC', parent_id: null, status: 'ACTIVE' } }
    );
  }

  let internationalRoot = await categoriesCol.findOne({
    $or: [{ code: 'INTERNATIONAL' }, { slug: 'tour-nuoc-ngoai' }, { name: 'Tour nước ngoài' }],
    deleted_at: null,
  });

  if (!internationalRoot) {
    const res = await categoriesCol.insertOne({
      name: 'Tour nước ngoài',
      slug: 'tour-nuoc-ngoai',
      code: 'INTERNATIONAL',
      parent_id: null,
      position: 2,
      image: '',
      description: 'Các tour du lịch quốc tế tới các châu lục trên thế giới',
      status: 'ACTIVE',
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    internationalRoot = await categoriesCol.findOne({ _id: res.insertedId });
    console.log('✨ Đã tạo danh mục gốc: Tour nước ngoài (INTERNATIONAL)');
  } else {
    await categoriesCol.updateOne(
      { _id: internationalRoot._id },
      { $set: { code: 'INTERNATIONAL', parent_id: null, status: 'ACTIVE' } }
    );
  }

  // 2. Sub-categories tương ứng các vùng cũ
  const defaultSubCats = [
    { name: 'Tour Miền Bắc', slug: 'tour-mien-bac', regionCode: 'MIEN_BAC', parent_id: domesticRoot._id, position: 1 },
    { name: 'Tour Miền Trung', slug: 'tour-mien-trung', regionCode: 'MIEN_TRUNG', parent_id: domesticRoot._id, position: 2 },
    { name: 'Tour Miền Nam', slug: 'tour-mien-nam', regionCode: 'MIEN_NAM', parent_id: domesticRoot._id, position: 3 },
    { name: 'Tour Châu Á', slug: 'tour-chau-a', regionCode: 'CHAU_A', parent_id: internationalRoot._id, position: 1 },
    { name: 'Tour Châu Âu', slug: 'tour-chau-au', regionCode: 'CHAU_AU', parent_id: internationalRoot._id, position: 2 },
    { name: 'Tour Châu Mỹ', slug: 'tour-chau-my', regionCode: 'CHAU_MY', parent_id: internationalRoot._id, position: 3 },
    { name: 'Tour Châu Úc', slug: 'tour-chau-uc', regionCode: 'CHAU_UC', parent_id: internationalRoot._id, position: 4 },
  ];

  const subCatMapByRegion = {};

  for (const item of defaultSubCats) {
    let cat = await categoriesCol.findOne({
      $or: [
        { slug: item.slug },
        { name: item.name },
        { name: new RegExp(`^${item.name}$`, 'i') },
      ],
      deleted_at: null,
    });

    if (!cat) {
      const inserted = await categoriesCol.insertOne({
        name: item.name,
        slug: item.slug,
        parent_id: item.parent_id,
        position: item.position,
        image: '',
        description: `Danh mục ${item.name}`,
        status: 'ACTIVE',
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      cat = await categoriesCol.findOne({ _id: inserted.insertedId });
      console.log(`✨ Đã tạo danh mục con: ${item.name}`);
    } else if (!cat.parent_id) {
      await categoriesCol.updateOne({ _id: cat._id }, { $set: { parent_id: item.parent_id } });
    }

    subCatMapByRegion[item.regionCode] = cat._id;
  }

  // 3. Migrate Tours
  const toursCursor = toursCol.find({ deleted_at: null });
  let totalTours = 0;
  let updatedTours = 0;

  while (await toursCursor.hasNext()) {
    const tour = await toursCursor.next();
    totalTours++;

    let targetCatId = tour.category_id;

    if (!targetCatId) {
      if (tour.region && subCatMapByRegion[tour.region]) {
        targetCatId = subCatMapByRegion[tour.region];
      } else if (tour.category === 'INTERNATIONAL') {
        targetCatId = internationalRoot._id;
      } else {
        targetCatId = domesticRoot._id;
      }

      await toursCol.updateOne(
        { _id: tour._id },
        {
          $set: {
            category_id: targetCatId,
            updated_at: new Date(),
          },
        }
      );
      updatedTours++;
    }
  }

  console.log(`🎉 Hoàn tất Migration Tour & Category: Đã cập nhật ${updatedTours}/${totalTours} tour.`);
  await mongoose.disconnect();
}

if (require.main === module) {
  migrateTourCategories().catch((err) => {
    console.error('❌ Lỗi Migration:', err);
    process.exit(1);
  });
}

module.exports = migrateTourCategories;

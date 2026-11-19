/**
 * Test script toàn diện cho Module Thiệp Điện Tử Kỷ Niệm Chuyến Đi (MVP)
 * Kiểm tra toàn bộ quy tắc nghiệp vụ, state machine, bảo mật và quyền riêng tư ảnh.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { MONGO_URI } = require('../src/config/env');
const User = require('../src/modules/user/user.model');
const Tour = require('../src/modules/tour/tour.model');
const TourDeparture = require('../src/modules/tour/tourDeparture.model');
const Order = require('../src/modules/order/order.model');
const Album = require('../src/modules/souvenir/models/album.model');
const AlbumPhoto = require('../src/modules/souvenir/models/albumPhoto.model');
const SouvenirCard = require('../src/modules/souvenir/models/souvenirCard.model');
const CardEmailLog = require('../src/modules/souvenir/models/cardEmailLog.model');

const albumService = require('../src/modules/souvenir/services/album.service');
const souvenirCardService = require('../src/modules/souvenir/services/souvenirCard.service');
const souvenirCustomerService = require('../src/modules/souvenir/services/souvenirCustomer.service');
const cardEmailService = require('../src/modules/souvenir/services/cardEmail.service');

let passed = 0;
let total = 0;

function assert(cond, msg) {
  total++;
  if (cond) {
    passed++;
    console.log(`  ✅ [PASS] ${msg}`);
  } else {
    console.error(`  ❌ [FAIL] ${msg}`);
  }
}

async function expectError(fn, expectedStatus, msg) {
  total++;
  try {
    await fn();
    console.error(`  ❌ [FAIL] ${msg} (Expected error ${expectedStatus} but succeeded)`);
  } catch (err) {
    if (!expectedStatus || err.statusCode === expectedStatus) {
      passed++;
      console.log(`  ✅ [PASS] ${msg} (Status ${err.statusCode}: ${err.message})`);
    } else {
      console.error(
        `  ❌ [FAIL] ${msg} (Expected status ${expectedStatus}, got ${err.statusCode}: ${err.message})`
      );
    }
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN MODULE THIỆP ĐIỆN TỬ');
  console.log('====================================================\n');

  const ts = Date.now();
  let staffUser, adminUser, customerA, customerB;
  let testTour, openDeparture, completedDeparture;
  let orderA, orderB;
  let passengerA1_Id, passengerA2_Id, passengerB1_Id;
  let orderItemA_Id, orderItemB_Id;
  let testAlbum;
  let photoShared, photoPersonal;
  let testCardA;

  try {
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour-booking';
    await mongoose.connect(dbUri);
    console.log('📦 Kết nối MongoDB thành công\n');

    // ==========================================
    // 1. TẠO TEST FIXTURES
    // ==========================================
    console.log('--- 1. Chuẩn bị dữ liệu mẫu ---');

    staffUser = await User.create({
      full_name: `Staff Test ${ts}`,
      email: `staff_${ts}@test.com`,
      phone: `0901${ts.toString().slice(-6)}`,
      password_hash: 'dummyhash',
      roles: ['STAFF'],
      status: 'ACTIVE',
    });

    adminUser = await User.create({
      full_name: `Admin Test ${ts}`,
      email: `admin_${ts}@test.com`,
      phone: `0902${ts.toString().slice(-6)}`,
      password_hash: 'dummyhash',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    });

    customerA = await User.create({
      full_name: `Customer A ${ts}`,
      email: `custA_${ts}@test.com`,
      phone: `0903${ts.toString().slice(-6)}`,
      password_hash: 'dummyhash',
      roles: ['CUSTOMER'],
      status: 'ACTIVE',
    });

    customerB = await User.create({
      full_name: `Customer B ${ts}`,
      email: `custB_${ts}@test.com`,
      phone: `0904${ts.toString().slice(-6)}`,
      password_hash: 'dummyhash',
      roles: ['CUSTOMER'],
      status: 'ACTIVE',
    });

    testTour = await Tour.create({
      title: `Tour Kỷ Niệm ${ts}`,
      code: `TK${ts.toString().slice(-6)}`,
      category: 'DOMESTIC',
      destination_location: 'Hà Nội',
      duration: '3 Ngày 2 Đêm',
      original_price: 2500000,
      main_image: 'https://example.com/tour.jpg',
      status: 'ACTIVE',
    });

    // Đợt khởi hành OPEN (chưa hoàn thành)
    openDeparture = await TourDeparture.create({
      product_id: testTour._id,
      start_datetime: new Date(Date.now() + 86400000 * 5),
      meeting_point: 'Nhà hát Lớn Hà Nội',
      total_slots: 30,
      booked_slots: 5,
      status: 'OPEN',
    });

    // Đợt khởi hành COMPLETED (đã hoàn thành)
    completedDeparture = await TourDeparture.create({
      product_id: testTour._id,
      start_datetime: new Date(Date.now() - 86400000 * 3),
      meeting_point: 'Nhà thờ Đức Bà Sài Gòn',
      total_slots: 20,
      booked_slots: 3,
      status: 'COMPLETED',
    });

    // Tạo đơn hàng của Customer A
    orderItemA_Id = new mongoose.Types.ObjectId();
    passengerA1_Id = new mongoose.Types.ObjectId();
    passengerA2_Id = new mongoose.Types.ObjectId();

    orderA = await Order.create({
      order_code: `ORD-A-${ts}`,
      user_id: customerA._id,
      customer_info: {
        full_name: customerA.full_name,
        phone: customerA.phone,
        email: customerA.email,
      },
      items: [
        {
          _id: orderItemA_Id,
          tour_id: testTour._id,
          departure_id: completedDeparture._id,
          tour_name: testTour.title,
          tour_code: testTour.code,
          departure_date: completedDeparture.start_datetime,
          price_adult: 2500000,
          quantity_adult: 2,
          quantity: 2,
          subtotal: 5000000,
        },
      ],
      booking_customers: [
        {
          _id: passengerA1_Id,
          order_item_id: orderItemA_Id,
          full_name: 'Nguyễn Văn A1',
          phone: '0911111111',
          email: 'a1@test.com',
          gender: 'MALE',
        },
        {
          _id: passengerA2_Id,
          order_item_id: orderItemA_Id,
          full_name: 'Nguyễn Thị A2',
          phone: '0911111112',
          email: null,
          gender: 'FEMALE',
        },
      ],
      subtotal: 5000000,
      total_amount: 5000000,
      paid_amount: 5000000,
      payment_status: 'PAID',
      order_status: 'CONFIRMED',
    });

    // Tạo đơn hàng của Customer B
    orderItemB_Id = new mongoose.Types.ObjectId();
    passengerB1_Id = new mongoose.Types.ObjectId();

    orderB = await Order.create({
      order_code: `ORD-B-${ts}`,
      user_id: customerB._id,
      customer_info: {
        full_name: customerB.full_name,
        phone: customerB.phone,
        email: customerB.email,
      },
      items: [
        {
          _id: orderItemB_Id,
          tour_id: testTour._id,
          departure_id: completedDeparture._id,
          tour_name: testTour.title,
          tour_code: testTour.code,
          departure_date: completedDeparture.start_datetime,
          price_adult: 2500000,
          quantity_adult: 1,
          quantity: 1,
          subtotal: 2500000,
        },
      ],
      booking_customers: [
        {
          _id: passengerB1_Id,
          order_item_id: orderItemB_Id,
          full_name: 'Trần Văn B1',
          phone: '0922222222',
          email: 'b1@test.com',
          gender: 'MALE',
        },
      ],
      subtotal: 2500000,
      total_amount: 2500000,
      paid_amount: 2500000,
      payment_status: 'PAID',
      order_status: 'CONFIRMED',
    });

    console.log('  Fixtures đã sẵn sàng!\n');

    // ==========================================
    // 2. KIỂM THỬ QUẢN LÝ ALBUM (BR01, BR02)
    // ==========================================
    console.log('--- 2. Kiểm thử tạo Album (BR01, BR02) ---');

    // BR01: Chặn tạo album khi departure chưa hoàn thành (OPEN)
    await expectError(
      async () => albumService.createAlbum(openDeparture._id, staffUser),
      400,
      'BR01: Chặn tạo Album cho đợt khởi hành chưa hoàn thành'
    );

    // Tạo Album thành công cho đợt COMPLETED
    testAlbum = await albumService.createAlbum(completedDeparture._id, staffUser, {
      title: `Album Chuyến Đi ${testTour.title}`,
      description: 'Kỷ niệm chuyến đi tuyệt vời',
    });
    assert(testAlbum && testAlbum.title.includes('Album'), 'Tạo Album cho đợt hoàn thành thành công');

    // BR02: Chặn tạo trùng album cho cùng một departure
    await expectError(
      async () => albumService.createAlbum(completedDeparture._id, staffUser),
      409,
      'BR02: Chặn tạo trùng Album cho cùng đợt khởi hành'
    );

    // ==========================================
    // 3. KIỂM THỬ ẢNH & GẮN ẢNH RIÊNG (BR05, BR14)
    // ==========================================
    console.log('\n--- 3. Kiểm thử Ảnh và Gắn ảnh riêng (BR05, BR14) ---');

    photoShared = await AlbumPhoto.create({
      album_id: testAlbum._id,
      departure_id: completedDeparture._id,
      url: 'https://res.cloudinary.com/demo/image/upload/sample_group.jpg',
      thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_300/sample_group.jpg',
      public_id: 'sample_group_id',
      category: 'GROUP',
      visibility: 'SHARED',
      uploaded_by: staffUser._id,
    });
    assert(photoShared.visibility === 'SHARED', 'Tạo ảnh chung của đoàn thành công');

    photoPersonal = await AlbumPhoto.create({
      album_id: testAlbum._id,
      departure_id: completedDeparture._id,
      url: 'https://res.cloudinary.com/demo/image/upload/sample_personal.jpg',
      thumbnail_url: 'https://res.cloudinary.com/demo/image/upload/c_thumb,w_300/sample_personal.jpg',
      public_id: 'sample_personal_id',
      category: 'PERSONAL',
      visibility: 'PERSONAL_ONLY',
      uploaded_by: staffUser._id,
    });

    // Gắn ảnh riêng cho hành khách A1
    await albumService.assignPhotoToCustomers(photoPersonal._id, [
      {
        order_id: orderA._id,
        order_item_id: orderItemA_Id,
        booking_customer_id: passengerA1_Id,
      },
    ]);

    const updatedPhoto = await AlbumPhoto.findById(photoPersonal._id).lean();
    assert(
      updatedPhoto.assigned_customers.length === 1 &&
        updatedPhoto.assigned_customers[0].booking_customer_id.toString() === passengerA1_Id.toString(),
      'Gắn ảnh riêng cho hành khách A1 thành công'
    );

    // ==========================================
    // 4. KIỂM THỬ TẠO & DUYỆT THIỆP (BR03, BR07, BR08, BR18)
    // ==========================================
    console.log('\n--- 4. Kiểm thử State Machine và Duyệt thiệp ---');

    testCardA = await souvenirCardService.createCard(
      {
        album_id: testAlbum._id,
        order_id: orderA._id,
        order_item_id: orderItemA_Id,
        booking_customer_id: passengerA1_Id,
        cover_photo: {
          url: photoShared.url,
          public_id: photoShared.public_id,
          thumbnail_url: photoShared.thumbnail_url,
        },
        personal_message: 'Chúc anh A1 luôn vui vẻ!',
      },
      staffUser
    );

    assert(testCardA.status === 'DRAFT', 'Tạo thiệp mới ở trạng thái DRAFT');
    assert(testCardA.personal_photo_ids.length === 1, 'Thiệp tự động lấy ảnh cá nhân đã gắn');

    // BR03: Chặn tạo thiệp trùng cho cùng 1 hành khách
    await expectError(
      async () =>
        souvenirCardService.createCard(
          {
            album_id: testAlbum._id,
            order_id: orderA._id,
            order_item_id: orderItemA_Id,
            booking_customer_id: passengerA1_Id,
          },
          staffUser
        ),
      409,
      'BR03: Chặn tạo thiệp trùng cho cùng một hành khách trong đơn'
    );

    // Thử phát hành khi thiệp còn DRAFT -> Chặn (BR08)
    await expectError(
      async () => souvenirCardService.adminPublish(testCardA._id, adminUser),
      400,
      'BR08: Chặn phát hành khi thiệp chưa được APPROVED'
    );

    // Staff gửi duyệt: DRAFT -> PENDING_REVIEW
    await souvenirCardService.submitReview(testCardA._id, staffUser);
    let cardStatus = (await SouvenirCard.findById(testCardA._id)).status;
    assert(cardStatus === 'PENDING_REVIEW', 'Nhân viên gửi duyệt thiệp thành công');

    // Admin yêu cầu sửa: PENDING_REVIEW -> REVISION_REQUESTED
    await souvenirCardService.adminRequestRevision(testCardA._id, adminUser, 'Vui lòng bổ sung lời chúc');
    cardStatus = (await SouvenirCard.findById(testCardA._id)).status;
    assert(cardStatus === 'REVISION_REQUESTED', 'Admin yêu cầu chỉnh sửa thiệp thành công');

    // Staff cập nhật và gửi duyệt lại
    await souvenirCardService.updateCard(testCardA._id, staffUser, {
      personal_message: 'Chúc anh A1 vạn dặm bình an!',
    });
    await souvenirCardService.submitReview(testCardA._id, staffUser);
    cardStatus = (await SouvenirCard.findById(testCardA._id)).status;
    assert(cardStatus === 'PENDING_REVIEW', 'Nhân viên gửi duyệt lại thành công');

    // Admin duyệt: PENDING_REVIEW -> APPROVED
    await souvenirCardService.adminApprove(testCardA._id, adminUser, 'Nội dung đạt');
    cardStatus = (await SouvenirCard.findById(testCardA._id)).status;
    assert(cardStatus === 'APPROVED', 'Admin duyệt thiệp thành công');

    // Admin phát hành: APPROVED -> PUBLISHED
    await souvenirCardService.adminPublish(testCardA._id, adminUser);
    cardStatus = (await SouvenirCard.findById(testCardA._id)).status;
    assert(cardStatus === 'PUBLISHED', 'Admin phát hành thiệp thành công');

    // ==========================================
    // 5. KIỂM THỬ QUYỀN TRUY CẬP KHÁCH HÀNG & BẢO MẬT ẢNH (BR04, BR05, BR15)
    // ==========================================
    console.log('\n--- 5. Kiểm thử Bảo Mật & Quyền Riêng Tư (BR04, BR05, BR15) ---');

    // Customer A xem được thiệp của mình
    const cardDetailA = await souvenirCustomerService.getMyCardDetail(testCardA.public_code, customerA._id);
    assert(
      cardDetailA && cardDetailA.card.recipient_name === 'Nguyễn Văn A1',
      'Customer A xem được thiệp của hành khách trong đơn mình'
    );

    // BR05: Customer B KHÔNG xem được thiệp của Customer A
    await expectError(
      async () => souvenirCustomerService.getMyCardDetail(testCardA.public_code, customerB._id),
      403,
      'BR05: Chặn Customer B xem thiệp của Customer A'
    );

    // Customer A tải ảnh riêng của mình thành công
    const downloadA = await souvenirCustomerService.getPhotoDownload(photoPersonal._id, customerA._id);
    assert(downloadA && downloadA.download_url, 'Customer A tải được ảnh riêng của mình');

    // BR05: Customer B KHÔNG được tải ảnh riêng của Customer A
    await expectError(
      async () => souvenirCustomerService.getPhotoDownload(photoPersonal._id, customerB._id),
      403,
      'BR05: Chặn Customer B tải ảnh riêng của Customer A'
    );

    // ==========================================
    // 6. KIỂM THỬ THU HỒI THIỆP (BR15)
    // ==========================================
    console.log('\n--- 6. Kiểm thử Thu Hồi Thiệp (BR15) ---');

    await souvenirCardService.adminRevoke(testCardA._id, adminUser, 'Sai sót danh sách');
    cardStatus = (await SouvenirCard.findById(testCardA._id)).status;
    assert(cardStatus === 'REVOKED', 'Admin thu hồi thiệp thành công');

    // BR15: Sau khi thu hồi, Customer A mất quyền truy cập
    await expectError(
      async () => souvenirCustomerService.getMyCardDetail(testCardA.public_code, customerA._id),
      403,
      'BR15: Khách không thể truy cập thiệp sau khi bị thu hồi'
    );

    // ==========================================
    // 7. KIỂM THỬ BATCH TẠO THIỆP & EMAIL IDEMPOTENCY
    // ==========================================
    console.log('\n--- 7. Kiểm thử Batch và Email Idempotency ---');

    // Batch create cards cho các khách còn lại trong album
    const batchResult = await souvenirCardService.batchCreateCards(testAlbum._id, staffUser);
    assert(batchResult.created_count >= 1, 'Tạo thiệp hàng loạt thành công');

    // Kiểm thử ghi nhận Email Log
    const emailRes = await cardEmailService.resendEmail(testCardA._id, adminUser).catch((err) => {
      // Vì thiệp đã bị REVOKED nên phải báo lỗi 400
      return err;
    });
    assert(emailRes.statusCode === 400, 'Chặn gửi lại email cho thiệp REVOKED');
  } catch (err) {
    console.error('Lỗi nghiêm trọng trong quá trình test:', err);
  } finally {
    if (mongoose.connection.readyState === 1) {
      console.log('\n--- Dọn dẹp dữ liệu kiểm thử ---');
      if (staffUser) await User.deleteOne({ _id: staffUser._id });
      if (adminUser) await User.deleteOne({ _id: adminUser._id });
      if (customerA) await User.deleteOne({ _id: customerA._id });
      if (customerB) await User.deleteOne({ _id: customerB._id });
      if (testTour) await Tour.deleteOne({ _id: testTour._id });
      if (openDeparture) await TourDeparture.deleteOne({ _id: openDeparture._id });
      if (completedDeparture) await TourDeparture.deleteOne({ _id: completedDeparture._id });
      if (orderA) await Order.deleteOne({ _id: orderA._id });
      if (orderB) await Order.deleteOne({ _id: orderB._id });
      if (testAlbum) await Album.deleteMany({ _id: testAlbum._id });
      await AlbumPhoto.deleteMany({ album_id: testAlbum?._id });
      await SouvenirCard.deleteMany({ departure_id: completedDeparture?._id });
      await CardEmailLog.deleteMany({ card_id: testCardA?._id });

      await mongoose.disconnect();
      console.log('📦 Đã ngắt kết nối MongoDB');
    }

    console.log('\n====================================================');
    console.log(`🏁 KẾT QUẢ: ${passed}/${total} TESTS ĐÃ VƯỢT QUA (${Math.round((passed / total) * 100)}%)`);
    console.log('====================================================');
  }
}

runTests();

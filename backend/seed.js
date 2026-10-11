const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Tour = require('./modules/tour/tour.model');
const { MONGO_URI } = require('./config/env');

/**
 * Danh sách 15 Tour Trong Nước & 15 Tour Nước Ngoài mẫu
 */
const domesticTemplates = [
  { code: 'DOM01', title: 'Hà Nội – Ninh Bình – Hạ Long – Sapa 6N5Đ', region: 'MIEN_BAC', from: 'Hà Nội', to: 'Hạ Long - Sapa', duration: '6 Ngày 5 Đêm', price: 10000000, oldPrice: 13650000, slots: 30, remain: 10, img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop' },
  { code: 'DOM02', title: 'Phú Quốc – Thiên Đường Đảo Ngọc 3N2Đ', region: 'MIEN_NAM', from: 'TP.HCM', to: 'Phú Quốc', duration: '3 Ngày 2 Đêm', price: 2590000, oldPrice: 3650000, slots: 25, remain: 15, img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop' },
  { code: 'DOM03', title: 'Đà Nẵng – Hội An – Bà Nà Hills 4N3Đ', region: 'MIEN_TRUNG', from: 'Hà Nội', to: 'Đà Nẵng - Hội An', duration: '4 Ngày 3 Đêm', price: 4590000, oldPrice: 5990000, slots: 35, remain: 20, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop' },
  { code: 'DOM04', title: 'Quy Nhơn – Kỳ Co – Eo Gió Biển Xanh 3N2Đ', region: 'MIEN_TRUNG', from: 'TP.HCM', to: 'Quy Nhơn', duration: '3 Ngày 2 Đêm', price: 3490000, oldPrice: 4500000, slots: 20, remain: 8, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop' },
  { code: 'DOM05', title: 'Đà Lạt – Thành Phố Ngàn Hoa Mộng Mơ 3N2Đ', region: 'MIEN_NAM', from: 'TP.HCM', to: 'Đà Lạt', duration: '3 Ngày 2 Đêm', price: 2890000, oldPrice: 3800000, slots: 30, remain: 12, img: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=800&auto=format&fit=crop' },
  { code: 'DOM06', title: 'Nha Trang – Vịnh San Hô – VinWonders 4N3Đ', region: 'MIEN_TRUNG', from: 'Hà Nội', to: 'Nha Trang', duration: '4 Ngày 3 Đêm', price: 4990000, oldPrice: 6500000, slots: 25, remain: 14, img: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop' },
  { code: 'DOM07', title: 'Côn Đảo – Khám Phá Tâm Linh & Biển Đảo 3N2Đ', region: 'MIEN_NAM', from: 'TP.HCM', to: 'Côn Đảo', duration: '3 Ngày 2 Đêm', price: 6990000, oldPrice: 8500000, slots: 15, remain: 5, img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop' },
  { code: 'DOM08', title: 'Mộc Châu – Mùa Hoa Cải & Đồi Chè Trái Tim 2N1Đ', region: 'MIEN_BAC', from: 'Hà Nội', to: 'Mộc Châu', duration: '2 Ngày 1 Đêm', price: 1890000, oldPrice: 2500000, slots: 20, remain: 9, img: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&auto=format&fit=crop' },
  { code: 'DOM09', title: 'Hà Giang – Mã Pí Lèng – Sông Nho Quế 3N2Đ', region: 'MIEN_BAC', from: 'Hà Nội', to: 'Hà Giang', duration: '3 Ngày 2 Đêm', price: 3290000, oldPrice: 4200000, slots: 20, remain: 6, img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop' },
  { code: 'DOM10', title: 'Miền Tây – Cần Thơ – Chợ Nổi Cái Răng 2N1Đ', region: 'MIEN_NAM', from: 'TP.HCM', to: 'Cần Thơ', duration: '2 Ngày 1 Đêm', price: 1690000, oldPrice: 2200000, slots: 25, remain: 18, img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop' },
  { code: 'DOM11', title: 'Huế – Lăng Tẩm Cố Đô & Ca Huế Sông Hương 3N2Đ', region: 'MIEN_TRUNG', from: 'Hà Nội', to: 'Huế', duration: '3 Ngày 2 Đêm', price: 3690000, oldPrice: 4800000, slots: 25, remain: 11, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop' },
  { code: 'DOM12', title: 'Phan Thiết – Mũi Né – Đồi Cát Bay 2N1Đ', region: 'MIEN_NAM', from: 'TP.HCM', to: 'Phan Thiết', duration: '2 Ngày 1 Đêm', price: 1990000, oldPrice: 2700000, slots: 30, remain: 16, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop' },
  { code: 'DOM13', title: 'Phú Yên – Ghềnh Đá Đĩa – Tháp Nhạn 3N2Đ', region: 'MIEN_TRUNG', from: 'TP.HCM', to: 'Phú Yên', duration: '3 Ngày 2 Đêm', price: 3390000, oldPrice: 4400000, slots: 20, remain: 7, img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop' },
  { code: 'DOM14', title: 'Buôn Ma Thuột – Khám Phá Thác Dray Nur 3N2Đ', region: 'MIEN_TRUNG', from: 'Hà Nội', to: 'Đắk Lắk', duration: '3 Ngày 2 Đêm', price: 3890000, oldPrice: 5000000, slots: 20, remain: 10, img: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop' },
  { code: 'DOM15', title: 'Vũng Tàu – Hồ Tràm Onsen Resort Nghỉ Dưỡng 2N1Đ', region: 'MIEN_NAM', from: 'TP.HCM', to: 'Hồ Tràm', duration: '2 Ngày 1 Đêm', price: 2190000, oldPrice: 2900000, slots: 25, remain: 13, img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop' },
];

const intlTemplates = [
  { code: 'INT01', title: 'Singapore – Malaysia 5N4Đ Đảo Quốc Sư Tử', region: 'CHAU_A', from: 'TP.HCM', to: 'Singapore - Malaysia', duration: '5 Ngày 4 Đêm', price: 12590000, oldPrice: 15990000, slots: 20, remain: 8, img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop' },
  { code: 'INT02', title: 'Thái Lan: Bangkok – Pattaya 5N4Đ Đất Nước Nụ Cười', region: 'CHAU_A', from: 'Hà Nội', to: 'Bangkok - Pattaya', duration: '5 Ngày 4 Đêm', price: 6990000, oldPrice: 8990000, slots: 30, remain: 14, img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop' },
  { code: 'INT03', title: 'Hàn Quốc: Seoul – Đảo Nami – Lotte World 5N4Đ', region: 'CHAU_A', from: 'Hà Nội', to: 'Seoul', duration: '5 Ngày 4 Đêm', price: 15990000, oldPrice: 19500000, slots: 25, remain: 9, img: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop' },
  { code: 'INT04', title: 'Nhật Bản: Tokyo – Núi Phú Sĩ – Kyoto – Osaka 6N5Đ', region: 'CHAU_A', from: 'TP.HCM', to: 'Tokyo - Osaka', duration: '6 Ngày 5 Đêm', price: 29990000, oldPrice: 36000000, slots: 20, remain: 7, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop' },
  { code: 'INT05', title: 'Pháp – Ý – Thụy Sĩ 8N7Đ Châu Âu Cổ Kính', region: 'CHAU_AU', from: 'Hà Nội', to: 'Paris - Rome - Zurich', duration: '8 Ngày 7 Đêm', price: 52900000, oldPrice: 65000000, slots: 15, remain: 5, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop' },
  { code: 'INT06', title: 'Trương Gia Giới – Phượng Hoàng Cổ Trấn 6N5Đ', region: 'CHAU_A', from: 'Hà Nội', to: 'Trương Gia Giới', duration: '6 Ngày 5 Đêm', price: 13990000, oldPrice: 17500000, slots: 25, remain: 11, img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop' },
  { code: 'INT07', title: 'Dubai – Abu Dhabi Xứ Sở Xa Hoa 5N4Đ', region: 'CHAU_A', from: 'TP.HCM', to: 'Dubai', duration: '5 Ngày 4 Đêm', price: 26900000, oldPrice: 32000000, slots: 20, remain: 8, img: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop' },
  { code: 'INT08', title: 'Úc: Sydney – Melbourne Mùa Thu Rực Rỡ 7N6Đ', region: 'CHAU_UC', from: 'TP.HCM', to: 'Sydney - Melbourne', duration: '7 Ngày 6 Đêm', price: 48900000, oldPrice: 58000000, slots: 15, remain: 6, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop' },
  { code: 'INT09', title: 'Bờ Tây Nước Mỹ: Los Angeles – Las Vegas 8N7Đ', region: 'CHAU_MY', from: 'Hà Nội', to: 'Los Angeles - Las Vegas', duration: '8 Ngày 7 Đêm', price: 79900000, oldPrice: 95000000, slots: 15, remain: 4, img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop' },
  { code: 'INT10', title: 'Vương Quốc Anh – Scotland Xứ Sở Sương Mù 8N7Đ', region: 'CHAU_AU', from: 'Hà Nội', to: 'London - Edinburgh', duration: '8 Ngày 7 Đêm', price: 68900000, oldPrice: 82000000, slots: 15, remain: 5, img: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop' },
  { code: 'INT11', title: 'Bali – Indonesia Thiên Đường Sống Ảo 4N3Đ', region: 'CHAU_A', from: 'TP.HCM', to: 'Bali', duration: '4 Ngày 3 Đêm', price: 10990000, oldPrice: 13500000, slots: 20, remain: 9, img: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop' },
  { code: 'INT12', title: 'Đài Loan: Đài Bắc – Đài Trung – Cao Hùng 5N4Đ', region: 'CHAU_A', from: 'Hà Nội', to: 'Đài Bắc', duration: '5 Ngày 4 Đêm', price: 11990000, oldPrice: 14500000, slots: 25, remain: 12, img: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=800&auto=format&fit=crop' },
  { code: 'INT13', title: 'Thổ Nhĩ Kỳ: Istanbul – Cappadocia Bay Khinh Khí Cầu 8N7Đ', region: 'CHAU_AU', from: 'Hà Nội', to: 'Istanbul - Cappadocia', duration: '8 Ngày 7 Đêm', price: 39900000, oldPrice: 48000000, slots: 18, remain: 7, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop' },
  { code: 'INT14', title: 'Bắc Âu: Đan Mạch – Na Uy – Thụy Điển 9N8Đ', region: 'CHAU_AU', from: 'TP.HCM', to: 'Copenhagen - Oslo', duration: '9 Ngày 8 Đêm', price: 85900000, oldPrice: 102000000, slots: 15, remain: 4, img: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop' },
  { code: 'INT15', title: 'Maldives – Thiên Đường Nghỉ Dưỡng Thượng Lưu 4N3Đ', region: 'CHAU_A', from: 'TP.HCM', to: 'Maldives', duration: '4 Ngày 3 Đêm', price: 35900000, oldPrice: 42000000, slots: 12, remain: 5, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop' },
];

/**
 * Tạo danh sách 30 Tour hoàn chỉnh từ các mẫu trên
 */
const buildTours = () => {
  const allTours = [];

  // Tạo 15 Tour trong nước
  domesticTemplates.forEach((t, i) => {
    allTours.push({
      code: t.code,
      title: t.title,
      description: `Hành trình khám phá ${t.to} với dịch vụ chất lượng cao, trọn gói tiện nghi nhất.`,
      category: 'DOMESTIC',
      region: t.region,
      departure_location: t.from,
      destination_location: t.to,
      duration: t.duration,
      departure_date: new Date(2025, 6 + (i % 5), 10 + (i * 2)),
      end_date: new Date(2025, 6 + (i % 5), 15 + (i * 2)),
      vehicle: i % 2 === 0 ? 'Máy bay + Ô tô' : 'Ô tô 45 chỗ',
      price: t.price,
      original_price: t.oldPrice,
      total_slots: t.slots,
      remaining_slots: t.remain,
      status: 'PUBLISHED',
      main_image: t.img,
      gallery: [t.img, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop'],
      content_html: `<h2>Khám phá vẻ đẹp ${t.to}</h2><p>Chuyến đi mang lại trải nghiệm tuyệt vời cùng gia đình và bạn bè.</p>`,
      itinerary: [
        { day_title: 'NGÀY 1 | KHỞI HÀNH ĐẾN ĐIỂM HẸN', description: `Đoàn xuất phát từ ${t.from}, check-in khách sạn và bắt đầu tham quan.`, image: t.img },
        { day_title: 'NGÀY 2 | TRẢI NGHIỆM ĐỊA PHƯƠNG', description: `Khám phá các thắng cảnh nổi tiếng tại ${t.to}, thưởng thức ẩm thực đặc sắc.`, image: t.img }
      ],
      notes: 'Bao gồm xe đưa đón, khách sạn tiêu chuẩn và bảo hiểm du lịch.',
    });
  });

  // Tạo 15 Tour nước ngoài
  intlTemplates.forEach((t, i) => {
    allTours.push({
      code: t.code,
      title: t.title,
      description: `Tour khám phá thế giới tuyệt mỹ tại ${t.to} cùng hướng dẫn viên chuyên nghiệp.`,
      category: 'INTERNATIONAL',
      region: t.region,
      departure_location: t.from,
      destination_location: t.to,
      duration: t.duration,
      departure_date: new Date(2025, 7 + (i % 4), 5 + (i * 2)),
      end_date: new Date(2025, 7 + (i % 4), 12 + (i * 2)),
      vehicle: 'Máy bay quốc tế',
      price: t.price,
      original_price: t.oldPrice,
      total_slots: t.slots,
      remaining_slots: t.remain,
      status: 'PUBLISHED',
      main_image: t.img,
      gallery: [t.img, 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&auto=format&fit=crop'],
      content_html: `<h2>Hành trình khám phá ${t.to}</h2><p>Trải nghiệm dịch vụ hàng không và khách sạn đẳng cấp quốc tế.</p>`,
      itinerary: [
        { day_title: 'NGÀY 1 | BAY ĐẾN ĐIỂM ĐẾN QUỐC TẾ', description: `Tập trung tại sân bay ${t.from}, làm thủ tục xuất cảnh sang ${t.to}.`, image: t.img },
        { day_title: 'NGÀY 2 | THAM QUAN BIỂU TƯỢNG VĂN HÓA', description: `Check-in các công trình kiến trúc kỳ quan và tự do mua sắm.`, image: t.img }
      ],
      notes: 'Bao gồm vé máy bay khứ hồi, visa, khách sạn 4-5 sao và các bữa ăn chính.',
    });
  });

  return allTours;
};

/**
 * Thực thi seed 30 Tour vào MongoDB
 */
const seedTourData = async () => {
  try {
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour-booking';
    await mongoose.connect(dbUri);
    console.log('🔗 Đã kết nối MongoDB thành công');

    // Dọn dẹp dữ liệu Tour cũ
    await Tour.deleteMany({});
    console.log('🧹 Đã dọn dẹp dữ liệu Tour cũ');

    const toursToInsert = buildTours();
    const createdTours = await Tour.insertMany(toursToInsert);
    console.log(`✅ Đã chèn thành công ${createdTours.length} Tour (15 Trong Nước + 15 Nước Ngoài) vào Database!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
    process.exit(1);
  }
};

seedTourData();


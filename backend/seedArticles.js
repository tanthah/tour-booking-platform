/**
 * Script seed dữ liệu bài viết tin tức nổi bật cho hệ thống
 * Chạy bằng lệnh: node backend/seedArticles.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Article = require('./modules/article/article.model');
const ArticleCategory = require('./modules/article/articleCategory.model');
const User = require('./modules/user/user.model');
const { MONGO_URI } = require('./config/env');

const sampleCategories = [
  { name: 'Cẩm nang du lịch', slug: 'cam-nang-du-lich', description: 'Kinh nghiệm và mẹo hữu ích cho chuyến đi' },
  { name: 'Điểm đến hot', slug: 'diem-den-hot', description: 'Các toạ độ du lịch nổi tiếng trong và ngoài nước' },
  { name: 'Kinh nghiệm du lịch', slug: 'kinh-nghiem-du-lich', description: 'Lịch trình chi tiết và cẩm nang phượt' },
  { name: 'Ẩm thực du lịch', slug: 'am-thuc-du-lich', description: 'Đặc sản và văn hóa ẩm thực các vùng miền' },
];

const sampleArticles = [
  {
    title: 'Top 5 điểm check in độc đáo không thể bỏ lỡ tại Singapore',
    slug: 'top-5-diem-check-in-doc-dao-tai-singapore',
    categorySlug: 'diem-den-hot',
    summary: 'Từ thác nước trong nhà Jewel Changi, khu vườn tương lai Gardens by the Bay đến khu phố sắc màu Haji Lane - khám phá những toạ độ sống ảo đỉnh cao tại đảo quốc sư tử.',
    cover_image: {
      url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1000&auto=format&fit=crop',
      alt: 'Singapore Marina Bay Sands',
      caption: 'Khu vực Marina Bay lung linh về đêm',
    },
    is_featured: true,
    view_count: 5420,
    tags: ['Singapore', 'Check-in', 'Du lịch quốc tế', 'Châu Á'],
    content: [
      {
        type: 'header',
        data: { text: '1. Thác nước trong nhà Jewel Changi kỳ vĩ', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Ngay khi vừa đặt chân xuống sân bay Changi, bạn sẽ bị choáng ngợp bởi thác nước Vortex cao 40m đổ từ mái vòm kính xuống tầng hầm, bao quanh bởi khu rừng nhiệt đới trong nhà tươi tốt. Đây là điểm check-in không thể bỏ lỡ trước khi bắt đầu hành trình khám phá quốc đảo.',
        },
      },
      {
        type: 'header',
        data: { text: '2. Khu vườn siêu cây Gardens by the Bay', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Biểu tượng xanh của Singapore với những Siêu Cây khổng lồ phát sáng rực rỡ trong màn trình diễn âm thanh và ánh sáng Garden Rhapsody mỗi tối. Đừng quên ghé thăm hai nhà kính Flower Dome và Cloud Forest với khí hậu mát lạnh dễ chịu.',
        },
      },
      {
        type: 'header',
        data: { text: '3. Phố nghệ thuật và sắc màu Haji Lane', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Con hẻm nhỏ rực rỡ với các bức tranh tường graffiti sống động, các cửa hàng thời trang thiết kế độc lạ và những quán cafe mang đậm phong cách vintage thu hút giới trẻ toàn cầu.',
        },
      },
    ],
  },
  {
    title: 'Homestay “cổ tích” giữa Đà Lạt mộng mơ',
    slug: 'homestay-co-tich-giua-da-lat-mong-mo',
    categorySlug: 'cam-nang-du-lich',
    summary: 'Khám phá những căn nhà gỗ mộc mạc ẩn mình giữa đồi thông ngút ngàn, nơi bạn có thể săn mây mỗi sớm mai và tận hưởng trọn vẹn không khí se lạnh của phố núi.',
    cover_image: {
      url: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=800&auto=format&fit=crop',
      alt: 'Homestay Đà Lạt',
      caption: 'Khung cảnh thơ mộng giữa thung lũng Đà Lạt',
    },
    is_featured: true,
    view_count: 3890,
    tags: ['Đà Lạt', 'Homestay', 'Săn mây', 'Nghỉ dưỡng'],
    content: [
      {
        type: 'header',
        data: { text: 'Trải nghiệm bình yên giữa đồi thông thơ mộng', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Đà Lạt luôn biết cách chiều chuộng du khách bởi những góc nhỏ bình yên. Những homestay gỗ xinh xắn nằm men theo triền dốc, mở cửa sổ ra là thấy biển mây bồng bềnh trôi qua ngọn đồi thông xanh ngắt.',
        },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Buổi tối cùng bạn bè quây quần bên bếp lửa bập bùng, nhâm nhi ly trà atiso ấm nóng hay thưởng thức tiệc nướng BBQ thơm lừng trong tiết trời 15 độ C là trải nghiệm không thể nào quên.',
        },
      },
    ],
  },
  {
    title: 'Đảo Phú Quý Bình Thuận hot trend năm 2025',
    slug: 'dao-phu-quy-binh-thuan-hot-trend-2025',
    categorySlug: 'kinh-nghiem-du-lich',
    summary: 'Cẩm nang chi tiết khám phá hòn đảo ngọc hoang sơ giữa đại dương xanh thẳm, bờ kè bảy sắc cầu vồng, dốc Phượt và hồ bơi vô cực tự nhiên đẹp ngỡ ngàng.',
    cover_image: {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
      alt: 'Biển đảo Phú Quý',
      caption: 'Làn nước biển xanh ngọc bích tại đảo Phú Quý',
    },
    is_featured: true,
    view_count: 4120,
    tags: ['Phú Quý', 'Bình Thuận', 'Biển đảo', 'Phượt'],
    content: [
      {
        type: 'header',
        data: { text: 'Thời điểm lý tưởng nhất để đến Phú Quý', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Từ tháng 3 đến tháng 8 là mùa đẹp nhất để khám phá đảo Phú Quý. Biển êm đềm, nước trong vắt nhìn thấy đáy, trời trong xanh tạo điều kiện lý tưởng cho các hoạt động chèo SUP, lặn ngắm san hô và chụp ảnh kỷ niệm.',
        },
      },
      {
        type: 'header',
        data: { text: 'Các toạ độ sống ảo triệu view trên đảo', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Dốc Phượt ôm sát bờ biển, Cột cờ chủ quyền, Gành Hang với khe Nước Trong mát rượi và Phong điện khổng lồ là những địa danh bạn nhất định phải đặt chân đến.',
        },
      },
    ],
  },
  {
    title: 'Đặc sản không thể bỏ qua khi đến với Đà Nẵng',
    slug: 'dac-san-khong-the-bo-qua-khi-den-da-nang',
    categorySlug: 'am-thuc-du-lich',
    summary: 'Thưởng thức bánh tráng cuốn thịt heo hai đầu da chấm mắm nêm cay nồng, mì Quảng tôm thịt đậm đà, chả bò giòn ngọt và hải sản tươi sống bên bờ biển Mỹ Khê.',
    cover_image: {
      url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&auto=format&fit=crop',
      alt: 'Ẩm thực Đà Nẵng',
      caption: 'Bàn tiệc đặc sản phong phú đậm chất miền Trung',
    },
    is_featured: true,
    view_count: 2780,
    tags: ['Đà Nẵng', 'Ẩm thực', 'Mì Quảng', 'Món ngon miền Trung'],
    content: [
      {
        type: 'header',
        data: { text: '1. Bánh tráng cuốn thịt heo hai đầu da', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Món ăn làm nên thương hiệu của ẩm thực xứ Quảng với lát thịt luộc mềm ngọt có hai đầu mỡ trong veo, ăn kèm rau sống tươi sạch và bát mắm nêm đậm đà thơm lừng mùi tỏi ớt.',
        },
      },
      {
        type: 'header',
        data: { text: '2. Mì Quảng - Tinh hoa ẩm thực đất Quảng', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Sợi mì vàng óng dai mềm, chan ít nước dùng rim tôm thịt đậm vị, rắc thêm đậu phộng rang giòn rụm và bánh tráng mè nướng tạo nên hương vị bùng nổ vị giác.',
        },
      },
    ],
  },
  {
    title: 'Trekking cắm trại - Cảm nhận thiên nhiên hoang sơ',
    slug: 'trekking-cam-trai-cam-nhan-thien-nhien-hoang-so',
    categorySlug: 'kinh-nghiem-du-lich',
    summary: 'Chinh phục cung đường vượt rừng băng suối, cắm lều đón gió trên đỉnh đồi lộng gió và ngắm nhìn bầu trời đêm đầy sao lấp lánh tránh xa khói bụi thành thị.',
    cover_image: {
      url: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop',
      alt: 'Trekking cắm trại',
      caption: 'Cắm trại trên đỉnh đồi đón hoàng hôn',
    },
    is_featured: true,
    view_count: 2310,
    tags: ['Trekking', 'Cắm trại', 'Khám phá', 'Thiên nhiên'],
    content: [
      {
        type: 'header',
        data: { text: 'Bỏ lại âu lo sau lưng để về với đại ngàn', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Những chuyến đi bộ xuyên rừng mang lại cảm giác giải phóng tâm trí tuyệt vời. Bước chân qua từng tán rừng già rợp bóng mát, lắng nghe tiếng suối róc rách và tiếng chim hót líu lo giúp bạn nạp đầy năng lượng tích cực.',
        },
      },
    ],
  },
  {
    title: 'Kinh nghiệm du lịch Thái Lan tự túc từ A đến Z',
    slug: 'kinh-nghiem-du-lich-thai-lan-tu-tuc-tu-a-den-z',
    categorySlug: 'cam-nang-du-lich',
    summary: 'Bí kíp vi vu Bangkok - Pattaya với chi phí tiết kiệm: hướng dẫn đi lại bằng tàu điện BTS/MRT, cách săn vé máy bay giá rẻ và địa chỉ mua sắm sầm uất.',
    cover_image: {
      url: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&auto=format&fit=crop',
      alt: 'Chùa Wat Arun Thái Lan',
      caption: 'Chùa Bình Minh Wat Arun rực rỡ bên dòng sông Chao Phraya',
    },
    is_featured: true,
    view_count: 3670,
    tags: ['Thái Lan', 'Bangkok', 'Du lịch tự túc', 'Châu Á'],
    content: [
      {
        type: 'header',
        data: { text: 'Khám phá xứ sở Chùa Vàng xinh đẹp', level: 2 },
      },
      {
        type: 'paragraph',
        data: {
          text: 'Thái Lan luôn là điểm đến hấp dẫn bậc nhất Đông Nam Á nhờ sự kết hợp hoàn hảo giữa các công trình đền chùa cổ kính uy nghiêm và nhịp sống đô thị hiện đại, sầm uất cùng nền ẩm thực đường phố ngon nức tiếng.',
        },
      },
    ],
  },
];

async function seedArticles() {
  try {
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour_booking_db';
    console.log('Đang kết nối MongoDB:', dbUri);
    await mongoose.connect(dbUri);
    console.log('✓ Kết nối MongoDB thành công');

    // 1. Tìm hoặc tạo người dùng tạo bài viết (Tác giả)
    let author = await User.findOne({ roles: 'ADMIN', deleted_at: null });
    if (!author) {
      author = await User.findOne({ status: 'ACTIVE', deleted_at: null });
    }
    if (!author) {
      author = await User.create({
        full_name: 'Ban Biên Tập Du Lịch',
        email: 'editor@tourbooking.com',
        phone: '0909999888',
        password_hash: 'Password@123',
        roles: ['ADMIN'],
        status: 'ACTIVE',
      });
      console.log('✓ Tạo tác giả mặc định:', author.email);
    } else {
      console.log('✓ Sử dụng tác giả:', author.full_name, `(${author.email})`);
    }

    // 2. Tạo hoặc cập nhật các danh mục bài viết
    const categoryMap = {};
    for (const catData of sampleCategories) {
      const category = await ArticleCategory.findOneAndUpdate(
        { slug: catData.slug },
        {
          $set: {
            name: catData.name,
            description: catData.description,
            is_active: true,
            deleted_at: null,
          },
        },
        { upsert: true, new: true }
      );
      categoryMap[catData.slug] = category._id;
      console.log(`✓ Danh mục sẵn sàng: ${category.name} (${category.slug})`);
    }

    // 3. Tạo hoặc cập nhật các bài viết tin tức nổi bật
    let insertedCount = 0;
    for (const art of sampleArticles) {
      const categoryId = categoryMap[art.categorySlug];
      const articleDoc = {
        title: art.title,
        slug: art.slug,
        summary: art.summary,
        cover_image: art.cover_image,
        content: art.content,
        category_id: categoryId,
        tags: art.tags,
        status: 'PUBLISHED',
        is_featured: art.is_featured,
        view_count: art.view_count,
        created_by: author._id,
        published_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)), // Trong vòng 7 ngày qua
        deleted_at: null,
      };

      await Article.findOneAndUpdate(
        { slug: art.slug },
        { $set: articleDoc },
        { upsert: true, new: true }
      );
      insertedCount++;
      console.log(`✓ Đã nạp bài viết [Nổi bật]: "${art.title}" (views: ${art.view_count})`);
    }

    console.log(`\n🎉 Thành công! Đã nạp ${insertedCount} bài viết tin tức mẫu nổi bật vào hệ thống.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi nạp dữ liệu bài viết:', error.message);
    process.exit(1);
  }
}

seedArticles();


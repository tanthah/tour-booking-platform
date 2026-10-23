/**
 * Script tao tai khoan Admin dau tien cho he thong
 * Chay 1 lan bang lenh: node createAdmin.js
 * Tai khoan se duoc tao voi roles ADMIN va status ACTIVE, bo qua buoc OTP
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./modules/user/user.model');
const { MONGO_URI } = require('./config/env');

// Thong tin tai khoan Admin - lay tu file .env de tranh hardcode
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tourbooking.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_FULLNAME = process.env.ADMIN_FULLNAME || 'Quan Tri Vien';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '0900000001';

const createAdmin = async () => {
  try {
    const dbUri = MONGO_URI || 'mongodb://127.0.0.1:27017/tour-booking';
    await mongoose.connect(dbUri);
    console.log('Ket noi MongoDB thanh cong');

    // Kiem tra tai khoan da ton tai chua
    const existing = await User.findOne({ email: ADMIN_EMAIL, deleted_at: null });
    if (existing) {
      console.log('Tai khoan voi email ' + ADMIN_EMAIL + ' da ton tai.');

      // Neu ton tai nhung chua co role ADMIN thi cap nhat them role
      const hasAdminRole = existing.roles && existing.roles.includes('ADMIN');
      if (!hasAdminRole) {
        existing.roles = ['ADMIN'];
        existing.status = 'ACTIVE';
        await existing.save();
        console.log('Da cap nhat role ADMIN va status ACTIVE cho tai khoan: ' + ADMIN_EMAIL);
      } else {
        console.log('Tai khoan nay da co role ADMIN roi, khong can thay doi.');
      }

      process.exit(0);
    }

    // Tao tai khoan Admin moi
    // password_hash se duoc ma hoa tu dong boi Mongoose pre-save hook
    const admin = new User({
      full_name: ADMIN_FULLNAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password_hash: ADMIN_PASSWORD,
      roles: ['ADMIN'],
      status: 'ACTIVE',
    });

    await admin.save();

    console.log('Tao tai khoan Admin thanh cong!');
    console.log('Email   : ' + ADMIN_EMAIL);
    console.log('Mat khau: ' + ADMIN_PASSWORD);
    console.log('Hay doi mat khau ngay sau khi dang nhap lan dau.');

    process.exit(0);
  } catch (error) {
    console.error('Loi khi tao tai khoan Admin:', error.message);
    process.exit(1);
  }
};

createAdmin();

const Setting = require('./setting.model');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');

// Lấy thông tin cài đặt chung
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  return ApiResponse.success(res, 200, 'Lấy cài đặt thành công', settings);
});

// Cập nhật thông tin cài đặt chung
const updateSettings = asyncHandler(async (req, res) => {
  const { logo_url, phone, email, address, facebook_url, instagram_url, youtube_url } = req.body;
  
  let settings = await Setting.findOne();
  if (!settings) {
    settings = new Setting();
  }
  
  if (logo_url !== undefined) settings.logo_url = logo_url;
  if (phone !== undefined) settings.phone = phone;
  if (email !== undefined) settings.email = email;
  if (address !== undefined) settings.address = address;
  if (facebook_url !== undefined) settings.facebook_url = facebook_url;
  if (instagram_url !== undefined) settings.instagram_url = instagram_url;
  if (youtube_url !== undefined) settings.youtube_url = youtube_url;

  await settings.save();
  return ApiResponse.success(res, 200, 'Cập nhật cài đặt thành công', settings);
});

module.exports = {
  getSettings,
  updateSettings
};

const Setting = require('./setting.model');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const { extractPublicIdFromUrl, cleanupRemovedImages } = require('../../utils/cloudinaryHelper');

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
  const {
    logo_url,
    logo_public_id,
    phone,
    email,
    address,
    facebook_url,
    instagram_url,
    youtube_url,
  } = req.body;

  let settings = await Setting.findOne();
  if (!settings) {
    settings = new Setting();
  }

  const oldLogoEntries = [{ url: settings.logo_url, public_id: settings.logo_public_id }];

  if (logo_url !== undefined) {
    const logoChanged = logo_url !== settings.logo_url;
    settings.logo_url = logo_url;
    if (logo_public_id !== undefined) {
      settings.logo_public_id = logo_public_id || '';
    } else if (logoChanged) {
      settings.logo_public_id = extractPublicIdFromUrl(logo_url) || '';
    }
  } else if (logo_public_id !== undefined) {
    settings.logo_public_id = logo_public_id || '';
  }

  if (phone !== undefined) settings.phone = phone;
  if (email !== undefined) settings.email = email;
  if (address !== undefined) settings.address = address;
  if (facebook_url !== undefined) settings.facebook_url = facebook_url;
  if (instagram_url !== undefined) settings.instagram_url = instagram_url;
  if (youtube_url !== undefined) settings.youtube_url = youtube_url;

  await settings.save();

  const newLogoEntries = [{ url: settings.logo_url, public_id: settings.logo_public_id }];
  await cleanupRemovedImages(oldLogoEntries, newLogoEntries);

  return ApiResponse.success(res, 200, 'Cập nhật cài đặt thành công', settings);
});

module.exports = {
  getSettings,
  updateSettings
};

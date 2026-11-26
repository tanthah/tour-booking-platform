const assert = require('assert');
const Module = require('module');

// Mock upload.middleware before requiring cloudinaryHelper
const deletedCalls = [];
const uploadedCalls = [];

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request.endsWith('upload.middleware') || request.includes('middlewares/upload.middleware')) {
    return {
      uploadToCloudinary: async (buffer, folder) => {
        uploadedCalls.push({ buffer, folder });
        return {
          secure_url: `https://res.cloudinary.com/demo/image/upload/v1700000000/${folder}/new_img.jpg`,
          public_id: `${folder}/new_img`,
        };
      },
      deleteFromCloudinary: async (publicId) => {
        deletedCalls.push(publicId);
        return { result: 'ok' };
      },
    };
  }
  return originalLoad.apply(this, arguments);
};

const {
  extractPublicIdFromUrl,
  resolvePublicId,
  safeDeleteFromCloudinary,
  deleteImages,
  replaceImage,
  cleanupRemovedImages,
} = require('../src/utils/cloudinaryHelper');

async function runTests() {
  // 1. extractPublicIdFromUrl tests
  assert.strictEqual(
    extractPublicIdFromUrl('https://res.cloudinary.com/demo/image/upload/v1712345678/tour-booking/avatars/abc_123.jpg'),
    'tour-booking/avatars/abc_123'
  );
  assert.strictEqual(
    extractPublicIdFromUrl('https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/v123/tour-booking/abc.webp'),
    'tour-booking/abc'
  );
  assert.strictEqual(
    extractPublicIdFromUrl('https://res.cloudinary.com/demo/image/upload/w_300,h_300,c_fill/tourgo/souvenirs/albums/xyz.png?v=1'),
    'tourgo/souvenirs/albums/xyz'
  );
  assert.strictEqual(
    extractPublicIdFromUrl('https://res.cloudinary.com/demo/image/upload/tour-booking/single.jpg'),
    'tour-booking/single'
  );
  assert.strictEqual(
    extractPublicIdFromUrl('https://images.unsplash.com/photo-123456'),
    null
  );
  assert.strictEqual(extractPublicIdFromUrl(''), null);
  assert.strictEqual(extractPublicIdFromUrl(null), null);

  // 2. resolvePublicId tests
  assert.strictEqual(
    resolvePublicId('https://res.cloudinary.com/demo/image/upload/v1/tour-booking/a.jpg', 'explicit/id'),
    'explicit/id'
  );
  assert.strictEqual(
    resolvePublicId('https://res.cloudinary.com/demo/image/upload/v1/tour-booking/a.jpg', ''),
    'tour-booking/a'
  );

  // 3. replaceImage tests
  deletedCalls.length = 0;
  uploadedCalls.length = 0;
  const replaced = await replaceImage(Buffer.from('fake'), 'tour-booking/avatars', 'tour-booking/avatars/old_img');
  assert.strictEqual(replaced.public_id, 'tour-booking/avatars/new_img');
  assert.deepStrictEqual(uploadedCalls.length, 1);
  assert.deepStrictEqual(deletedCalls, ['tour-booking/avatars/old_img']);

  // 4. cleanupRemovedImages tests
  deletedCalls.length = 0;
  await cleanupRemovedImages(
    [
      { url: 'https://res.cloudinary.com/demo/image/upload/v1/tour-booking/keep.jpg', public_id: 'tour-booking/keep' },
      { url: 'https://res.cloudinary.com/demo/image/upload/v1/tour-booking/removed1.jpg', public_id: 'tour-booking/removed1' },
      { url: 'https://res.cloudinary.com/demo/image/upload/v1/tour-booking/removed2.jpg', public_id: '' },
      { url: 'https://images.unsplash.com/photo-999', public_id: '' },
    ],
    [
      { url: 'https://res.cloudinary.com/demo/image/upload/v1/tour-booking/keep.jpg', public_id: 'tour-booking/keep' },
      { url: 'https://res.cloudinary.com/demo/image/upload/v1/tour-booking/added.jpg', public_id: 'tour-booking/added' },
    ]
  );
  assert.deepStrictEqual(deletedCalls.sort(), ['tour-booking/removed1', 'tour-booking/removed2']);

  // 5. deleteImages deduplication & non-cloudinary safety
  deletedCalls.length = 0;
  await deleteImages([
    'tour-booking/a',
    'tour-booking/a',
    'https://res.cloudinary.com/demo/image/upload/v1/tour-booking/b.jpg',
    'https://images.unsplash.com/photo-1',
    '',
    null,
  ]);
  assert.deepStrictEqual(deletedCalls.sort(), ['tour-booking/a', 'tour-booking/b']);

  // 6. safeDeleteFromCloudinary skips empty
  deletedCalls.length = 0;
  const skipped = await safeDeleteFromCloudinary('');
  assert.strictEqual(skipped.skipped, true);
  assert.strictEqual(deletedCalls.length, 0);

  console.log('✅ All cloudinaryHelper tests passed!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

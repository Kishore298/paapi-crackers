const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Storage Provider Abstraction Layer
 * Currently: Cloudinary
 * Swap to local storage by implementing the same interface
 */

const uploadToCloud = (fileBuffer, folder = 'paapi-crackers') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const deleteFromCloud = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from cloud:', error.message);
  }
};

const getUrl = (publicId) => {
  if (!publicId) return null;
  return cloudinary.url(publicId, { secure: true });
};

/**
 * Injects dynamic Cloudinary transformations into an existing secure_url.
 * Ensures that bandwidth is optimized by limiting width and auto-negotiating format/quality.
 */
const getOptimizedUrl = (originalUrl, width = 800) => {
  if (!originalUrl) return originalUrl;
  if (!originalUrl.includes('res.cloudinary.com')) return originalUrl;
  if (originalUrl.includes('/upload/c_limit')) return originalUrl; // Already optimized

  // Inject the transformation string right after /upload/
  // c_limit ensures we don't upscale small images
  return originalUrl.replace('/upload/', `/upload/c_limit,w_${width},f_auto,q_auto/`);
};

module.exports = {
  upload: uploadToCloud,
  delete: deleteFromCloud,
  getUrl,
  getOptimizedUrl,
};

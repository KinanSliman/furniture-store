import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Folder name for all product images
const UPLOAD_FOLDER = 'ecommerce-products';

/**
 * Upload an image to Cloudinary
 * @param file - Base64 encoded image or file path
 * @param publicId - Optional custom public ID for the image
 * @returns Upload result with secure_url and public_id
 */
export async function uploadImage(file: string, publicId?: string) {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: UPLOAD_FOLDER,
      public_id: publicId,
      resource_type: 'image',
      transformation: [
        { quality: 'auto' }, // Automatic quality optimization
        { fetch_format: 'auto' }, // Automatic format selection (WebP, AVIF, etc.)
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Deletion result
 */
export async function deleteImage(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Delete multiple images from Cloudinary
 * @param publicIds - Array of public IDs to delete
 * @returns Deletion results
 */
export async function deleteImages(publicIds: string[]) {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error('Cloudinary bulk delete error:', error);
    throw new Error('Failed to delete images from Cloudinary');
  }
}

/**
 * Generate a thumbnail URL from a Cloudinary image URL
 * @param url - Original Cloudinary image URL
 * @param width - Thumbnail width (default 200)
 * @param height - Thumbnail height (default 200)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(url: string, width = 200, height = 200): string {
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  // Insert transformation parameters into Cloudinary URL
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
}

/**
 * Generate an optimized image URL from a Cloudinary image URL
 * @param url - Original Cloudinary image URL
 * @param width - Image width (default 800)
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(url: string, width = 800): string {
  if (!url.includes('cloudinary.com')) {
    return url;
  }

  // Insert transformation parameters into Cloudinary URL
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
}

export default cloudinary;

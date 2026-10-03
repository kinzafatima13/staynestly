/**
 * Cloudinary utilities for image upload and management
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dobsklhla';
const UPLOAD_PRESET = 'staynestly_unsigned';

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  url: string;
  folder?: string;
}

export interface UploadOptions {
  folder?: string;
  transformation?: string;
  tags?: string[];
}

/**
 * Upload a single image to Cloudinary
 * @param file - The image file to upload
 * @param options - Optional upload configuration
 * @returns Promise with Cloudinary response containing secure_url
 */
export async function uploadImageToCloudinary(
  file: File,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  // Optional folder for organization
  if (options.folder) {
    formData.append('folder', options.folder);
  }
  
  // Optional tags for categorization
  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','));
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || `Upload failed with status ${response.status}`
    );
  }

  const data = await response.json();
  return data;
}

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of image files to upload
 * @param options - Optional upload configuration
 * @param onProgress - Optional callback for upload progress
 * @returns Promise with array of secure URLs
 */
export async function uploadMultipleImages(
  files: File[],
  options: UploadOptions = {},
  onProgress?: (current: number, total: number, url: string) => void
): Promise<string[]> {
  const urls: string[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    try {
      const result = await uploadImageToCloudinary(files[i], options);
      urls.push(result.secure_url);
      
      if (onProgress) {
        onProgress(i + 1, total, result.secure_url);
      }
    } catch (error) {
      console.error(`Failed to upload image ${i + 1}/${total}:`, error);
      throw error;
    }
  }

  return urls;
}

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in megabytes (default: 10MB)
 * @returns Object with isValid and error message
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type: ${file.type}. Supported formats: JPG, PNG, WebP, GIF`,
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum of ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Extract public_id from Cloudinary URL
 * Useful for deleting images or applying transformations
 * @param url - Cloudinary secure_url
 * @returns public_id or null if not a valid Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Generate optimized image URL with transformations
 * @param publicId - Cloudinary public_id
 * @param transformations - Cloudinary transformation string (e.g., 'w_800,h_600,c_fill')
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  transformations: string = 'w_800,h_600,c_fill,q_auto,f_auto'
): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}

/**
 * Get thumbnail URL for an image
 * @param url - Original Cloudinary URL
 * @param width - Thumbnail width (default: 200)
 * @param height - Thumbnail height (default: 200)
 * @returns Thumbnail URL
 */
export function getThumbnailUrl(
  url: string,
  width: number = 200,
  height: number = 200
): string {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return url;
  
  return getOptimizedImageUrl(publicId, `w_${width},h_${height},c_fill,q_auto,f_auto`);
}

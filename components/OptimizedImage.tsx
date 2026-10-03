/**
 * OptimizedImage Component
 * 
 * Wrapper for Cloudinary's CldImage with sensible defaults
 * Automatically optimizes images with WebP/AVIF format and responsive sizing
 */

import { CldImage } from 'next-cloudinary';

interface OptimizedImageProps {
  src: string; // Can be Cloudinary public_id or full URL
  alt: string;
  width: number;
  height: number;
  fill?: boolean;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'auto';
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  crop = 'fill',
  className = '',
  priority = false,
  sizes,
}: OptimizedImageProps) {
  // Extract public_id from Cloudinary URL if full URL is provided
  const getPublicId = (url: string): string => {
    if (!url.includes('cloudinary')) {
      return url; // Not a Cloudinary URL, return as-is
    }
    
    // Extract public_id from URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : url;
  };

  const publicId = getPublicId(src);

  return (
    <CldImage
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      crop={{
        type: crop,
        source: true,
      }}
      className={className}
      priority={priority}
      sizes={sizes}
      // Automatically applies:
      // - f_auto (automatic format: WebP, AVIF)
      // - q_auto (automatic quality optimization)
      // - dpr_auto (responsive pixel density)
    />
  );
}

// Example usage:
// <OptimizedImage
//   src="staynestly/properties/abc123"
//   alt="Property image"
//   width={800}
//   height={600}
//   crop="fill"
//   className="rounded-lg"
// />

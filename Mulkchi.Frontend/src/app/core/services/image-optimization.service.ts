import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface OptimizedImage {
  src: string; // URL to display
  srcset: string; // Responsive image srcset
  sizes: string; // Image sizes for responsive loading
  placeholder?: string; // Low quality placeholder
  lazy?: boolean; // Lazy load the image
}

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizationService {
  /**
   * Generate optimized image URL with quality and size parameters
   */
  getOptimizedImage(url: string, width?: number, height?: number, quality = 80): string {
    if (!url) return '';

    // Handle external images
    if (url.startsWith('http') || url.includes('placehold.co')) {
      return url;
    }

    // Prepend API base URL for relative paths that are not frontend assets
    // environment.apiUrl is usually http://localhost:5000/api
    // Images are served from http://localhost:5000/uploads
    const baseUrl = environment.apiUrl.replace('/api', '');
    
    // If it's a relative path starting with /assets, it belongs to the frontend
    if (url.startsWith('/assets')) {
      return url;
    }

    const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;

    // For now, our backend serves pre-generated variants (full, medium, thumb)
    // We don't support dynamic resizing via query params yet, so we return the URL as is
    // or select a variant if the logic is added later.
    return fullUrl;
  }

  /**
   * Generate srcset for responsive images
   */
  generateSrcset(url: string, widths: number[] = [320, 640, 960, 1280]): string {
    return widths.map((width) => `${this.getOptimizedImage(url, width)} ${width}w`).join(', ');
  }

  /**
   * Generate sizes attribute for responsive loading
   */
  generateSizes(breakpoints: { width: string; size: string }[] = []): string {
    const defaults = [
      { width: '(max-width: 640px)', size: '100vw' },
      { width: '(max-width: 1024px)', size: '50vw' },
      { width: '', size: '33vw' },
    ];

    const bp = breakpoints.length ? breakpoints : defaults;
    return bp.map((b) => (b.width ? `${b.width} ${b.size}` : b.size)).join(', ');
  }

  /**
   * Generate low-quality placeholder image
   */
  generatePlaceholder(url: string, width = 50, height = 50): string {
    return this.getOptimizedImage(url, width, height, 30);
  }

  /**
   * Create optimized image configuration
   */
  createOptimizedImage(
    url: string,
    options: {
      widths?: number[];
      quality?: number;
      withPlaceholder?: boolean;
      lazy?: boolean;
    } = {},
  ): OptimizedImage {
    const {
      widths = [320, 640, 960, 1280],
      quality = 80,
      withPlaceholder = false,
      lazy = true,
    } = options;

    return {
      src: this.getOptimizedImage(url, widths[widths.length - 1], undefined, quality),
      srcset: this.generateSrcset(url, widths),
      sizes: this.generateSizes(),
      placeholder: withPlaceholder ? this.generatePlaceholder(url) : undefined,
      lazy,
    };
  }

  /**
   * Check if image URL is valid
   */
  isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get fallback/placeholder image for property type
   */
  getFallbackImage(type = 'Apartment'): string {
    const colors: Record<string, string> = {
      Apartment: '1B3A6B/C9A84C',
      House: '1B3A6B/ffffff',
      Villa: 'C9A84C/1B3A6B',
      Office: '2a4a7c/ffffff',
      Land: '10b981/ffffff',
      Commercial: 'f59e0b/1B3A6B',
    };

    const color = colors[type] || '1B3A6B/C9A84C';
    return `https://placehold.co/400x300/${color}?text=${encodeURIComponent(type)}`;
  }

  /**
   * Compress image client-side before upload
   */
  async compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  }
}

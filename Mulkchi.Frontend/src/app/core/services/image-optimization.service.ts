import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface OptimizedImage {
  src: string;
  srcset: string;
  sizes: string;
  placeholder?: string;
  lazy?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizationService {
  getOptimizedImage(url: string, width?: number, height?: number, quality?: number): string {
    if (!url) return '';

    if (url.startsWith('http') || url.includes('images.unsplash.com')) {
      return url;
    }

    const baseUrl = environment.apiUrl.replace('/api', '');

    if (url.startsWith('/assets')) {
      return url;
    }

    let normalizedUrl = url.replace(/\\/g, '/');
    if (normalizedUrl.startsWith('/')) {
      normalizedUrl = normalizedUrl.substring(1);
    }

    if (!normalizedUrl.includes('/')) {
      const lower = normalizedUrl.toLowerCase();
      if (lower.endsWith('.webp')) {
        normalizedUrl = `uploads/property-images/${normalizedUrl}`;
      } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) {
        normalizedUrl = `avatars/${normalizedUrl}`;
      }
    }

    const fullUrl = `${baseUrl}/${normalizedUrl}`;

    return fullUrl;
  }

  generateSrcset(url: string, widths: number[] = [320, 640, 960, 1280]): string {
    return widths.map((width) => `${this.getOptimizedImage(url, width)} ${width}w`).join(', ');
  }

  generateSizes(breakpoints: { width: string; size: string }[] = []): string {
    const defaults = [
      { width: '(max-width: 640px)', size: '100vw' },
      { width: '(max-width: 1024px)', size: '50vw' },
      { width: '', size: '33vw' },
    ];

    const bp = breakpoints.length ? breakpoints : defaults;
    return bp.map((b) => (b.width ? `${b.width} ${b.size}` : b.size)).join(', ');
  }

  generatePlaceholder(url: string, width = 50, height = 50): string {
    return this.getOptimizedImage(url, width, height, 30);
  }

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

  isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getFallbackImage(type = 'Apartment'): string {
    return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
  }

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
            quality,
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  }
}

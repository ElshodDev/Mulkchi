import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-optimized-image',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="optimized-image-container" [style.aspect-ratio]="aspectRatio()">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="image-loading">
          <mat-progress-spinner diameter="30" mode="indeterminate"></mat-progress-spinner>
        </div>
      }

      <!-- Main Image -->
      <img
        [src]="currentSrc()"
        [srcset]="srcset()"
        [sizes]="sizes()"
        [alt]="alt()"
        [style.width.%]="100"
        [style.height.%]="100"
        [style.object-fit]="objectFit()"
        (load)="onImageLoad()"
        (error)="onImageError()"
        [class.loaded]="isLoaded()"
        [class.error]="hasError()"
        loading="lazy"
        decoding="async"
      />

      <!-- Error State -->
      @if (hasError()) {
        <div class="image-error">
          <span class="error-icon">🖼️</span>
          <span class="error-text">Rasm yuklanmadi</span>
        </div>
      }

      <!-- Low Quality Placeholder (LQIP) -->
      @if (placeholder() && !isLoaded()) {
        <div
          class="image-placeholder"
          [style.background-image]="'url(' + placeholder() + ')'"
          [style.filter]="placeholderBlur() ? 'blur(10px)' : 'none'"
        ></div>
      }
    </div>
  `,
  styles: [
    `
      .optimized-image-container {
        position: relative;
        overflow: hidden;
        background: var(--color-surface-elevated);
        border-radius: var(--radius-3);
      }

      .optimized-image-container img {
        transition:
          opacity 0.3s ease,
          transform 0.3s ease;
        opacity: 0;
      }

      .optimized-image-container img.loaded {
        opacity: 1;
      }

      .optimized-image-container img.error {
        display: none;
      }

      .image-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
      }

      .image-error {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--color-surface);
        color: var(--color-text-muted);
        font-size: var(--font-size-2);
        z-index: 2;
      }

      .error-icon {
        font-size: 2rem;
        margin-bottom: var(--space-2);
      }

      .image-placeholder {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        transition: opacity 0.3s ease;
      }

      .optimized-image-container img.loaded + .image-placeholder {
        opacity: 0;
      }

      /* Responsive image sizes */
      @media (max-width: 768px) {
        .optimized-image-container {
          border-radius: var(--radius-2);
        }
      }
    `,
  ],
})
export class OptimizedImageComponent {
  src = input<string>('');
  alt = input<string>('');
  width = input<number>(400);
  height = input<number>(300);
  objectFit = input<'cover' | 'contain' | 'fill'>('cover');
  placeholder = input<string>('');
  placeholderBlur = input<boolean>(true);
  lazy = input<boolean>(true);

  // Internal state
  private _isLoaded = signal(false);
  private _hasError = signal(false);
  private _isLoading = signal(true);

  // Computed properties
  isLoaded = computed(() => this._isLoaded());
  hasError = computed(() => this._hasError());
  isLoading = computed(() => this._isLoading());
  aspectRatio = computed(() => `${this.width()} / ${this.height()}`);

  // Generate optimized image URLs
  currentSrc = computed(() => {
    if (!this.src()) return '';

    // Check if WebP is supported
    const supportsWebP = this.checkWebPSupport();
    const extension = supportsWebP ? 'webp' : this.getFileExtension(this.src());

    // Generate different sizes for responsive images
    return this.generateImageUrl(this.src(), extension, this.width());
  });

  srcset = computed(() => {
    if (!this.src()) return '';

    const supportsWebP = this.checkWebPSupport();
    const extension = supportsWebP ? 'webp' : this.getFileExtension(this.src());

    // Generate srcset for different screen sizes
    const sizes = [320, 640, 960, 1280, 1920];
    return sizes
      .filter((size) => size <= this.width() * 2) // Don't generate unnecessarily large images
      .map((size) => `${this.generateImageUrl(this.src(), extension, size)} ${size}w`)
      .join(', ');
  });

  sizes = computed(() => {
    // Responsive sizes based on viewport
    return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
  });

  // Event handlers
  onImageLoad(): void {
    this._isLoaded.set(true);
    this._isLoading.set(false);
  }

  onImageError(): void {
    this._hasError.set(true);
    this._isLoading.set(false);
  }

  // Utility methods
  private checkWebPSupport(): boolean {
    // Simple WebP support detection
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private getFileExtension(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'jpg';
  }

  private generateImageUrl(baseUrl: string, extension: string, width: number): string {
    // In a real application, this would connect to an image CDN or service
    // For now, we'll simulate image optimization

    if (!baseUrl) return '';

    // Remove existing extension and add new one
    const urlWithoutExt = baseUrl.replace(/\.[^/.]+$/, '');

    // Add size and quality parameters
    const quality = width <= 640 ? 80 : 60; // Higher quality for smaller images

    return `${urlWithoutExt}_${width}w_q${quality}.${extension}`;
  }
}

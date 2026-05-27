import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';

@Component({
  selector: 'app-optimized-image',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="optimized-image-container" [style.aspect-ratio]="aspectRatio()">
      <!-- Loading State -->
      <div *ngIf="isLoading()" class="image-loading">
        <mat-progress-spinner diameter="30" mode="indeterminate"></mat-progress-spinner>
      </div>

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
        (error)="onImageError($event)"
        [class.loaded]="isLoaded()"
        [class.error]="hasError()"
        loading="lazy"
        decoding="async"
      />

      <!-- Error State -->
      <div *ngIf="hasError()" class="image-error">
        <span class="error-icon">🖼️</span>
        <span class="error-text">Rasm yuklanmadi</span>
      </div>

      <!-- Low Quality Placeholder (LQIP) -->
      <div
        *ngIf="placeholder() && !isLoaded()"
        class="image-placeholder"
        [style.background-image]="'url(' + placeholder() + ')'"
        [style.filter]="placeholderBlur() ? 'blur(10px)' : 'none'"
      ></div>
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

  private _isLoaded = signal(false);
  private _hasError = signal(false);
  private _isLoading = signal(true);

  private imageOptimizationService = inject(ImageOptimizationService);

  isLoaded = computed(() => this._isLoaded());
  hasError = computed(() => this._hasError());
  isLoading = computed(() => this._isLoading());
  aspectRatio = computed(() => `${this.width()} / ${this.height()}`);

  currentSrc = computed(() => {
    return this.imageOptimizationService.getOptimizedImage(this.src(), this.width(), this.height());
  });

  srcset = computed(() => {
    return this.imageOptimizationService.generateSrcset(this.src());
  });

  sizes = computed(() => {
    return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
  });

  onImageLoad(): void {
    this._isLoaded.set(true);
    this._isLoading.set(false);
  }

  onImageError(event?: Event): void {
    this._hasError.set(true);
    this._isLoading.set(false);

    if (event && event.target) {
      this._isLoaded.set(false);
      this._hasError.set(false);
      const img = event.target as HTMLImageElement;
      img.src = `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=400&auto=format&fit=crop`;
    }
  }

  private checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type SkeletonType = 'card' | 'detail' | 'text' | 'avatar' | 'title';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" [ngClass]="type">
      @if (type === 'card') {
        <div class="skeleton-media pulse"></div>
        <div class="skeleton-content">
          <div class="skeleton-line title pulse"></div>
          <div class="skeleton-line pulse"></div>
          <div class="skeleton-line short pulse"></div>
          <div class="skeleton-footer">
            <div class="skeleton-box pulse"></div>
            <div class="skeleton-box small pulse"></div>
          </div>
        </div>
      } @else if (type === 'detail') {
        <div class="skeleton-header pulse"></div>
        <div class="skeleton-gallery">
          <div class="skeleton-gallery-main pulse"></div>
          <div class="skeleton-gallery-side">
            <div class="skeleton-gallery-small pulse"></div>
            <div class="skeleton-gallery-small pulse"></div>
          </div>
        </div>
        <div class="skeleton-content-large mt-6">
          <div class="skeleton-line title large pulse"></div>
          <div class="skeleton-line pulse"></div>
          <div class="skeleton-line pulse"></div>
          <div class="skeleton-line short pulse"></div>
        </div>
      } @else if (type === 'avatar') {
        <div class="skeleton-avatar pulse" [style.width]="width" [style.height]="height"></div>
      } @else if (type === 'title') {
        <div class="skeleton-line title pulse" [style.width]="width" [style.height]="height"></div>
      } @else {
        <div class="skeleton-line pulse" [style.width]="width" [style.height]="height"></div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .pulse {
        background: linear-gradient(
          90deg,
          var(--color-surface-elevated) 0%,
          var(--color-border) 50%,
          var(--color-surface-elevated) 100%
        );
        background-size: 200% 100%;
        animation: pulseAnimation 1.5s infinite ease-in-out;
        border-radius: 8px;
      }

      @keyframes pulseAnimation {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* Card Type */
      .card {
        background: var(--color-surface);
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid var(--color-border);
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 420px;
      }
      .skeleton-media {
        height: 240px;
        width: 100%;
        border-radius: 0;
      }
      .skeleton-content {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1;
      }
      .skeleton-line {
        height: 16px;
        width: 100%;
      }
      .skeleton-line.title {
        height: 24px;
        width: 80%;
        margin-bottom: 8px;
      }
      .skeleton-line.short {
        width: 50%;
      }
      .skeleton-footer {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        padding-top: 16px;
        border-top: 1px dashed var(--color-border);
      }
      .skeleton-box {
        height: 24px;
        width: 100px;
      }
      .skeleton-box.small {
        width: 60px;
        border-radius: 20px;
      }

      /* Detail Type */
      .detail {
        width: 100%;
      }
      .skeleton-header {
        height: 40px;
        width: 40%;
        margin-bottom: 24px;
      }
      .skeleton-gallery {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 16px;
        height: 400px;
      }
      .skeleton-gallery-main {
        height: 100%;
        border-radius: 24px;
      }
      .skeleton-gallery-side {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .skeleton-gallery-small {
        height: calc(50% - 8px);
        border-radius: 24px;
      }
      .skeleton-content-large {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .skeleton-line.large {
        height: 32px;
        width: 60%;
        margin-bottom: 16px;
      }

      /* Avatar */
      .skeleton-avatar {
        border-radius: 50%;
        width: 48px;
        height: 48px;
      }
      
      .mt-6 {
        margin-top: 24px;
      }
    `,
  ],
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() width?: string;
  @Input() height?: string;
}

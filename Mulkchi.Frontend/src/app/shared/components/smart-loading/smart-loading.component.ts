import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-smart-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="smart-loading" [class]="variant()" [class.full-screen]="fullScreen()">
      <!-- Skeleton Loading -->
      @if (type() === 'skeleton') {
        <div class="skeleton-container">
          @for (item of skeletonItems(); track item) {
            <div class="skeleton-item">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-content">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line subtitle"></div>
                <div class="skeleton-line text"></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Spinner Loading -->
      @if (type() === 'spinner') {
        <div class="spinner-container">
          <mat-progress-spinner
            [diameter]="spinnerSize()"
            mode="indeterminate"
            [color]="spinnerColor()"
          >
          </mat-progress-spinner>
          @if (message()) {
            <p class="loading-message">{{ message() }}</p>
          }
        </div>
      }

      <!-- Progress Bar Loading -->
      @if (type() === 'progress' && progress() !== undefined) {
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="progress()"></div>
          </div>
          @if (message()) {
            <p class="progress-message">{{ message() }} ({{ progress() }}%)</p>
          }
        </div>
      }

      <!-- Pulse Loading -->
      @if (type() === 'pulse') {
        <div class="pulse-container">
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
          @if (message()) {
            <p class="pulse-message">{{ message() }}</p>
          }
        </div>
      }

      <!-- Empty State -->
      @if (type() === 'empty') {
        <div class="empty-state">
          <mat-icon>{{ emptyIcon() }}</mat-icon>
          <h3>{{ emptyTitle() }}</h3>
          <p>{{ emptyMessage() }}</p>
          @if (actionText()) {
            <button mat-button (click)="onAction.emit()">
              <mat-icon>{{ actionIcon() }}</mat-icon>
              {{ actionText() }}
            </button>
          }
        </div>
      }

      <!-- Error State -->
      @if (type() === 'error') {
        <div class="error-state">
          <mat-icon color="warn">error</mat-icon>
          <h3>Xatolik yuz berdi</h3>
          <p>{{ errorMessage() }}</p>
          <button mat-button (click)="onRetry.emit()">
            <mat-icon>refresh</mat-icon>
            Qayta urinish
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .smart-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-6);
        min-height: 200px;
      }

      .smart-loading.full-screen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        z-index: 9999;
      }

      /* Skeleton Loading */
      .skeleton-container {
        width: 100%;
        max-width: 600px;
      }

      .skeleton-item {
        display: flex;
        gap: var(--space-3);
        margin-bottom: var(--space-4);
        padding: var(--space-4);
        background: var(--color-surface-elevated);
        border-radius: var(--radius-3);
      }

      .skeleton-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-content {
        flex: 1;
      }

      .skeleton-line {
        height: 16px;
        border-radius: var(--radius-1);
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        margin-bottom: var(--space-2);
      }

      .skeleton-line.title {
        width: 60%;
        height: 20px;
      }

      .skeleton-line.subtitle {
        width: 40%;
        height: 16px;
      }

      .skeleton-line.text {
        width: 80%;
        height: 14px;
      }

      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }

      /* Spinner Loading */
      .spinner-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
      }

      .loading-message {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: var(--font-size-2);
        text-align: center;
      }

      /* Progress Bar */
      .progress-container {
        width: 100%;
        max-width: 400px;
      }

      .progress-bar {
        height: 8px;
        background: var(--color-border-soft);
        border-radius: var(--radius-round);
        overflow: hidden;
        margin-bottom: var(--space-3);
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-brand-500), var(--color-brand-600));
        border-radius: var(--radius-round);
        transition: width 0.3s ease;
      }

      .progress-message {
        margin: 0;
        text-align: center;
        color: var(--color-text-secondary);
        font-size: var(--font-size-2);
      }

      /* Pulse Loading */
      .pulse-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
      }

      .pulse-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--color-brand-600);
        margin: 0 4px;
        animation: pulse 1.4s ease-in-out infinite both;
      }

      .pulse-dot:nth-child(1) {
        animation-delay: -0.32s;
      }
      .pulse-dot:nth-child(2) {
        animation-delay: -0.16s;
      }
      .pulse-dot:nth-child(3) {
        animation-delay: 0;
      }

      @keyframes pulse {
        0%,
        80%,
        100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .pulse-message {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: var(--font-size-2);
        text-align: center;
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        color: var(--color-text-secondary);
      }

      .empty-state mat-icon {
        font-size: 4rem;
        width: 4rem;
        height: 4rem;
        color: var(--color-text-muted);
        margin-bottom: var(--space-4);
      }

      .empty-state h3 {
        margin: 0 0 var(--space-2) 0;
        color: var(--color-text-primary);
        font-size: var(--font-size-5);
      }

      .empty-state p {
        margin: 0 0 var(--space-4) 0;
        line-height: var(--line-height-relaxed);
      }

      /* Error State */
      .error-state {
        text-align: center;
        color: var(--color-error-600);
      }

      .error-state mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        margin-bottom: var(--space-3);
      }

      .error-state h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-size-5);
      }

      .error-state p {
        margin: 0 0 var(--space-4) 0;
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      }

      /* Mobile Optimizations */
      @media (max-width: 768px) {
        .smart-loading {
          padding: var(--spacing-mobile);
          min-height: 150px;
        }

        .skeleton-item {
          padding: var(--spacing-mobile);
        }

        .loading-message,
        .progress-message,
        .pulse-message {
          font-size: var(--font-size-3);
        }

        .empty-state mat-icon,
        .error-state mat-icon {
          font-size: 3rem;
          width: 3rem;
          height: 3rem;
        }
      }
    `,
  ],
})
export class SmartLoadingComponent {
  // Inputs converted to Angular signals (input())
  type = input<'skeleton' | 'spinner' | 'progress' | 'pulse' | 'empty' | 'error'>('spinner');
  variant = input<'default' | 'compact' | 'large'>('default');
  message = input<string>('');
  progress = input<number>(0);
  fullScreen = input<boolean>(false);
  skeletonItemsCount = input<number>(3);
  spinnerSize = input<number>(40);
  spinnerColor = input<'primary' | 'accent' | 'warn'>('primary');
  emptyIcon = input<string>('inbox');
  emptyTitle = input<string>("Ma'lumot topilmadi");
  emptyMessage = input<string>("Bu yerda hozircha hech narsa yo'q");
  errorMessage = input<string>("Ma'lumotlarni yuklashda xatolik");
  actionText = input<string>('');
  actionIcon = input<string>('add');

  // Only keep computed for derived/complex values
  protected skeletonItemsArray = computed(() => Array.from({ length: this.skeletonItemsCount() }));

  // Adapter for template compatibility: keep `skeletonItems()` call in template working
  protected skeletonItems = computed(() => this.skeletonItemsArray());

  @Output() onAction = new EventEmitter<void>();
  @Output() onRetry = new EventEmitter<void>();
}

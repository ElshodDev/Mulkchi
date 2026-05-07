import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-top-loading-bar',
  standalone: true,
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-bar-shell" aria-hidden="true">
        <div class="loading-bar"></div>
      </div>
    }
  `,
  styles: [
    `
      .loading-bar-shell {
        position: fixed;
        inset: 0 0 auto;
        z-index: var(--z-toast);
        height: 3px;
        overflow: hidden;
        pointer-events: none;
      }

      .loading-bar {
        width: 40%;
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(
          90deg,
          var(--color-brand-500),
          var(--color-accent-500)
        );
        box-shadow: 0 0 24px rgba(14, 116, 144, 0.35);
        animation: loading-slide 1.1s ease-in-out infinite;
      }

      @keyframes loading-slide {
        0% {
          transform: translateX(-120%);
        }

        50% {
          transform: translateX(140%);
        }

        100% {
          transform: translateX(280%);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopLoadingBarComponent {
  protected readonly loadingService = inject(LoadingService);
}

import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

declare global {
  interface Window {
    __googleInitialized?: boolean;
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: string;
            },
          ) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="google-login">
      @if (isLoading()) {
        <button mat-stroked-button type="button" disabled class="google-fallback">
          <mat-icon>hourglass_empty</mat-icon>
          <span>Google bilan davom etish</span>
        </button>
      }

      <div #googleButtonContainer class="google-slot" [class.hidden]="isLoading()"></div>
    </div>
  `,
  styles: [
    `
      .google-login,
      .google-slot {
        display: grid;
        width: 100%;
      }

      .google-fallback {
        justify-content: center;
        gap: var(--space-2);
        width: 100%;
        min-height: 48px;
        border-radius: var(--radius-round) !important;
      }

      .google-slot.hidden {
        display: none;
      }

      :host ::ng-deep .google-slot iframe {
        width: 100% !important;
        border-radius: var(--radius-round);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleLoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly googleClientId = environment.googleClientId;
  protected readonly isLoading = signal(true);
  private readonly googleButtonContainer = viewChild.required<ElementRef<HTMLElement>>('googleButtonContainer');

  constructor() {
    afterNextRender(() => {
      if (!this.googleClientId) {
        this.isLoading.set(false);
        return;
      }

      this.loadGoogleScript();
    });
  }

  private loadGoogleScript(): void {
    if (document.getElementById('google-identity-script')) {
      this.initializeAndRender();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initializeAndRender();
    script.onerror = () => {
      this.isLoading.set(false);
      this.toastService.warning('Google login vaqtincha yuklanmadi.');
    };
    document.head.appendChild(script);
  }

  private initializeAndRender(): void {
    if (!window.google?.accounts?.id || !this.googleClientId) {
      this.isLoading.set(false);
      return;
    }

    if (!window.__googleInitialized) {
      window.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: (response) => this.handleGoogleResponse(response),
      });
      window.__googleInitialized = true;
    }

    window.google.accounts.id.renderButton(this.googleButtonContainer().nativeElement, {
      theme: 'outline',
      size: 'large',
      width: '100%',
    });

    this.isLoading.set(false);
  }

  private handleGoogleResponse(response: { credential: string }): void {
    if (!response.credential) {
      this.toastService.warning('Google orqali kirish bekor qilindi.');
      return;
    }

    this.authService.googleLogin(response.credential).subscribe({
      next: () => {
        this.toastService.success('Google orqali muvaffaqiyatli kirdingiz.');
        void this.router.navigate(['/']);
      },
      error: (error) => {
        const message = error.error?.message || error.message || 'Google login bajarilmadi.';
        this.toastService.error(message);
      },
    });
  }
}

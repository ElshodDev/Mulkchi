import { Component, ViewChild, ElementRef, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

declare global {
  interface Window {
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
            }
          ) => void;
        };
      };
    };
  }
}

// Global flag to track initialization across component instances
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
            }
          ) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="google-login-container">
      <div *ngIf="isLoading()" class="loading-wrapper">
        <button mat-stroked-button disabled class="google-btn">
          <mat-icon>hourglass_empty</mat-icon>
          <span>Google bilan davom etish</span>
        </button>
      </div>
      <div #googleButtonContainer class="google-button-wrapper" [class.hidden]="isLoading()"></div>
    </div>
  `,
  styles: [`
    .google-login-container {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    
    .loading-wrapper {
      width: 100%;
    }
    
    .google-button-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
    }
    
    .google-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border: 1px solid #dadce0;
      background: white;
      color: #3c4043;
      font-size: 14px;
      font-weight: 500;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .google-btn:hover {
      background: #f8f9fa;
    }
    
    .google-btn mat-icon {
      color: #4285f4;
    }
    
    :host ::ng-deep .google-button-wrapper iframe {
      width: 100% !important;
    }
    
    .google-button-wrapper.hidden {
      display: none;
    }
  `]
})
export class GoogleLoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  isLoading = signal(true);
  
  @ViewChild('googleButtonContainer') googleButtonContainer!: ElementRef;
  
  ngOnInit(): void {
    this.loadGoogleScript();
  }
  
  private loadGoogleScript(): void {
    // Check if script is already loaded globally
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
      this.snackBar.open('Google login yuklanmadi', 'Yopish', { duration: 3000 });
    };
    document.head.appendChild(script);
  }
  
  private initializeAndRender(): void {
    if (!window.google?.accounts?.id) {
      this.isLoading.set(false);
      return;
    }
    
    const clientId = '875022387846-46rckl1kpnk2hujvd53nasu9dr4v3i2k.apps.googleusercontent.com';
    
    // Initialize only once globally
    if (!window.__googleInitialized) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => this.handleGoogleResponse(response)
        });
        window.__googleInitialized = true;
        console.log('[GoogleLogin] GSI initialized successfully');
      } catch (error) {
        console.error('[GoogleLogin] GSI initialization error:', error);
      }
    }
    
    // Render button
    const container = this.googleButtonContainer?.nativeElement;
    if (container) {
      window.google?.accounts?.id.renderButton(container, {
        theme: 'outline',
        size: 'large'
      });
      this.isLoading.set(false);
    }
  }
  
  private handleGoogleResponse(response: { credential: string }): void {
    if (!response.credential) {
      this.snackBar.open('Google orqali kirish bekor qilindi', 'Yopish', { duration: 3000 });
      return;
    }
    
    this.authService.googleLogin(response.credential).subscribe({
      next: (authResponse) => {
        console.log('[GoogleLogin] Login success, token:', authResponse.token ? 'present' : 'missing');
        this.snackBar.open('Google orqali muvaffaqiyatli kirdingiz!', 'Yopish', { duration: 3000 });
        // Small delay to ensure token is saved before navigation
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 100);
      },
      error: (err) => {
        console.error('[GoogleLogin] Login error:', err);
        const message = err.error?.message || err.message || 'Google orqali kirishda xatolik';
        this.snackBar.open(message, 'Yopish', { duration: 5000 });
      }
    });
  }
}

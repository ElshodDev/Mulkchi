import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleLoginComponent } from '../../../shared/components/google-login/google-login.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    GoogleLoginComponent
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Tizimga kirish</mat-card-title>
          <mat-card-subtitle>Akkauntingizga kiring</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-field">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" placeholder="email@example.com">
                <mat-icon matPrefix>email</mat-icon>
                @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                  <mat-error>
                    @if (loginForm.get('email')?.hasError('required')) {
                      Email kiritilishi shart
                    } @else if (loginForm.get('email')?.hasError('email')) {
                      Noto'g'ri email format
                    }
                  </mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-field">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Parol</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password">
                <mat-icon matPrefix>lock</mat-icon>
                <button mat-icon-button matSuffix type="button" (click)="togglePasswordVisibility()">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                  <mat-error>Parol kiritilishi shart</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-options">
              <mat-checkbox formControlName="rememberMe">Meni eslab qolish</mat-checkbox>
              <a mat-button color="primary" routerLink="/auth/forgot-password">Parolni unutdingizmi?</a>
            </div>

            @if (errorMessage()) {
              <div class="error-alert">
                <mat-icon color="warn">error</mat-icon>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              class="full-width submit-btn"
              [disabled]="loginForm.invalid || isLoading()">
              @if (isLoading()) {
                <mat-progress-spinner diameter="20" class="inline-spinner"></mat-progress-spinner>
                <span>Kirish...</span>
              } @else {
                <span>Kirish</span>
              }
            </button>

            <!-- Google Login -->
            <div class="divider">
              <span>yoki</span>
            </div>

            @if (googleClientId) {
              <app-google-login></app-google-login>
            }
          </form>
        </mat-card-content>

        <mat-card-actions class="login-actions">
          <p>Akkauntingiz yo'qmi? <a mat-button color="primary" routerLink="/auth/register">Ro'yxatdan o'tish</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    /* ===== CSS Variables ===== */
    :host {
      --color-navy: #1B3A6B;
      --color-navy-light: #2a4a7c;
      --color-gold: #C9A84C;
      --color-gold-light: #d4b86a;
      --color-white: #ffffff;
      --color-gray-50: #f8fafc;
      --color-gray-100: #f1f5f9;
      --color-gray-200: #e2e8f0;
      --color-gray-400: #94a3b8;
      --color-gray-500: #64748b;
      --color-gray-600: #475569;
      --color-gray-900: #0f172a;
      --radius: 8px;
      --radius-lg: 12px;
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }

    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 40px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
    }

    mat-card-header {
      text-align: center;
      display: block;
      margin-bottom: 32px;
    }

    mat-card-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--color-navy);
      margin-bottom: 8px;
    }

    mat-card-subtitle {
      font-size: 1rem;
      color: var(--color-gray-500);
    }

    .full-width {
      width: 100%;
    }

    .form-field {
      margin-bottom: 20px;
    }

    ::ng-deep .mat-mdc-form-field-focus-overlay {
      background-color: var(--color-navy) !important;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: var(--color-gray-50);
    }

    ::ng-deep .mdc-text-field--focused .mdc-floating-label {
      color: var(--color-navy) !important;
    }

    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined .mdc-notched-outline__trailing {
      border-color: var(--color-gray-200) !important;
    }

    ::ng-deep .mdc-text-field--focused .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--focused .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: var(--color-navy) !important;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 8px;
    }

    ::ng-deep .mat-mdc-checkbox .mdc-checkbox__native-control:checked ~ .mdc-checkbox__background {
      background-color: var(--color-navy) !important;
      border-color: var(--color-navy) !important;
    }

    ::ng-deep .mat-mdc-checkbox .mdc-checkbox__ripple {
      background: var(--color-navy) !important;
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fef2f2;
      color: #dc2626;
      padding: 14px 16px;
      border-radius: var(--radius);
      margin-bottom: 20px;
      font-size: 0.95rem;
    }

    .submit-btn {
      height: 52px;
      font-size: 1.125rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--color-navy) !important;
      border-radius: var(--radius) !important;
      transition: all 0.3s ease;
    }

    .submit-btn:hover:not([disabled]) {
      background: var(--color-navy-light) !important;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .submit-btn:disabled {
      background: var(--color-gray-400) !important;
    }

    .inline-spinner {
      display: inline-block;
    }

    ::ng-deep .mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle,
    ::ng-deep .mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic {
      stroke: var(--color-gold) !important;
    }

    .login-actions {
      justify-content: center;
      padding-top: 24px;
    }

    .login-actions p {
      margin: 0;
      color: var(--color-gray-600);
      font-size: 0.95rem;
    }

    .login-actions a {
      color: var(--color-navy) !important;
      font-weight: 500;
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 24px 0;
      color: var(--color-gray-400);
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .divider span {
      padding: 0 16px;
      font-size: 0.875rem;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 24px;
      }

      mat-card-title {
        font-size: 1.5rem;
      }

      .form-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .submit-btn {
        height: 48px;
        font-size: 1rem;
      }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  // Expose google client ID from environment to template
  readonly googleClientId = environment.googleClientId;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  hidePassword = signal(true);

  private returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({
      email: email!,
      password: password!
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Muvaffaqiyatli kirdingiz!', 'Yopish', { duration: 3000 });
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigate([returnUrl]);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Login qilishda xatolik yuz berdi');
      }
    });
  }
}

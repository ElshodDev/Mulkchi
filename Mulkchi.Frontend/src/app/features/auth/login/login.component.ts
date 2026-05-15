import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { GoogleLoginComponent } from '../../../shared/components/google-login/google-login.component';
import { TelegramLoginComponent } from '../telegram-login/telegram-login.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    GoogleLoginComponent,
    TelegramLoginComponent,
  ],
  template: `
    <section class="auth-shell">
      <div class="auth-shell__content">
        <aside class="auth-shell__panel">
          <div class="brand-pulse"></div>
          <span class="eyebrow">Mulkchi</span>
          <h1>Uy topish jarayonini xotirjam qilamiz</h1>
          <p>Bron, xabarlar va tavsiyalar bitta joyda. Kirib, sizga mos ijarani davom ettiramiz.</p>

          <div class="feature-list">
            <div>
              <mat-icon>verified_user</mat-icon>
              <span>Tasdiqlangan e'lonlar va mezbonlar</span>
            </div>
            <div>
              <mat-icon>bolt</mat-icon>
              <span>Tezkor booking va javoblar</span>
            </div>
            <div>
              <mat-icon>insights</mat-icon>
              <span>AI tavsiya va narx tahlili</span>
            </div>
          </div>
        </aside>

        <div class="auth-card surface-card">
          <div class="auth-card__header">
            <span class="eyebrow eyebrow--secondary">Kirish yoki Ro'yxatdan o'tish</span>
            <h2>Xush kelibsiz</h2>
            <p>Hisobingizga kiring va davom eting.</p>
          </div>

          <!-- STEP 1: EMAIL INPUT -->
          @if (step() === 1) {
            <form [formGroup]="emailForm" class="auth-form" (ngSubmit)="onEmailSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input
                  matInput
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  placeholder="email@example.com"
                />
                <mat-icon matPrefix>mail</mat-icon>
                @if (shouldShowEmailError()) {
                  <mat-error>Email formati to'g'ri emas.</mat-error>
                }
              </mat-form-field>

              @if (errorMessage()) {
                <div class="form-alert form-alert--error">
                  <mat-icon>error</mat-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <button
                mat-flat-button
                type="submit"
                class="submit-button"
                [disabled]="isLoading()"
              >
                @if (isLoading()) {
                  <mat-progress-spinner diameter="18" mode="indeterminate"></mat-progress-spinner>
                  <span>Kutib turing...</span>
                } @else {
                  <span>Davom etish</span>
                }
              </button>

              @if (googleClientId) {
                <div class="separator"><span>yoki</span></div>
                <app-google-login />
              }

              <div class="separator"><span>yoki</span></div>
              <app-telegram-login actionText="Telegram orqali" />
            </form>
          }

          <!-- STEP 2: OTP INPUT -->
          @if (step() === 2) {
            <form [formGroup]="otpForm" class="auth-form" (ngSubmit)="onOtpSubmit()">
              <div class="otp-header">
                <p><strong>{{ emailForm.get('email')?.value }}</strong> pochtasiga 6 xonali tasdiqlash kodi yubordik.</p>
                <button type="button" mat-button color="primary" (click)="step.set(1)">Emailni o'zgartirish</button>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Tasdiqlash kodi</mat-label>
                <input
                  matInput
                  type="text"
                  formControlName="code"
                  autocomplete="one-time-code"
                  placeholder="123456"
                  maxlength="6"
                />
                <mat-icon matPrefix>password</mat-icon>
              </mat-form-field>

              @if (errorMessage()) {
                <div class="form-alert form-alert--error">
                  <mat-icon>error</mat-icon>
                  <span>{{ errorMessage() }}</span>
                </div>
              }

              <button
                mat-flat-button
                type="submit"
                class="submit-button"
                [disabled]="isLoading() || otpForm.invalid"
              >
                @if (isLoading()) {
                  <mat-progress-spinner diameter="18" mode="indeterminate"></mat-progress-spinner>
                  <span>Tekshirilmoqda...</span>
                } @else {
                  <span>Tasdiqlash</span>
                }
              </button>
            </form>
          }
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .auth-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: clamp(var(--space-4), 4vw, var(--space-6));
      }

      .auth-shell__content {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(22rem, 30rem);
        width: min(100%, 72rem);
        overflow: hidden;
        border-radius: 2rem;
        background: color-mix(in srgb, var(--color-surface-elevated) 88%, transparent);
        box-shadow: var(--shadow-xl);
      }

      .auth-shell__panel,
      .auth-card {
        position: relative;
        padding: clamp(var(--space-6), 5vw, var(--space-8));
      }

      .auth-shell__panel {
        display: grid;
        align-content: center;
        gap: var(--space-5);
        min-height: 42rem;
        background:
          linear-gradient(160deg, rgba(15, 118, 110, 0.94), rgba(15, 23, 42, 0.92)),
          var(--color-surface-inverse);
        color: white;
      }

      .brand-pulse {
        position: absolute;
        inset: auto auto 10% -10%;
        width: 18rem;
        height: 18rem;
        border-radius: var(--radius-round);
        background: rgba(245, 158, 11, 0.18);
        filter: blur(18px);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        min-height: 2rem;
        padding: 0 var(--space-3);
        border-radius: var(--radius-round);
        background: rgba(255, 255, 255, 0.14);
        font-size: var(--font-size-2);
        font-weight: var(--font-weight-semibold);
      }

      .eyebrow--secondary {
        background: rgba(15, 118, 110, 0.1);
        color: var(--color-brand-600);
      }

      h1,
      h2 {
        margin: 0;
      }

      h1 {
        font-size: clamp(2.25rem, 4vw, 3.5rem);
        line-height: var(--line-height-tight);
      }

      .auth-shell__panel p,
      .auth-card__header p {
        margin: 0;
        color: color-mix(in srgb, currentColor 78%, transparent);
        line-height: var(--line-height-relaxed);
      }

      .feature-list {
        display: grid;
        gap: var(--space-3);
      }

      .feature-list div {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        min-height: 3rem;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-3);
        background: rgba(255, 255, 255, 0.1);
      }

      .auth-card {
        display: grid;
        gap: var(--space-5);
        background: var(--color-surface-elevated);
      }

      .auth-card__header {
        display: grid;
        gap: var(--space-2);
      }

      .auth-form {
        display: grid;
        gap: var(--space-4);
      }

      .submit-button {
        gap: var(--space-2);
        min-height: 52px;
        background: linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700));
        color: white !important;
      }
      
      .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .form-alert {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-3);
        font-size: var(--font-size-2);
      }

      .form-alert--error {
        background: rgba(220, 38, 38, 0.08);
        color: var(--color-danger-600);
      }

      .separator {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-muted);
        font-size: var(--font-size-2);
      }

      .separator::before {
        content: '';
        position: absolute;
        inset: 50% 0 auto;
        border-top: 1px solid var(--color-border-soft);
      }

      .separator span {
        position: relative;
        padding: 0 var(--space-3);
        background: var(--color-surface-elevated);
      }

      .otp-header {
        font-size: var(--font-size-2);
        color: var(--color-text-secondary);
        margin-bottom: var(--space-2);
      }

      @media (max-width: 900px) {
        .auth-shell__content {
          grid-template-columns: 1fr;
        }

        .auth-shell__panel {
          min-height: auto;
        }
      }

      @media (max-width: 640px) {
        .auth-shell__panel {
          gap: var(--space-4);
        }

        .feature-list {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly googleClientId = environment.googleClientId;
  
  protected readonly step = signal<1 | 2>(1);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly currentSessionId = signal<string | null>(null);

  protected readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  protected async onEmailSubmit(): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const email = this.emailForm.getRawValue().email;
      const response = await firstValueFrom(this.authStore.sendEmailCode(email));
      
      this.currentSessionId.set(response.sessionId);
      this.step.set(2);
      this.toastService.success('Tasdiqlash kodi yuborildi!');
    } catch (error: unknown) {
      const err = error as { error?: { error?: { message?: string }; message?: string } };
      const message = err.error?.error?.message || err.error?.message || 'Kod yuborishda xatolik yuz berdi.';
      this.errorMessage.set(message);

      // Agar xatolik ichida kod bo'lsa (DEV rejim), "Sehrli" kirishni amalga oshiramiz
      if (message.includes('DEV REJIM UCHUN KOD:')) {
        const sessionIdMatch = message.match(/SESSION: ([\w-]+)/);
        const codeMatch = message.match(/KOD: (\d+)/);
        
        if (sessionIdMatch && codeMatch) {
          this.currentSessionId.set(sessionIdMatch[1]);
          this.otpForm.patchValue({ code: codeMatch[1] });
          this.step.set(2);
          
          // 1 soniyadan keyin avtomatik tasdiqlash (foydalanuvchi nima bo'lganini ko'rib ulgurishi uchun)
          setTimeout(() => this.onOtpSubmit(), 1000);
        }
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async onOtpSubmit(): Promise<void> {
    if (this.otpForm.invalid || !this.currentSessionId()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const email = this.emailForm.getRawValue().email;
      const code = this.otpForm.getRawValue().code;
      const sessionId = this.currentSessionId()!;

      await firstValueFrom(this.authStore.verifyEmailCode(email, sessionId, code));
      this.toastService.success('Muvaffaqiyatli kirdingiz.');

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
      await this.router.navigateByUrl(returnUrl);
    } catch (error: unknown) {
      const message =
        (error as { error?: { message?: string } })?.error?.message ||
        'Kod xato yoki eskirgan.';
      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected shouldShowEmailError(): boolean {
    const control = this.emailForm.controls.email;
    return control.invalid && (control.touched || control.dirty);
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
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
            <span class="eyebrow eyebrow--secondary">Kirish</span>
            <h2>Xush kelibsiz</h2>
            <p>Hisobingizga kiring va davom eting.</p>
          </div>

          <form [formGroup]="loginForm" class="auth-form" (ngSubmit)="onSubmit()">
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
              @if (shouldShowError('email')) {
                <mat-error>{{ emailErrorMessage() }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Parol</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
                placeholder="Parolingiz"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                [attr.aria-label]="hidePassword() ? 'Parolni ko‘rsatish' : 'Parolni yashirish'"
                (click)="togglePasswordVisibility()"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (shouldShowError('password')) {
                <mat-error>Iltimos, parolingizni kiriting.</mat-error>
              }
            </mat-form-field>

            <div class="auth-form__row">
              <mat-checkbox formControlName="rememberMe">Eslab qolish</mat-checkbox>
              <a routerLink="/auth/forgot-password">Parolni unutdingizmi?</a>
            </div>

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
              [disabled]="submitDisabled()"
            >
              @if (isLoading()) {
                <mat-progress-spinner diameter="18" mode="indeterminate"></mat-progress-spinner>
                <span>Kiryapmiz...</span>
              } @else {
                <span>Kirish</span>
              }
            </button>

            @if (googleClientId) {
              <div class="separator"><span>yoki</span></div>
              <app-google-login />
            }

            <div class="separator"><span>yoki</span></div>

            <!-- Telegram orqali kirish -->
            <app-telegram-login />
          </form>

          <p class="auth-card__footer">
            Hisobingiz yo'qmi?
            <a routerLink="/auth/register">Ro'yxatdan o'tish</a>
          </p>
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

      .auth-form__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
        color: var(--color-text-secondary);
        font-size: var(--font-size-2);
      }

      .auth-form__row a,
      .auth-card__footer a {
        color: var(--color-brand-600);
        font-weight: var(--font-weight-semibold);
      }

      .submit-button {
        gap: var(--space-2);
        min-height: 52px;
        background: linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700));
        color: white !important;
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

      .auth-card__footer {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: var(--font-size-2);
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
  protected readonly hidePassword = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  protected readonly submitDisabled = computed(() => this.isLoading());

  protected async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const { email, password } = this.loginForm.getRawValue();

      await firstValueFrom(this.authStore.login({ email, password }));
      this.toastService.success('Muvaffaqiyatli kirdingiz.');

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
      await this.router.navigateByUrl(returnUrl);
    } catch (error: unknown) {
      const message =
        (error as { error?: { message?: string } })?.error?.message ||
        'Kirish vaqtida xatolik yuz berdi.';

      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected shouldShowError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  protected emailErrorMessage(): string {
    const emailControl = this.loginForm.controls.email;

    if (emailControl.hasError('required')) {
      return 'Iltimos, emailingizni kiriting.';
    }

    return "Email formati to'g'ri emas.";
  }
}

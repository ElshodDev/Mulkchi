import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { GoogleLoginComponent } from '../../../shared/components/google-login/google-login.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    GoogleLoginComponent,
  ],
  template: `
    <section class="register-shell">
      <div class="register-shell__content">
        <div class="register-card surface-card">
          <div class="register-card__header">
            <span class="eyebrow">Yangi hisob</span>
            <h1>Bir necha qadamda boshlaymiz</h1>
            <p>E'lonlar, xabarlar va bronlaringiz bir joyda boshqariladi.</p>
          </div>

          @if (googleClientId) {
            <app-google-login />
            <div class="separator"><span>yoki email orqali</span></div>
          }

          <form [formGroup]="registerForm" class="register-form" (ngSubmit)="onSubmit()">
            <div class="two-col">
              <mat-form-field appearance="outline">
                <mat-label>Ism</mat-label>
                <input
                  matInput
                  formControlName="firstName"
                  autocomplete="given-name"
                  placeholder="Ismingiz"
                />
                <mat-icon matPrefix>person</mat-icon>
                @if (showError('firstName')) {
                  <mat-error>Iltimos, ismingizni kiriting.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Familiya</mat-label>
                <input
                  matInput
                  formControlName="lastName"
                  autocomplete="family-name"
                  placeholder="Familiyangiz"
                />
                <mat-icon matPrefix>badge</mat-icon>
                @if (showError('lastName')) {
                  <mat-error>Iltimos, familiyangizni kiriting.</mat-error>
                }
              </mat-form-field>
            </div>

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
              @if (showError('email')) {
                <mat-error>{{ emailErrorMessage() }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Telefon</mat-label>
              <input
                matInput
                formControlName="phone"
                autocomplete="tel"
                placeholder="+998 90 123 45 67"
              />
              <mat-icon matPrefix>call</mat-icon>
              @if (showError('phone')) {
                <mat-error>Iltimos, telefon raqamingizni kiriting.</mat-error>
              }
            </mat-form-field>

            <div class="two-col">
              <mat-form-field appearance="outline">
                <mat-label>Parol</mat-label>
                <input
                  matInput
                  [type]="hidePassword() ? 'password' : 'text'"
                  formControlName="password"
                  autocomplete="new-password"
                  placeholder="Kamida 8 ta belgi"
                />
                <mat-icon matPrefix>lock</mat-icon>
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  aria-label="Parolni ko‘rsatish"
                  (click)="togglePasswordVisibility()"
                >
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (showError('password')) {
                  <mat-error>{{ passwordErrorMessage() }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Parolni tasdiqlang</mat-label>
                <input
                  matInput
                  [type]="hidePassword() ? 'password' : 'text'"
                  formControlName="confirmPassword"
                  autocomplete="new-password"
                  placeholder="Parolni qayta kiriting"
                />
                <mat-icon matPrefix>verified_user</mat-icon>
                @if (showError('confirmPassword') || registerForm.hasError('passwordMismatch')) {
                  <mat-error>Parollar bir-biriga mos emas.</mat-error>
                }
              </mat-form-field>
            </div>

            @if (errorMessage()) {
              <div class="form-alert">
                <mat-icon>error</mat-icon>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button mat-flat-button type="submit" class="submit-button" [disabled]="submitDisabled()">
              @if (isLoading()) {
                <mat-progress-spinner diameter="18" mode="indeterminate"></mat-progress-spinner>
                <span>Yaratilyapti...</span>
              } @else {
                <span>Hisob yaratish</span>
              }
            </button>
          </form>

          <p class="register-card__footer">
            Akkauntingiz bormi?
            <a routerLink="/auth/login">Kirish</a>
          </p>
        </div>

        <aside class="register-shell__panel">
          <div class="panel-card">
            <span class="eyebrow eyebrow--soft">Nega Mulkchi?</span>
            <h2>Mezbon ham, ijarachi ham bir xil qulaylikda ishlaydi</h2>
            <div class="panel-metrics">
              <div>
                <strong>AI</strong>
                <span>Narx va moslik tavsiyasi</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Xabarlar va booking oqimi</span>
              </div>
              <div>
                <strong>1 joy</strong>
                <span>Profil, bron va mulklar boshqaruvi</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [
    `
      .register-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: clamp(var(--space-4), 4vw, var(--space-6));
      }

      .register-shell__content {
        display: grid;
        grid-template-columns: minmax(22rem, 34rem) minmax(0, 1fr);
        width: min(100%, 76rem);
        border-radius: 2rem;
        overflow: hidden;
        box-shadow: var(--shadow-xl);
      }

      .register-card,
      .register-shell__panel {
        padding: clamp(var(--space-6), 5vw, var(--space-8));
      }

      .register-card {
        display: grid;
        gap: var(--space-5);
        background: var(--color-surface-elevated);
      }

      .register-card__header,
      .register-form {
        display: grid;
        gap: var(--space-4);
      }

      .register-card__header p,
      .panel-card {
        color: var(--color-text-secondary);
      }

      h1,
      h2 {
        margin: 0;
      }

      .eyebrow {
        display: inline-flex;
        width: fit-content;
        min-height: 2rem;
        align-items: center;
        padding: 0 var(--space-3);
        border-radius: var(--radius-round);
        background: rgba(15, 118, 110, 0.1);
        color: var(--color-brand-600);
        font-size: var(--font-size-2);
        font-weight: var(--font-weight-semibold);
      }

      .eyebrow--soft {
        background: rgba(255, 255, 255, 0.16);
        color: white;
      }

      .two-col {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-4);
      }

      .submit-button {
        gap: var(--space-2);
        min-height: 52px;
        background: linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700));
        color: white !important;
      }

      .separator {
        position: relative;
        display: flex;
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

      .form-alert {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-3);
        background: rgba(220, 38, 38, 0.08);
        color: var(--color-danger-600);
        font-size: var(--font-size-2);
      }

      .register-card__footer {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: var(--font-size-2);
      }

      .register-card__footer a {
        color: var(--color-brand-600);
        font-weight: var(--font-weight-semibold);
      }

      .register-shell__panel {
        display: grid;
        align-items: center;
        background:
          radial-gradient(circle at top right, rgba(245, 158, 11, 0.22), transparent 26%),
          linear-gradient(180deg, #0f172a, #111827);
        color: white;
      }

      .panel-card {
        display: grid;
        gap: var(--space-5);
      }

      .panel-card h2 {
        color: white;
        font-size: clamp(2rem, 3.5vw, 3rem);
        line-height: var(--line-height-tight);
      }

      .panel-metrics {
        display: grid;
        gap: var(--space-3);
      }

      .panel-metrics div {
        display: grid;
        gap: var(--space-1);
        padding: var(--space-4);
        border-radius: var(--radius-3);
        background: rgba(255, 255, 255, 0.08);
      }

      .panel-metrics strong {
        color: var(--color-accent-500);
        font-size: var(--font-size-6);
      }

      @media (max-width: 960px) {
        .register-shell__content {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 640px) {
        .two-col {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly googleClientId = environment.googleClientId;
  protected readonly hidePassword = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly registerForm = this.fb.nonNullable.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatchValidator },
  );

  protected readonly submitDisabled = computed(
    () => this.registerForm.invalid || this.isLoading(),
  );

  protected async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const formValue = this.registerForm.getRawValue();

      await firstValueFrom(
        this.authStore.register({
          firstName: formValue.firstName,
          lastName: formValue.lastName,
          email: formValue.email,
          phone: formValue.phone,
          password: formValue.password,
          confirmPassword: formValue.confirmPassword,
        }),
      );

      this.toastService.success("Ro'yxatdan o'tish muvaffaqiyatli yakunlandi.");
      await this.router.navigate(['/']);
    } catch (error: unknown) {
      const message =
        (error as { error?: { message?: string } })?.error?.message ||
        "Ro'yxatdan o'tishda xatolik yuz berdi.";

      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected showError(
    controlName: 'firstName' | 'lastName' | 'email' | 'phone' | 'password' | 'confirmPassword',
  ): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected emailErrorMessage(): string {
    const control = this.registerForm.controls.email;
    if (control.hasError('required')) {
      return 'Iltimos, emailingizni kiriting.';
    }

    return "Email formati to'g'ri emas.";
  }

  protected passwordErrorMessage(): string {
    const control = this.registerForm.controls.password;

    if (control.hasError('required')) {
      return 'Iltimos, parol kiriting.';
    }

    if (control.hasError('minlength')) {
      return "Parol kamida 8 ta belgidan iborat bo'lishi kerak.";
    }

    return "Parolda katta-kichik harf, raqam va maxsus belgi bo'lishi kerak.";
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }
}

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }

  return null;
}

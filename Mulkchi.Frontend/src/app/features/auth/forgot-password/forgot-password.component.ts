import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section class="forgot-shell">
      <div class="forgot-card surface-card">
        <div class="forgot-copy">
          <span class="eyebrow">Parolni tiklash</span>
          <h1>Hisobingizga qaytib kelamiz</h1>
          <p>
            Email manzilingizni kiriting. Tiklash havolasini yuboramiz va qolganini u yerdan davom
            ettirasiz.
          </p>
        </div>

        @if (!isSuccess()) {
          <form [formGroup]="forgotForm" class="forgot-form" (ngSubmit)="onSubmit()">
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
              @if (showEmailError()) {
                <mat-error>{{ emailErrorMessage() }}</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <div class="form-alert">
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
                <span>Yuborilyapti...</span>
              } @else {
                <span>Havolani yuborish</span>
              }
            </button>
          </form>
        } @else {
          <div class="success-state">
            <div class="success-icon">
              <mat-icon>mark_email_read</mat-icon>
            </div>
            <h2>Email yuborildi</h2>
            <p>
              Spam papkasini ham tekshirib ko‘ring. Havola odatda bir necha soniyada yetib boradi.
            </p>
            <a mat-flat-button routerLink="/auth/login">Kirish sahifasiga qaytish</a>
          </div>
        }

        <a class="back-link" routerLink="/auth/login">Kirishga qaytish</a>
      </div>
    </section>
  `,
  styles: [
    `
      .forgot-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: var(--space-4);
      }

      .forgot-card {
        display: grid;
        gap: var(--space-5);
        width: min(100%, 34rem);
        padding: clamp(var(--space-6), 5vw, var(--space-8));
      }

      .forgot-copy,
      .forgot-form,
      .success-state {
        display: grid;
        gap: var(--space-4);
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

      h1,
      h2,
      p {
        margin: 0;
      }

      p {
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
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
        background: rgba(220, 38, 38, 0.08);
        color: var(--color-danger-600);
      }

      .success-state {
        text-align: center;
      }

      .success-icon {
        display: grid;
        place-items: center;
        inline-size: 4.5rem;
        aspect-ratio: 1;
        justify-self: center;
        border-radius: 1.5rem;
        background: rgba(34, 197, 94, 0.14);
        color: var(--color-success-500);
      }

      .success-icon mat-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
      }

      .back-link {
        color: var(--color-brand-600);
        font-size: var(--font-size-2);
        font-weight: var(--font-weight-semibold);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  protected readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected readonly isLoading = signal(false);
  protected readonly isSuccess = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submitDisabled = computed(() => this.forgotForm.invalid || this.isLoading());

  protected async onSubmit(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.authService.forgotPassword(this.forgotForm.getRawValue().email));
      this.isSuccess.set(true);
      this.toastService.success('Tiklash havolasi emailingizga yuborildi.');
    } catch (error: unknown) {
      const message =
        (error as { error?: { message?: string } })?.error?.message ||
        'Xatolik yuz berdi. Qayta urinib ko‘ring.';

      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected showEmailError(): boolean {
    const control = this.forgotForm.controls.email;
    return control.invalid && (control.touched || control.dirty);
  }

  protected emailErrorMessage(): string {
    const control = this.forgotForm.controls.email;
    if (control.hasError('required')) {
      return 'Iltimos, emailingizni kiriting.';
    }

    return "Email formati to'g'ri emas.";
  }
}

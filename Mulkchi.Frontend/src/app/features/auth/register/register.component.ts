import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule, StepperOrientation } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleLoginComponent } from '../../../shared/components/google-login/google-login.component';

@Component({
  selector: 'app-register',
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
    MatSelectModule,
    MatStepperModule,
    GoogleLoginComponent
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Ro'yxatdan o'tish</mat-card-title>
          <mat-card-subtitle>Yangi akkaunt yarating</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Google Quick Register -->
          <div class="google-register-section">
            <app-google-login></app-google-login>
            <div class="divider">
              <span>yoki</span>
            </div>
          </div>

          <mat-stepper [orientation]="stepperOrientationSignal()" linear #stepper>
            <!-- Step 1: Personal Info -->
            <mat-step [stepControl]="personalInfoForm" label="Shaxsiy ma'lumotlar">
              <form [formGroup]="personalInfoForm">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Ism</mat-label>
                    <input matInput formControlName="firstName" placeholder="Ismingiz">
                    <mat-icon matPrefix>person</mat-icon>
                    @if (personalInfoForm.get('firstName')?.invalid && personalInfoForm.get('firstName')?.touched) {
                      <mat-error>Ism kiritilishi shart</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="half-width">
                    <mat-label>Familiya</mat-label>
                    <input matInput formControlName="lastName" placeholder="Familiyangiz">
                    <mat-icon matPrefix>person_outline</mat-icon>
                    @if (personalInfoForm.get('lastName')?.invalid && personalInfoForm.get('lastName')?.touched) {
                      <mat-error>Familiya kiritilishi shart</mat-error>
                    }
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="email@example.com">
                  <mat-icon matPrefix>email</mat-icon>
                  @if (personalInfoForm.get('email')?.invalid && personalInfoForm.get('email')?.touched) {
                    <mat-error>
                      @if (personalInfoForm.get('email')?.hasError('required')) {
                        Email kiritilishi shart
                      } @else if (personalInfoForm.get('email')?.hasError('email')) {
                        Noto'g'ri email format
                      }
                    </mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Telefon</mat-label>
                  <input matInput formControlName="phone" placeholder="+998 90 123 45 67">
                  <mat-icon matPrefix>phone</mat-icon>
                </mat-form-field>

                <div class="step-actions">
                  <button mat-raised-button color="primary" matStepperNext type="button">
                    Keyingisi
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 2: Account Info -->
            <mat-step [stepControl]="accountInfoForm" label="Akkount ma'lumotlari">
              <form [formGroup]="accountInfoForm">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Parol</mat-label>
                  <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password">
                  <mat-icon matPrefix>lock</mat-icon>
                  <button mat-icon-button matSuffix type="button" (click)="togglePasswordVisibility()">
                    <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                  @if (accountInfoForm.get('password')?.invalid && accountInfoForm.get('password')?.touched) {
                    <mat-error>
                      @if (accountInfoForm.get('password')?.hasError('required')) {
                        Parol kiritilishi shart
                      } @else if (accountInfoForm.get('password')?.hasError('minlength')) {
                        Parol kamida 8 ta belgidan iborat bo'lishi kerak
                      } @else if (accountInfoForm.get('password')?.hasError('pattern')) {
                        Parol katta harf, kichik harf, raqam va maxsus belgi bo'lishi kerak
                      }
                    </mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Parolni tasdiqlash</mat-label>
                  <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="confirmPassword">
                  <mat-icon matPrefix>lock_outline</mat-icon>
                  @if (accountInfoForm.get('confirmPassword')?.invalid && accountInfoForm.get('confirmPassword')?.touched) {
                    <mat-error>
                      @if (accountInfoForm.get('confirmPassword')?.hasError('required')) {
                        Parolni tasdiqlang
                      } @else if (accountInfoForm.hasError('passwordMismatch')) {
                        Parollar mos kelmadi
                      }
                    </mat-error>
                  }
                </mat-form-field>

                @if (accountInfoForm.hasError('passwordMismatch') && accountInfoForm.touched) {
                  <div class="error-message">
                    <mat-icon color="warn">error</mat-icon>
                    <span>Parollar mos kelmadi</span>
                  </div>
                }

                <div class="step-actions">
                  <button mat-button matStepperPrevious type="button">Orqaga</button>
                  <button mat-raised-button color="primary" matStepperNext type="button">
                    Keyingisi
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <!-- Step 3: Confirmation -->
            <mat-step label="Tasdiqlash">
              <div class="confirmation-content">
                <h3>Ma'lumotlaringizni tekshiring</h3>
                
                <div class="confirmation-item">
                  <span class="label">Ism:</span>
                  <span class="value">{{ personalInfoForm.value.firstName }}</span>
                </div>
                <div class="confirmation-item">
                  <span class="label">Familiya:</span>
                  <span class="value">{{ personalInfoForm.value.lastName }}</span>
                </div>
                <div class="confirmation-item">
                  <span class="label">Email:</span>
                  <span class="value">{{ personalInfoForm.value.email }}</span>
                </div>
                <div class="confirmation-item">
                  <span class="label">Telefon:</span>
                  <span class="value">{{ personalInfoForm.value.phone || 'Kiritilmagan' }}</span>
                </div>
                @if (errorMessage()) {
                  <div class="error-alert">
                    <mat-icon color="warn">error</mat-icon>
                    <span>{{ errorMessage() }}</span>
                  </div>
                }

                <div class="step-actions">
                  <button mat-button matStepperPrevious type="button" [disabled]="isLoading()">Orqaga</button>
                  <button 
                    mat-raised-button 
                    color="primary" 
                    type="button"
                    (click)="onSubmit()"
                    [disabled]="isLoading()">
                    @if (isLoading()) {
                      <mat-progress-spinner diameter="20" class="inline-spinner"></mat-progress-spinner>
                      <span>Ro'yxatdan o'tish...</span>
                    } @else {
                      <span>Ro'yxatdan o'tish</span>
                    }
                  </button>
                </div>
              </div>
            </mat-step>
          </mat-stepper>
        </mat-card-content>

        <mat-card-actions class="register-actions">
          <p>Akkauntingiz bormi? <a mat-button color="primary" routerLink="/auth/login">Kirish</a></p>
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

    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%);
      padding: 20px;
    }

    .register-card {
      width: 100%;
      max-width: 600px;
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
      margin-bottom: 16px;
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

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 0;
    }

    .half-width {
      width: 50%;
    }

    .step-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .step-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--color-navy) !important;
      color: var(--color-white) !important;
      border-radius: var(--radius) !important;
      transition: all 0.3s ease;
    }

    .step-actions button:hover:not([disabled]) {
      background: var(--color-navy-light) !important;
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }

    ::ng-deep .mat-step-header .mat-step-icon-selected,
    ::ng-deep .mat-step-header .mat-step-icon-state-done,
    ::ng-deep .mat-step-header .mat-step-icon-state-edit {
      background-color: var(--color-navy) !important;
      color: var(--color-gold) !important;
    }

    ::ng-deep .mat-step-header .mat-step-icon {
      color: var(--color-gray-400);
    }

    ::ng-deep .mat-step-header .mat-step-label.mat-step-label-active {
      color: var(--color-navy) !important;
    }

    ::ng-deep .mat-step-header .mat-step-label {
      color: var(--color-gray-500);
    }

    ::ng-deep .mat-step-header:hover {
      background-color: rgba(27, 58, 107, 0.05);
    }

    .confirmation-content {
      padding: 16px 0;
    }

    .confirmation-content h3 {
      margin-bottom: 24px;
      color: var(--color-navy);
      font-weight: 600;
    }

    .confirmation-item {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .confirmation-item .label {
      width: 150px;
      font-weight: 500;
      color: var(--color-gray-500);
    }

    .confirmation-item .value {
      flex: 1;
      color: var(--color-gray-900);
      font-weight: 500;
    }

    .error-message,
    .error-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef2f2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: var(--radius);
      margin: 16px 0;
    }

    .inline-spinner {
      display: inline-block;
    }

    ::ng-deep .mat-mdc-progress-spinner .mdc-circular-progress__determinate-circle,
    ::ng-deep .mat-mdc-progress-spinner .mdc-circular-progress__indeterminate-circle-graphic {
      stroke: var(--color-gold) !important;
    }

    .register-actions {
      justify-content: center;
      padding-top: 24px;
    }

    .register-actions p {
      margin: 0;
      color: var(--color-gray-600);
      font-size: 0.95rem;
    }

    .register-actions a {
      color: var(--color-navy) !important;
      font-weight: 500;
    }

    .google-register-section {
      margin-bottom: 24px;
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

    @media (max-width: 600px) {
      .register-card {
        padding: 24px;
      }

      mat-card-title {
        font-size: 1.5rem;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .half-width {
        width: 100%;
      }

      .confirmation-item {
        flex-direction: column;
        gap: 4px;
      }

      .confirmation-item .label {
        width: auto;
      }

      .step-actions {
        flex-direction: column;
      }

      .step-actions button {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .register-card {
        padding: 20px;
      }

      mat-card-title {
        font-size: 1.25rem;
      }
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private breakpointObserver = inject(BreakpointObserver);

  personalInfoForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required]
  });

  accountInfoForm = this.fb.group({
    password: ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/)
    ]],
    confirmPassword: ['', Validators.required]
    // Single Identity: No role selection - defaults to Guest on backend
  }, { validators: this.passwordMatchValidator });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  hidePassword = signal(true);

  stepperOrientation: Observable<StepperOrientation> = this.breakpointObserver
    .observe('(min-width: 600px)')
    .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));

  stepperOrientationSignal = toSignal(this.stepperOrientation, { initialValue: 'horizontal' as StepperOrientation });

  togglePasswordVisibility(): void {
    this.hidePassword.update(v => !v);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.personalInfoForm.invalid || this.accountInfoForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const registerData = {
      firstName: this.personalInfoForm.value.firstName!,
      lastName: this.personalInfoForm.value.lastName!,
      email: this.personalInfoForm.value.email!,
      phone: this.personalInfoForm.value.phone!,
      password: this.accountInfoForm.value.password!,
      confirmPassword: this.accountInfoForm.value.confirmPassword!
      // Single Identity: No role sent - defaults to Guest on backend
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Ro\'yxatdan o\'tish muvaffaqiyatli!', 'Yopish', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
      }
    });
  }
}

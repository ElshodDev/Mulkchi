import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { ListingType, Property } from '../../../core/models';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-booking-panel',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <article class="booking-card glass-panel">
      <div class="booking-card__header">
        <div>
          <span class="eyebrow"><mat-icon>date_range</mat-icon> Taqvim</span>
          <h2>Kunlarni tanlang</h2>
        </div>
      </div>

      <form [formGroup]="bookingForm" class="booking-form" (ngSubmit)="onSubmit()">
        <div class="booking-grid">
          <mat-form-field appearance="outline" class="premium-field">
            <mat-label>Kirish sanasi</mat-label>
            <input
              matInput
              [matDatepicker]="checkInPicker"
              formControlName="checkInDate"
              [min]="minDate"
            />
            <mat-datepicker-toggle matIconSuffix [for]="checkInPicker"></mat-datepicker-toggle>
            <mat-datepicker #checkInPicker></mat-datepicker>
            @if (
              bookingForm.controls.checkInDate.invalid && bookingForm.controls.checkInDate.touched
            ) {
              <mat-error>Iltimos, kirish sanasini tanlang.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="premium-field">
            <mat-label>Chiqish sanasi</mat-label>
            <input
              matInput
              [matDatepicker]="checkOutPicker"
              formControlName="checkOutDate"
              [min]="minCheckOutDate()"
            />
            <mat-datepicker-toggle matIconSuffix [for]="checkOutPicker"></mat-datepicker-toggle>
            <mat-datepicker #checkOutPicker></mat-datepicker>
            @if (
              bookingForm.controls.checkOutDate.invalid && bookingForm.controls.checkOutDate.touched
            ) {
              <mat-error>Iltimos, chiqish sanasini tanlang.</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="premium-field">
          <mat-label>Mehmonlar soni</mat-label>
          <mat-select formControlName="numberOfGuests">
            @for (guest of guestOptions(); track guest) {
              <mat-option [value]="guest">{{ guest }} mehmon</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="premium-field">
          <mat-label>Qo'shimcha izoh</mat-label>
          <textarea
            matInput
            rows="2"
            formControlName="notes"
            placeholder="Kelib kelish vaqti yoki maxsus istaklar..."
          ></textarea>
        </mat-form-field>

        <div class="price-sheet">
          @if (nightsCount() > 0 && property().listingType === listingType.ShortTermRent) {
            <div class="price-row">
              <span
                >{{ property().pricePerNight | number }} {{ property().currency }} x
                {{ nightsCount() }} tun</span
              >
              <strong>{{ basePrice() | number }} {{ property().currency }}</strong>
            </div>
            <div class="price-row">
              <span>Xizmat haqi</span>
              <strong>{{ serviceFee() | number }} {{ property().currency }}</strong>
            </div>
            <mat-divider></mat-divider>
            <div class="price-row price-row--total">
              <span>Jami summa</span>
              <strong>{{ totalPrice() | number }} {{ property().currency }}</strong>
            </div>
          } @else {
            <div class="empty-state-calc">
              <mat-icon>calculate</mat-icon>
              <span>Jami hisob-kitobni ko'rish uchun sanalarni tanlang</span>
            </div>
          }
        </div>

        @if (errorMessage()) {
          <div class="form-alert">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <button mat-flat-button type="submit" class="submit-button" [disabled]="submitDisabled()">
          @if (isLoading()) {
            <mat-progress-spinner
              diameter="20"
              mode="indeterminate"
              color="accent"
            ></mat-progress-spinner>
            <span>Band qilinmoqda...</span>
          } @else {
            <ng-container>
              <mat-icon>check_circle</mat-icon>
              <span>Tasdiqlash va Bron</span>
            </ng-container>
          }
        </button>
      </form>
    </article>
  `,
  styles: [
    `
      .glass-panel {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.8);
        border-radius: 28px;
        padding: 32px;
        box-shadow:
          0 20px 40px -10px rgba(15, 23, 42, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.6);
        margin-top: 24px;
        position: relative;
        overflow: hidden;
      }
      .glass-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: linear-gradient(90deg, #10b981, #059669);
      }

      .booking-card__header {
        margin-bottom: 24px;
      }
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: #ecfdf5;
        color: #059669;
        border-radius: 12px;
        font-weight: 800;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .eyebrow mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
      h2 {
        margin: 12px 0 0;
        font-size: 1.6rem;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: -0.5px;
      }

      .booking-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .booking-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      ::ng-deep .premium-field .mdc-text-field--outlined {
        --mdc-outlined-text-field-container-shape: 14px;
        background: rgba(255, 255, 255, 0.6);
      }

      .price-sheet {
        padding: 24px;
        background: #f8fafc;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .price-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #475569;
        font-size: 1.05rem;
      }
      .price-row strong {
        color: #0f172a;
        font-weight: 800;
      }
      .price-row--total {
        margin-top: 8px;
      }
      .price-row--total span {
        font-weight: 800;
        color: #0f172a;
        font-size: 1.15rem;
      }
      .price-row--total strong {
        font-size: 1.5rem;
        color: #1e40af;
      }

      .empty-state-calc {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: #94a3b8;
        text-align: center;
        font-size: 0.95rem;
        font-weight: 600;
        padding: 10px 0;
      }
      .empty-state-calc mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #cbd5e1;
      }

      .form-alert {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: #fef2f2;
        border: 1px solid #fca5a5;
        color: #b91c1c;
        border-radius: 16px;
        font-weight: 600;
        font-size: 0.95rem;
      }

      .submit-button {
        height: 56px !important;
        border-radius: 16px !important;
        font-size: 1.15rem !important;
        font-weight: 800 !important;
        background: linear-gradient(135deg, #10b981, #059669) !important;
        color: white !important;
        letter-spacing: 0.5px;
        box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2) !important;
        transition: all 0.3s ease !important;
      }
      .submit-button:not(:disabled):hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 25px rgba(16, 185, 129, 0.35) !important;
      }
      .submit-button:disabled {
        background: #cbd5e1 !important;
        color: white !important;
        box-shadow: none !important;
      }
      .submit-button ::ng-deep .mdc-button__label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
      }

      @media (max-width: 640px) {
        .booking-grid {
          grid-template-columns: 1fr;
        }
        .glass-panel {
          padding: 24px;
          border-radius: 20px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPanelComponent {
  readonly property = input.required<Property>();
  protected readonly listingType = ListingType;
  protected readonly minDate = new Date();

  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly bookingForm = this.fb.nonNullable.group({
    checkInDate: [null as Date | null, Validators.required],
    checkOutDate: [null as Date | null, Validators.required],
    numberOfGuests: [1, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  protected readonly submitDisabled = computed(() => this.bookingForm.invalid || this.isLoading());

  protected readonly guestOptions = computed(() => {
    const maxGuests = this.property().maxGuests || 10;
    return Array.from({ length: maxGuests }, (_, index) => index + 1);
  });

  protected readonly minCheckOutDate = computed(() => {
    const checkIn = this.bookingForm.controls.checkInDate.value;
    if (!checkIn) {
      return this.minDate;
    }

    const nextDay = new Date(checkIn);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  });

  protected readonly nightsCount = computed(() => {
    const checkIn = this.bookingForm.controls.checkInDate.value;
    const checkOut = this.bookingForm.controls.checkOutDate.value;

    if (!checkIn || !checkOut) {
      return 0;
    }

    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  });

  protected readonly basePrice = computed(() => {
    if (this.property().listingType !== ListingType.ShortTermRent) {
      return this.property().monthlyRent ?? 0;
    }

    return this.nightsCount() * (this.property().pricePerNight || 0);
  });

  protected readonly serviceFee = computed(() => Math.round(this.basePrice() * 0.1));
  protected readonly totalPrice = computed(() =>
    this.property().listingType === ListingType.ShortTermRent
      ? this.basePrice() + this.serviceFee()
      : this.basePrice(),
  );

  protected async onSubmit(): Promise<void> {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    const { checkInDate, checkOutDate, numberOfGuests, notes } = this.bookingForm.getRawValue();

    if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
      this.errorMessage.set("Chiqish sanasi kirish sanasidan keyin bo'lishi kerak.");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      await firstValueFrom(
        this.bookingService.createBooking({
          propertyId: this.property().id,
          checkInDate,
          checkOutDate,
          numberOfGuests,
          notes: notes || undefined,
        }),
      );

      this.toastService.success('Bron muvaffaqiyatli yuborildi.');
      await this.router.navigate(['/bookings']);
    } catch (error: unknown) {
      this.handleError(error as HttpErrorResponse);
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleError(error: HttpErrorResponse): void {
    switch (error.status) {
      case 401:
        this.errorMessage.set('Bron qilish uchun avval tizimga kiring.');
        this.toastService.warning('Iltimos, avval tizimga kiring.');
        void this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: this.router.url },
        });
        break;
      case 409:
        this.errorMessage.set('Bu sana allaqachon band. Boshqa sanani tanlang.');
        break;
      case 400:
        this.errorMessage.set(error.error?.message || "Ma'lumotlarni qayta tekshirib ko‘ring.");
        break;
      case 403:
        this.errorMessage.set('Bu amalni bajarish uchun ruxsat yetarli emas.');
        break;
      default:
        this.errorMessage.set('Bron yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.');
    }
  }
}

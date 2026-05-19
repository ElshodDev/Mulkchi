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
    <article class="booking-card surface-card">
      <div class="booking-card__header">
        <div>
          <span class="eyebrow">Bron</span>
          <h2>Sanalarni band qiling</h2>
        </div>
        <div class="booking-price">
          @if (property().listingType === listingType.ShortTermRent && property().pricePerNight) {
            <strong>{{ property().pricePerNight | number }} {{ property().currency }}</strong>
            <span>/ tun</span>
          } @else if (property().listingType === listingType.Rent && property().monthlyRent) {
            <strong>{{ property().monthlyRent | number }} {{ property().currency }}</strong>
            <span>/ oy</span>
          }
        </div>
      </div>

      <form [formGroup]="bookingForm" class="booking-form" (ngSubmit)="onSubmit()">
        <div class="booking-grid">
          <mat-form-field appearance="outline">
            <mat-label>Kirish sanasi</mat-label>
            <input matInput [matDatepicker]="checkInPicker" formControlName="checkInDate" [min]="minDate" />
            <mat-datepicker-toggle matIconSuffix [for]="checkInPicker"></mat-datepicker-toggle>
            <mat-datepicker #checkInPicker></mat-datepicker>
            @if (bookingForm.controls.checkInDate.invalid && bookingForm.controls.checkInDate.touched) {
              <mat-error>Iltimos, kirish sanasini tanlang.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Chiqish sanasi</mat-label>
            <input
              matInput
              [matDatepicker]="checkOutPicker"
              formControlName="checkOutDate"
              [min]="minCheckOutDate()"
            />
            <mat-datepicker-toggle matIconSuffix [for]="checkOutPicker"></mat-datepicker-toggle>
            <mat-datepicker #checkOutPicker></mat-datepicker>
            @if (bookingForm.controls.checkOutDate.invalid && bookingForm.controls.checkOutDate.touched) {
              <mat-error>Iltimos, chiqish sanasini tanlang.</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Mehmonlar soni</mat-label>
          <mat-select formControlName="numberOfGuests">
            @for (guest of guestOptions(); track guest) {
              <mat-option [value]="guest">{{ guest }} mehmon</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Qo'shimcha izoh</mat-label>
          <textarea
            matInput
            rows="3"
            formControlName="notes"
            placeholder="Kelib kelish vaqti yoki maxsus ehtiyojlaringiz bo‘lsa yozing"
          ></textarea>
        </mat-form-field>

        <div class="price-sheet">
          @if (nightsCount() > 0 && property().listingType === listingType.ShortTermRent) {
            <div class="price-row">
              <span>{{ nightsCount() }} tun x {{ property().pricePerNight | number }}</span>
              <strong>{{ basePrice() | number }} {{ property().currency }}</strong>
            </div>
            <div class="price-row">
              <span>Xizmat haqi</span>
              <strong>{{ serviceFee() | number }} {{ property().currency }}</strong>
            </div>
          } @else {
            <div class="price-row">
              <span>Oylik to'lov</span>
              <strong>{{ property().monthlyRent || 0 | number }} {{ property().currency }}</strong>
            </div>
          }

          <mat-divider></mat-divider>

          <div class="price-row price-row--total">
            <span>Jami</span>
            <strong>{{ totalPrice() | number }} {{ property().currency }}</strong>
          </div>
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
            <span>Yuborilyapti...</span>
          } @else {
            <ng-container>
              <mat-icon>calendar_month</mat-icon>
              <span>Bron qilish</span>
            </ng-container>
          }
        </button>
      </form>
    </article>
  `,
  styles: [
    `
      .booking-card {
        display: grid;
        gap: var(--space-5);
        padding: var(--space-5);
      }

      .booking-card__header,
      .booking-price,
      .price-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        min-height: 2rem;
        padding: 0 var(--space-3);
        border-radius: var(--radius-round);
        background: rgba(15, 118, 110, 0.1);
        color: var(--color-brand-600);
        font-size: var(--font-size-2);
        font-weight: var(--font-weight-semibold);
      }

      h2 {
        margin: var(--space-2) 0 0;
        font-size: var(--font-size-6);
      }

      .booking-price {
        flex-direction: column;
        align-items: flex-end;
      }

      .booking-price strong {
        font-size: var(--font-size-6);
        color: var(--color-brand-600);
      }

      .booking-price span,
      .price-row span {
        color: var(--color-text-secondary);
      }

      .booking-form,
      .price-sheet {
        display: grid;
        gap: var(--space-4);
      }

      .booking-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--space-4);
      }

      .price-sheet {
        padding: var(--space-4);
        border-radius: var(--radius-3);
        background: rgba(15, 118, 110, 0.05);
      }

      .price-row--total strong {
        font-size: var(--font-size-5);
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

      .submit-button {
        gap: var(--space-2);
        min-height: 52px;
        background: linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700));
        color: white !important;
      }

      @media (max-width: 640px) {
        .booking-card__header,
        .booking-grid {
          grid-template-columns: 1fr;
        }

        .booking-card__header {
          align-items: flex-start;
        }

        .booking-price {
          align-items: flex-start;
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

  protected readonly submitDisabled = computed(
    () => this.bookingForm.invalid || this.isLoading(),
  );

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
        this.errorMessage.set("Bu amalni bajarish uchun ruxsat yetarli emas.");
        break;
      default:
        this.errorMessage.set('Bron yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.');
    }
  }
}

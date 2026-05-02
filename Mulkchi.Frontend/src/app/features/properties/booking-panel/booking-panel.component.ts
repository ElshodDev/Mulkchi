import { Component, Input, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { Property, ListingType } from '../../../core/models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-booking-panel',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <mat-card class="booking-panel">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>calendar_today</mat-icon>
          Bron qilish
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <!-- Price Display -->
        <div class="price-display">
          @if (property.listingType === ListingType.ShortTermRent && property.pricePerNight) {
            <span class="amount">{{ property.pricePerNight | number }} {{ property.currency }}</span>
            <span class="period">/tun</span>
          } @else if (property.listingType === ListingType.Rent && property.monthlyRent) {
            <span class="amount">{{ property.monthlyRent | number }} {{ property.currency }}</span>
            <span class="period">/oy</span>
          }
        </div>

        <!-- Booking Form -->
        <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
          <!-- Check-in Date -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Kirish sanasi</mat-label>
            <input matInput [matDatepicker]="checkInPicker" formControlName="checkInDate" [min]="minDate">
            <mat-datepicker-toggle matIconSuffix [for]="checkInPicker"></mat-datepicker-toggle>
            <mat-datepicker #checkInPicker></mat-datepicker>
            @if (bookingForm.get('checkInDate')?.hasError('required')) {
              <mat-error>Kirish sanasini tanlang</mat-error>
            }
          </mat-form-field>

          <!-- Check-out Date -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Chiqish sanasi</mat-label>
            <input matInput [matDatepicker]="checkOutPicker" formControlName="checkOutDate" [min]="minCheckOutDate()">
            <mat-datepicker-toggle matIconSuffix [for]="checkOutPicker"></mat-datepicker-toggle>
            <mat-datepicker #checkOutPicker></mat-datepicker>
            @if (bookingForm.get('checkOutDate')?.hasError('required')) {
              <mat-error>Chiqish sanasini tanlang</mat-error>
            }
          </mat-form-field>

          <!-- Number of Guests -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Mehmonlar soni</mat-label>
            <mat-select formControlName="numberOfGuests">
              @for (num of guestOptions(); track num) {
                <mat-option [value]="num">{{ num }} mehmon</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Notes -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Qo'shimcha izohlar</mat-label>
            <textarea matInput formControlName="notes" rows="2" placeholder="Maxsus so'rovlar..."></textarea>
          </mat-form-field>

          <!-- Price Calculation -->
          @if (totalPrice() > 0) {
            <div class="price-calculation">
              <div class="calc-row">
                <span>{{ nightsCount() }} tun × {{ property.pricePerNight | number }} {{ property.currency }}</span>
                <span>{{ basePrice() | number }} {{ property.currency }}</span>
              </div>
              @if (serviceFee() > 0) {
                <div class="calc-row">
                  <span>Xizmat haqi (10%)</span>
                  <span>{{ serviceFee() | number }} {{ property.currency }}</span>
                </div>
              }
              <mat-divider></mat-divider>
              <div class="calc-row total">
                <span>Jami</span>
                <span>{{ totalPrice() | number }} {{ property.currency }}</span>
              </div>
            </div>
          }

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="error-message">
              <mat-icon color="warn">error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <!-- Submit Button -->
          <button 
            mat-raised-button 
            color="primary" 
            class="full-width book-button"
            type="submit"
            [disabled]="bookingForm.invalid || isLoading()">
            @if (isLoading()) {
              <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
              <span>Yuklanmoqda...</span>
            } @else {
              <ng-container>
                <mat-icon>calendar_today</mat-icon>
                <span>Bron qilish</span>
              </ng-container>
            }
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .booking-panel {
      margin-top: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    mat-card-header {
      padding: 16px 16px 0;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.25rem;
      font-weight: 600;
    }

    mat-card-content {
      padding: 16px;
    }

    .price-display {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #eee;
    }

    .price-display .amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
    }

    .price-display .period {
      font-size: 1rem;
      color: #666;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .price-calculation {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.9rem;
      color: #555;
    }

    .calc-row.total {
      font-weight: 700;
      font-size: 1.1rem;
      color: #333;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      font-size: 0.9rem;
      margin: 12px 0;
      padding: 8px 12px;
      background: #ffebee;
      border-radius: 8px;
    }

    .book-button {
      height: 48px;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .book-button mat-progress-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    mat-divider {
      margin: 8px 0;
    }
  `]
})
export class BookingPanelComponent {
  @Input({ required: true }) property!: Property;

  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  ListingType = ListingType;
  minDate = new Date();

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  bookingForm = this.fb.group({
    checkInDate: [null as Date | null, Validators.required],
    checkOutDate: [null as Date | null, Validators.required],
    numberOfGuests: [1, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  // Computed values
  guestOptions = computed(() => {
    const max = this.property?.maxGuests || 10;
    return Array.from({ length: max }, (_, i) => i + 1);
  });

  minCheckOutDate = computed(() => {
    const checkIn = this.bookingForm.get('checkInDate')?.value;
    if (!checkIn) return this.minDate;
    const nextDay = new Date(checkIn);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  });

  nightsCount = computed(() => {
    const checkIn = this.bookingForm.get('checkInDate')?.value;
    const checkOut = this.bookingForm.get('checkOutDate')?.value;
    if (!checkIn || !checkOut) return 0;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  basePrice = computed(() => {
    if (this.property?.listingType !== ListingType.ShortTermRent) return 0;
    return this.nightsCount() * (this.property?.pricePerNight || 0);
  });

  serviceFee = computed(() => {
    return Math.round(this.basePrice() * 0.1);
  });

  totalPrice = computed(() => {
    return this.basePrice() + this.serviceFee();
  });

  onSubmit(): void {
    if (this.bookingForm.invalid) return;

    const formValue = this.bookingForm.value;
    const checkInDate = formValue.checkInDate!;
    const checkOutDate = formValue.checkOutDate!;

    // Validate dates
    if (checkOutDate <= checkInDate) {
      this.errorMessage.set('Chiqish sanasi kirish sanasidan keyin bo\'lishi kerak');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request = {
      propertyId: this.property.id,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      numberOfGuests: formValue.numberOfGuests || 1,
      notes: formValue.notes || undefined
    };

    this.bookingService.createBooking(request).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Bron tasdiqlandi!', 'Yopish', {
          duration: 3000,
          panelClass: 'success-snackbar'
        });
        // Redirect to my bookings
        this.router.navigate(['/bookings/my']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.handleError(error);
      }
    });
  }

  private handleError(error: HttpErrorResponse): void {
    switch (error.status) {
      case 401:
        this.errorMessage.set('Tizimga kirish talab qilinadi');
        this.snackBar.open('Iltimos, tizimga kiring', 'Kirish', {
          duration: 5000
        }).onAction().subscribe(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: this.router.url }
          });
        });
        break;

      case 409:
        this.errorMessage.set('Bu sana band. Boshqa sanani tanlang.');
        break;

      case 400: {
        const message = error.error?.message || 'Ma\'lumotlar noto\'g\'ri kiritildi';
        this.errorMessage.set(message);
        break;
      }

      case 403:
        this.errorMessage.set('Bu amalni bajarishga ruxsat yo\'q');
        break;

      case 500:
        this.errorMessage.set('Server xatosi. Iltimos, keyinroq urinib ko\'ring.');
        break;

      default:
        this.errorMessage.set('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
    }
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { ListingType, Property } from '../../../core/models';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { SmartContractModalComponent } from '../../../shared/components/smart-contract-modal/smart-contract-modal.component';

type BookingStep = 'dates' | 'hold' | 'confirm' | 'done';

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
    MatStepperModule,
    MatDialogModule,
  ],
  template: `
    <article class="booking-card glass-panel">
      <!-- Header -->
      <div class="booking-card__header">
        <div>
          <span class="eyebrow"><mat-icon>date_range</mat-icon> Bron qilish</span>
          <h2>
            @if (currentStep() === 'dates') { Kunlarni tanlang }
            @else if (currentStep() === 'hold') { Sanalar band qilindi ⏳ }
            @else if (currentStep() === 'confirm') { Bronni tasdiqlang }
            @else { Bron yuborildi ✅ }
          </h2>
        </div>

        @if (currentStep() === 'hold' && holdExpiresIn() > 0) {
          <div class="hold-timer">
            <mat-icon>timer</mat-icon>
            <span>{{ holdMinutes() }}:{{ holdSeconds() }} qoldi</span>
          </div>
        }
      </div>

      <!-- Qadam 1: Sanalarni tanlash -->
      @if (currentStep() === 'dates') {
        <form [formGroup]="bookingForm" class="booking-form" (ngSubmit)="onHold()">
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
              @if (bookingForm.controls.checkInDate.invalid && bookingForm.controls.checkInDate.touched) {
                <mat-error>Kirish sanasini tanlang.</mat-error>
              }
            </mat-form-field>

            @if (property().listingType === listingType.ShortTermRent) {
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
                @if (bookingForm.controls.checkOutDate.invalid && bookingForm.controls.checkOutDate.touched) {
                  <mat-error>Chiqish sanasini tanlang.</mat-error>
                }
              </mat-form-field>
            } @else if (property().listingType === listingType.Rent) {
              <mat-form-field appearance="outline" class="premium-field">
                <mat-label>Ijara muddati (oy)</mat-label>
                <mat-select formControlName="leaseDurationMonths">
                  <mat-option [value]="1">1 oy</mat-option>
                  <mat-option [value]="3">3 oy</mat-option>
                  <mat-option [value]="6">6 oy</mat-option>
                  <mat-option [value]="12">1 yil</mat-option>
                </mat-select>
              </mat-form-field>
            }
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

          <!-- Narx hisobi -->
          <div class="price-sheet">
            @if (nightsCount() > 0 && property().listingType === listingType.ShortTermRent) {
              <div class="price-row">
                <span>{{ property().pricePerNight | number }} UZS × {{ nightsCount() }} tun</span>
                <strong>{{ basePrice() | number }} UZS</strong>
              </div>
              <div class="price-row">
                <span>Xizmat haqi (10%)</span>
                <strong>{{ serviceFee() | number }} UZS</strong>
              </div>
              <mat-divider></mat-divider>
              <div class="price-row price-row--total">
                <span>Jami summa</span>
                <strong>{{ totalPrice() | number }} UZS</strong>
              </div>
            } @else if (property().listingType === listingType.Rent && bookingForm.controls.checkInDate.value) {
              <div class="price-row">
                <span>Oylik ijara</span>
                <strong>{{ property().monthlyRent | number }} UZS × {{ bookingForm.controls.leaseDurationMonths.value }} oy</strong>
              </div>
              <mat-divider></mat-divider>
              <div class="price-row price-row--total">
                <span>Jami muddat uchun (qaytarib beriladigan depozit hisobga olinmagan)</span>
                <strong>{{ basePrice() | number }} UZS</strong>
              </div>
            } @else if (property().listingType === listingType.Rent) {
              <div class="price-row price-row--total">
                <span>Oylik ijara</span>
                <strong>{{ (property().monthlyRent ?? 0) | number }} UZS</strong>
              </div>
            } @else {
              <div class="empty-state-calc">
                <mat-icon>calculate</mat-icon>
                <span>Narxni ko'rish uchun sanalarni tanlang</span>
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
              <ng-container>
                <mat-progress-spinner diameter="20" mode="indeterminate" color="accent"></mat-progress-spinner>
                <span>So'rov yuborilmoqda...</span>
              </ng-container>
            } @else {
              <ng-container>
                @if (property().listingType === listingType.ShortTermRent) {
                  <mat-icon>lock_clock</mat-icon>
                  <span>Sanalarni band qilish (10 daqiqa)</span>
                } @else {
                  <mat-icon>send</mat-icon>
                  <span>Ijara so'rovini yuborish</span>
                }
              </ng-container>
            }
          </button>
        </form>
      }

      <!-- Qadam 2: Hold — tasdiqlash -->
      @if (currentStep() === 'confirm') {
        <div class="confirm-panel">
          <div class="booking-summary">
            <div class="summary-row">
              <mat-icon>calendar_today</mat-icon>
              <div>
                <span class="label">Kirish</span>
                <strong>{{ bookingForm.value.checkInDate | date : 'dd.MM.yyyy' }}</strong>
              </div>
            </div>
            <div class="summary-row">
              <mat-icon>event_available</mat-icon>
              <div>
                <span class="label">Chiqish</span>
                <strong>{{ bookingForm.value.checkOutDate | date : 'dd.MM.yyyy' }}</strong>
              </div>
            </div>
            <div class="summary-row">
              <mat-icon>nights_stay</mat-icon>
              <div>
                <span class="label">Tunlar soni</span>
                <strong>{{ nightsCount() }} tun</strong>
              </div>
            </div>
            <mat-divider></mat-divider>
            <div class="summary-row summary-total">
              <mat-icon>payments</mat-icon>
              <div>
                <span class="label">Jami to'lov</span>
                <strong class="total-amount">{{ totalPrice() | number }} UZS</strong>
              </div>
            </div>
          </div>

          <div class="hold-info-box">
            <mat-icon>info</mat-icon>
            <span>Sanalar sizga <strong>{{ holdMinutes() }}:{{ holdSeconds() }}</strong> davomida band qilindi. Tasdiqlash tugmasi bosilmasa bron bekor bo'ladi.</span>
          </div>

          @if (errorMessage()) {
            <div class="form-alert">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <div class="confirm-actions-payment">
            <h4 class="payment-title">To'lov usulini tanlang:</h4>
            <div class="payment-buttons">
              <button mat-stroked-button class="pay-btn" (click)="onConfirm()">
                <mat-icon style="color: #00a0e9;">credit_card</mat-icon>
                <span>Click</span>
              </button>
              <button mat-stroked-button class="pay-btn" (click)="onConfirm()">
                <mat-icon style="color: #33cccc;">credit_card</mat-icon>
                <span>Payme</span>
              </button>
            </div>
            
            <button mat-flat-button class="submit-button web3-btn" [disabled]="isLoading()" (click)="onConfirmWeb3()">
              @if (isLoading()) {
                <ng-container>
                  <mat-progress-spinner diameter="20" mode="indeterminate" color="accent"></mat-progress-spinner>
                  <span>Yuborilmoqda...</span>
                </ng-container>
              } @else {
                <ng-container>
                  <mat-icon>currency_bitcoin</mat-icon>
                  <span>Smart Contract (USDT Web3)</span>
                </ng-container>
              }
            </button>
            <button mat-stroked-button class="back-button" (click)="cancelHold()">Ortga</button>
          </div>
        </div>
      }

      <!-- Qadam 3: Muvaffaqiyatli -->
      @if (currentStep() === 'done') {
        <div class="success-panel">
          <div class="success-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <h3>Bron yuborildi! 🎉</h3>
          <p>Uy egasi tasdiqlashini kuting yoki <strong>Bronlarim</strong> sahifasida holatni kuzating.</p>
          <button mat-flat-button class="submit-button" (click)="goToBookings()">
            <mat-icon>list_alt</mat-icon>
            Bronlarimni ko'rish
          </button>
        </div>
      }
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
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
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
      .eyebrow mat-icon { font-size: 16px; width: 16px; height: 16px; }
      h2 {
        margin: 12px 0 0;
        font-size: 1.4rem;
        font-weight: 900;
        color: #0f172a;
        letter-spacing: -0.5px;
      }

      .hold-timer {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        color: #c2410c;
        border-radius: 12px;
        padding: 8px 16px;
        font-weight: 800;
        font-size: 1rem;
        flex-shrink: 0;
      }
      .hold-timer mat-icon { font-size: 18px; width: 18px; height: 18px; }

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
        font-size: 1rem;
      }
      .price-row strong { color: #0f172a; font-weight: 800; }
      .price-row--total span { font-weight: 800; color: #0f172a; font-size: 1.1rem; }
      .price-row--total strong { font-size: 1.4rem; color: #1e40af; }

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
      .empty-state-calc mat-icon { font-size: 28px; width: 28px; height: 28px; color: #cbd5e1; }

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
        font-size: 1.05rem !important;
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

      .confirm-panel {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .booking-summary {
        background: #f8fafc;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .summary-row {
        display: flex;
        align-items: center;
        gap: 14px;
        color: #475569;
      }
      .summary-row mat-icon { color: #10b981; }
      .summary-row div { display: flex; flex-direction: column; gap: 2px; }
      .summary-row .label { font-size: 0.8rem; color: #94a3b8; }
      .summary-row strong { font-weight: 700; color: #0f172a; }
      .summary-total strong.total-amount { font-size: 1.5rem; color: #1e40af; font-weight: 900; }

      .hold-info-box {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 16px;
        padding: 16px;
        color: #92400e;
        font-size: 0.9rem;
      }
      .hold-info-box mat-icon { color: #f97316; flex-shrink: 0; }

      .confirm-actions-payment {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 10px;
      }
      .payment-title {
        margin: 0 0 4px;
        font-size: 0.95rem;
        color: #64748b;
        font-weight: 700;
      }
      .payment-buttons {
        display: flex;
        gap: 12px;
      }
      .payment-buttons .pay-btn {
        flex: 1;
        height: 50px !important;
        border-radius: 14px !important;
        border-color: #cbd5e1 !important;
        color: #0f172a !important;
        font-weight: 700 !important;
      }
      .web3-btn {
        background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
        margin-top: 4px;
      }
      .web3-btn:not(:disabled):hover {
        box-shadow: 0 15px 25px rgba(139, 92, 246, 0.35) !important;
      }
      .back-button {
        height: 48px !important;
        border-radius: 12px !important;
        font-weight: 700 !important;
        margin-top: 8px;
        color: #64748b !important;
      }

      .success-panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        text-align: center;
        padding: 16px 0;
      }
      .success-icon mat-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: #10b981;
        animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      @keyframes popIn {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .success-panel h3 { font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0; }
      .success-panel p { color: #475569; font-size: 1rem; margin: 0; }

      @media (max-width: 640px) {
        .booking-grid { grid-template-columns: 1fr; }
        .glass-panel { padding: 24px; border-radius: 20px; }
        .confirm-actions { flex-direction: column; }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingPanelComponent implements OnDestroy {
  readonly property = input.required<Property>();
  protected readonly listingType = ListingType;

  protected readonly minDate = new Date();
  constructor() {
    this.minDate.setHours(0, 0, 0, 0);
  }

  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly dialog = inject(MatDialog);

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly currentStep = signal<BookingStep>('dates');

  private holdTimerInterval: ReturnType<typeof setInterval> | null = null;
  protected readonly holdExpiresAt = signal<Date | null>(null);
  protected readonly holdExpiresIn = signal(0);
  protected readonly holdId = signal<string | null>(null);

  protected readonly holdMinutes = computed(() =>
    String(Math.floor(this.holdExpiresIn() / 60)).padStart(2, '0'),
  );
  protected readonly holdSeconds = computed(() =>
    String(this.holdExpiresIn() % 60).padStart(2, '0'),
  );

  protected readonly bookingForm = this.fb.nonNullable.group({
    checkInDate: [null as Date | null, Validators.required],
    checkOutDate: [null as Date | null],
    leaseDurationMonths: [1, [Validators.min(1)]],
    numberOfGuests: [1, [Validators.required, Validators.min(1)]],
    notes: [''],
  });

  protected readonly formValue = toSignal(this.bookingForm.valueChanges, { initialValue: this.bookingForm.value });

  protected readonly submitDisabled = computed(() => {
    this.formValue();
    const isRent = this.property().listingType === ListingType.Rent;
    const isShortTerm = this.property().listingType === ListingType.ShortTermRent;
    
    if (this.isLoading()) return true;
    if (this.bookingForm.controls.checkInDate.invalid) return true;
    if (isShortTerm && this.bookingForm.controls.checkOutDate.invalid) return true;
    if (isShortTerm && !this.bookingForm.controls.checkOutDate.value) return true;
    
    return false;
  });

  protected readonly guestOptions = computed(() => {
    const maxGuests = this.property().maxGuests || 10;
    return Array.from({ length: maxGuests }, (_, i) => i + 1);
  });

  protected readonly minCheckOutDate = computed(() => {
    this.formValue();
    const checkIn = this.bookingForm.controls.checkInDate.value;
    if (!checkIn) return this.minDate;
    const next = new Date(checkIn);
    next.setDate(next.getDate() + 1);
    return next;
  });

  protected readonly nightsCount = computed(() => {
    this.formValue();
    const ci = this.bookingForm.controls.checkInDate.value;
    const co = this.bookingForm.controls.checkOutDate.value;
    if (!ci || !co) return 0;
    return Math.ceil((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
  });

  protected readonly basePrice = computed(() => {
    this.formValue();
    if (this.property().listingType === ListingType.Rent) {
      return (this.property().monthlyRent ?? 0) * (this.bookingForm.controls.leaseDurationMonths.value || 1);
    }
    return this.nightsCount() * (this.property().pricePerNight || 0);
  });

  protected readonly serviceFee = computed(() =>
    this.property().listingType === ListingType.ShortTermRent
      ? Math.round(this.basePrice() * 0.1)
      : 0,
  );

  protected readonly totalPrice = computed(() => this.basePrice() + this.serviceFee());


  protected async onHold(): Promise<void> {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    let { checkInDate, checkOutDate, leaseDurationMonths } = this.bookingForm.getRawValue();
    
    if (this.property().listingType === ListingType.Rent) {
      if (!checkInDate) {
        this.errorMessage.set("Kirish sanasini tanlang.");
        return;
      }
      checkOutDate = new Date(checkInDate);
      checkOutDate.setMonth(checkOutDate.getMonth() + (leaseDurationMonths || 1));
    } else {
      if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
        this.errorMessage.set("Chiqish sanasi kirish sanasidan keyin bo'lishi kerak.");
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const hold = await firstValueFrom(
        this.bookingService.createHold({
          propertyId: this.property().id,
          checkInDate,
          checkOutDate,
        }),
      );

      this.holdId.set(hold.id);
      this.holdExpiresAt.set(new Date(hold.expiresAt));
      this.startHoldTimer(new Date(hold.expiresAt));
      this.currentStep.set('confirm');
      this.toastService.success("Sanalar 10 daqiqaga band qilindi! ⏳");
    } catch (error) {
      this.handleError(error as HttpErrorResponse);
    } finally {
      this.isLoading.set(false);
    }
  }


  protected async onConfirm(): Promise<void> {
    const { checkInDate, checkOutDate, numberOfGuests, notes } = this.bookingForm.getRawValue();
    if (!checkInDate || !checkOutDate) return;

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

      this.stopHoldTimer();
      this.currentStep.set('done');
      this.toastService.success('Bron muvaffaqiyatli yuborildi! 🎉');
    } catch (error) {
      this.handleError(error as HttpErrorResponse);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onConfirmWeb3(): void {
    const usdtPrice = Math.round(this.totalPrice() / 12600);
    const dialogRef = this.dialog.open(SmartContractModalComponent, {
      width: '450px',
      panelClass: 'web3-dialog-panel',
      data: {
        propertyName: this.property().title,
        price: usdtPrice,
        currency: 'USDT',
        hostName: this.property().hostName || 'Mulk egasi'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Smart contract muvaffaqiyatli imzolandi, endi backendga yuboramiz
        this.onConfirm();
      }
    });
  }


  protected async cancelHold(): Promise<void> {
    const hId = this.holdId();
    if (hId) {
      try {
        await firstValueFrom(this.bookingService.cancelHold(hId));
      } catch {
        // Ignore cancel errors
      }
    }
    this.stopHoldTimer();
    this.holdId.set(null);
    this.currentStep.set('dates');
    this.errorMessage.set(null);
  }


  protected async goToBookings(): Promise<void> {
    await this.router.navigate(['/bookings']);
  }


  private startHoldTimer(expiresAt: Date): void {
    this.stopHoldTimer();
    const update = () => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      this.holdExpiresIn.set(remaining);
      if (remaining === 0) {
        this.stopHoldTimer();
        if (this.currentStep() === 'confirm') {
          this.currentStep.set('dates');
          this.errorMessage.set('Sanalar band qilish muddati tugadi. Qaytadan tanlang.');
          this.toastService.warning('Vaqt tugadi. Iltimos, sanalarni qaytadan tanlang.');
        }
      }
    };
    update();
    this.holdTimerInterval = setInterval(update, 1000);
  }

  private stopHoldTimer(): void {
    if (this.holdTimerInterval !== null) {
      clearInterval(this.holdTimerInterval);
      this.holdTimerInterval = null;
    }
  }


  private handleError(error: HttpErrorResponse): void {
    switch (error?.status) {
      case 401:
        this.errorMessage.set("Bron qilish uchun avval tizimga kiring.");
        void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
        break;
      case 409:
        this.errorMessage.set("Bu sana allaqachon band. Boshqa sanani tanlang.");
        break;
      case 400:
        this.errorMessage.set(error.error?.message ?? "Ma'lumotlarni tekshirib ko'ring.");
        break;
      case 403:
        this.errorMessage.set("Bu amalni bajarish uchun ruxsat yetarli emas.");
        break;
      default:
        this.errorMessage.set("Xatolik yuz berdi. Qayta urinib ko\u2019ring.");
    }
  }

  ngOnDestroy(): void {
    this.stopHoldTimer();
  }
}

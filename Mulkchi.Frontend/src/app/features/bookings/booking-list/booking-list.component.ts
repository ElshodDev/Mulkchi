import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { BookingStatus } from '../../../core/models';
import { BookingService } from '../../../core/services/booking.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="booking-list-container">
      <div class="container">
        <div class="page-header">
          <h1>Mening bronlarim</h1>
          <p>Barcha bronlaringizni boshqaring</p>
        </div>

        <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
          <mat-tab label="Barcha">
            @if (loading()) {
              <div class="loading-container">
                <mat-progress-spinner diameter="50"></mat-progress-spinner>
                <p>Yuklanmoqda...</p>
              </div>
            } @else if (filteredBookings().length === 0) {
              <div class="empty-container">
                <mat-icon>event_busy</mat-icon>
                <h3>Bronlar yo'q</h3>
                <p>Hozircha hech qanday bron mavjud emas</p>
                <button mat-raised-button color="primary" routerLink="/properties">
                  Mulk qidirish
                </button>
              </div>
            } @else {
              <div class="bookings-list">
                @for (booking of filteredBookings(); track booking.id) {
                  <mat-card class="booking-card" [class]="getStatusClass(booking.status)">
                    <div class="booking-image">
                      @if (booking.property?.mainImageUrl) {
                        <img
                          [src]="booking.property?.mainImageUrl"
                          [alt]="booking.property?.title"
                        />
                      } @else {
                        <div class="no-image">
                          <mat-icon>home</mat-icon>
                        </div>
                      }
                    </div>

                    <div class="booking-content">
                      <div class="booking-header">
                        <h3>{{ booking.property?.title }}</h3>
                        <span class="status-badge" [class]="getStatusClass(booking.status)">
                          {{ getStatusLabel(booking.status) }}
                        </span>
                      </div>

                      <p class="location">
                        <mat-icon>location_on</mat-icon>
                        {{ booking.property?.city }}, {{ booking.property?.district }}
                      </p>

                      <div class="booking-dates">
                        <div class="date-item">
                          <mat-icon>login</mat-icon>
                          <div>
                            <span class="label">Kirish</span>
                            <span class="value">{{
                              booking.checkInDate | date: 'dd MMM yyyy'
                            }}</span>
                          </div>
                        </div>
                        <mat-icon class="arrow">arrow_forward</mat-icon>
                        <div class="date-item">
                          <mat-icon>logout</mat-icon>
                          <div>
                            <span class="label">Chiqish</span>
                            <span class="value">{{
                              booking.checkOutDate | date: 'dd MMM yyyy'
                            }}</span>
                          </div>
                        </div>
                      </div>

                      <div class="booking-footer">
                        <div class="guests-price">
                          <span class="guests">
                            <mat-icon>people</mat-icon>
                            {{ booking.numberOfGuests }} mehmon
                          </span>
                          <span class="price">{{ booking.totalPrice | number }} UZS</span>
                        </div>

                        <div class="actions">
                          <a mat-button [routerLink]="['/properties', booking.propertyId]">
                            Mulkni ko'rish
                          </a>
                          @if (canCancel(booking.status)) {
                            <button
                              mat-stroked-button
                              color="warn"
                              (click)="cancelBooking(booking.id)"
                            >
                              Bekor qilish
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  </mat-card>
                }
              </div>

              <mat-paginator
                [length]="totalCount()"
                [pageSize]="pageSize()"
                [pageSizeOptions]="[5, 10, 20]"
                (page)="onPageChange($event)"
              >
              </mat-paginator>
            }
          </mat-tab>

          <mat-tab label="Kutilmoqda">
            <div class="tab-content">
              @if (filteredByStatus(BookingStatus.Pending).length === 0) {
                <div class="empty-state">
                  <mat-icon>schedule</mat-icon>
                  <p>Kutilayotgan bronlar yo'q</p>
                </div>
              } @else {
                <div class="bookings-list">
                  @for (booking of filteredByStatus(BookingStatus.Pending); track booking.id) {
                    <ng-container
                      *ngTemplateOutlet="bookingCard; context: { $implicit: booking }"
                    ></ng-container>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Tasdiqlangan">
            <div class="tab-content">
              @if (filteredByStatus(BookingStatus.Confirmed).length === 0) {
                <div class="empty-state">
                  <mat-icon>check_circle</mat-icon>
                  <p>Tasdiqlangan bronlar yo'q</p>
                </div>
              } @else {
                <div class="bookings-list">
                  @for (booking of filteredByStatus(BookingStatus.Confirmed); track booking.id) {
                    <ng-container
                      *ngTemplateOutlet="bookingCard; context: { $implicit: booking }"
                    ></ng-container>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Bekor qilingan">
            <div class="tab-content">
              @if (filteredByStatus(BookingStatus.Cancelled).length === 0) {
                <div class="empty-state">
                  <mat-icon>cancel</mat-icon>
                  <p>Bekor qilingan bronlar yo'q</p>
                </div>
              } @else {
                <div class="bookings-list">
                  @for (booking of filteredByStatus(BookingStatus.Cancelled); track booking.id) {
                    <ng-container
                      *ngTemplateOutlet="bookingCard; context: { $implicit: booking }"
                    ></ng-container>
                  }
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>

    <ng-template #bookingCard let-booking>
      <mat-card class="booking-card" [class]="getStatusClass(booking.status)">
        <div class="booking-image">
          @if (booking.property?.mainImageUrl) {
            <img [src]="booking.property?.mainImageUrl" [alt]="booking.property?.title" />
          } @else {
            <div class="no-image">
              <mat-icon>home</mat-icon>
            </div>
          }
        </div>

        <div class="booking-content">
          <div class="booking-header">
            <h3>{{ booking.property?.title }}</h3>
            <span class="status-badge" [class]="getStatusClass(booking.status)">
              {{ getStatusLabel(booking.status) }}
            </span>
          </div>

          <p class="location">
            <mat-icon>location_on</mat-icon>
            {{ booking.property?.city }}, {{ booking.property?.district }}
          </p>

          <div class="booking-dates">
            <div class="date-item">
              <mat-icon>login</mat-icon>
              <div>
                <span class="label">Kirish</span>
                <span class="value">{{ booking.checkInDate | date: 'dd MMM yyyy' }}</span>
              </div>
            </div>
            <mat-icon class="arrow">arrow_forward</mat-icon>
            <div class="date-item">
              <mat-icon>logout</mat-icon>
              <div>
                <span class="label">Chiqish</span>
                <span class="value">{{ booking.checkOutDate | date: 'dd MMM yyyy' }}</span>
              </div>
            </div>
          </div>

          <div class="booking-footer">
            <div class="guests-price">
              <span class="guests">
                <mat-icon>people</mat-icon>
                {{ booking.numberOfGuests }} mehmon
              </span>
              <span class="price">{{ booking.totalPrice | number }} UZS</span>
            </div>

            <div class="actions">
              <a mat-button [routerLink]="['/properties', booking.propertyId]"> Mulkni ko'rish </a>
              @if (canCancel(booking.status)) {
                <button mat-stroked-button color="warn" (click)="cancelBooking(booking.id)">
                  Bekor qilish
                </button>
              }
            </div>
          </div>
        </div>
      </mat-card>
    </ng-template>
  `,
  styles: [
    `
      .booking-list-container {
        min-height: calc(100vh - 64px);
        background: #f5f5f5;
        padding: 40px 0;
      }

      .container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 0 20px;
      }

      .page-header {
        margin-bottom: 32px;
      }

      .page-header h1 {
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .page-header p {
        color: #666;
      }

      .loading-container,
      .empty-container,
      .empty-state {
        text-align: center;
        padding: 60px 20px;
      }

      .empty-container mat-icon,
      .empty-state mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #ccc;
        margin-bottom: 16px;
      }

      .bookings-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px 0;
      }

      .booking-card {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 24px;
        padding: 0;
        overflow: hidden;
      }

      .booking-card.pending {
        border-left: 4px solid #ff9800;
      }

      .booking-card.confirmed {
        border-left: 4px solid #4caf50;
      }

      .booking-card.cancelled {
        border-left: 4px solid #f44336;
      }

      .booking-card.completed {
        border-left: 4px solid #2196f3;
      }

      .booking-image {
        height: 100%;
        min-height: 200px;
      }

      .booking-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e0e0e0;
      }

      .no-image mat-icon {
        font-size: 48px;
        color: #999;
      }

      .booking-content {
        padding: 24px 24px 24px 0;
      }

      .booking-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .booking-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
      }

      .status-badge.pending {
        background: #fff3e0;
        color: #f57c00;
      }

      .status-badge.confirmed {
        background: #e8f5e9;
        color: #388e3c;
      }

      .status-badge.cancelled {
        background: #ffebee;
        color: #c62828;
      }

      .status-badge.completed {
        background: #e3f2fd;
        color: #1976d2;
      }

      .location {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #666;
        margin-bottom: 16px;
      }

      .location mat-icon {
        font-size: 16px;
      }

      .booking-dates {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .date-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .date-item mat-icon {
        color: #667eea;
      }

      .date-item .label {
        display: block;
        font-size: 0.75rem;
        color: #666;
      }

      .date-item .value {
        display: block;
        font-weight: 500;
        color: #333;
      }

      .arrow {
        color: #999;
      }

      .booking-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px solid #eee;
      }

      .guests-price {
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .guests {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #666;
      }

      .price {
        font-size: 1.25rem;
        font-weight: 700;
        color: #667eea;
      }

      .actions {
        display: flex;
        gap: 8px;
      }

      .tab-content {
        padding: 16px 0;
      }

      @media (max-width: 768px) {
        .booking-card {
          grid-template-columns: 1fr;
        }

        .booking-image {
          height: 200px;
        }

        .booking-content {
          padding: 16px;
        }

        .booking-dates {
          flex-direction: column;
          align-items: flex-start;
        }

        .arrow {
          transform: rotate(90deg);
        }

        .booking-footer {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }

        .actions {
          justify-content: stretch;
        }

        .actions button,
        .actions a {
          flex: 1;
        }
      }
    `,
  ],
})
export class BookingListComponent implements OnInit {
  private bookingService = inject(BookingService);
  private snackBar = inject(MatSnackBar);
  private confirmationService = inject(ConfirmationService);

  // Expose enum to template
  readonly BookingStatus = BookingStatus;

  bookings = this.bookingService.bookings;
  loading = this.bookingService.loading;
  totalCount = signal(0);
  pageSize = signal(10);
  currentTab = signal(0);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.bookingService.getMyBookings(1, this.pageSize()).subscribe({
      next: (result) => {
        this.totalCount.set(result.totalCount);
      },
      error: () => {
        this.snackBar.open('Bronlarni yuklashda xatolik', 'Yopish', { duration: 3000 });
      },
    });
  }

  filteredBookings() {
    const bookingsList = this.bookings();
    if (!Array.isArray(bookingsList)) {
      return [];
    }
    return bookingsList;
  }

  filteredByStatus(status: BookingStatus) {
    const bookingsList = this.bookings();
    if (!Array.isArray(bookingsList)) {
      return [];
    }
    return bookingsList.filter((b) => b.status === status);
  }

  onTabChange(index: number): void {
    this.currentTab.set(index);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.loadBookings();
  }

  getStatusClass(status: BookingStatus): string {
    return status.toLowerCase();
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.Pending:
        return 'Kutilmoqda';
      case BookingStatus.Confirmed:
        return 'Tasdiqlangan';
      case BookingStatus.Cancelled:
        return 'Bekor qilingan';
      case BookingStatus.Completed:
        return 'Yakunlangan';
      default:
        return status;
    }
  }

  canCancel(status: BookingStatus): boolean {
    return status === BookingStatus.Pending || status === BookingStatus.Confirmed;
  }

  cancelBooking(id: string): void {
    this.confirmationService
      .confirm({
        title: 'Bronni bekor qilish',
        message: 'Bu bronni bekor qilishni tasdiqlaysizmi?',
        confirmLabel: 'Bekor qilish',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.bookingService.cancelBooking(id).subscribe({
          next: () => {
            this.snackBar.open('Bron bekor qilindi', 'Yopish', { duration: 3000 });
            this.loadBookings();
          },
          error: () => {
            this.snackBar.open('Bekor qilishda xatolik', 'Yopish', { duration: 3000 });
          },
        });
      });
  }
}

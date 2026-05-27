import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { BookingService } from '../../../core/services/booking.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { Booking, BookingStatus } from '../../../core/models';

@Component({
  selector: 'app-host-bookings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    <div class="host-bookings-container">
      <div class="container">
        <div class="page-header">
          <div class="header-content">
            <h1>Bronlar boshqaruvi</h1>
            <p>Sizning mulklaringizga kelgan bronlar</p>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-cards">
          <mat-card class="stat-card pending">
            <div class="stat-icon">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="stat-info">
              <span class="value">{{ pendingCount() }}</span>
              <span class="label">Kutilmoqda</span>
            </div>
          </mat-card>
          <mat-card class="stat-card confirmed">
            <div class="stat-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <span class="value">{{ confirmedCount() }}</span>
              <span class="label">Tasdiqlangan</span>
            </div>
          </mat-card>
          <mat-card class="stat-card completed">
            <div class="stat-icon">
              <mat-icon>done_all</mat-icon>
            </div>
            <div class="stat-info">
              <span class="value">{{ completedCount() }}</span>
              <span class="label">Yakunlangan</span>
            </div>
          </mat-card>
          <mat-card class="stat-card revenue">
            <div class="stat-icon">
              <mat-icon>payments</mat-icon>
            </div>
            <div class="stat-info">
              <span class="value">{{ totalRevenue() | number }} UZS</span>
              <span class="label">Umumiy daromad</span>
            </div>
          </mat-card>
        </div>

        @if (loading()) {
          <div class="loading-container">
            <mat-progress-spinner diameter="50"></mat-progress-spinner>
            <p>Yuklanmoqda...</p>
          </div>
        } @else if (bookings().length === 0) {
          <div class="empty-container">
            <mat-icon>event_busy</mat-icon>
            <h3>Hali bronlar yo'q</h3>
            <p>Sizning mulklaringizga hali hech kim bron qilmagan</p>
          </div>
        } @else {
          <!-- Bookings Table -->
          <mat-card class="table-card">
            <table mat-table [dataSource]="bookings()">
              <!-- Guest Column -->
              <ng-container matColumnDef="guest">
                <th mat-header-cell *matHeaderCellDef>Mehmon</th>
                <td mat-cell *matCellDef="let booking">
                  <div class="guest-cell">
                    <div class="guest-avatar">
                      @if (booking.guest?.avatarUrl) {
                        <img [src]="booking.guest?.avatarUrl" [alt]="booking.guest?.firstName" />
                      } @else {
                        <mat-icon>person</mat-icon>
                      }
                    </div>
                    <div class="guest-info">
                      <span class="name"
                        >{{ booking.guest?.firstName }} {{ booking.guest?.lastName }}</span
                      >
                      <span class="phone">{{ booking.guest?.phone }}</span>
                    </div>
                  </div>
                </td>
              </ng-container>

              <!-- Property Column -->
              <ng-container matColumnDef="property">
                <th mat-header-cell *matHeaderCellDef>Mulk</th>
                <td mat-cell *matCellDef="let booking">
                  <div class="property-cell">
                    <span class="title">{{ booking.property?.title }}</span>
                    <span class="location">{{ booking.property?.city }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Dates Column -->
              <ng-container matColumnDef="dates">
                <th mat-header-cell *matHeaderCellDef>Sana</th>
                <td mat-cell *matCellDef="let booking">
                  <div class="dates-cell">
                    <span class="check-in">
                      <mat-icon>login</mat-icon>
                      {{ booking.checkInDate | date: 'dd.MM.yyyy' }}
                    </span>
                    <span class="check-out">
                      <mat-icon>logout</mat-icon>
                      {{ booking.checkOutDate | date: 'dd.MM.yyyy' }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <!-- Guests Column -->
              <ng-container matColumnDef="guests">
                <th mat-header-cell *matHeaderCellDef>Mehmonlar</th>
                <td mat-cell *matCellDef="let booking">
                  <span class="guests-count">
                    <mat-icon>people</mat-icon>
                    {{ booking.numberOfGuests }}
                  </span>
                </td>
              </ng-container>

              <!-- Total Price Column -->
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Summa</th>
                <td mat-cell *matCellDef="let booking">
                  <span class="price">{{ booking.totalPrice | number }} UZS</span>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let booking">
                  <span class="status-badge" [class]="booking.status.toLowerCase()">
                    {{ getStatusLabel(booking.status) }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Amallar</th>
                <td mat-cell *matCellDef="let booking">
                  <div class="actions-cell">
                    @if (booking.status === 'Pending') {
                      <button
                        mat-icon-button
                        color="primary"
                        (click)="confirmBooking(booking.id)"
                        matTooltip="Tasdiqlash"
                      >
                        <mat-icon>check</mat-icon>
                      </button>
                    }
                    @if (booking.status === 'Confirmed') {
                      <button
                        mat-icon-button
                        color="accent"
                        (click)="completeBooking(booking.id)"
                        matTooltip="Yakunlash"
                      >
                        <mat-icon>done_all</mat-icon>
                      </button>
                    }
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="cancelBooking(booking.id)"
                      matTooltip="Bekor qilish"
                    >
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            <mat-paginator
              [length]="bookings().length"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[5, 10, 20]"
              (page)="onPageChange($event)"
            >
            </mat-paginator>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .host-bookings-container {
        min-height: calc(100vh - 80px);
        background: #f8fafc;
        padding: 60px 0;
      }

      .container {
        max-width: 1240px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .page-header {
        margin-bottom: 48px;
      }

      .header-content h1 {
        font-size: 2.5rem;
        font-weight: 900;
        color: #0f172a;
        margin-bottom: 12px;
        letter-spacing: -1px;
      }

      .header-content p {
        color: #64748b;
        font-size: 1.1rem;
      }

      .stats-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
        margin-bottom: 48px;
      }

      .stat-card {
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(12px);
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        transition: transform 0.3s ease;
      }

      .stat-card:hover {
        transform: translateY(-5px);
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
      }

      .pending .stat-icon {
        background: #fff7ed;
        color: #ea580c;
      }
      .confirmed .stat-icon {
        background: #f0fdf4;
        color: #16a34a;
      }
      .completed .stat-icon {
        background: #f0f9ff;
        color: #0284c7;
      }
      .revenue .stat-icon {
        background: #fdf2f8;
        color: #db2777;
      }

      .stat-icon mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .stat-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .stat-info .value {
        font-size: 1.75rem;
        font-weight: 900;
        color: #0f172a;
      }
      .stat-info .label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #64748b;
      }

      .loading-container,
      .empty-container {
        text-align: center;
        padding: 100px 40px;
        background: white;
        border-radius: 32px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
      }

      .empty-container mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #cbd5e1;
        margin-bottom: 24px;
      }

      .empty-container h3 {
        font-size: 1.5rem;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 12px;
      }

      .table-card {
        border-radius: 32px;
        padding: 32px;
        border: 1px solid #f1f5f9;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.04);
        background: white;
      }

      table {
        width: 100%;
      }

      th.mat-mdc-header-cell {
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        padding-bottom: 20px !important;
      }

      td.mat-mdc-cell {
        padding: 24px 0 !important;
      }

      .guest-cell {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .guest-avatar {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      }

      .guest-info .name {
        font-size: 1rem;
        font-weight: 700;
        color: #1e293b;
        display: block;
      }
      .guest-info .phone {
        font-size: 0.85rem;
        color: #64748b;
      }

      .property-cell .title {
        font-weight: 700;
        color: #1e293b;
        display: block;
        margin-bottom: 4px;
      }
      .property-cell .location {
        font-size: 0.85rem;
        color: #94a3b8;
      }

      .dates-cell {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .dates-cell span {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.9rem;
        font-weight: 600;
      }
      .check-in {
        color: #16a34a;
      }
      .check-out {
        color: #dc2626;
      }
      .dates-cell mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .price {
        font-size: 1.1rem;
        font-weight: 900;
        color: #4f46e5;
      }

      .status-badge {
        display: inline-block;
        padding: 6px 14px;
        border-radius: 99px;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .status-badge.pending {
        background: #fff7ed;
        color: #ea580c;
      }
      .status-badge.confirmed {
        background: #f0fdf4;
        color: #16a34a;
      }
      .status-badge.completed {
        background: #f0f9ff;
        color: #0284c7;
      }
      .status-badge.cancelled {
        background: #fef2f2;
        color: #dc2626;
      }

      .actions-cell {
        display: flex;
        gap: 8px;
      }

      ::ng-deep .mat-mdc-paginator {
        background: transparent !important;
        margin-top: 24px;
      }

      @media (max-width: 1024px) {
        .stats-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 768px) {
        .header-content h1 {
          font-size: 2rem;
        }
        .stats-cards {
          grid-template-columns: 1fr;
        }
        .table-card {
          padding: 16px;
        }
      }
    `,
  ],
})
export class HostBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private snackBar = inject(MatSnackBar);
  private confirmationService = inject(ConfirmationService);

  bookings = signal<Booking[]>([]);
  loading = signal(true);
  pageSize = signal(10);
  displayedColumns = ['guest', 'property', 'dates', 'guests', 'price', 'status', 'actions'];

  pendingCount = signal(0);
  confirmedCount = signal(0);
  completedCount = signal(0);
  totalRevenue = signal(0);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);

    this.bookingService.getHostBookings().subscribe({
      next: (result) => {
        this.bookings.set(result.items);
        this.calculateStats(result.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Bronlarni yuklashda xatolik', 'Yopish', { duration: 3000 });
      },
    });
  }

  calculateStats(bookings: Booking[]): void {
    const pending = bookings.filter((b) => b.status === 'Pending').length;
    const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
    const completed = bookings.filter((b) => b.status === 'Completed').length;
    const revenue = bookings
      .filter((b) => b.status === 'Completed' || b.status === 'Confirmed')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    this.pendingCount.set(pending);
    this.confirmedCount.set(confirmed);
    this.completedCount.set(completed);
    this.totalRevenue.set(revenue);
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case 'Pending':
        return 'Kutilmoqda';
      case 'Confirmed':
        return 'Tasdiqlangan';
      case 'Cancelled':
        return 'Bekor qilingan';
      case 'Completed':
        return 'Yakunlangan';
      default:
        return status;
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
  }

  confirmBooking(id: string): void {
    this.confirmationService
      .confirm({
        title: 'Bronni tasdiqlash',
        message: 'Bu bronni tasdiqlashni xohlaysizmi?',
        confirmLabel: 'Tasdiqlash',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.bookingService.confirmBooking(id).subscribe({
          next: () => {
            this.snackBar.open('Bron tasdiqlandi', 'Yopish', { duration: 3000 });
            this.loadBookings();
          },
          error: () => {
            this.snackBar.open('Tasdiqlashda xatolik yuz berdi', 'Yopish', { duration: 3000 });
          }
        });
      });
  }

  completeBooking(_id: string): void {
    this.confirmationService
      .confirm({
        title: 'Bronni yakunlash',
        message: 'Ushbu bronni yakunlangan deb belgilaymizmi?',
        confirmLabel: 'Yakunlash',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.snackBar.open('Bron yakunlandi', 'Yopish', { duration: 3000 });
        this.loadBookings();
      });
  }

  cancelBooking(id: string): void {
    this.confirmationService
      .confirm({
        title: 'Bronni bekor qilish',
        message: 'Bu bronni bekor qilishni xohlaysizmi?',
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
             this.snackBar.open('Bekor qilishda xatolik yuz berdi', 'Yopish', { duration: 3000 });
          }
        });
      });
  }
}

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
    MatDialogModule
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
                        <img [src]="booking.guest?.avatarUrl" [alt]="booking.guest?.firstName">
                      } @else {
                        <mat-icon>person</mat-icon>
                      }
                    </div>
                    <div class="guest-info">
                      <span class="name">{{ booking.guest?.firstName }} {{ booking.guest?.lastName }}</span>
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
                      {{ booking.checkInDate | date:'dd.MM.yyyy' }}
                    </span>
                    <span class="check-out">
                      <mat-icon>logout</mat-icon>
                      {{ booking.checkOutDate | date:'dd.MM.yyyy' }}
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
                      <button mat-icon-button color="primary" (click)="confirmBooking(booking.id)" matTooltip="Tasdiqlash">
                        <mat-icon>check</mat-icon>
                      </button>
                    }
                    @if (booking.status === 'Confirmed') {
                      <button mat-icon-button color="accent" (click)="completeBooking(booking.id)" matTooltip="Yakunlash">
                        <mat-icon>done_all</mat-icon>
                      </button>
                    }
                    <button mat-icon-button color="warn" (click)="cancelBooking(booking.id)" matTooltip="Bekor qilish">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator
              [length]="bookings().length"
              [pageSize]="pageSize()"
              [pageSizeOptions]="[5, 10, 20]"
              (page)="onPageChange($event)">
            </mat-paginator>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .host-bookings-container {
      min-height: calc(100vh - 64px);
      background: #f5f5f5;
      padding: 40px 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .header-content p {
      color: #666;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pending .stat-icon {
      background: #fff3e0;
      color: #f57c00;
    }

    .confirmed .stat-icon {
      background: #e8f5e9;
      color: #388e3c;
    }

    .completed .stat-icon {
      background: #e3f2fd;
      color: #1976d2;
    }

    .revenue .stat-icon {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .stat-icon mat-icon {
      font-size: 24px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-info .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
    }

    .stat-info .label {
      font-size: 0.85rem;
      color: #666;
    }

    .loading-container,
    .empty-container {
      text-align: center;
      padding: 60px;
    }

    .empty-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .table-card {
      overflow: auto;
    }

    table {
      width: 100%;
    }

    .guest-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .guest-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .guest-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .guest-avatar mat-icon {
      font-size: 24px;
      color: #999;
    }

    .guest-info {
      display: flex;
      flex-direction: column;
    }

    .guest-info .name {
      font-weight: 500;
      color: #333;
    }

    .guest-info .phone {
      font-size: 0.85rem;
      color: #666;
    }

    .property-cell {
      display: flex;
      flex-direction: column;
    }

    .property-cell .title {
      font-weight: 500;
      color: #333;
    }

    .property-cell .location {
      font-size: 0.85rem;
      color: #666;
    }

    .dates-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dates-cell span {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.9rem;
    }

    .dates-cell mat-icon {
      font-size: 16px;
    }

    .check-in mat-icon {
      color: #4caf50;
    }

    .check-out mat-icon {
      color: #f44336;
    }

    .guests-count {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
    }

    .price {
      font-weight: 600;
      color: #667eea;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-badge.pending {
      background: #fff3e0;
      color: #f57c00;
    }

    .status-badge.confirmed {
      background: #e8f5e9;
      color: #388e3c;
    }

    .status-badge.completed {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-badge.cancelled {
      background: #ffebee;
      color: #c62828;
    }

    .actions-cell {
      display: flex;
      gap: 8px;
    }

    @media (max-width: 1024px) {
      .stats-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .stats-cards {
        grid-template-columns: 1fr;
      }

      .table-card {
        overflow-x: auto;
      }
    }
  `]
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
      }
    });
  }

  calculateStats(bookings: Booking[]): void {
    const pending = bookings.filter(b => b.status === 'Pending').length;
    const confirmed = bookings.filter(b => b.status === 'Confirmed').length;
    const completed = bookings.filter(b => b.status === 'Completed').length;
    const revenue = bookings
      .filter(b => b.status === 'Completed' || b.status === 'Confirmed')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    this.pendingCount.set(pending);
    this.confirmedCount.set(confirmed);
    this.completedCount.set(completed);
    this.totalRevenue.set(revenue);
  }

  getStatusLabel(status: BookingStatus): string {
    switch (status) {
      case 'Pending': return 'Kutilmoqda';
      case 'Confirmed': return 'Tasdiqlangan';
      case 'Cancelled': return 'Bekor qilingan';
      case 'Completed': return 'Yakunlangan';
      default: return status;
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
  }

  confirmBooking(_id: string): void {
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

        this.snackBar.open('Bron tasdiqlandi', 'Yopish', { duration: 3000 });
        this.loadBookings();
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

  cancelBooking(_id: string): void {
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

        this.snackBar.open('Bron bekor qilindi', 'Yopish', { duration: 3000 });
        this.loadBookings();
      });
  }
}

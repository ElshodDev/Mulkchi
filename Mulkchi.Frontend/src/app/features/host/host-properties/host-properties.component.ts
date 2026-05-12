import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { Property, PropertyStatus } from '../../../core/models';

@Component({
  selector: 'app-host-properties',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="host-properties-container">
      <div class="container">
        <div class="page-header">
          <div class="header-content">
            <h1>Mening mulklarim</h1>
            <p>Barcha e'lonlaringizni boshqaring</p>
          </div>
          <a mat-raised-button color="primary" routerLink="/host/properties/create">
            <mat-icon>add</mat-icon>
            Yangi mulk qo'shish
          </a>
        </div>

        @if (loading()) {
          <div class="loading-container">
            <mat-progress-spinner diameter="50"></mat-progress-spinner>
            <p>Yuklanmoqda...</p>
          </div>
        } @else if (properties().length === 0) {
          <div class="empty-container">
            <mat-icon>home_work</mat-icon>
            <h3>Hali mulk e'lonlari yo'q</h3>
            <p>O'z mulkingizni e'lon qilish uchun yangi mulk qo'shing</p>
            <a mat-raised-button color="primary" routerLink="/host/properties/create">
              <mat-icon>add</mat-icon>
              Mulk qo'shish
            </a>
          </div>
        } @else {
          <!-- Stats Cards -->
          <div class="stats-cards">
            <mat-card class="stat-card">
              <mat-icon>home</mat-icon>
              <div class="stat-info">
                <span class="value">{{ properties().length }}</span>
                <span class="label">Jami mulklar</span>
              </div>
            </mat-card>
            <mat-card class="stat-card">
              <mat-icon>visibility</mat-icon>
              <div class="stat-info">
                <span class="value">{{ totalViews() }}</span>
                <span class="label">Ko'rishlar</span>
              </div>
            </mat-card>
            <mat-card class="stat-card">
              <mat-icon>favorite</mat-icon>
              <div class="stat-info">
                <span class="value">{{ totalFavorites() }}</span>
                <span class="label">Sevimlilar</span>
              </div>
            </mat-card>
            <mat-card class="stat-card">
              <mat-icon>event_note</mat-icon>
              <div class="stat-info">
                <span class="value">{{ activeBookings() }}</span>
                <span class="label">Faol bronlar</span>
              </div>
            </mat-card>
          </div>

          <!-- Properties Table -->
          <mat-card class="table-card">
            <table mat-table [dataSource]="properties()">
              <!-- Image Column -->
              <ng-container matColumnDef="image">
                <th mat-header-cell *matHeaderCellDef>Rasm</th>
                <td mat-cell *matCellDef="let property">
                  <div class="table-image">
                    @if (property.images && property.images.length > 0) {
                      <img [src]="property.images[0].imageUrl" [alt]="property.title">
                    } @else {
                      <div class="no-image">
                        <mat-icon>image_not_supported</mat-icon>
                      </div>
                    }
                  </div>
                </td>
              </ng-container>

              <!-- Title Column -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Sarlavha</th>
                <td mat-cell *matCellDef="let property">
                  <div class="title-cell">
                    <span class="title">{{ property.title }}</span>
                    <span class="location">{{ property.city }}, {{ property.district }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Type Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Turi</th>
                <td mat-cell *matCellDef="let property">
                  <span class="type-badge">{{ property.type }}</span>
                </td>
              </ng-container>

              <!-- Price Column -->
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Narx</th>
                <td mat-cell *matCellDef="let property">
                  <div class="price-cell">
                    <span class="price">{{ getPrice(property) | number }} {{ property.currency }}</span>
                    <span class="period">{{ getPricePeriod(property) }}</span>
                  </div>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let property">
                  <span class="status-badge" [class]="property.status.toLowerCase()">
                    {{ getStatusLabel(property.status) }}
                  </span>
                </td>
              </ng-container>

              <!-- Stats Column -->
              <ng-container matColumnDef="stats">
                <th mat-header-cell *matHeaderCellDef>Statistika</th>
                <td mat-cell *matCellDef="let property">
                  <div class="stats-cell">
                    <span matTooltip="Ko'rishlar">
                      <mat-icon>visibility</mat-icon>
                      {{ property.viewsCount }}
                    </span>
                    <span matTooltip="Sevimlilar">
                      <mat-icon>favorite</mat-icon>
                      {{ property.favoritesCount }}
                    </span>
                  </div>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Amallar</th>
                <td mat-cell *matCellDef="let property">
                  <div class="actions-cell">
                    <a mat-icon-button [routerLink]="['/properties', property.id]" matTooltip="Ko'rish">
                      <mat-icon>visibility</mat-icon>
                    </a>
                    <a mat-icon-button [routerLink]="['/host/properties/edit', property.id]" matTooltip="Tahrirlash">
                      <mat-icon>edit</mat-icon>
                    </a>
                    <button mat-icon-button color="warn" (click)="deleteProperty(property.id)" matTooltip="O'chirish">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <mat-paginator
              [length]="properties().length"
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
    /* ===== CSS Variables ===== */
    :host {
      --color-navy: #1B3A6B;
      --color-navy-light: #2a4a7c;
      --color-navy-dark: #122a4d;
      --color-gold: #C9A84C;
      --color-gold-light: #d4b86a;
      --color-white: #ffffff;
      --color-gray-50: #f8fafc;
      --color-gray-100: #f1f5f9;
      --color-gray-200: #e2e8f0;
      --color-gray-300: #cbd5e1;
      --color-gray-400: #94a3b8;
      --color-gray-500: #64748b;
      --color-gray-600: #475569;
      --color-gray-700: #334155;
      --color-gray-800: #1e293b;
      --color-gray-900: #0f172a;
      --radius: 8px;
      --radius-lg: 12px;
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }

    .host-properties-container {
      min-height: calc(100vh - 64px);
      background: var(--color-gray-50);
      padding: 40px 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content h1 {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--color-navy);
      margin: 0 0 8px 0;
    }

    .header-content p {
      color: var(--color-gray-500);
      font-size: 1rem;
      margin: 0;
    }

    ::ng-deep .page-header .mat-mdc-raised-button {
      background: var(--color-navy) !important;
      color: var(--color-white) !important;
      height: 48px;
      padding: 0 24px;
      font-weight: 500;
      border-radius: var(--radius) !important;
      transition: all 0.3s ease;
    }

    ::ng-deep .page-header .mat-mdc-raised-button:hover {
      background: var(--color-navy-light) !important;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    /* ===== Loading & Empty States ===== */
    .loading-container,
    .empty-container {
      text-align: center;
      padding: 80px 20px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
    }

    .loading-container mat-icon,
    .empty-container mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: var(--color-navy);
      margin-bottom: 24px;
    }

    .empty-container h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-gray-800);
      margin: 0 0 12px 0;
    }

    .empty-container p {
      color: var(--color-gray-500);
      margin: 0 0 24px 0;
    }

    /* ===== Stats Cards ===== */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .stat-card mat-icon {
      font-size: 40px;
      width: 48px;
      height: 48px;
      color: var(--color-navy);
      background: rgba(27, 58, 107, 0.1);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-info .value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-gray-900);
      line-height: 1.2;
    }

    .stat-info .label {
      font-size: 0.9rem;
      color: var(--color-gray-500);
    }

    /* ===== Table Card ===== */
    .table-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    ::ng-deep .mat-mdc-header-cell {
      color: var(--color-gray-700) !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
      background: var(--color-gray-50) !important;
      border-bottom: 2px solid var(--color-gray-200) !important;
    }

    ::ng-deep .mat-mdc-row:hover {
      background: var(--color-gray-50) !important;
    }

    ::ng-deep .mat-mdc-cell {
      color: var(--color-gray-700) !important;
      font-size: 0.9rem !important;
    }

    /* ===== Table Image ===== */
    .table-image {
      width: 80px;
      height: 60px;
      border-radius: var(--radius);
      overflow: hidden;
    }

    .table-image img {
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
      background: var(--color-gray-200);
    }

    .no-image mat-icon {
      font-size: 24px;
      color: var(--color-gray-400);
    }

    /* ===== Title Cell ===== */
    .title-cell {
      display: flex;
      flex-direction: column;
    }

    .title-cell .title {
      font-weight: 600;
      color: var(--color-gray-900);
    }

    .title-cell .location {
      font-size: 0.85rem;
      color: var(--color-gray-500);
    }

    /* ===== Type Badge ===== */
    .type-badge {
      padding: 6px 14px;
      background: rgba(27, 58, 107, 0.1);
      color: var(--color-navy);
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    /* ===== Price Cell ===== */
    .price-cell {
      display: flex;
      flex-direction: column;
    }

    .price-cell .price {
      font-weight: 700;
      color: var(--color-navy);
      font-size: 1rem;
    }

    .price-cell .period {
      font-size: 0.8rem;
      color: var(--color-gray-500);
    }

    /* ===== Status Badge ===== */
    .status-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.active {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
    }

    .status-badge.draft {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .status-badge.sold,
    .status-badge.rented {
      background: rgba(220, 38, 38, 0.1);
      color: #dc2626;
    }

    .status-badge.archived {
      background: var(--color-gray-100);
      color: var(--color-gray-500);
    }

    /* ===== Stats Cell ===== */
    .stats-cell {
      display: flex;
      gap: 20px;
    }

    .stats-cell span {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-gray-500);
      font-size: 0.9rem;
    }

    .stats-cell mat-icon {
      font-size: 18px;
      color: var(--color-gray-400);
    }

    /* ===== Actions Cell ===== */
    .actions-cell {
      display: flex;
      gap: 8px;
    }

    ::ng-deep .actions-cell .mat-mdc-icon-button {
      color: var(--color-gray-500) !important;
      transition: all 0.3s ease;
    }

    ::ng-deep .actions-cell .mat-mdc-icon-button:hover {
      background: rgba(27, 58, 107, 0.1) !important;
      color: var(--color-navy) !important;
    }

    ::ng-deep .actions-cell .mat-mdc-icon-button.mat-warn:hover {
      background: rgba(220, 38, 38, 0.1) !important;
      color: #dc2626 !important;
    }

    /* ===== Paginator ===== */
    ::ng-deep .mat-mdc-paginator {
      background: var(--color-gray-50) !important;
      border-top: 1px solid var(--color-gray-200);
    }

    /* ===== Responsive Design ===== */
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

      .header-content h1 {
        font-size: 1.75rem;
      }

      .stats-cards {
        grid-template-columns: 1fr;
      }

      .table-card {
        overflow-x: auto;
      }

      .stat-card {
        padding: 20px;
      }

      .stat-info .value {
        font-size: 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 0 16px;
      }

      .host-properties-container {
        padding: 24px 0;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class HostPropertiesComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private confirmationService = inject(ConfirmationService);

  properties = signal<Property[]>([]);
  loading = signal(true);
  pageSize = signal(10);
  displayedColumns = ['image', 'title', 'type', 'price', 'status', 'stats', 'actions'];

  // Stats signals
  totalViews = signal(0);
  totalFavorites = signal(0);
  activeBookings = signal(0);

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading.set(true);
    
    this.propertyService.getHostProperties().subscribe({
      next: (properties) => {
        this.properties.set(properties);
        this.calculateStats(properties);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Mulklarni yuklashda xatolik', 'Yopish', { duration: 3000 });
      }
    });
  }

  calculateStats(properties: Property[] | null | undefined): void {
    // Ensure properties is an array
    const propsArray = Array.isArray(properties) ? properties : [];
    const views = propsArray.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    const favorites = propsArray.reduce((sum, p) => sum + (p.favoritesCount || 0), 0);
    
    this.totalViews.set(views);
    this.totalFavorites.set(favorites);
    this.activeBookings.set(0); // Would be fetched from bookings API
  }

  getPrice(property: Property): number {
    return property.salePrice || property.monthlyRent || property.pricePerNight || 0;
  }

  getPricePeriod(property: Property): string {
    if (property.salePrice) return '';
    if (property.monthlyRent) return '/oy';
    if (property.pricePerNight) return '/tun';
    return '';
  }

  getStatusLabel(status: PropertyStatus): string {
    switch (status) {
      case 'Active': return 'Faol';
      case 'Draft': return 'Qoralama';
      case 'Sold': return 'Sotildi';
      case 'Rented': return 'Ijaraga berildi';
      case 'Archived': return 'Arxivlangan';
      default: return status;
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
  }

  deleteProperty(id: string): void {
    this.confirmationService
      .confirm({
        title: "Mulkni o'chirish",
        message: "Bu e'lonni rostdan ham o'chirmoqchimisiz?",
        confirmLabel: "O'chirish",
        cancelLabel: 'Bekor qilish',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.propertyService.deleteProperty(id).subscribe({
          next: () => {
            this.snackBar.open('Mulk o\'chirildi', 'Yopish', { duration: 3000 });
            this.loadProperties();
          },
          error: () => {
            this.snackBar.open('O\'chirishda xatolik', 'Yopish', { duration: 3000 });
          }
        });
      });
  }
}

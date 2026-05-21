import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Property, User } from '../../../core/models';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { PropertyService } from '../../../core/services/property.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  template: `
    <div class="admin-dashboard-container">
      <div class="container">
        <div class="page-header">
          <h1>Admin panel</h1>
          <p>Tizimni boshqarish va monitoring</p>
        </div>

        <!-- Overview Cards -->
        <div class="overview-cards">
          <mat-card class="overview-card users">
            <div class="card-icon">
              <mat-icon>people</mat-icon>
            </div>
            <div class="card-info">
              <span class="value">{{ totalUsers() }}</span>
              <span class="label">Foydalanuvchilar</span>
            </div>
          </mat-card>
          <mat-card class="overview-card properties">
            <div class="card-icon">
              <mat-icon>home_work</mat-icon>
            </div>
            <div class="card-info">
              <span class="value">{{ totalProperties() }}</span>
              <span class="label">Mulk e'lonlari</span>
            </div>
          </mat-card>
          <mat-card class="overview-card bookings">
            <div class="card-icon">
              <mat-icon>event_note</mat-icon>
            </div>
            <div class="card-info">
              <span class="value">{{ totalBookings() }}</span>
              <span class="label">Bronlar</span>
            </div>
          </mat-card>
          <mat-card class="overview-card revenue">
            <div class="card-icon">
              <mat-icon>attach_money</mat-icon>
            </div>
            <div class="card-info">
              <span class="value">{{ totalRevenue() | number }} UZS</span>
              <span class="label">Umumiy daromad</span>
            </div>
          </mat-card>
        </div>

        <mat-tab-group class="dashboard-tabs">
          <!-- Users Tab -->
          <mat-tab label="Foydalanuvchilar">
            <mat-card class="table-card">
              @if (loading()) {
                <div class="loading-container">
                  <mat-progress-spinner diameter="40"></mat-progress-spinner>
                </div>
              } @else {
                <table mat-table [dataSource]="usersData">
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>Foydalanuvchi</th>
                    <td mat-cell *matCellDef="let user">
                      <div class="user-cell">
                        <div class="user-avatar">
                          @if (user.avatarUrl) {
                            <img [src]="user.avatarUrl" [alt]="user.firstName" />
                          } @else {
                            <mat-icon>person</mat-icon>
                          }
                        </div>
                        <div class="user-info">
                          <span class="name">{{ user.firstName }} {{ user.lastName }}</span>
                          <span class="email">{{ user.email }}</span>
                        </div>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef>Rol</th>
                    <td mat-cell *matCellDef="let user">
                      <span class="role-badge" [class]="user.role.toLowerCase()">
                        {{ getRoleLabel(user.role) }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="phone">
                    <th mat-header-cell *matHeaderCellDef>Telefon</th>
                    <td mat-cell *matCellDef="let user">
                      {{ user.phone || '-' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let user">
                      @if (user.isVerified) {
                        <span class="verified">
                          <mat-icon>verified</mat-icon>
                          Tasdiqlangan
                        </span>
                      } @else {
                        <span class="unverified">Tasdiqlanmagan</span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="joined">
                    <th mat-header-cell *matHeaderCellDef>Qo'shilgan</th>
                    <td mat-cell *matCellDef="let user">
                      {{ user.createdAt | date: 'dd.MM.yyyy' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Amallar</th>
                    <td mat-cell *matCellDef="let user">
                      <div class="actions-cell">
                        <button
                          mat-icon-button
                          [routerLink]="['/profile', user.id]"
                          matTooltip="Ko'rish"
                        >
                          <mat-icon>visibility</mat-icon>
                        </button>
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="deleteUser(user.id)"
                          matTooltip="O'chirish"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: userColumns"></tr>
                </table>
              }
            </mat-card>
          </mat-tab>

          <!-- Properties Tab -->
          <mat-tab label="Mulk e'lonlari">
            <mat-card class="table-card">
              @if (loading()) {
                <div class="loading-container">
                  <mat-progress-spinner diameter="40"></mat-progress-spinner>
                </div>
              } @else {
                <table mat-table [dataSource]="propertiesData">
                  <ng-container matColumnDef="property">
                    <th mat-header-cell *matHeaderCellDef>Mulk</th>
                    <td mat-cell *matCellDef="let property">
                      <div class="property-cell">
                        <div class="property-thumb">
                          @if (property.images && property.images.length > 0) {
                            <img [src]="property.images[0].imageUrl" [alt]="property.title" />
                          } @else {
                            <mat-icon>home</mat-icon>
                          }
                        </div>
                        <div class="property-info">
                          <span class="title">{{ property.title }}</span>
                          <span class="location">{{ property.city }}, {{ property.district }}</span>
                        </div>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Turi</th>
                    <td mat-cell *matCellDef="let property">
                      <span class="type-badge">{{ property.type }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="price">
                    <th mat-header-cell *matHeaderCellDef>Narx</th>
                    <td mat-cell *matCellDef="let property">
                      <span class="price"
                        >{{ getPrice(property) | number }} {{ property.currency }}</span
                      >
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let property">
                      <span class="status-badge" [class]="property.status.toLowerCase()">
                        {{ getPropertyStatusLabel(property.status) }}
                      </span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="owner">
                    <th mat-header-cell *matHeaderCellDef>Egasi</th>
                    <td mat-cell *matCellDef="let property">
                      {{ property.host?.firstName }} {{ property.host?.lastName }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Amallar</th>
                    <td mat-cell *matCellDef="let property">
                      <div class="actions-cell">
                        <a
                          mat-icon-button
                          [routerLink]="['/properties', property.id]"
                          matTooltip="Ko'rish"
                        >
                          <mat-icon>visibility</mat-icon>
                        </a>
                        <button
                          mat-icon-button
                          color="primary"
                          (click)="verifyProperty(property.id)"
                          matTooltip="Tasdiqlash"
                        >
                          <mat-icon>verified</mat-icon>
                        </button>
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="deleteProperty(property.id)"
                          matTooltip="O'chirish"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="propertyColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: propertyColumns"></tr>
                </table>
              }
            </mat-card>
          </mat-tab>

          <!-- Announcements Tab -->
          <mat-tab label="E'lonlar">
            <div class="tab-content announcement-tab">
              <p class="announcement-info">
                <mat-icon>info</mat-icon>
                E'lonlarni boshqarish uchun quyidagi tugmani bosing
              </p>
              <a mat-raised-button color="primary" routerLink="/admin/announcements">
                <mat-icon>edit</mat-icon>
                E'lonlarni boshqarish
              </a>
            </div>
          </mat-tab>

          <!-- Logs Tab -->
          <mat-tab label="Tizim loglari">
            <div class="logs-container">
              <div class="logs-header">
                <div class="logs-stats">
                  <div class="stat-item error">
                    <span class="label">Xatolar:</span>
                    <span class="value">{{ logStats()?.errorCount ?? 0 }}</span>
                  </div>
                  <div class="stat-item warning">
                    <span class="label">Ogohlantirishlar:</span>
                    <span class="value">{{ logStats()?.warningCount ?? 0 }}</span>
                  </div>
                  <div class="stat-item info">
                    <span class="label">Ma'lumot:</span>
                    <span class="value">{{ logStats()?.infoCount ?? 0 }}</span>
                  </div>
                </div>
                <button mat-stroked-button (click)="loadLogs()">
                  <mat-icon>refresh</mat-icon>
                  Yangilash
                </button>
              </div>

              <div class="logs-viewer">
                @if (logsLoading()) {
                  <div class="loading-container">
                    <mat-progress-spinner diameter="30"></mat-progress-spinner>
                  </div>
                } @else {
                  <div class="log-lines">
                    @for (line of systemLogs(); track $index) {
                      <div class="log-line" [class]="getLogLevel(line)">
                        {{ line }}
                      </div>
                    } @empty {
                      <div class="no-logs">Loglar topilmadi</div>
                    }
                  </div>
                }
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-dashboard-container {
        min-height: calc(100vh - 64px);
        background: #f5f5f5;
        padding: 40px 0;
      }

      .container {
        max-width: 1400px;
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

      .overview-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
        margin-bottom: 32px;
      }

      .overview-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px;
      }

      .card-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .users .card-icon {
        background: #e3f2fd;
        color: #1976d2;
      }

      .properties .card-icon {
        background: #e8f5e9;
        color: #388e3c;
      }

      .bookings .card-icon {
        background: #fff3e0;
        color: #f57c00;
      }

      .revenue .card-icon {
        background: #f3e5f5;
        color: #7b1fa2;
      }

      .card-icon mat-icon {
        font-size: 28px;
      }

      .card-info {
        display: flex;
        flex-direction: column;
      }

      .card-info .value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #333;
      }

      .card-info .label {
        font-size: 0.9rem;
        color: #666;
      }

      .dashboard-tabs {
        margin-top: 24px;
      }

      .table-card {
        margin-top: 16px;
        overflow: auto;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 40px;
      }

      table {
        width: 100%;
      }

      .user-cell,
      .property-cell {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-avatar,
      .property-thumb {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .user-avatar img,
      .property-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .user-avatar mat-icon,
      .property-thumb mat-icon {
        font-size: 24px;
        color: #999;
      }

      .user-info,
      .property-info {
        display: flex;
        flex-direction: column;
      }

      .user-info .name,
      .property-info .title {
        font-weight: 500;
        color: #333;
      }

      .user-info .email,
      .property-info .location {
        font-size: 0.85rem;
        color: #666;
      }

      .role-badge {
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .role-badge.guest {
        background: #e3f2fd;
        color: #1976d2;
      }

      .role-badge.host {
        background: #e8f5e9;
        color: #388e3c;
      }

      .role-badge.admin {
        background: #fff3e0;
        color: #f57c00;
      }

      .verified {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #4caf50;
      }

      .verified mat-icon {
        font-size: 18px;
      }

      .unverified {
        color: #999;
      }

      .type-badge {
        padding: 4px 12px;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 4px;
        font-size: 0.85rem;
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

      .status-badge.active {
        background: #e8f5e9;
        color: #388e3c;
      }

      .status-badge.pending {
        background: #fff3e0;
        color: #f57c00;
      }

      .actions-cell {
        display: flex;
        gap: 8px;
      }

      .tab-content {
        padding: 32px 16px;
        text-align: center;
      }

      .announcement-info {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 24px;
        color: #666;
        font-size: 16px;
      }

      .announcement-info mat-icon {
        color: #1976d2;
      }

      .tab-content a {
        display: inline-flex;
        gap: 8px;
        align-items: center;
      }

      .logs-container {
        padding: 24px 0;
      }

      .logs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .logs-stats {
        display: flex;
        gap: 24px;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
      }

      .stat-item .value {
        font-weight: 700;
      }

      .stat-item.error .value { color: #f44336; }
      .stat-item.warning .value { color: #ff9800; }
      .stat-item.info .value { color: #2196f3; }

      .logs-viewer {
        background: #1e1e1e;
        color: #d4d4d4;
        border-radius: 8px;
        padding: 16px;
        font-family: 'Cascadia Code', 'Consolas', monospace;
        font-size: 0.85rem;
        max-height: 500px;
        overflow-y: auto;
        border: 1px solid #333;
      }

      .log-line {
        padding: 2px 0;
        white-space: pre-wrap;
        border-bottom: 1px solid #2a2a2a;
      }

      .log-line.err { color: #f48771; }
      .log-line.wrn { color: #cca700; }
      .log-line.inf { color: #75beff; }

      .no-logs {
        text-align: center;
        padding: 40px;
        color: #666;
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private propertyService = inject(PropertyService);
  private snackBar = inject(MatSnackBar);
  private confirmationService = inject(ConfirmationService);
  private analyticsService = inject(AnalyticsService);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  users = signal<User[]>([]);
  properties = signal<Property[]>([]);
  loading = signal(true);

  totalUsers = signal(0);
  totalProperties = signal(0);
  totalBookings = signal(0);
  totalRevenue = signal(0);

  systemLogs = signal<string[]>([]);
  logStats = signal<any>(null);
  logsLoading = signal(false);

  userColumns = ['user', 'role', 'phone', 'status', 'joined', 'actions'];
  propertyColumns = ['property', 'type', 'price', 'status', 'owner', 'actions'];

  get usersData(): User[] {
    return this.users();
  }

  get propertiesData(): Property[] {
    return this.properties();
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadLogs(); // Loads mock logs only - no API calls
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading.set(true);

    // Analytics overview
    this.analyticsService
      .getMarketOverview()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (overview) => {
          this.totalProperties.set(overview.totalListings ?? 0);
        },
        error: () => {},
      });

    // Properties list
    this.http
      .get<any>(`${environment.apiUrl}/properties?page=1&pageSize=100`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.properties.set(result.items ?? []);
        },
        error: () => {
          this.properties.set([]);
        },
      });

    // Users list (admin endpoint)
    this.http
      .get<any>(`${environment.apiUrl}/users?page=1&pageSize=100`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          const list = Array.isArray(result) ? result : (result.items ?? []);
          this.users.set(list);
          this.totalUsers.set(list.length);
          this.loading.set(false);
        },
        error: () => {
          this.users.set([]);
          this.loading.set(false);
        },
      });

    // Bookings count
    this.http
      .get<any>(`${environment.apiUrl}/bookings?page=1&pageSize=1`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.totalBookings.set(result.totalCount ?? 0);
        },
        error: () => {},
      });
  }

  loadLogs(): void {
    this.logsLoading.set(true);
    // Mock logs for now - Backend endpoint not implemented yet
    const mockLogs = [
      '[2026-05-21 08:30:00] INF - Admin panel accessed',
      '[2026-05-21 08:25:00] INF - User logged in',
      '[2026-05-21 08:20:00] INF - Property created',
      '[2026-05-21 08:15:00] INF - System started',
    ];
    this.systemLogs.set(mockLogs);
    this.logStats.set({ errorCount: 0, warningCount: 2, infoCount: 4 });
    this.logsLoading.set(false);
  }

  getLogLevel(line: string): string {
    if (line.includes(' ERR ')) return 'err';
    if (line.includes(' WRN ')) return 'wrn';
    if (line.includes(' INF ')) return 'inf';
    return '';
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'Guest':
        return 'Mehmon';
      case 'Host':
        return 'Host';
      case 'Admin':
        return 'Admin';
      case 'SuperAdmin':
        return 'Super Admin';
      default:
        return role;
    }
  }

  getPropertyStatusLabel(status: string): string {
    switch (status) {
      case 'Active':
        return 'Faol';
      case 'Draft':
        return 'Qoralama';
      case 'Sold':
        return 'Sotildi';
      case 'Rented':
        return 'Ijarada';
      case 'Archived':
        return 'Arxivlangan';
      default:
        return status;
    }
  }

  getPrice(property: Property): number {
    return property.salePrice || property.monthlyRent || property.pricePerNight || 0;
  }

  deleteUser(id: string): void {
    this.confirmationService
      .confirm({
        title: "Foydalanuvchini o'chirish",
        message: "Bu foydalanuvchini rostdan ham o'chirmoqchimisiz?",
        confirmLabel: "O'chirish",
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.http
          .delete(`${environment.apiUrl}/users/${id}`)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open("Foydalanuvchi o'chirildi", 'Yopish', { duration: 3000 });
              this.loadDashboardData();
            },
            error: () => {
              this.snackBar.open("O'chirishda xato yuz berdi", 'Yopish', { duration: 3000 });
            },
          });
      });
  }
  verifyProperty(id: string): void {
    this.http
      .patch(`${environment.apiUrl}/properties/${id}/verify`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Mulk tasdiqlandi', 'Yopish', { duration: 3000 });
          this.loadDashboardData();
        },
        error: () => {
          this.snackBar.open('Tasdiqlashda xato yuz berdi', 'Yopish', { duration: 3000 });
        },
      });
  }

  deleteProperty(id: string): void {
    this.confirmationService
      .confirm({
        title: "Mulkni o'chirish",
        message: "Bu mulkni rostdan ham o'chirmoqchimisiz?",
        confirmLabel: "O'chirish",
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.http
          .delete(`${environment.apiUrl}/properties/${id}`)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open("Mulk o'chirildi", 'Yopish', { duration: 3000 });
              this.loadDashboardData();
            },
            error: () => {
              this.snackBar.open("O'chirishda xato yuz berdi", 'Yopish', { duration: 3000 });
            },
          });
      });
  }
}

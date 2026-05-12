import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { Property, User } from '../../../core/models';
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
                <table mat-table [dataSource]="users()">
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
                <table mat-table [dataSource]="properties()">
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
            <div class="tab-content">
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

      @media (max-width: 1200px) {
        .overview-cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .overview-cards {
          grid-template-columns: 1fr;
        }

        .page-header h1 {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private propertyService = inject(PropertyService);
  private snackBar = inject(MatSnackBar);
  private confirmationService = inject(ConfirmationService);

  users = signal<User[]>([]);
  properties = signal<Property[]>([]);
  loading = signal(true);

  totalUsers = signal(0);
  totalProperties = signal(0);
  totalBookings = signal(0);
  totalRevenue = signal(0);

  userColumns = ['user', 'role', 'phone', 'status', 'joined', 'actions'];
  propertyColumns = ['property', 'type', 'price', 'status', 'owner', 'actions'];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);

    // Simulate loading data - would be replaced with actual API calls
    setTimeout(() => {
      this.users.set([]);
      this.properties.set([]);
      this.totalUsers.set(0);
      this.totalProperties.set(0);
      this.totalBookings.set(0);
      this.totalRevenue.set(0);
      this.loading.set(false);
    }, 1000);
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

  deleteUser(_id: string): void {
    this.confirmationService
      .confirm({
        title: "Foydalanuvchini o'chirish",
        message: 'Bu foydalanuvchini rostdan ham o‘chirmoqchimisiz?',
        confirmLabel: "O'chirish",
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.snackBar.open("Foydalanuvchi o'chirildi", 'Yopish', { duration: 3000 });
        this.loadDashboardData();
      });
  }

  verifyProperty(_id: string): void {
    this.snackBar.open('Mulk tasdiqlandi', 'Yopish', { duration: 3000 });
    this.loadDashboardData();
  }

  deleteProperty(_id: string): void {
    this.confirmationService
      .confirm({
        title: "Mulkni o'chirish",
        message: 'Bu mulkni rostdan ham o‘chirmoqchimisiz?',
        confirmLabel: "O'chirish",
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.snackBar.open("Mulk o'chirildi", 'Yopish', { duration: 3000 });
        this.loadDashboardData();
      });
  }
}

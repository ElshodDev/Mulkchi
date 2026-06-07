import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterModule } from '@angular/router';
import { Gender, HostBadge, UserRole } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { AuthStore } from '../../core/stores/auth.store';
import { UIStore } from '../../core/stores/ui.store';
import { AnalyticsService, HostDashboardStats } from '../../core/services/analytics.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="profile-container">
      <div class="profile-cover">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
        <div class="cover-overlay"></div>
      </div>
      <div class="container profile-main-wrapper">
        <div class="profile-header-modern">
          <h1>{{ text().title }}</h1>
          <p>{{ text().description }}</p>
        </div>

        @if (currentUser()) {
          <div class="profile-content">
            <!-- Profile Sidebar -->
            <aside class="profile-sidebar">
              <div class="profile-card">
                <div class="avatar-section" [class.uploading]="isUploadingAvatar()">
                  @if (currentUser()?.avatarUrl) {
                    <img
                      [src]="currentUser()?.avatarUrl"
                      (error)="onProfileAvatarError($event)"
                      [alt]="currentUser()?.firstName"
                      class="avatar"
                    />
                  } @else {
                    <div class="avatar-placeholder">
                      <mat-icon>person</mat-icon>
                    </div>
                  }
                  @if (isUploadingAvatar()) {
                    <div class="avatar-loading-overlay">
                      <mat-progress-spinner
                        diameter="40"
                        mode="indeterminate"
                      ></mat-progress-spinner>
                    </div>
                  }
                  <button
                    mat-icon-button
                    class="avatar-edit-btn"
                    (click)="uploadAvatar()"
                    [disabled]="isUploadingAvatar()"
                  >
                    <mat-icon>photo_camera</mat-icon>
                  </button>
                </div>

                <div class="user-info">
                  <h2>{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</h2>
                  <p class="email">{{ currentUser()?.email }}</p>

                  <div class="badges-row">
                    @if (currentUser()?.role) {
                      <span class="role-badge" [class]="currentUser()?.role?.toLowerCase()">
                        {{ getRoleLabel(currentUser()?.role) }}
                      </span>
                    }

                    @if (currentUser()?.badge && currentUser()?.role === 'Host') {
                      <div class="host-badge">
                        <mat-icon>stars</mat-icon>
                        <span>{{ getBadgeLabel(currentUser()?.badge) }}</span>
                      </div>
                    }
                  </div>
                </div>

                <mat-divider></mat-divider>

                <div class="user-meta-info">
                  <div class="meta-item">
                    <mat-icon>calendar_today</mat-icon>
                    <span
                      >{{ text().memberSince }}:
                      {{ currentUser()?.createdDate | date: 'mediumDate' }}</span
                    >
                  </div>
                  <div class="meta-item" *ngIf="currentUser()?.isVerified">
                    <mat-icon color="primary">verified</mat-icon>
                    <span>{{ text().verifiedUser }}</span>
                  </div>
                </div>
              </div>

              <!-- Wallet Card -->
              <div class="wallet-card">
                <div class="wallet-header">
                  <h3>Mening Hamyonim</h3>
                  <mat-icon>account_balance_wallet</mat-icon>
                </div>
                <div class="wallet-balance">
                  <span class="currency">UZS</span>
                  <span class="amount">{{ walletBalance() | number }}</span>
                </div>
                <button mat-flat-button class="btn-topup" (click)="openTopupModal()">
                  <mat-icon>add_circle</mat-icon> Hisobni to'ldirish
                </button>
              </div>

              <!-- Quick Links Card -->
              <div class="quick-links-card">
                <h3>{{ text().quickActions }}</h3>
                <div class="links-grid">
                  <a routerLink="/elon-berish/tur" class="link-item">
                    <div class="icon-box"><mat-icon>add_home</mat-icon></div>
                    <span>{{ text().postAd }}</span>
                  </a>
                  <a routerLink="/messages" class="link-item">
                    <div class="icon-box"><mat-icon>chat</mat-icon></div>
                    <span>{{ text().messages }}</span>
                  </a>
                  <a routerLink="/favorites" class="link-item">
                    <div class="icon-box"><mat-icon>favorite</mat-icon></div>
                    <span>{{ text().favorites }}</span>
                  </a>
                  <a (click)="openBoostModal()" class="link-item" style="cursor: pointer;">
                    <div class="icon-box" style="background: var(--color-gold-light); color: var(--color-navy);"><mat-icon>rocket_launch</mat-icon></div>
                    <span>Tezkor Sotish</span>
                  </a>
                </div>
              </div>
            </aside>

            <!-- Profile Main Content -->
            <div class="profile-main">
              <!-- Statistics Dashboard Section -->
              <div class="stats-dashboard">
                <div class="dashboard-header">
                  <h3>{{ text().accountOverview }}</h3>
                </div>
                
                <!-- Premium Charts Section -->
                <div class="charts-container" *ngIf="stats()">
                  <div class="chart-card glass">
                    <h4>Ko'rilishlar statistikasi (Oxirgi 6 oy)</h4>
                    <canvas id="viewsChart" class="dashboard-chart"></canvas>
                  </div>
                  <div class="chart-card glass">
                    <h4>Daromad o'sishi (UZS)</h4>
                    <canvas id="revenueChart" class="dashboard-chart"></canvas>
                  </div>
                </div>
                <div class="stats-grid">
                  <div class="stat-card modern glass">
                    <div class="stat-icon listings"><mat-icon>home_work</mat-icon></div>
                    <div class="stat-content">
                      <span class="value">{{
                        stats()?.totalListings || currentUser()?.totalListings || 0
                      }}</span>
                      <span class="label">{{ text().myListings }}</span>
                    </div>
                  </div>
                  <div class="stat-card modern glass">
                    <div class="stat-icon bookings"><mat-icon>event_available</mat-icon></div>
                    <div class="stat-content">
                      <span class="value">{{
                        stats()?.totalBookings || currentUser()?.totalBookings || 0
                      }}</span>
                      <span class="label">{{ text().totalBookings }}</span>
                    </div>
                  </div>
                  <div class="stat-card modern glass">
                    <div class="stat-icon views"><mat-icon>visibility</mat-icon></div>
                    <div class="stat-content">
                      <span class="value">{{ stats()?.totalViews || 0 }}</span>
                      <span class="label">Ko'rishlar</span>
                    </div>
                  </div>
                  <div class="stat-card modern glass">
                    <div class="stat-icon rating"><mat-icon>star</mat-icon></div>
                    <div class="stat-content">
                      <span class="value">{{
                        stats()?.averageRating || currentUser()?.rating || '0.0'
                      }}</span>
                      <span class="label">{{ text().avgRating }}</span>
                    </div>
                  </div>
                  <div class="stat-card modern glass">
                    <div class="stat-icon revenue"><mat-icon>payments</mat-icon></div>
                    <div class="stat-content">
                      <span class="value"
                        >{{ stats()?.totalRevenue || 0 | number: '1.0-0' }} UZS</span
                      >
                      <span class="label">Tushum</span>
                    </div>
                  </div>
                </div>
              </div>

              <mat-card class="main-info-card">
                <mat-tab-group>
                  <mat-tab [label]="text().infoTab">
                    <div class="tab-content">
                      <div class="tab-header">
                        <h3>{{ text().personalInfo }}</h3>
                        <button
                          mat-raised-button
                          color="primary"
                          (click)="isEditing() ? saveProfile() : toggleEdit()"
                          [disabled]="isSaving()"
                        >
                          @if (isSaving()) {
                            <ng-container>
                              <mat-progress-spinner
                                diameter="20"
                                class="inline-spinner"
                              ></mat-progress-spinner>
                              <span>{{ text().saving }}</span>
                            </ng-container>
                          } @else {
                            <ng-container>
                              <mat-icon>{{ isEditing() ? 'save' : 'edit' }}</mat-icon>
                              <span>{{ isEditing() ? text().save : text().edit }}</span>
                            </ng-container>
                          }
                        </button>
                      </div>

                      <form [formGroup]="profileForm" class="profile-form">
                        <div class="form-row">
                          <mat-form-field appearance="outline">
                            <mat-label>{{ text().firstName }}</mat-label>
                            <input matInput formControlName="firstName" [readonly]="!isEditing()" />
                          </mat-form-field>

                          <mat-form-field appearance="outline">
                            <mat-label>{{ text().lastName }}</mat-label>
                            <input matInput formControlName="lastName" [readonly]="!isEditing()" />
                          </mat-form-field>
                        </div>

                        <div class="form-row">
                          <mat-form-field appearance="outline">
                            <mat-label>Email</mat-label>
                            <input matInput type="email" formControlName="email" readonly />
                            <mat-icon matSuffix>lock</mat-icon>
                          </mat-form-field>

                          <mat-form-field appearance="outline">
                            <mat-label>{{ text().phone }}</mat-label>
                            <input matInput formControlName="phone" [readonly]="!isEditing()" />
                          </mat-form-field>
                        </div>

                        <div class="form-row">
                          <mat-form-field appearance="outline">
                            <mat-label>{{ text().dob }}</mat-label>
                            <input
                              matInput
                              [matDatepicker]="picker"
                              formControlName="dateOfBirth"
                              [readonly]="!isEditing()"
                            />
                            <mat-datepicker-toggle
                              matSuffix
                              [for]="picker"
                              [disabled]="!isEditing()"
                            ></mat-datepicker-toggle>
                            <mat-datepicker #picker></mat-datepicker>
                          </mat-form-field>

                          <mat-form-field appearance="outline">
                            <mat-label>{{ text().gender }}</mat-label>
                            <mat-select
                              formControlName="gender"
                              [attr.disabled]="!isEditing() || null"
                            >
                              <mat-option [value]="'Male'">Erkak</mat-option>
                              <mat-option [value]="'Female'">Ayol</mat-option>
                              <mat-option [value]="'Other'">Boshqa</mat-option>
                            </mat-select>
                          </mat-form-field>
                        </div>

                        <div class="form-row">
                           <mat-slide-toggle (change)="enablePush()">Push bildirishnomalar</mat-slide-toggle>
                        </div>

                        @if (isEditing()) {
                          <div class="form-actions">
                            <button mat-button type="button" (click)="toggleEdit()">
                              {{ text().cancel }}
                            </button>
                          </div>
                        }
                      </form>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </mat-card>
            </div>
          </div>
        } @else {
          <div class="loading-container">
            <mat-progress-spinner diameter="50"></mat-progress-spinner>
            <p>Yuklanmoqda...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --color-navy: var(--color-primary);
        --color-navy-light: var(--color-primary-light);
        --color-navy-dark: var(--color-primary);
        --color-gold: var(--color-gold);
        --color-white: var(--color-surface);
        --color-gray-50: var(--color-background);
        --color-gray-100: var(--color-surface);
        --color-gray-200: var(--color-border);
        --color-gray-300: var(--color-border);
        --color-gray-500: var(--color-text-secondary);
        --color-gray-900: var(--color-text-primary);
        --radius-lg: 16px;
        --radius-xl: 24px;
        --shadow-lg: 0 10px 25px -3px rgb(0 0 0 / 0.1);
      }

      .profile-container {
        min-height: calc(100vh - 64px);
        background: var(--color-gray-50);
        position: relative;
        padding-bottom: 60px;
      }

      .profile-cover {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 320px;
        background: #1e293b;
        overflow: hidden;
        z-index: 0;
      }
      .blob {
        position: absolute;
        filter: blur(60px);
        opacity: 0.8;
        animation: float 10s infinite ease-in-out alternate;
      }
      .blob-1 { top: -50px; left: -10%; width: 500px; height: 500px; background: #6366f1; border-radius: 50%; }
      .blob-2 { bottom: -100px; right: -5%; width: 400px; height: 400px; background: #a855f7; border-radius: 50%; animation-delay: -5s; }
      .blob-3 { top: 20%; left: 40%; width: 300px; height: 300px; background: #ec4899; border-radius: 50%; animation-delay: -2s; }
      
      .cover-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(15,23,42,0.2) 0%, rgba(248,250,252,1) 100%);
      }

      @keyframes float {
        0% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(30px, -30px) scale(1.1); }
        100% { transform: translate(-20px, 20px) scale(0.9); }
      }

      .profile-main-wrapper {
        position: relative;
        padding-top: 140px;
        z-index: 2;
      }

      .profile-header-modern {
        margin-bottom: 32px;
        text-align: right;
        padding-right: 24px;
        color: var(--color-white);
      }

      .profile-header-modern h1 {
        font-size: 2.5rem;
        font-weight: 800;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .profile-content {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 32px;
      }

      .profile-card,
      .quick-links-card,
      .wallet-card {
        padding: 32px;
        background: white;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        margin-bottom: 24px;
      }

      .wallet-card {
        background: linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%);
        color: white;
        padding: 24px;
      }
      .wallet-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .wallet-header h3 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--color-gold);
      }
      .wallet-header mat-icon {
        color: rgba(255, 255, 255, 0.5);
      }
      .wallet-balance {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 20px;
      }
      .wallet-balance .amount {
        font-size: 2.2rem;
        font-weight: 800;
      }
      .wallet-balance .currency {
        font-size: 1rem;
        opacity: 0.8;
      }
      .btn-topup {
        width: 100%;
        background: var(--color-gold) !important;
        color: #1E1E1E !important;
        font-weight: 700 !important;
      }
      .btn-topup mat-icon {
        margin-right: 8px;
      }

      .profile-card {
        margin-top: -60px;
      }

      .avatar-section {
        position: relative;
        width: 160px;
        height: 160px;
        margin: -100px auto 24px;
      }

      .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 6px solid white;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-navy), var(--color-navy-dark));
        border: 6px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .avatar-placeholder mat-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: var(--color-gold);
      }

      .user-info {
        text-align: center;
        margin-bottom: 24px;
      }
      .user-info h2 {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-navy);
        margin: 0;
      }
      .user-info .email {
        color: var(--color-gray-500);
        margin-top: 4px;
      }

      .badges-row {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 12px;
      }

      .role-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
      }
      .role-badge.guest {
        background: var(--color-surface);
        color: var(--color-text-primary);
      }
      .role-badge.host {
        background: color-mix(in srgb, var(--color-warning) 15%, transparent);
        color: var(--color-warning);
      }
      .role-badge.admin {
        background: color-mix(in srgb, var(--color-error) 15%, transparent);
        color: var(--color-error);
      }

      .host-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--color-gold);
        font-size: 0.8rem;
        font-weight: 700;
      }

      .user-meta-info {
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .meta-item {
        display: flex;
        align-items: center;
        gap: 10px;
        color: var(--color-gray-500);
        font-size: 0.9rem;
      }
      .meta-item mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .quick-links-card h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 20px;
        color: var(--color-navy);
      }
      .links-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .link-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        color: var(--color-gray-500);
        transition: all 0.2s;
      }
      .link-item:hover {
        color: var(--color-navy);
      }
      .icon-box {
        width: 44px;
        height: 44px;
        background: var(--color-background);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .link-item:hover .icon-box {
        background: color-mix(in srgb, var(--color-info) 15%, transparent);
        color: var(--color-info);
      }
      .link-item span {
        font-size: 0.75rem;
        font-weight: 600;
        text-align: center;
      }

      .stats-dashboard {
        margin-bottom: 24px;
      }
      .dashboard-header h3 {
        font-size: 1.3rem;
        font-weight: 800;
        color: var(--color-navy);
        margin-bottom: 16px;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }

      .stat-card.modern {
        background: white;
        padding: 24px;
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        border: 1px solid var(--color-gray-200);
      }
      .stat-card.modern.glass {
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 8px 32px rgba(30, 41, 59, 0.05);
      }
      .stat-card.modern:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }
      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .stat-icon.listings {
        background: color-mix(in srgb, var(--color-info) 15%, transparent);
        color: var(--color-info);
      }
      .stat-icon.bookings {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }
      .stat-icon.views {
        background: color-mix(in srgb, var(--color-primary) 15%, transparent);
        color: var(--color-primary);
      }
      .stat-icon.rating {
        background: color-mix(in srgb, var(--color-warning) 15%, transparent);
        color: var(--color-warning);
      }
      .stat-icon.revenue {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }
      .stat-content {
        display: flex;
        flex-direction: column;
      }
      .stat-content .value {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-navy);
      }
      .stat-content .label {
        font-size: 0.85rem;
        color: var(--color-gray-500);
        font-weight: 600;
      }
      
      .charts-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 24px;
      }
      .chart-card {
        background: white;
        padding: 20px;
        border-radius: var(--radius-lg);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--color-gray-200);
      }
      .chart-card h4 {
        margin: 0 0 16px 0;
        color: var(--color-navy);
        font-weight: 700;
        font-size: 1rem;
      }
      .dashboard-chart {
        width: 100% !important;
        height: 250px !important;
      }
      
      @media (max-width: 768px) {
        .charts-container {
          grid-template-columns: 1fr;
        }
      }

      .main-info-card {
        border-radius: var(--radius-xl);
        border: none;
        box-shadow: var(--shadow-lg);
      }
      .tab-content {
        padding: 32px;
      }
      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
      }
      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }

      @media (max-width: 1024px) {
        .profile-content {
          grid-template-columns: 1fr;
        }
        .profile-sidebar {
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
        }
        .profile-header-modern {
          text-align: center;
        }
      }
      @media (max-width: 640px) {
        .stats-grid {
          grid-template-columns: 1fr 1fr;
        }
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private uiStore = inject(UIStore);
  private analyticsService = inject(AnalyticsService);
  private notificationService = inject(NotificationService);

  currentUser = this.authService.currentUser;
  isEditing = signal(false);
  isSaving = signal(false);
  walletBalance = signal(0);
  stats = signal<HostDashboardStats | null>(null);
  readonly lang = computed(() => this.uiStore.language());

  readonly text = computed(() => {
    const l = this.uiStore.language();
    const labels = {
      uz: {
        title: 'Mening profilim',
        description: 'Shaxsiy boshqaruv panelingiz',
        infoTab: "Ma'lumotlar",
        personalInfo: "Shaxsiy ma'lumotlar",
        accountOverview: 'Hisob qisqartmasi',
        myListings: "Mening e'lonlarim",
        totalBookings: 'Jami bronlar',
        avgRating: "O'rtacha reyting",
        reviews: 'Sharhlar',
        memberSince: "A'zolik sanasi",
        verifiedUser: 'Tasdiqlangan foydalanuvchi',
        quickActions: 'Tezkor harakatlar',
        postAd: "E'lon berish",
        messages: 'Xabarlar',
        favorites: 'Sevimlilar',
        firstName: 'Ism',
        lastName: 'Familiya',
        phone: 'Telefon',
        dob: "Tug'ilgan sana",
        gender: 'Jins',
        edit: 'Tahrirlash',
        save: 'Saqlash',
        saving: 'Saqlanmoqda...',
        cancel: 'Bekor qilish',
      },
      ru: {
        title: 'Мой профиль',
        description: 'Ваша личная панель управления',
        infoTab: 'Данные',
        personalInfo: 'Личные данные',
        accountOverview: 'Обзор аккаунта',
        myListings: 'Мои объявления',
        totalBookings: 'Всего броней',
        avgRating: 'Средний рейтинг',
        reviews: 'Отзывы',
        memberSince: 'Дата регистрации',
        verifiedUser: 'Подтвержденный пользователь',
        quickActions: 'Быстрые действия',
        postAd: 'Подать объявление',
        messages: 'Сообщения',
        favorites: 'Избранное',
        firstName: 'Имя',
        lastName: 'Фамилия',
        phone: 'Телефон',
        dob: 'Дата рождения',
        gender: 'Пол',
        edit: 'Ред.',
        save: 'Сохранить',
        saving: 'Сохранение...',
        cancel: 'Отмена',
      },
      en: {
        title: 'My Profile',
        description: 'Your personal dashboard',
        infoTab: 'Data',
        personalInfo: 'Personal Information',
        accountOverview: 'Account Overview',
        myListings: 'My Listings',
        totalBookings: 'Total Bookings',
        avgRating: 'Avg Rating',
        reviews: 'Reviews',
        memberSince: 'Member since',
        verifiedUser: 'Verified user',
        quickActions: 'Quick Actions',
        postAd: 'Post Ad',
        messages: 'Messages',
        favorites: 'Favorites',
        firstName: 'First Name',
        lastName: 'Last Name',
        phone: 'Phone',
        dob: 'Date of Birth',
        gender: 'Gender',
        edit: 'Edit',
        save: 'Save',
        saving: 'Saving...',
        cancel: 'Cancel',
      },
    };
    return labels[l as keyof typeof labels];
  });

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    phone: [''],
    dateOfBirth: [''],
    gender: ['' as Gender],
  });

  enablePush(): void {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.snackBar.open('Push xabarlar yoqildi!', 'Yopish', { duration: 3000 });
        }
      });
    }
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadStats();
  }

  loadStats(): void {
    const role = this.currentUser()?.role;
    if (role === 'Host' || role === 'Admin' || role === 'SuperAdmin') {
      this.analyticsService.getHostDashboardStats().subscribe({
        next: (s) => {
          this.stats.set(s);
          setTimeout(() => this.initCharts(s), 300);
        },
        error: () => console.error('Failed to load stats'),
      });
    }
  }

  initCharts(s: HostDashboardStats): void {
    const viewsCanvas = document.getElementById('viewsChart') as HTMLCanvasElement;
    const revenueCanvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!viewsCanvas || !revenueCanvas) return;

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      
      const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun'];
      
      const totalV = s.totalViews || 1500;
      const viewsData = [totalV*0.1, totalV*0.15, totalV*0.12, totalV*0.2, totalV*0.18, totalV*0.25];
      
      const ctxViews = viewsCanvas.getContext('2d');
      let gradientViews;
      if (ctxViews) {
        gradientViews = ctxViews.createLinearGradient(0, 0, 0, 250);
        gradientViews.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradientViews.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
      }

      new Chart(viewsCanvas, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: "Ko'rilishlar",
            data: viewsData,
            borderColor: '#6366f1',
            backgroundColor: gradientViews || 'rgba(99, 102, 241, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#6366f1',
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: 0.4,
            fill: true
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#f1f5f9' }, beginAtZero: true }
          }
        }
      });

      const totalR = s.totalRevenue || 5000000;
      const revData = [totalR*0.05, totalR*0.1, totalR*0.15, totalR*0.2, totalR*0.2, totalR*0.3];
      
      const ctxRev = revenueCanvas.getContext('2d');
      let gradientRev;
      if (ctxRev) {
        gradientRev = ctxRev.createLinearGradient(0, 0, 0, 250);
        gradientRev.addColorStop(0, '#10b981');
        gradientRev.addColorStop(1, '#34d399');
      }

      new Chart(revenueCanvas, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: "Tushum (UZS)",
            data: revData,
            backgroundColor: gradientRev || '#10b981',
            borderRadius: 8,
            barThickness: 24
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: '#f1f5f9' }, beginAtZero: true }
          }
        }
      });
    }).catch(e => console.warn("Chart.js yuklanmadi", e));
  }

  loadUserData(): void {
    const u = this.currentUser();
    if (u) {
      this.profileForm.patchValue({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone || '',
        dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
        gender: u.gender || 'Other',
      });
    }
  }

  toggleEdit(): void {
    this.isEditing.update((v) => !v);
    if (!this.isEditing()) this.loadUserData();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSaving.set(true);
    const data = {
      firstName: this.profileForm.value.firstName!,
      lastName: this.profileForm.value.lastName!,
      phone: this.profileForm.value.phone || undefined,
      dateOfBirth: this.profileForm.value.dateOfBirth
        ? new Date(this.profileForm.value.dateOfBirth)
        : undefined,
      gender: this.profileForm.value.gender as Gender,
    };
    this.authService.updateProfile(data).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.snackBar.open('Profil yangilandi', 'Yopish', { duration: 3000 });
      },
      error: () => {
        this.isSaving.set(false);
        this.snackBar.open('Xatolik', 'Yopish', { duration: 3000 });
      },
    });
  }

  isUploadingAvatar = signal(false);
  uploadAvatar(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => this.handleAvatar(e);
    input.click();
  }

  private handleAvatar(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.isUploadingAvatar.set(true);
      this.authService.uploadAvatar(input.files[0]).subscribe({
        next: () => {
          this.isUploadingAvatar.set(false);
          this.snackBar.open('Avatar yangilandi', 'OK');
        },
        error: () => {
          this.isUploadingAvatar.set(false);
        },
      });
    }
  }

  getRoleLabel(r?: UserRole): string {
    if (r === 'Guest') return 'Mehmon';
    if (r === 'Host') return 'Host';
    if (r === 'Admin') return 'Admin';
    if (r === 'SuperAdmin') return 'Super Admin';
    return 'User';
  }

  getBadgeLabel(b: HostBadge | undefined): string {
    if (!b) return '';
    const l: Record<string, string> = {
      New: 'Yangi',
      Rising: 'Rivojlanayotgan',
      Super: 'Super',
      Legend: 'Afsona',
    };
    return l[b] || b;
  }

  openTopupModal(): void {
    const amount = prompt("To'ldirish summasini kiriting (UZS):", "50000");
    if (amount && !isNaN(Number(amount))) {
      this.walletBalance.update(b => b + Number(amount));
      this.snackBar.open(`Hamyoningiz Click orqali ${amount} UZS ga to'ldirildi!`, 'OK', { duration: 3000 });
    }
  }

  openBoostModal(): void {
    if (this.walletBalance() < 25000) {
      this.snackBar.open("VIP status olish uchun hamyoningizda kamida 25,000 UZS bo'lishi kerak. Iltimos hamyonni to'ldiring.", "OK", { duration: 5000 });
      return;
    }
    const confirm = window.confirm("E'loningizni qidiruvlarda TOP 1 ga chiqish (VIP) uchun hamyoningizdan 25,000 UZS yechiladi. Rozimisiz?");
    if (confirm) {
      this.walletBalance.update(b => b - 25000);
      this.snackBar.open("Tabriklaymiz! E'loningiz VIP statusiga o'tdi va TOP ga chiqdi 🚀", "Ajoyib", { duration: 5000 });
    }
  }

  onProfileAvatarError(event: any): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/placeholder-avatar.png';
  }
}

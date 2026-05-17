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
import { ConfirmationService } from '../../core/services/confirmation.service';
import { AuthStore } from '../../core/stores/auth.store';
import { UIStore } from '../../core/stores/ui.store';

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
      <div class="profile-cover"></div>
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
                    <span>{{ text().memberSince }}: {{ currentUser()?.createdDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="meta-item" *ngIf="currentUser()?.isVerified">
                    <mat-icon color="primary">verified</mat-icon>
                    <span>{{ text().verifiedUser }}</span>
                  </div>
                </div>
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
                <div class="stats-grid">
                  <div class="stat-card modern">
                    <div class="stat-icon listings"><mat-icon>home_work</mat-icon></div>
                    <div class="stat-content">
                      <span class="value">{{ currentUser()?.totalListings || 0 }}</span>
                      <span class="label">{{ text().myListings }}</span>
                    </div>
                  </div>
                  <div class="stat-card modern">
                    <div class="stat-icon bookings"><mat-icon>event_available</mat-icon></div>
                    <div class="stat-content">
                      <span class="value">{{ currentUser()?.totalBookings || 0 }}</span>
                      <span class="label">{{ text().totalBookings }}</span>
                    </div>
                  </div>
                  <div class="stat-card modern">
                    <div class="stat-icon rating"><mat-icon>star</mat-icon></div>
                    <div class="stat-content">
                      <span class="value">{{ currentUser()?.rating || '5.0' }}</span>
                      <span class="label">{{ text().avgRating }}</span>
                    </div>
                  </div>
                  <div class="stat-card modern">
                    <div class="stat-icon reviews"><mat-icon>reviews</mat-icon></div>
                    <div class="stat-content">
                      <span class="value">{{ (currentUser()?.totalBookings || 0) + 2 }}</span>
                      <span class="label">{{ text().reviews }}</span>
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
                              <mat-progress-spinner diameter="20" class="inline-spinner"></mat-progress-spinner>
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

                        @if (isEditing()) {
                          <div class="form-actions">
                            <button mat-button type="button" (click)="toggleEdit()">{{ text().cancel }}</button>
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
  styles: [`
      :host {
        --color-navy: #1b3a6b;
        --color-navy-light: #2a4a7c;
        --color-navy-dark: #122a4d;
        --color-gold: #c9a84c;
        --color-white: #ffffff;
        --color-gray-50: #f8fafc;
        --color-gray-100: #f1f5f9;
        --color-gray-200: #e2e8f0;
        --color-gray-300: #cbd5e1;
        --color-gray-500: #64748b;
        --color-gray-900: #0f172a;
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
        height: 280px;
        background: linear-gradient(135deg, var(--color-navy-dark) 0%, var(--color-navy) 50%, var(--color-navy-light) 100%);
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
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
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

      /* Sidebar Styles */
      .profile-card, .quick-links-card {
        padding: 32px;
        background: white;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        margin-bottom: 24px;
      }

      .profile-card { margin-top: -60px; }

      .avatar-section {
        position: relative;
        width: 160px;
        height: 160px;
        margin: -100px auto 24px;
      }

      .avatar {
        width: 100%; height: 100%; border-radius: 50%;
        object-fit: cover; border: 6px solid white;
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      }

      .avatar-placeholder {
        width: 100%; height: 100%; border-radius: 50%;
        background: linear-gradient(135deg, var(--color-navy), var(--color-navy-dark));
        border: 6px solid white; display: flex; align-items: center; justify-content: center;
      }

      .avatar-placeholder mat-icon { font-size: 72px; width: 72px; height: 72px; color: var(--color-gold); }

      .user-info { text-align: center; margin-bottom: 24px; }
      .user-info h2 { font-size: 1.5rem; font-weight: 800; color: var(--color-navy); margin: 0; }
      .user-info .email { color: var(--color-gray-500); margin-top: 4px; }

      .badges-row { display: flex; justify-content: center; gap: 8px; margin-top: 12px; }

      .role-badge { padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
      .role-badge.guest { background: #f1f5f9; color: #475569; }
      .role-badge.host { background: #fffbeb; color: #b45309; }
      .role-badge.admin { background: #fef2f2; color: #dc2626; }

      .host-badge { display: flex; align-items: center; gap: 4px; color: var(--color-gold); font-size: 0.8rem; font-weight: 700; }

      .user-meta-info { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
      .meta-item { display: flex; align-items: center; gap: 10px; color: var(--color-gray-500); font-size: 0.9rem; }
      .meta-item mat-icon { font-size: 18px; width: 18px; height: 18px; }

      .quick-links-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 20px; color: var(--color-navy); }
      .links-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .link-item { display: flex; flex-direction: column; align-items: center; gap: 8px; text-decoration: none; color: var(--color-gray-500); transition: all 0.2s; }
      .link-item:hover { color: var(--color-navy); }
      .icon-box { width: 44px; height: 44px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
      .link-item:hover .icon-box { background: #eff6ff; color: #3b82f6; }
      .link-item span { font-size: 0.75rem; font-weight: 600; text-align: center; }

      /* Main Content Styles */
      .stats-dashboard { margin-bottom: 24px; }
      .dashboard-header h3 { font-size: 1.3rem; font-weight: 800; color: var(--color-navy); margin-bottom: 16px; }
      .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
      
      .stat-card.modern {
        background: white; padding: 24px; border-radius: var(--radius-lg);
        display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        transition: transform 0.2s;
      }
      .stat-card.modern:hover { transform: translateY(-4px); }
      .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
      .stat-icon.listings { background: #eff6ff; color: #2563eb; }
      .stat-icon.bookings { background: #f0fdf4; color: #16a34a; }
      .stat-icon.rating { background: #fffbeb; color: #d97706; }
      .stat-icon.reviews { background: #faf5ff; color: #7c3aed; }
      .stat-content { display: flex; flex-direction: column; }
      .stat-content .value { font-size: 1.5rem; font-weight: 800; color: var(--color-navy); }
      .stat-content .label { font-size: 0.85rem; color: var(--color-gray-500); font-weight: 600; }

      .main-info-card { border-radius: var(--radius-xl); border: none; box-shadow: var(--shadow-lg); }
      .tab-content { padding: 32px; }
      .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
      .profile-form { display: flex; flex-direction: column; gap: 20px; }
      .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

      @media (max-width: 1024px) {
        .profile-content { grid-template-columns: 1fr; }
        .profile-sidebar { max-width: 600px; margin: 0 auto; width: 100%; }
        .profile-header-modern { text-align: center; }
      }
      @media (max-width: 640px) {
        .stats-grid { grid-template-columns: 1fr 1fr; }
        .form-row { grid-template-columns: 1fr; }
      }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authStore = inject(AuthStore);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private uiStore = inject(UIStore);

  currentUser = this.authService.currentUser;
  isEditing = signal(false);
  isSaving = signal(false);
  readonly lang = computed(() => this.uiStore.language());

  readonly text = computed(() => {
    const l = this.uiStore.language();
    const labels = {
      uz: {
        title: 'Mening profilim',
        description: "Shaxsiy boshqaruv panelingiz",
        infoTab: "Ma'lumotlar",
        personalInfo: "Shaxsiy ma'lumotlar",
        accountOverview: 'Hisob qisqartmasi',
        myListings: "Mening e'lonlarim",
        totalBookings: 'Jami bronlar',
        avgRating: 'O\'rtacha reyting',
        reviews: 'Sharhlar',
        memberSince: 'A\'zolik sanasi',
        verifiedUser: 'Tasdiqlangan foydalanuvchi',
        quickActions: 'Tezkor harakatlar',
        postAd: 'E\'lon berish',
        messages: 'Xabarlar',
        favorites: 'Sevimlilar',
        firstName: 'Ism', lastName: 'Familiya', phone: 'Telefon', dob: 'Tug\'ilgan sana', gender: 'Jins',
        edit: 'Tahrirlash', save: 'Saqlash', saving: 'Saqlanmoqda...', cancel: 'Bekor qilish'
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
        firstName: 'Имя', lastName: 'Фамилия', phone: 'Телефон', dob: 'Дата рождения', gender: 'Пол',
        edit: 'Ред.', save: 'Сохранить', saving: 'Сохранение...', cancel: 'Отмена'
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
        firstName: 'First Name', lastName: 'Last Name', phone: 'Phone', dob: 'Date of Birth', gender: 'Gender',
        edit: 'Edit', save: 'Save', saving: 'Saving...', cancel: 'Cancel'
      }
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

  ngOnInit(): void { this.loadUserData(); }

  loadUserData(): void {
    const u = this.currentUser();
    if (u) {
      this.profileForm.patchValue({
        firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '',
        dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
        gender: u.gender || 'Other',
      });
    }
  }

  toggleEdit(): void {
    this.isEditing.update(v => !v);
    if (!this.isEditing()) this.loadUserData();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.isSaving.set(true);
    const data = {
      firstName: this.profileForm.value.firstName!,
      lastName: this.profileForm.value.lastName!,
      phone: this.profileForm.value.phone || undefined,
      dateOfBirth: this.profileForm.value.dateOfBirth ? new Date(this.profileForm.value.dateOfBirth) : undefined,
      gender: this.profileForm.value.gender as Gender,
    };
    this.authService.updateProfile(data).subscribe({
      next: () => {
        this.isSaving.set(false); this.isEditing.set(false);
        this.snackBar.open('Profil yangilandi', 'Yopish', { duration: 3000 });
      },
      error: () => { this.isSaving.set(false); this.snackBar.open('Xatolik', 'Yopish', { duration: 3000 }); }
    });
  }

  isUploadingAvatar = signal(false);
  uploadAvatar(): void {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => this.handleAvatar(e);
    input.click();
  }

  private handleAvatar(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.isUploadingAvatar.set(true);
      this.authService.uploadAvatar(input.files[0]).subscribe({
        next: () => { this.isUploadingAvatar.set(false); this.snackBar.open('Avatar yangilandi', 'OK'); },
        error: () => { this.isUploadingAvatar.set(false); }
      });
    }
  }

  getRoleLabel(r?: UserRole): string {
    if (r === 'Guest') return 'Mehmon';
    if (r === 'Host') return 'Host';
    if (r === 'Admin') return 'Admin';
    return 'User';
  }

  getBadgeLabel(b: HostBadge | undefined): string {
    if (!b) return '';
    const l: Record<string, string> = { 'New': 'Yangi', 'Rising': 'Rivojlanayotgan', 'Super': 'Super', 'Legend': 'Afsona' };
    return l[b] || b;
  }
}

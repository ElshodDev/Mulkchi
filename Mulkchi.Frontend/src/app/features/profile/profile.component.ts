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
      <div class="container">
        <div class="profile-header">
          <h1>{{ text().title }}</h1>
          <p>{{ text().description }}</p>
        </div>

        @if (currentUser()) {
          <div class="profile-content">
            <!-- Profile Sidebar -->
            <aside class="profile-sidebar">
              <mat-card class="profile-card">
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

                <mat-divider></mat-divider>

                <div class="user-stats">
                  @if (currentUser()?.role === 'Host') {
                    <div class="stat">
                      <span class="value">{{ currentUser()?.totalListings || 0 }}</span>
                      <span
                        class="label"
                        >{{ lang() === 'en' ? 'Listings' : lang() === 'ru' ? 'Объявления' : "E'lonlar" }}</span
                      >
                    </div>
                  }
                  <div class="stat">
                    <span class="value">{{ currentUser()?.totalBookings || 0 }}</span>
                    <span class="label">{{
                      lang() === 'en' ? 'Bookings' : lang() === 'ru' ? 'Бронирования' : 'Bronlar'
                    }}</span>
                  </div>
                  @if (currentUser()?.rating) {
                    <div class="stat">
                      <span class="value">{{ currentUser()?.rating }}</span>
                      <span class="label">{{
                        lang() === 'en' ? 'Rating' : lang() === 'ru' ? 'Рейтинг' : 'Reyting'
                      }}</span>
                    </div>
                  }
                </div>

                @if (currentUser()?.isVerified) {
                  <div class="verified-badge">
                    <mat-icon color="primary">verified</mat-icon>
                    <span>{{
                      lang() === 'en'
                        ? 'Verified user'
                        : lang() === 'ru'
                          ? 'Подтверждённый пользователь'
                          : 'Tasdiqlangan foydalanuvchi'
                    }}</span>
                  </div>
                }
              </mat-card>
            </aside>

            <!-- Profile Main Content -->
            <div class="profile-main">
              <mat-card>
                <mat-tab-group>
                  <!-- Personal Info Tab -->
                  <mat-tab [label]="text().infoTab">
                    <div class="tab-content">
                      <div class="tab-header">
                        <h3>{{ text().infoTab }}</h3>
                        <button
                          mat-raised-button
                          color="primary"
                          (click)="isEditing() ? saveProfile() : toggleEdit()"
                          [disabled]="isSaving()"
                        >
                          @if (isSaving()) {
                            <mat-progress-spinner
                              diameter="20"
                              class="inline-spinner"
                            ></mat-progress-spinner>
                            <span>{{ text().saving }}</span>
                          } @else if (isEditing()) {
                            <ng-container>
                              <mat-icon>save</mat-icon>
                              <span>{{
                                lang() === 'en' ? 'Save' : lang() === 'ru' ? 'Сохранить' : 'Saqlash'
                              }}</span>
                            </ng-container>
                          } @else {
                            <ng-container>
                              <mat-icon>edit</mat-icon>
                              <span>{{
                                lang() === 'en'
                                  ? 'Edit'
                                  : lang() === 'ru'
                                    ? 'Редактировать'
                                    : 'Tahrirlash'
                              }}</span>
                            </ng-container>
                          }
                        </button>
                      </div>

                      <form [formGroup]="profileForm" class="profile-form">
                        <div class="form-row">
                          <mat-form-field appearance="outline">
                            <mat-label>{{
                              lang() === 'en' ? 'First name' : lang() === 'ru' ? 'Имя' : 'Ism'
                            }}</mat-label>
                            <input matInput formControlName="firstName" [readonly]="!isEditing()" />
                          </mat-form-field>

                          <mat-form-field appearance="outline">
                            <mat-label>{{
                              lang() === 'en'
                                ? 'Last name'
                                : lang() === 'ru'
                                  ? 'Фамилия'
                                  : 'Familiya'
                            }}</mat-label>
                            <input matInput formControlName="lastName" [readonly]="!isEditing()" />
                          </mat-form-field>
                        </div>

                        <div class="form-row">
                          <mat-form-field appearance="outline">
                            <mat-label>{{
                              lang() === 'en' ? 'Email' : lang() === 'ru' ? 'Email' : 'Email'
                            }}</mat-label>
                            <input matInput type="email" formControlName="email" readonly />
                            <mat-icon matSuffix>lock</mat-icon>
                          </mat-form-field>

                          <mat-form-field appearance="outline">
                            <mat-label>{{
                              lang() === 'en' ? 'Phone' : lang() === 'ru' ? 'Телефон' : 'Telefon'
                            }}</mat-label>
                            <input matInput formControlName="phone" [readonly]="!isEditing()" />
                          </mat-form-field>
                        </div>

                        <div class="form-row">
                          <mat-form-field appearance="outline">
                            <mat-label>{{ dobLabel() }}</mat-label>
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
                            <mat-label>{{
                              lang() === 'en' ? 'Gender' : lang() === 'ru' ? 'Пол' : 'Jins'
                            }}</mat-label>
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

                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>{{
                            lang() === 'en' ? 'Address' : lang() === 'ru' ? 'Адрес' : 'Manzil'
                          }}</mat-label>
                          <textarea
                            matInput
                            formControlName="address"
                            rows="3"
                            [readonly]="!isEditing()"
                          ></textarea>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>{{
                            lang() === 'en' ? 'Bio' : lang() === 'ru' ? 'О себе' : 'Bio'
                          }}</mat-label>
                          <textarea
                            matInput
                            formControlName="bio"
                            rows="4"
                            [readonly]="!isEditing()"
                            placeholder="O'zingiz haqingizda qisqacha ma'lumot..."
                          ></textarea>
                        </mat-form-field>

                        @if (isEditing()) {
                          <div class="form-actions">
                            <button mat-button type="button" (click)="toggleEdit()">
                              {{
                                lang() === 'en'
                                  ? 'Cancel'
                                  : lang() === 'ru'
                                    ? 'Отмена'
                                    : 'Bekor qilish'
                              }}
                            </button>
                          </div>
                        }
                      </form>
                    </div>
                  </mat-tab>

                  <!-- Security Tab -->
                  <mat-tab [label]="text().securityTab">
                    <div class="tab-content">
                      <h3>{{ text().changePasswordTitle }}</h3>

                      <form
                        [formGroup]="passwordForm"
                        (ngSubmit)="changePassword()"
                        class="password-form"
                      >
                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>{{
                            lang() === 'en'
                              ? 'Current password'
                              : lang() === 'ru'
                                ? 'Текущий пароль'
                                : 'Joriy parol'
                          }}</mat-label>
                          <input matInput type="password" formControlName="currentPassword" />
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>{{
                            lang() === 'en'
                              ? 'New password'
                              : lang() === 'ru'
                                ? 'Новый пароль'
                                : 'Yangi parol'
                          }}</mat-label>
                          <input matInput type="password" formControlName="newPassword" />
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="full-width">
                          <mat-label>{{
                            lang() === 'en'
                              ? 'Confirm new password'
                              : lang() === 'ru'
                                ? 'Подтвердите пароль'
                                : 'Yangi parolni tasdiqlash'
                          }}</mat-label>
                          <input matInput type="password" formControlName="confirmPassword" />
                          @if (passwordForm.hasError('mismatch')) {
                            <mat-error>{{
                              lang() === 'en'
                                ? 'Passwords do not match'
                                : lang() === 'ru'
                                  ? 'Пароли не совпадают'
                                  : 'Parollar mos kelmadi'
                            }}</mat-error>
                          }
                        </mat-form-field>

                        <button
                          mat-raised-button
                          color="primary"
                          type="submit"
                          [disabled]="passwordForm.invalid || isChangingPassword()"
                        >
                          @if (isChangingPassword()) {
                            <mat-progress-spinner
                              diameter="20"
                              class="inline-spinner"
                            ></mat-progress-spinner>
                            <span>{{ text().saving }}</span>
                          } @else {
                            <span>{{ text().changePassword }}</span>
                          }
                        </button>
                      </form>
                    </div>
                  </mat-tab>

                  <!-- Settings Tab -->
                  <mat-tab [label]="text().settingsTab">
                    <div class="tab-content">
                      <h3>{{ text().languageSettings }}</h3>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>{{ text().interfaceLanguage }}</mat-label>
                        <mat-select
                          [value]="selectedLanguage()"
                          (selectionChange)="changeLanguage($event)"
                        >
                          <mat-option value="uz">O'zbekcha</mat-option>
                          <mat-option value="ru">Русский</mat-option>
                          <mat-option value="en">English</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <mat-divider class="section-divider"></mat-divider>

                      <h3>{{ text().notifications }}</h3>

                      <div class="notification-settings">
                        <div class="setting-item">
                          <span>{{ text().emailNotifications }}</span>
                          <mat-icon color="primary">toggle_on</mat-icon>
                        </div>
                        <div class="setting-item">
                          <span>{{ text().smsNotifications }}</span>
                          <mat-icon color="primary">toggle_on</mat-icon>
                        </div>
                        <div class="setting-item">
                          <span>{{ text().marketingMessages }}</span>
                          <mat-icon>toggle_off</mat-icon>
                        </div>
                      </div>

                      <mat-divider class="section-divider"></mat-divider>

                      <h3 class="danger-zone">{{ text().dangerZone }}</h3>

                      <div class="danger-actions">
                        <button mat-stroked-button color="warn" (click)="deleteAccount()">
                          <mat-icon>delete_forever</mat-icon>
                          {{ text().deleteAccountButton }}
                        </button>
                      </div>
                    </div>
                  </mat-tab>

                  <!-- Host Mode Tab -->
                  @if (isHostOrAdmin()) {
                    <mat-tab [label]="text().hostModeTab">
                      <div class="tab-content">
                        <div class="mode-section">
                          <h3>{{ text().currentMode }}</h3>
                          <div class="mode-display">
                            <div class="mode-card" [class.active]="isInHostMode()">
                              <mat-icon>business</mat-icon>
                              <span>{{ text().hostMode }}</span>
                            </div>
                            <div class="mode-separator">
                              <mat-icon>swap_horiz</mat-icon>
                            </div>
                            <div class="mode-card" [class.active]="!isInHostMode()">
                              <mat-icon>person</mat-icon>
                              <span>{{ text().guestMode }}</span>
                            </div>
                          </div>

                          <mat-divider class="section-divider"></mat-divider>

                          <div class="mode-info">
                            @if (isInHostMode()) {
                              <div class="mode-description">
                                <mat-icon>info</mat-icon>
                                <div>
                                  <h4>{{ text().hostModeActive }}</h4>
                                  <p>{{ text().hostModeDescription }}</p>
                                </div>
                              </div>
                              <button
                                mat-raised-button
                                color="primary"
                                (click)="switchToGuestMode()"
                                [disabled]="isSwitchingMode()"
                              >
                                @if (isSwitchingMode()) {
                                  <mat-progress-spinner
                                    diameter="20"
                                    class="inline-spinner"
                                  ></mat-progress-spinner>
                                  <span>{{ text().switching }}</span>
                                } @else {
                                  <ng-container>
                                    <mat-icon>person</mat-icon>
                                    <span>{{ text().switchToGuest }}</span>
                                  </ng-container>
                                }
                              </button>
                            } @else {
                              <div class="mode-description">
                                <mat-icon>info</mat-icon>
                                <div>
                                  <h4>{{ text().guestModeActive }}</h4>
                                  <p>{{ text().guestModeDescription }}</p>
                                </div>
                              </div>
                              <button
                                mat-raised-button
                                color="primary"
                                (click)="switchToHostMode()"
                                [disabled]="isSwitchingMode()"
                              >
                                @if (isSwitchingMode()) {
                                  <mat-progress-spinner
                                    diameter="20"
                                    class="inline-spinner"
                                  ></mat-progress-spinner>
                                  <span>{{ text().switching }}</span>
                                } @else {
                                  <ng-container>
                                    <mat-icon>business</mat-icon>
                                    <span>{{ text().switchToHost }}</span>
                                  </ng-container>
                                }
                              </button>
                            }
                          </div>

                          @if (isInHostMode()) {
                            <mat-divider class="section-divider"></mat-divider>
                            <h3>{{ text().hostTools }}</h3>
                            <div class="host-actions">
                              <a mat-stroked-button routerLink="/host/properties">
                                <mat-icon>dashboard</mat-icon>
                                {{ text().hostPanel }}
                              </a>
                              <button mat-stroked-button routerLink="/listings/create">
                                <mat-icon>add_home</mat-icon>
                                {{ text().createListing }}
                              </button>
                            </div>
                          }
                        </div>
                      </div>
                    </mat-tab>
                  }
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
      /* ===== CSS Variables ===== */
      :host {
        --color-navy: #1b3a6b;
        --color-navy-light: #2a4a7c;
        --color-navy-dark: #122a4d;
        --color-gold: #c9a84c;
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
        --radius-xl: 16px;
        --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      }

      .profile-container {
        min-height: calc(100vh - 64px);
        background: var(--color-gray-50);
        padding: 40px 0;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }

      /* ===== Profile Header ===== */
      .profile-header {
        margin-bottom: 40px;
      }

      .profile-header h1 {
        font-size: 2.25rem;
        font-weight: 700;
        color: var(--color-navy);
        margin: 0 0 8px 0;
      }

      .profile-header p {
        color: #444444;
        font-size: 1.125rem;
        margin: 0;
      }

      /* ===== Profile Content ===== */
      .profile-content {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 32px;
      }

      .profile-sidebar {
        height: fit-content;
      }

      .profile-card {
        padding: 32px 24px;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
      }

      /* ===== Avatar Section ===== */
      .avatar-section {
        position: relative;
        width: 140px;
        height: 140px;
        margin: 0 auto 28px;
      }

      .avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        border: 4px solid var(--color-navy);
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: var(--color-navy);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .avatar-placeholder mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: var(--color-gold);
      }

      .avatar-edit-btn {
        position: absolute;
        bottom: 4px;
        right: 4px;
        background: var(--color-white) !important;
        box-shadow: var(--shadow);
        border: 2px solid var(--color-navy) !important;
        transition: all 0.3s ease;
      }

      .avatar-edit-btn:hover {
        background: var(--color-navy) !important;
      }

      .avatar-edit-btn:hover mat-icon {
        color: var(--color-gold) !important;
      }

      .avatar-section.uploading .avatar,
      .avatar-section.uploading .avatar-placeholder {
        opacity: 0.5;
      }

      .avatar-loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }

      /* ===== User Info ===== */
      .user-info {
        text-align: center;
        margin-bottom: 28px;
      }

      .user-info h2 {
        font-size: 1.375rem;
        font-weight: 700;
        color: var(--color-gray-900);
        margin: 0 0 6px 0;
      }

      .user-info .email {
        color: var(--color-gray-500);
        font-size: 0.9rem;
        margin-bottom: 16px;
      }

      /* ===== Role Badge ===== */
      .role-badge {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .role-badge.guest {
        background: rgba(27, 58, 107, 0.1);
        color: var(--color-navy);
      }

      .role-badge.host {
        background: rgba(201, 168, 76, 0.15);
        color: var(--color-navy);
      }

      .role-badge.admin {
        background: rgba(220, 38, 38, 0.1);
        color: #dc2626;
      }

      /* ===== Host Badge ===== */
      .host-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 12px;
        color: var(--color-gold);
        font-size: 0.9rem;
        font-weight: 500;
      }

      .host-badge mat-icon {
        font-size: 18px;
      }

      /* ===== User Stats ===== */
      .user-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        text-align: center;
        padding: 8px 0;
      }

      .user-stats .stat .value {
        display: block;
        font-size: 1.625rem;
        font-weight: 700;
        color: var(--color-navy);
        line-height: 1.2;
      }

      .user-stats .stat .label {
        font-size: 0.8rem;
        color: var(--color-gray-500);
      }

      /* ===== Verified Badge ===== */
      .verified-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 24px;
        padding: 12px 16px;
        background: rgba(34, 197, 94, 0.1);
        border-radius: var(--radius);
        color: #16a34a;
        font-size: 0.9rem;
        font-weight: 500;
      }

      /* ===== Profile Main ===== */
      .profile-main mat-card {
        min-height: 600px;
        background: var(--color-white);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
      }

      ::ng-deep .mat-mdc-tab-group {
        --mdc-secondary-navigation-tab-container-height: 56px;
      }

      ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
        color: var(--color-gray-500);
        font-weight: 500;
      }

      ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
        color: var(--color-navy) !important;
      }

      ::ng-deep .mat-mdc-tab .mdc-tab-indicator__content--underline {
        border-color: var(--color-navy) !important;
      }

      ::ng-deep .mat-mdc-tab:hover .mdc-tab__text-label {
        color: var(--color-navy);
      }

      .tab-content {
        padding: 32px;
      }

      /* ===== Tab Header ===== */
      .tab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 28px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .tab-header h3 {
        font-size: 1.375rem;
        font-weight: 600;
        color: var(--color-gray-900);
        margin: 0;
      }

      ::ng-deep .tab-header .mat-mdc-raised-button {
        background: var(--color-navy) !important;
        color: var(--color-white) !important;
        border-radius: var(--radius) !important;
        transition: all 0.3s ease;
      }

      ::ng-deep .tab-header .mat-mdc-raised-button:hover:not([disabled]) {
        background: var(--color-navy-light) !important;
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      ::ng-deep
        .tab-header
        .mat-mdc-progress-spinner
        .mdc-circular-progress__indeterminate-circle-graphic {
        stroke: var(--color-gold) !important;
      }

      /* ===== Profile Form ===== */
      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      .full-width {
        width: 100%;
      }

      ::ng-deep .profile-form .mat-mdc-form-field-focus-overlay {
        background-color: var(--color-navy) !important;
      }

      ::ng-deep .profile-form .mat-mdc-text-field-wrapper {
        background-color: var(--color-gray-50);
      }

      ::ng-deep .profile-form .mdc-text-field--focused .mdc-floating-label {
        color: var(--color-navy) !important;
      }

      ::ng-deep .profile-form .mdc-text-field--outlined .mdc-notched-outline__leading,
      ::ng-deep .profile-form .mdc-text-field--outlined .mdc-notched-outline__notch,
      ::ng-deep .profile-form .mdc-text-field--outlined .mdc-notched-outline__trailing {
        border-color: var(--color-gray-200) !important;
      }

      ::ng-deep .profile-form .mdc-text-field--focused .mdc-notched-outline__leading,
      ::ng-deep .profile-form .mdc-text-field--focused .mdc-notched-outline__notch,
      ::ng-deep .profile-form .mdc-text-field--focused .mdc-notched-outline__trailing {
        border-color: var(--color-navy) !important;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 8px;
      }

      ::ng-deep .form-actions .mat-mdc-button {
        color: var(--color-gray-600) !important;
      }

      /* ===== Password Form ===== */
      .password-form {
        max-width: 450px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .section-divider {
        margin: 32px 0;
      }

      /* ===== Section Divider ===== */
      .section-divider {
        margin: 32px 0;
        border-color: var(--color-gray-200);
      }

      /* ===== Notification Settings ===== */
      .notification-settings {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid var(--color-gray-100);
      }

      ::ng-deep .setting-item .mat-mdc-slide-toggle {
        --mdc-switch-selected-track-color: var(--color-navy);
        --mdc-switch-selected-handle-color: var(--color-gold);
        --mdc-switch-selected-focus-track-color: var(--color-navy);
        --mdc-switch-selected-hover-track-color: var(--color-navy);
      }

      /* ===== Danger Zone ===== */
      .danger-zone {
        color: #dc2626;
      }

      .danger-zone h3 {
        color: #dc2626;
        font-weight: 600;
      }

      .danger-actions {
        margin-top: 20px;
      }

      ::ng-deep .danger-actions .mat-mdc-raised-button.mat-warn {
        background: #dc2626 !important;
      }

      /* ===== Host Mode Section ===== */
      .mode-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .mode-display {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 24px;
        background: var(--color-gray-50);
        border-radius: var(--radius-lg);
      }

      .mode-card {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 20px;
        border-radius: var(--radius);
        border: 2px solid var(--color-gray-200);
        transition: all 0.3s ease;
        background: var(--color-white);
      }

      .mode-card.active {
        border-color: var(--color-navy);
        background: rgba(27, 58, 107, 0.05);
        box-shadow: var(--shadow);
      }

      .mode-card mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--color-navy);
      }

      .mode-card span {
        font-weight: 600;
        color: var(--color-gray-900);
      }

      .mode-separator {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-gray-300);
      }

      .mode-info {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .mode-description {
        display: flex;
        gap: 16px;
        padding: 20px;
        background: rgba(27, 58, 107, 0.05);
        border-radius: var(--radius);
        border-left: 4px solid var(--color-navy);
      }

      .mode-description mat-icon {
        color: var(--color-navy);
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .mode-description h4 {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--color-gray-900);
        margin: 0 0 8px 0;
      }

      .mode-description p {
        color: var(--color-gray-600);
        margin: 0;
        line-height: 1.6;
      }

      .host-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .host-actions a,
      .host-actions button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* ===== Spinner & Loading ===== */
      .inline-spinner {
        display: inline-block;
        margin-right: 8px;
      }

      ::ng-deep .inline-spinner .mdc-circular-progress__indeterminate-circle-graphic {
        stroke: var(--color-gold) !important;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        gap: 16px;
      }

      .loading-container mat-icon {
        font-size: 64px;
        color: var(--color-navy);
      }

      /* ===== Responsive Design ===== */
      @media (max-width: 1024px) {
        .profile-content {
          grid-template-columns: 1fr;
        }

        .profile-sidebar {
          max-width: 400px;
          margin: 0 auto;
          width: 100%;
        }

        .profile-header h1 {
          font-size: 1.875rem;
        }
      }

      @media (max-width: 768px) {
        .profile-container {
          padding: 24px 0;
        }

        .container {
          padding: 0 16px;
        }

        .tab-content {
          padding: 24px 16px;
        }

        .avatar-section {
          width: 120px;
          height: 120px;
        }

        .profile-card {
          padding: 24px 20px;
        }

        .form-row {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .tab-header {
          flex-direction: column;
          gap: 12px;
          align-items: stretch;
        }

        .tab-header h3 {
          font-size: 1.25rem;
        }

        .user-stats {
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
      }

      @media (max-width: 480px) {
        .profile-header h1 {
          font-size: 1.5rem;
        }

        .profile-header p {
          font-size: 1rem;
        }

        .user-info h2 {
          font-size: 1.125rem;
        }

        .avatar-section {
          width: 100px;
          height: 100px;
        }

        .avatar-placeholder mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
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
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private uiStore = inject(UIStore);

  currentUser = this.authService.currentUser;
  isEditing = signal(false);
  isSaving = signal(false);
  isChangingPassword = signal(false);
  isSwitchingMode = signal(false);
  selectedLanguage = signal(this.uiStore.language());
  readonly lang = computed(() => this.uiStore.language());

  readonly text = computed(() => {
    const language = this.uiStore.language();

    const labels = {
      uz: {
        title: 'Mening profilim',
        description: "Shaxsiy ma'lumotlaringizni boshqaring",
        infoTab: "Shaxsiy ma'lumotlar",
        securityTab: 'Xavfsizlik',
        settingsTab: 'Sozlamalar',
        hostModeTab: 'Xost rezhimi',
        languageSettings: 'Til sozlamalari',
        interfaceLanguage: 'Interfeys tili',
        notifications: 'Bildirishnomalar',
        emailNotifications: 'Email bildirishnomalari',
        smsNotifications: 'SMS bildirishnomalari',
        marketingMessages: 'Marketing xabarlari',
        dangerZone: 'Xavfli zona',
        deleteAccountButton: "Akkauntni o'chirish",
        saving: "O'zgartirilmoqda...",
        changePassword: "Parolni o'zgartirish",
        changePasswordTitle: "Parolni o'zgartirish",
        currentMode: 'Hozirgi rejim',
        hostMode: 'Xost rezhimi',
        guestMode: 'Mehmon rezhimi',
        hostModeActive: 'Siz xost rejimidassiz',
        hostModeDescription:
          "E'lon yaratishni, mulkni boshqarishni va bron qabul qilishni davom ettira olasiz.",
        guestModeActive: 'Siz mehmon rejimidassiz',
        guestModeDescription:
          "Mulkni izlashing, bronlash va sharhlash mumkin. Xost rejimiga o'tish uchun pastdagi tugmani bosing.",
        switching: "O'zgartirilmoqda...",
        switchToGuest: "Mehmon rejimiga o'tish",
        switchToHost: "Xost rejimiga o'tish",
        hostTools: 'Xost vositalari',
        hostPanel: 'Xost paneli',
        createListing: "E'lon yaratish",
      },
      ru: {
        title: 'Мой профиль',
        description: 'Управляйте личной информацией',
        infoTab: 'Личные данные',
        securityTab: 'Безопасность',
        settingsTab: 'Настройки',
        hostModeTab: 'Режим хозяина',
        languageSettings: 'Языковые настройки',
        interfaceLanguage: 'Язык интерфейса',
        notifications: 'Уведомления',
        emailNotifications: 'Email уведомления',
        smsNotifications: 'SMS уведомления',
        marketingMessages: 'Маркетинговые сообщения',
        dangerZone: 'Опасная зона',
        deleteAccountButton: 'Удалить аккаунт',
        saving: 'Изменяется...',
        changePassword: 'Изменить пароль',
        changePasswordTitle: 'Изменение пароля',
        currentMode: 'Текущий режим',
        hostMode: 'Режим хозяина',
        guestMode: 'Режим гостя',
        hostModeActive: 'Вы в режиме хозяина',
        hostModeDescription:
          'Вы можете создавать объявления, управлять имуществом и принимать бронирования.',
        guestModeActive: 'Вы в режиме гостя',
        guestModeDescription:
          'Поиск имущества, бронирование и написание отзывов. Переключитесь в режим хозяина с помощью кнопки ниже.',
        switching: 'Переключение...',
        switchToGuest: 'Перейти в режим гостя',
        switchToHost: 'Перейти в режим хозяина',
        hostTools: 'Инструменты хозяина',
        hostPanel: 'Панель хозяина',
        createListing: 'Создать объявление',
      },
      en: {
        title: 'My profile',
        description: 'Manage your personal information',
        infoTab: 'Personal data',
        securityTab: 'Security',
        settingsTab: 'Settings',
        hostModeTab: 'Host Mode',
        languageSettings: 'Language settings',
        interfaceLanguage: 'Interface language',
        notifications: 'Notifications',
        emailNotifications: 'Email notifications',
        smsNotifications: 'SMS notifications',
        marketingMessages: 'Marketing messages',
        dangerZone: 'Danger zone',
        deleteAccountButton: 'Delete account',
        saving: 'Updating...',
        changePassword: 'Change password',
        changePasswordTitle: 'Change password',
        currentMode: 'Current mode',
        hostMode: 'Host mode',
        guestMode: 'Guest mode',
        hostModeActive: 'You are in host mode',
        hostModeDescription: 'You can create listings, manage properties, and accept bookings.',
        guestModeActive: 'You are in guest mode',
        guestModeDescription:
          'Search properties, make bookings, and write reviews. Switch to host mode using the button below.',
        switching: 'Switching...',
        switchToGuest: 'Switch to guest mode',
        switchToHost: 'Switch to host mode',
        hostTools: 'Host tools',
        hostPanel: 'Host dashboard',
        createListing: 'Create listing',
      },
    } as const;

    return labels[language];
  });

  readonly dobLabel = computed(() =>
    this.lang() === 'en'
      ? 'Date of birth'
      : this.lang() === 'ru'
        ? 'Дата рождения'
        : "Tug'ilgan sana",
  );

  Gender = Gender;
  UserRole = UserRole;

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [{ value: '', disabled: true }],
    phone: [''],
    dateOfBirth: [''],
    gender: ['' as Gender],
    address: [''],
    bio: [''],
  });

  passwordForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit(): void {
    const preferredLanguage = this.currentUser()?.preferredLanguage;
    if (preferredLanguage === 'uz' || preferredLanguage === 'ru' || preferredLanguage === 'en') {
      this.uiStore.setLanguage(preferredLanguage);
      this.selectedLanguage.set(preferredLanguage);
    }

    this.loadUserData();
  }

  loadUserData(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user.gender || 'Other',
        address: user.address || '',
        bio: user.bio || '',
      });
    }
  }

  toggleEdit(): void {
    this.isEditing.update((v) => !v);
    if (!this.isEditing()) {
      this.loadUserData(); // Reset form
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);

    const updateData = {
      firstName: this.profileForm.value.firstName!,
      lastName: this.profileForm.value.lastName!,
      phone: this.profileForm.value.phone || undefined,
      dateOfBirth: this.profileForm.value.dateOfBirth
        ? new Date(this.profileForm.value.dateOfBirth)
        : undefined,
      gender: this.profileForm.value.gender as Gender,
      address: this.profileForm.value.address || undefined,
      bio: this.profileForm.value.bio || undefined,
    };

    this.authService.updateProfile(updateData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.isEditing.set(false);
        this.snackBar.open('Profil yangilandi', 'Yopish', { duration: 3000 });
      },
      error: () => {
        this.isSaving.set(false);
        this.snackBar.open('Xatolik yuz berdi', 'Yopish', { duration: 3000 });
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.isChangingPassword.set(true);

    // Simulate API call
    setTimeout(() => {
      this.isChangingPassword.set(false);
      this.passwordForm.reset();
      this.snackBar.open("Parol o'zgartirildi", 'Yopish', { duration: 3000 });
    }, 1500);
  }

  isUploadingAvatar = signal(false);

  uploadAvatar(): void {
    // Trigger file input click
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.onchange = (event) => this.handleAvatarFileSelect(event);
    fileInput.click();
  }

  private handleAvatarFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('Rasm hajmi 5MB dan oshmasligi kerak', 'Yopish', { duration: 3000 });
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        this.snackBar.open("Faqat JPG, PNG yoki WEBP formatlari qo'llab-quvvatlanadi", 'Yopish', {
          duration: 3000,
        });
        return;
      }

      this.isUploadingAvatar.set(true);

      this.authService.uploadAvatar(file).subscribe({
        next: () => {
          this.isUploadingAvatar.set(false);
          this.snackBar.open('Avatar muvaffaqiyatli yangilandi', 'Yopish', { duration: 3000 });
        },
        error: (error) => {
          this.isUploadingAvatar.set(false);
          this.snackBar.open(error.error?.message || 'Avatar yuklashda xatolik', 'Yopish', {
            duration: 3000,
          });
        },
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  changeLanguage(lang: any): void {
    this.selectedLanguage.set(lang.value);
    this.uiStore.setLanguage(lang.value);
    this.snackBar.open("Til o'zgartirildi", 'Yopish', { duration: 2000 });
  }

  deleteAccount(): void {
    this.confirmationService
      .confirm({
        title: "Akkauntni o'chirish",
        message: "Bu amal qaytarib bo'lmaydi. Akkauntingizni o'chirishni davom ettiraylikmi?",
        confirmLabel: "O'chirish",
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.snackBar.open("Akkaunt o'chirish so'rovi yuborildi", 'Yopish', { duration: 3000 });
        }
      });
  }

  getRoleLabel(role?: UserRole): string {
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
        return 'Foydalanuvchi';
    }
  }

  getBadgeLabel(badge: HostBadge | undefined): string {
    if (!badge) return '';
    const labels: Record<HostBadge, string> = {
      [HostBadge.New]: 'Yangi',
      [HostBadge.Rising]: 'Rivojlanayotgan',
      [HostBadge.Super]: 'Super',
      [HostBadge.Legend]: 'Afsona',
    };
    return labels[badge] || badge;
  }

  navigateToHostDashboard(): void {
    this.router.navigate(['/host']);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  passwordMatchValidator(formGroup: any): Record<string, boolean> | null {
    const newPassword = formGroup.get('newPassword');
    const confirmPassword = formGroup.get('confirmPassword');
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { mismatch: true };
    }
    return null;
  }

  isHostOrAdmin(): boolean {
    const role = this.currentUser()?.role;
    return role === UserRole.Host || role === UserRole.Admin;
  }

  isInHostMode(): boolean {
    const mode = this.authStore.currentMode();
    return mode === UserRole.Host || mode === UserRole.Admin;
  }

  switchToHostMode(): void {
    this.confirmationService
      .confirm({
        title: "Xost rejimiga o'tish",
        message:
          "Xost rejimiga o'tsangiz, mulk yaratish va bronlarni boshqarish imkonyatiga ega bo'lasiz. Davom ettiraylikmi?",
        confirmLabel: "Xost rejimiga o'tish",
        tone: 'default',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isSwitchingMode.set(true);
          this.authStore.switchMode({ targetMode: UserRole.Host }).subscribe({
            next: () => {
              this.isSwitchingMode.set(false);
              this.snackBar.open("Xost rejimiga o'tib oldingiz", 'Yopish', { duration: 3000 });
            },
            error: () => {
              this.isSwitchingMode.set(false);
              this.snackBar.open("Rejim o'zgartirilishda xato", 'Yopish', { duration: 3000 });
            },
          });
        }
      });
  }

  switchToGuestMode(): void {
    this.confirmationService
      .confirm({
        title: "Mehmon rejimiga o'tish",
        message: "Mehmon rejimiga o'tsangiz, xost vositalari yopiladi. Davom ettiraylikmi?",
        confirmLabel: "Mehmon rejimiga o'tish",
        tone: 'default',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.isSwitchingMode.set(true);
          this.authStore.switchMode({ targetMode: UserRole.Guest }).subscribe({
            next: () => {
              this.isSwitchingMode.set(false);
              this.snackBar.open("Mehmon rejimiga o'ttingiz", 'Yopish', { duration: 3000 });
            },
            error: () => {
              this.isSwitchingMode.set(false);
              this.snackBar.open("Rejim o'zgartirilishda xato", 'Yopish', { duration: 3000 });
            },
          });
        }
      });
  }
}

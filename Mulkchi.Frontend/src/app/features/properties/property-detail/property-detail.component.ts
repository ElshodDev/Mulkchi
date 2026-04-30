import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { Property, ListingType, UserRole } from '../../../core/models';
import { BookingPanelComponent } from '../booking-panel/booking-panel.component';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    BookingPanelComponent
  ],
  template: `
    <div class="property-detail-container">
      @if (loading()) {
        <div class="loading-container">
          <div class="skeleton-loader">
            <div class="skeleton-main-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-title"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
        </div>
      } @else if (error()) {
        <div class="error-container">
          <mat-icon>error</mat-icon>
          <h2>{{ error() }}</h2>
          <button mat-raised-button routerLink="/properties" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
            Barcha mulklarga qaytish
          </button>
        </div>
      } @else if (property()) {
        <div class="property-content">
          <!-- Breadcrumb -->
          <div class="breadcrumb">
            <a routerLink="/">Bosh sahifa</a>
            <mat-icon>chevron_right</mat-icon>
            <a routerLink="/properties">Ko'chmas mulk</a>
            <mat-icon>chevron_right</mat-icon>
            <span>{{ property()?.title }}</span>
          </div>

          <!-- Property Header (Mobile: Top, Desktop: Sidebar) -->
          <div class="property-header-mobile">
            <div class="badges">
              @if (property()?.isFeatured) {
                <span class="badge featured">
                  <mat-icon>star</mat-icon> Featured
                </span>
              }
              @if (property()?.isVerified) {
                <span class="badge verified">
                  <mat-icon>verified</mat-icon> Tasdiqlangan
                </span>
              }
              @if (property()?.isInstantBook) {
                <span class="badge instant">
                  <mat-icon>bolt</mat-icon> Tez bron
                </span>
              }
            </div>
            <h1 class="property-title">{{ property()?.title }}</h1>
            <div class="location">
              <mat-icon>location_on</mat-icon>
              <span>{{ property()?.address }}, {{ property()?.district }}, {{ property()?.city }}</span>
            </div>
          </div>

          <!-- Image Gallery -->
          <div class="gallery-section">
            <div class="main-image">
              @if (currentImage()) {
                <img [src]="currentImage()" [alt]="property()?.title">
              } @else {
                <div class="no-image">
                  <mat-icon>image_not_supported</mat-icon>
                  <p>Rasm mavjud emas</p>
                </div>
              }
              
              @if (property()?.images && property()!.images!.length > 1) {
                <button class="nav-btn prev" (click)="prevImage()">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <button class="nav-btn next" (click)="nextImage()">
                  <mat-icon>chevron_right</mat-icon>
                </button>
                <div class="image-counter">
                  {{ currentImageIndex() + 1 }} / {{ property()!.images!.length }}
                </div>
              }
            </div>
            
            @if (property()?.images && property()!.images!.length > 1) {
              <div class="thumbnail-list">
                @for (image of property()!.images; track image.id; let i = $index) {
                  <div 
                    class="thumbnail" 
                    [class.active]="i === currentImageIndex()"
                    (click)="selectImage(i)">
                    <img [src]="getThumbnailUrl(image)" [alt]="image.caption || ''">
                  </div>
                }
              </div>
            }
          </div>

          <!-- Property Info -->
          <div class="info-section">
            <!-- Desktop Header -->
            <div class="property-header-desktop">
              <div class="badges">
                @if (property()?.isFeatured) {
                  <span class="badge featured">
                    <mat-icon>star</mat-icon> Featured
                  </span>
                }
                @if (property()?.isVerified) {
                  <span class="badge verified">
                    <mat-icon>verified</mat-icon> Tasdiqlangan
                  </span>
                }
                @if (property()?.isInstantBook) {
                  <span class="badge instant">
                    <mat-icon>bolt</mat-icon> Tez bron
                  </span>
                }
              </div>
              
              <h1 class="property-title">{{ property()?.title }}</h1>
              
              <div class="location">
                <mat-icon>location_on</mat-icon>
                <span>{{ property()?.address }}, {{ property()?.district }}, {{ property()?.city }}</span>
              </div>
            </div>

            <!-- Price Card -->
            <div class="price-card">
              <div class="price-display">
                @if (property()?.listingType === ListingType.Sale && property()?.salePrice) {
                  <span class="price-amount">{{ property()?.salePrice | number }} {{ property()?.currency }}</span>
                  <span class="price-type sale">Sotuv</span>
                } @else if (property()?.listingType === ListingType.Rent && property()?.monthlyRent) {
                  <span class="price-amount">{{ property()?.monthlyRent | number }} {{ property()?.currency }}</span>
                  <span class="price-period">/oy</span>
                } @else if (property()?.listingType === ListingType.ShortTermRent && property()?.pricePerNight) {
                  <span class="price-amount">{{ property()?.pricePerNight | number }} {{ property()?.currency }}</span>
                  <span class="price-period">/tun</span>
                }
              </div>
              @if (property()?.averageRating) {
                <div class="rating-display">
                  <mat-icon>star</mat-icon>
                  <span class="rating-value">{{ property()?.averageRating | number:'1.1-1' }}</span>
                  <span class="rating-count">({{ property()?.viewsCount }} ko'rish)</span>
                </div>
              }
            </div>

            <mat-divider></mat-divider>

            <!-- Quick Stats -->
            <div class="quick-stats">
              <div class="stat-item">
                <div class="stat-icon">
                  <mat-icon>bed</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ property()?.numberOfBedrooms }}</span>
                  <span class="stat-label">Xona</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">
                  <mat-icon>bathtub</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ property()?.numberOfBathrooms }}</span>
                  <span class="stat-label">Hammom</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">
                  <mat-icon>square_foot</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ property()?.area }}</span>
                  <span class="stat-label">m²</span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-icon">
                  <mat-icon>people</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ property()?.maxGuests }}</span>
                  <span class="stat-label">Mehmon</span>
                </div>
              </div>
            </div>

            <mat-divider></mat-divider>

            <!-- Description -->
            <div class="description-section">
              <h2 class="section-title">
                <mat-icon>description</mat-icon>
                Tavsif
              </h2>
              <p class="description-text">{{ property()?.description || 'Tavsif mavjud emas' }}</p>
            </div>

            <!-- Amenities -->
            <div class="amenities-section">
              <h2 class="section-title">
                <mat-icon>checklist</mat-icon>
                Qulayliklar
              </h2>
              <div class="amenities-grid">
                @for (amenity of amenitiesList(); track amenity.name) {
                  <div class="amenity-item" [class.available]="amenity.available">
                    <div class="amenity-icon">
                      <mat-icon>{{ amenity.available ? 'check_circle' : 'cancel' }}</mat-icon>
                    </div>
                    <span class="amenity-label">{{ amenity.label }}</span>
                  </div>
                }
              </div>
            </div>

            <mat-divider></mat-divider>

            <!-- Location Info -->
            <div class="location-section">
              <h2 class="section-title">
                <mat-icon>place</mat-icon>
                Joylashuv
              </h2>
              <div class="location-grid">
                <div class="location-item">
                  <span class="location-label">Viloyat</span>
                  <span class="location-value">{{ property()?.region }}</span>
                </div>
                <div class="location-item">
                  <span class="location-label">Shahar</span>
                  <span class="location-value">{{ property()?.city }}</span>
                </div>
                <div class="location-item">
                  <span class="location-label">Tuman</span>
                  <span class="location-value">{{ property()?.district }}</span>
                </div>
                <div class="location-item">
                  <span class="location-label">Mahalla</span>
                  <span class="location-value">{{ property()?.mahalla }}</span>
                </div>
                <div class="location-item full-width">
                  <span class="location-label">Manzil</span>
                  <span class="location-value">{{ property()?.address }}</span>
                </div>
                @if (property()?.distanceToCityCenter) {
                  <div class="location-item">
                    <span class="location-label">Shahar markazigacha</span>
                    <span class="location-value">{{ property()?.distanceToCityCenter }} km</span>
                  </div>
                }
              </div>
            </div>

            <!-- Host Info -->
            <div class="host-card">
              <div class="host-header">
                <mat-icon>account_circle</mat-icon>
                <h3>Host haqida</h3>
              </div>
              <div class="host-content">
                <div class="host-avatar">
                  <div class="avatar-placeholder">
                    <mat-icon>person</mat-icon>
                  </div>
                </div>
                <div class="host-details">
                  <h4 class="host-name">Host</h4>
                  <div class="host-badge">
                    <mat-icon>verified</mat-icon>
                    <span>Tasdiqlangan host</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="actions-section">
              @if (isAuthenticated()) {
                @if (!isOwner()) {
                  <div class="action-buttons">
                    <button mat-raised-button class="action-btn primary" (click)="bookNow()">
                      <mat-icon>calendar_today</mat-icon>
                      Bron qilish
                    </button>
                    <button mat-stroked-button class="action-btn secondary" (click)="contactHost()">
                      <mat-icon>message</mat-icon>
                      Host bilan bog'lanish
                    </button>
                    <button 
                      class="favorite-btn"
                      [class.active]="isFavorite()"
                      (click)="toggleFavorite()"
                      [matTooltip]="getFavoriteTooltip()">
                      <mat-icon>{{ isFavorite() ? 'favorite' : 'favorite_border' }}</mat-icon>
                    </button>
                  </div>
                } @else {
                  <div class="owner-actions">
                    <button mat-raised-button class="edit-btn" [routerLink]="['/host/properties/edit', property()?.id]">
                      <mat-icon>edit</mat-icon>
                      Tahrirlash
                    </button>
                    <button mat-stroked-button class="delete-btn" (click)="deleteProperty()">
                      <mat-icon>delete</mat-icon>
                      O'chirish
                    </button>
                  </div>
                }
              } @else {
                <div class="auth-prompt">
                  <mat-icon>login</mat-icon>
                  <p>Bron qilish yoki aloqa uchun tizimga kiring</p>
                  <button mat-raised-button routerLink="/auth/login" class="login-btn">
                    Kirish
                  </button>
                </div>
              }
            </div>

            <!-- Booking Panel -->
            @if (isAuthenticated() && !isOwner() && property()?.listingType === ListingType.ShortTermRent) {
              <app-booking-panel [property]="property()!"></app-booking-panel>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* ===== CSS Variables ===== */
    :host {
      --color-navy: #1B3A6B;
      --color-navy-light: #2a4a7c;
      --color-gold: #C9A84C;
      --color-white: #ffffff;
      --color-gray-50: #f8fafc;
      --color-gray-100: #f1f5f9;
      --color-gray-200: #e2e8f0;
      --color-gray-500: #64748b;
      --color-gray-600: #475569;
      --color-gray-800: #1e293b;
      --color-gray-900: #0f172a;
      --radius: 8px;
      --radius-lg: 12px;
      --radius-xl: 16px;
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }

    /* ===== Layout ===== */
    .property-detail-container {
      min-height: 100vh;
      background: var(--color-gray-50);
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 16px;
    }

    .error-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--color-navy);
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--color-navy);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: var(--color-navy-light);
    }

    /* ===== Property Content ===== */
    .property-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 32px;
    }

    /* ===== Breadcrumb ===== */
    .breadcrumb {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: var(--color-gray-500);
    }

    .breadcrumb a {
      color: var(--color-navy);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .breadcrumb a:hover {
      color: var(--color-gold);
    }

    .breadcrumb mat-icon {
      font-size: 18px;
      color: var(--color-gray-400);
    }

    /* ===== Mobile Header ===== */
    .property-header-mobile {
      grid-column: 1 / -1;
      display: none;
    }

    .property-header-mobile .property-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-gray-900);
      margin: 0;
    }

    /* ===== Gallery Section ===== */
    .gallery-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .main-image {
      position: relative;
      height: 450px;
      border-radius: var(--radius-xl);
      overflow: hidden;
      background: var(--color-gray-200);
    }

    .main-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .no-image mat-icon {
      font-size: 64px;
      color: var(--color-gray-400);
    }

    .no-image p {
      color: var(--color-gray-500);
    }

    .nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.95);
      border: none;
      border-radius: 50%;
      color: var(--color-navy);
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: var(--shadow);
    }

    .nav-btn:hover {
      background: var(--color-white);
      transform: translateY(-50%) scale(1.1);
    }

    .nav-btn.prev { left: 16px; }
    .nav-btn.next { right: 16px; }

    .image-counter {
      position: absolute;
      bottom: 16px;
      right: 16px;
      background: rgba(27, 58, 107, 0.9);
      color: var(--color-white);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .thumbnail-list {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .thumbnail {
      flex-shrink: 0;
      width: 100px;
      height: 75px;
      border-radius: var(--radius);
      overflow: hidden;
      cursor: pointer;
      opacity: 0.6;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .thumbnail.active {
      opacity: 1;
      border-color: var(--color-gold);
    }

    .thumbnail:hover {
      opacity: 1;
    }

    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* ===== Info Section ===== */
    .info-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .property-header-desktop {
      display: block;
    }

    .info-header {
      margin-bottom: 24px;
    }

    .badges {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .badge.featured {
      background: var(--color-gold);
      color: var(--color-navy);
    }

    .badge.verified {
      background: rgba(34, 197, 94, 0.1);
      color: #16a34a;
    }

    .badge.instant {
      background: rgba(27, 58, 107, 0.1);
      color: var(--color-navy);
    }

    .badge mat-icon {
      font-size: 16px;
    }

    .badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .property-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-gray-900);
      margin: 0 0 12px 0;
      line-height: 1.3;
    }

    .location {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-gray-500);
      font-size: 0.95rem;
    }

    .location mat-icon {
      font-size: 20px;
      color: var(--color-navy);
    }

    .location mat-icon {
      color: #667eea;
    }

    /* ===== Price Card ===== */
    .price-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow);
    }

    .price-display {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;
    }

    .price-amount {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-navy);
    }

    .price-period {
      font-size: 1.125rem;
      color: var(--color-gray-500);
    }

    .price-type {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      background: rgba(27, 58, 107, 0.1);
      color: var(--color-navy);
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--color-gray-200);
    }

    .rating-display mat-icon {
      font-size: 20px;
      color: #f59e0b;
    }

    .rating-value {
      font-weight: 600;
      color: var(--color-gray-800);
    }

    .rating-count {
      color: var(--color-gray-500);
      font-size: 0.875rem;
    }

    mat-divider {
      margin: 24px 0;
    }

    /* ===== Quick Stats ===== */
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 4px 0;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--color-gray-100);
      border-radius: var(--radius);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--color-navy);
      border-radius: var(--radius);
    }

    .stat-icon mat-icon {
      font-size: 20px;
      color: var(--color-gold);
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-gray-900);
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--color-gray-500);
    }

    /* ===== Section Title ===== */
    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0 0 16px 0;
    }

    .section-title mat-icon {
      font-size: 24px;
      color: var(--color-navy);
    }

    /* ===== Description ===== */
    .description-text {
      color: var(--color-gray-600);
      line-height: 1.8;
      white-space: pre-line;
    }

    /* ===== Amenities ===== */
    .amenities-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .amenity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: var(--radius);
      background: var(--color-gray-100);
      color: var(--color-gray-400);
    }

    .amenity-item.available {
      background: rgba(27, 58, 107, 0.05);
      color: var(--color-gray-800);
    }

    .amenity-icon mat-icon {
      font-size: 20px;
    }

    .amenity-item.available .amenity-icon mat-icon {
      color: var(--color-navy);
    }

    /* ===== Location Grid ===== */
    .location-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .location-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .location-item.full-width {
      grid-column: 1 / -1;
    }

    .location-label {
      font-size: 0.8rem;
      color: var(--color-gray-500);
    }

    .location-value {
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-gray-800);
    }

    /* ===== Host Card ===== */
    .host-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow);
    }

    .host-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .host-header mat-icon {
      font-size: 24px;
      color: var(--color-navy);
    }

    .host-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0;
    }

    .host-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .avatar-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: var(--color-navy);
      border-radius: 50%;
    }

    .avatar-placeholder mat-icon {
      font-size: 28px;
      color: var(--color-gold);
    }

    .host-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0 0 8px 0;
    }

    .host-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      color: #16a34a;
    }

    .host-badge mat-icon {
      font-size: 16px;
    }

    /* ===== Actions ===== */
    .actions-section {
      padding: 4px 0;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }

    .action-btn.primary {
      flex: 1;
      min-width: 160px;
      background: var(--color-navy);
      color: var(--color-white);
    }

    .action-btn.primary:hover {
      background: var(--color-navy-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .action-btn.secondary {
      flex: 1;
      min-width: 160px;
      background: var(--color-white);
      color: var(--color-navy);
      border: 2px solid var(--color-navy);
    }

    .action-btn.secondary:hover {
      background: rgba(27, 58, 107, 0.05);
    }

    .favorite-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: var(--color-white);
      border: 2px solid var(--color-gray-200);
      border-radius: var(--radius);
      color: var(--color-gray-400);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .favorite-btn:hover {
      border-color: #ef4444;
      color: #ef4444;
    }

    .favorite-btn.active {
      background: #fef2f2;
      border-color: #ef4444;
      color: #ef4444;
    }

    .owner-actions {
      display: flex;
      gap: 12px;
    }

    .edit-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 24px;
      background: var(--color-navy);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .edit-btn:hover {
      background: var(--color-navy-light);
    }

    .delete-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 24px;
      background: var(--color-white);
      color: #dc2626;
      border: 2px solid #dc2626;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .delete-btn:hover {
      background: #fef2f2;
    }

    .auth-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
      background: var(--color-gray-100);
      border-radius: var(--radius-lg);
      text-align: center;
    }

    .auth-prompt mat-icon {
      font-size: 48px;
      color: var(--color-navy);
    }

    .auth-prompt p {
      color: var(--color-gray-600);
      margin: 0;
    }

    .login-btn {
      padding: 12px 32px;
      background: var(--color-navy);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .login-btn:hover {
      background: var(--color-navy-light);
    }

    mat-divider {
      margin: 8px 0;
      border-top-color: var(--color-gray-200);
    }

    /* ===== Responsive Design ===== */
    @media (max-width: 1024px) {
      .property-content {
        grid-template-columns: 1fr;
      }

      .main-image {
        height: 350px;
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
      }

      .property-header-desktop {
        display: none;
      }

      .property-header-mobile {
        display: block;
      }
    }

    @media (max-width: 768px) {
      .property-content {
        padding: 16px;
      }

      .main-image {
        height: 300px;
      }

      .nav-btn {
        width: 40px;
        height: 40px;
      }

      .price-amount {
        font-size: 1.5rem;
      }

      .property-title {
        font-size: 1.5rem;
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .stat-item {
        padding: 12px;
      }

      .action-buttons {
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
      }

      .owner-actions {
        flex-direction: column;
      }

      .edit-btn,
      .delete-btn {
        width: 100%;
        justify-content: center;
      }

      .amenities-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .property-content {
        padding: 12px;
      }

      .main-image {
        height: 250px;
        border-radius: var(--radius-lg);
      }

      .thumbnail {
        width: 80px;
        height: 60px;
      }

      .quick-stats {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }

      .stat-icon {
        width: 32px;
        height: 32px;
      }

      .stat-icon mat-icon {
        font-size: 16px;
      }

      .stat-value {
        font-size: 1rem;
      }

      .location-grid {
        grid-template-columns: 1fr;
      }

      .price-card {
        padding: 20px;
      }
    }
  `]
})
export class PropertyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  property = this.propertyService.currentProperty;
  loading = this.propertyService.loading;
  error = signal<string | null>(null);
  currentImageIndex = signal(0);
  isFavorite = signal(false);

  currentImage = computed(() => {
    const prop = this.property();
    if (prop?.images && prop.images.length > 0) {
      const image = prop.images[this.currentImageIndex()];
      return image.url || image.imageUrl || '';
    }
    return null;
  });

  // Get thumbnail URL for an image
  getThumbnailUrl(image: any): string {
    return image.thumbnailUrl || image.url || image.imageUrl || '';
  }

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;

  isOwner = computed(() => {
    const user = this.currentUser();
    const prop = this.property();
    return user && prop && user.id === prop.hostId;
  });

  ListingType = ListingType;

  amenitiesList = computed(() => {
    const prop = this.property();
    if (!prop) return [];

    return [
      { name: 'wifi', label: 'Wi-Fi', available: prop.hasWifi },
      { name: 'parking', label: 'Avtoturargoh', available: prop.hasParking },
      { name: 'pool', label: 'Hovuz', available: prop.hasPool },
      { name: 'ac', label: 'Konditsioner', available: prop.hasAirConditioning },
      { name: 'heating', label: 'Isitish', available: prop.hasHeating },
      { name: 'kitchen', label: 'Oshxona', available: prop.hasKitchen },
      { name: 'tv', label: 'TV', available: prop.hasTV },
      { name: 'washer', label: 'Kir yuvish', available: prop.hasWasher },
      { name: 'workspace', label: 'Ish joyi', available: prop.hasWorkspace },
      { name: 'elevator', label: 'Lift', available: prop.hasElevator },
      { name: 'security', label: 'Qo\'riqlash', available: prop.hasSecurity },
      { name: 'generator', label: 'Generator', available: prop.hasGenerator },
      { name: 'furniture', label: 'Mebel', available: prop.hasFurniture },
      { name: 'renovated', label: 'Tamirlangan', available: prop.isRenovated },
      { name: 'pets', label: 'Uy hayvonlari', available: prop.petsAllowed },
      { name: 'metro', label: 'Metro yaqinida', available: prop.hasMetroNearby },
      { name: 'market', label: 'Bozor yaqinida', available: prop.hasMarketNearby },
      { name: 'school', label: 'Maktab yaqinida', available: prop.hasSchoolNearby },
      { name: 'hospital', label: 'Shifoxona yaqinida', available: prop.hasHospitalNearby }
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProperty(id);
    } else {
      this.error.set('Mulk ID topilmadi');
    }
  }

  loadProperty(id: string): void {
    this.error.set(null);
    
    this.propertyService.getPropertyById(id).subscribe({
      error: () => {
        this.error.set('Mulk ma\'lumotlarini yuklashda xatolik yuz berdi');
      }
    });
  }

  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  prevImage(): void {
    this.currentImageIndex.update(i => {
      const prop = this.property();
      if (!prop?.images) return 0;
      return i === 0 ? prop.images.length - 1 : i - 1;
    });
  }

  nextImage(): void {
    this.currentImageIndex.update(i => {
      const prop = this.property();
      if (!prop?.images) return 0;
      return i === prop.images.length - 1 ? 0 : i + 1;
    });
  }

  bookNow(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }
    
    // Scroll to booking panel
    const bookingPanel = document.querySelector('app-booking-panel');
    if (bookingPanel) {
      bookingPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  contactHost(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }
    
    this.snackBar.open('Xabar yuborish funksiyasi tez orada qo\'shiladi', 'Yopish', {
      duration: 3000
    });
  }

  toggleFavorite(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isFavorite.update(v => !v);
    
    this.snackBar.open(
      this.isFavorite() ? 'Sevimlilarga qo\'shildi' : 'Sevimlilardan olib tashlandi',
      'Yopish',
      { duration: 2000 }
    );
  }

  getFavoriteTooltip(): string {
    return this.isFavorite() ? 'Sevimlilardan olib tashlash' : "Sevimlilarga qo'shish";
  }

  deleteProperty(): void {
    const prop = this.property();
    if (!prop) return;

    if (confirm('Haqiqatan ham bu mulkni o\'chirmoqchimisiz?')) {
      this.propertyService.deleteProperty(prop.id).subscribe({
        next: () => {
          this.snackBar.open('Mulk o\'chirildi', 'Yopish', { duration: 3000 });
          this.router.navigate(['/properties']);
        },
        error: () => {
          this.snackBar.open('O\'chirishda xatolik yuz berdi', 'Yopish', { duration: 3000 });
        }
      });
    }
  }
}

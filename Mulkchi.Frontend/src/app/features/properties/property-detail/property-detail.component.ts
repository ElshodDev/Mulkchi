import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { ListingType, PropertyImage } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { PropertyService } from '../../../core/services/property.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BookingPanelComponent } from '../booking-panel/booking-panel.component';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { animate, style, transition, trigger } from '@angular/animations';

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
    BookingPanelComponent,
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
    ]),
  ],
  template: `
    <div class="property-detail-container">
      <ng-container *ngIf="loading(); else checkError">
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
      </ng-container>
      <ng-template #checkError>
        <ng-container *ngIf="error(); else propertyContent">
          <div class="error-container">
            <mat-icon>error</mat-icon>
            <h2>{{ error() }}</h2>
            <button mat-raised-button routerLink="/properties" class="back-btn">
              <mat-icon>arrow_back</mat-icon>
              Barcha mulklarga qaytish
            </button>
          </div>
        </ng-container>
      </ng-template>
      <ng-template #propertyContent>
        <div class="property-content" @fadeInUp>
          <!-- Breadcrumb -->
          <div class="breadcrumb">
            <a routerLink="/">Bosh sahifa</a>
            <mat-icon>chevron_right</mat-icon>
            <a routerLink="/properties">Ko'chmas mulk</a>
            <mat-icon>chevron_right</mat-icon>
            <span>{{ property()?.title }}</span>
          </div>

          <!-- Main Grid -->
          <div class="main-details-grid">
            <!-- Left Column -->
            <div class="left-column">
              <!-- Property Header -->
              <div class="property-header">
                <div class="badges">
                  <span *ngIf="property()?.isFeatured" class="badge featured"
                    ><mat-icon>auto_awesome</mat-icon> Top</span
                  >
                  <span *ngIf="property()?.isVerified" class="badge verified"
                    ><mat-icon>verified</mat-icon> Tasdiqlangan</span
                  >
                  <span
                    class="badge type"
                    [ngClass]="property()?.listingType?.toLowerCase() || ''"
                    >{{ getListingLabel(property()?.listingType) }}</span
                  >
                </div>
                <h1 class="property-title">{{ property()?.title }}</h1>
                <div class="location-row">
                  <div class="location">
                    <mat-icon>place</mat-icon>
                    <span
                      >{{ property()?.address }}, {{ property()?.district }},
                      {{ property()?.city }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- Image Gallery -->
              <div class="gallery-section-modern">
                <div class="main-stage">
                  <ng-container *ngIf="currentImage(); else noImage">
                    <img
                      [src]="currentImage()"
                      [alt]="property()?.title"
                      class="stage-img"
                      (error)="onMainImageError()"
                    />
                    <div class="img-overlay"></div>
                  </ng-container>
                  <ng-template #noImage>
                    <div class="no-image-placeholder">
                      <mat-icon>landscape</mat-icon>
                      <p>Suratlar mavjud emas</p>
                    </div>
                  </ng-template>

                  <div
                    class="gallery-controls"
                    *ngIf="property()?.images && property()!.images!.length > 1"
                  >
                    <button class="nav-arrow prev" (click)="prevImage()">
                      <mat-icon>west</mat-icon>
                    </button>
                    <button class="nav-arrow next" (click)="nextImage()">
                      <mat-icon>east</mat-icon>
                    </button>
                    <div class="count-pill">
                      {{ currentImageIndex() + 1 }} / {{ property()!.images!.length }}
                    </div>
                  </div>
                </div>

                <div
                  class="thumbnail-strip"
                  *ngIf="property()?.images && property()!.images!.length > 1"
                >
                  @for (image of property()!.images; track $index) {
                    <div
                      class="thumb-item"
                      [class.active]="$index === currentImageIndex()"
                      (click)="selectImage($index)"
                    >
                      <img
                        [src]="getThumbnailUrl(image)"
                        [alt]="image.caption || ''"
                        (error)="onThumbnailError($index)"
                      />
                    </div>
                  }
                </div>
              </div>

              <!-- Quick Stats Premium -->
              <div class="quick-stats-glass">
                <div class="stat-item">
                  <div class="stat-icon-wrapper"><mat-icon>bed</mat-icon></div>
                  <div class="stat-info">
                    <span class="stat-value">{{ property()?.numberOfBedrooms || 1 }}</span>
                    <span class="stat-label">Xona</span>
                  </div>
                </div>
                <div class="divider-vertical"></div>
                <div class="stat-item">
                  <div class="stat-icon-wrapper"><mat-icon>bathtub</mat-icon></div>
                  <div class="stat-info">
                    <span class="stat-value">{{ property()?.numberOfBathrooms || 1 }}</span>
                    <span class="stat-label">Hammom</span>
                  </div>
                </div>
                <div class="divider-vertical"></div>
                <div class="stat-item">
                  <div class="stat-icon-wrapper"><mat-icon>square_foot</mat-icon></div>
                  <div class="stat-info">
                    <span class="stat-value">{{ property()?.area }}</span>
                    <span class="stat-label">m²</span>
                  </div>
                </div>
                <div class="divider-vertical"></div>
                <div class="stat-item">
                  <div class="stat-icon-wrapper"><mat-icon>groups</mat-icon></div>
                  <div class="stat-info">
                    <span class="stat-value">{{ property()?.maxGuests || 2 }}</span>
                    <span class="stat-label">Mehmon</span>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div class="description-section content-card">
                <h2 class="section-title">Uy haqida</h2>
                <p class="description-text">
                  {{ property()?.description || 'Tavsif mavjud emas' }}
                </p>
              </div>

              <!-- Amenities -->
              <div class="amenities-section content-card">
                <h2 class="section-title">Qulayliklar</h2>
                <div class="amenities-grid">
                  <div
                    *ngFor="let amenity of amenitiesList()"
                    class="amenity-item"
                    [class.unavailable]="!amenity.available"
                  >
                    <div class="amenity-icon" [class.active]="amenity.available">
                      <mat-icon>{{ getAmenityIcon(amenity.name) }}</mat-icon>
                    </div>
                    <span class="amenity-label" [class.strike]="!amenity.available">{{
                      amenity.label
                    }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column (Sidebar) -->
            <div class="sidebar-column">
              <div class="sticky-wrapper">
                <!-- Premium Glass Price Card -->
                <div class="glass-card price-card">
                  <div class="price-header">
                    <div class="price-display">
                      <span
                        *ngIf="
                          property()?.listingType === ListingType.Sale && property()?.salePrice
                        "
                        class="price-amount"
                        >{{ property()?.salePrice | number }}
                        <span class="currency">{{ property()?.currency }}</span></span
                      >
                      <span
                        *ngIf="
                          property()?.listingType === ListingType.Sale && property()?.salePrice
                        "
                        class="price-type"
                        >Sotuv</span
                      >
                      <span
                        *ngIf="
                          property()?.listingType === ListingType.Rent && property()?.monthlyRent
                        "
                        class="price-amount"
                        >{{ property()?.monthlyRent | number }}
                        <span class="currency">{{ property()?.currency }}</span></span
                      >
                      <span
                        *ngIf="
                          property()?.listingType === ListingType.Rent && property()?.monthlyRent
                        "
                        class="price-period"
                        >/ oy</span
                      >
                      <span
                        *ngIf="
                          property()?.listingType === ListingType.ShortTermRent &&
                          property()?.pricePerNight
                        "
                        class="price-amount"
                        >{{ property()?.pricePerNight | number }}
                        <span class="currency">{{ property()?.currency }}</span></span
                      >
                      <span
                        *ngIf="
                          property()?.listingType === ListingType.ShortTermRent &&
                          property()?.pricePerNight
                        "
                        class="price-period"
                        >/ tun</span
                      >
                    </div>

                    <div class="action-buttons">
                      <ng-container *ngIf="isAuthenticated() && !isOwner()">
                        <button
                          mat-flat-button
                          class="btn-main-action"
                          (click)="handleMainAction()"
                        >
                          {{ getMainActionLabel() }}
                          <mat-icon>arrow_forward</mat-icon>
                        </button>

                        <div class="secondary-actions">
                          <button
                            class="btn-fav-icon"
                            [class.active]="isFavorite()"
                            (click)="toggleFavorite()"
                            [matTooltip]="getFavoriteTooltip()"
                          >
                            <mat-icon>{{ isFavorite() ? 'favorite' : 'favorite_border' }}</mat-icon>
                          </button>
                        </div>
                      </ng-container>

                      <ng-container *ngIf="isAuthenticated() && isOwner()">
                        <button
                          mat-flat-button
                          class="btn-main-action"
                          (click)="bumpPropertyDetail()"
                          [disabled]="isBumpingProperty()"
                        >
                          @if (isBumpingProperty()) {
                            <mat-progress-spinner
                              diameter="20"
                              mode="indeterminate"
                              color="accent"
                            ></mat-progress-spinner>
                          } @else {
                            <mat-icon>rocket_launch</mat-icon>
                          }
                          @if (isBumpingProperty()) {
                            <span>Ko'tarilmoqda...</span>
                          } @else {
                            <span>TOPga ko'tarish</span>
                          }
                        </button>
                        <button
                          mat-flat-button
                          class="btn-edit"
                          [routerLink]="['/host/properties/edit', property()?.id]"
                        >
                          <mat-icon>edit</mat-icon> Tahrirlash
                        </button>
                        <button
                          mat-stroked-button
                          color="warn"
                          class="btn-delete"
                          (click)="deleteProperty()"
                        >
                          <mat-icon>delete_outline</mat-icon> O'chirish
                        </button>
                      </ng-container>

                      <ng-container *ngIf="!isAuthenticated()">
                        <button
                          mat-flat-button
                          class="btn-main-action"
                          (click)="handleMainAction()"
                        >
                          Tizimga kirish
                          <mat-icon>login</mat-icon>
                        </button>
                      </ng-container>
                    </div>
                  </div>
                </div>

                <!-- Host Card Glass -->
                <div class="glass-card host-card">
                  <div class="host-avatar">
                    <img
                      *ngIf="property()?.hostAvatarUrl"
                      [src]="property()?.hostAvatarUrl"
                      [alt]="property()?.hostName"
                    />
                    <div *ngIf="!property()?.hostAvatarUrl" class="avatar-placeholder">
                      <mat-icon>person</mat-icon>
                    </div>
                  </div>
                  <div class="host-details">
                    <span class="host-label">Uy egasi</span>
                    <h4 class="host-name">{{ property()?.hostName || 'Foydalanuvchi' }}</h4>
                    <div class="host-badge">
                      <mat-icon>verified_user</mat-icon><span>Tasdiqlangan</span>
                    </div>
                  </div>
                </div>

                <!-- Booking Panel (Only for ShortTermRent) -->
                <app-booking-panel
                  *ngIf="
                    isAuthenticated() &&
                    !isOwner() &&
                    property()?.listingType === ListingType.ShortTermRent
                  "
                  [property]="property()!"
                ></app-booking-panel>
              </div>
            </div>
          </div>

          <!-- AI Recommendations Section -->
          <div class="recommendations-section" *ngIf="similarProperties().length > 0">
            <div class="rec-header">
              <div class="rec-icon"><mat-icon>auto_awesome</mat-icon></div>
              <div>
                <h2 class="section-title">O'xshash takliflar</h2>
                <p class="section-subtitle">Aynan siz qidirayotgan didingizdagi uylar</p>
              </div>
            </div>
            <div class="recommendations-grid">
              @for (rel of similarProperties(); track rel.id) {
                <div class="rel-card-premium" [routerLink]="['/properties', rel.id]">
                  <div class="rel-image-box">
                    <img [src]="getSimilarPropertyImage(rel)" alt="Similar" />
                    <div class="rel-price-overlay">
                      {{ rel.salePrice || rel.monthlyRent || rel.pricePerNight | number }}
                      {{ rel.currency || 'UZS' }}
                    </div>
                  </div>
                  <div class="rel-body">
                    <h4 class="rel-title">{{ rel.title }}</h4>
                    <div class="rel-meta">
                      <mat-icon>place</mat-icon>
                      <span>{{ rel.city }}, {{ rel.district }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      :host {
        --color-navy: #0f172a;
        --color-gold: #fbbf24;
        --color-gold-dark: #d97706;
        --color-blue-accent: #3b82f6;
        --color-blue-dark: #2563eb;
        --color-bg: #f8fafc;
        --color-text-main: #1e293b;
        --color-text-muted: #64748b;
        font-family: 'Inter', sans-serif;
      }

      .property-detail-container {
        min-height: 100vh;
        background: var(--color-bg);
        color: var(--color-text-main);
      }
      .property-content {
        max-width: 1320px;
        margin: 0 auto;
        padding: 32px 24px;
      }

      /* Breadcrumb */
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: var(--color-text-muted);
        margin-bottom: 24px;
        font-weight: 500;
      }
      .breadcrumb a {
        color: var(--color-blue-dark);
        text-decoration: none;
        transition: color 0.2s;
      }
      .breadcrumb a:hover {
        color: var(--color-blue-accent);
      }
      .breadcrumb mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .main-details-grid {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 40px;
        align-items: start;
      }

      /* --- HEADER --- */
      .property-header {
        margin-bottom: 24px;
      }
      .badges {
        display: flex;
        gap: 10px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .badge.featured {
        background: linear-gradient(135deg, #fef3c7, #fde68a);
        color: #b45309;
      }
      .badge.verified {
        background: #dcfce7;
        color: #15803d;
      }
      .badge.type {
        background: #e0e7ff;
        color: #4338ca;
      }
      .badge.type.sale {
        background: #fee2e2;
        color: #b91c1c;
      }
      .badge.type.rent {
        background: #dcfce7;
        color: #15803d;
      }
      .badge.type.shorttermrent {
        background: #e0e7ff;
        color: #4338ca;
      }
      .badge mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .property-title {
        font-size: 2.5rem;
        font-weight: 900;
        color: var(--color-navy);
        margin: 0 0 16px 0;
        line-height: 1.2;
        letter-spacing: -1px;
      }
      .location-row {
        display: flex;
        align-items: center;
        gap: 16px;
        color: var(--color-text-muted);
        font-size: 1.05rem;
      }
      .location {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .location mat-icon {
        color: var(--color-blue-accent);
      }

      /* --- GALLERY MODERN --- */
      .gallery-section-modern {
        margin-bottom: 32px;
      }
      .main-stage {
        position: relative;
        height: 500px;
        border-radius: 24px;
        overflow: hidden;
        background: #cbd5e1;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
      }
      .stage-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .main-stage:hover .stage-img {
        transform: scale(1.03);
      }
      .img-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(15, 23, 42, 0.3) 0%, transparent 40%);
        pointer-events: none;
      }
      .nav-arrow {
        width: 56px;
        height: 56px;
        background: rgba(255, 255, 255, 0.85);
        border: none;
        border-radius: 16px;
        color: var(--color-navy);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(8px);
        transition: all 0.3s ease;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }
      .nav-arrow:hover {
        background: white;
        transform: scale(1.1);
        color: var(--color-blue-accent);
      }
      .gallery-controls {
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        z-index: 5;
      }
      .count-pill {
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(12px);
        color: white;
        padding: 8px 16px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.9rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .thumbnail-strip {
        display: flex;
        gap: 12px;
        margin-top: 16px;
        overflow-x: auto;
        padding: 4px 4px 16px 4px;
      }
      .thumbnail-strip::-webkit-scrollbar {
        height: 6px;
      }
      .thumbnail-strip::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }
      .thumb-item {
        flex-shrink: 0;
        width: 120px;
        height: 85px;
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        transition: all 0.3s ease;
        opacity: 0.7;
      }
      .thumb-item:hover {
        opacity: 1;
      }
      .thumb-item.active {
        opacity: 1;
        border: 3px solid var(--color-blue-accent);
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
      }
      .thumb-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* --- QUICK STATS GLASS --- */
      .quick-stats-glass {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 24px 32px;
        border-radius: 24px;
        margin-bottom: 32px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
        border: 1px solid #e2e8f0;
      }
      .stat-item {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .stat-icon-wrapper {
        width: 48px;
        height: 48px;
        background: #eff6ff;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-blue-dark);
        transition: transform 0.3s;
      }
      .quick-stats-glass:hover .stat-icon-wrapper {
        transform: translateY(-3px) rotate(5deg);
      }
      .stat-info {
        display: flex;
        flex-direction: column;
      }
      .stat-value {
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--color-navy);
      }
      .stat-label {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        font-weight: 600;
      }
      .divider-vertical {
        width: 1px;
        height: 40px;
        background: #e2e8f0;
      }

      /* --- CONTENT CARDS --- */
      .content-card {
        background: white;
        padding: 32px;
        border-radius: 24px;
        margin-bottom: 32px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        border: 1px solid #f1f5f9;
      }
      .section-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-navy);
        margin: 0 0 20px 0;
        letter-spacing: -0.5px;
      }
      .description-text {
        font-size: 1.05rem;
        line-height: 1.7;
        color: #334155;
        white-space: pre-wrap;
        margin: 0;
      }

      /* --- AMENITIES GRID --- */
      .amenities-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
      }
      .amenity-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .amenity-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        color: #94a3b8;
        transition: all 0.3s;
      }
      .amenity-icon.active {
        background: #eff6ff;
        color: var(--color-blue-dark);
      }
      .amenity-item:hover .amenity-icon.active {
        transform: scale(1.1);
        background: var(--color-blue-dark);
        color: white;
      }
      .amenity-label {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-main);
      }
      .amenity-label.strike {
        text-decoration: line-through;
        color: #94a3b8;
      }
      .unavailable {
        opacity: 0.6;
      }

      /* --- SIDEBAR & GLASSMORPHISM --- */
      .sidebar-column {
        position: relative;
      }
      .sticky-wrapper {
        position: sticky;
        top: 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .glass-card {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.8);
        border-radius: 28px;
        padding: 32px;
        box-shadow:
          0 20px 40px -10px rgba(15, 23, 42, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.6);
        position: relative;
        overflow: hidden;
      }

      .price-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        background: linear-gradient(90deg, var(--color-blue-accent), var(--color-blue-dark));
      }

      .price-display {
        margin-bottom: 24px;
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 8px;
      }
      .price-amount {
        font-size: 2.4rem;
        font-weight: 900;
        color: var(--color-navy);
        letter-spacing: -1px;
      }
      .currency {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--color-text-muted);
      }
      .price-period,
      .price-type {
        font-size: 1.1rem;
        color: var(--color-text-muted);
        font-weight: 600;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .btn-main-action {
        height: 56px !important;
        border-radius: 16px !important;
        font-size: 1.15rem !important;
        font-weight: 800 !important;
        letter-spacing: 0.5px;
        background: linear-gradient(
          135deg,
          var(--color-blue-accent),
          var(--color-blue-dark)
        ) !important;
        color: white !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3) !important;
      }
      .btn-main-action:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 25px rgba(37, 99, 235, 0.4) !important;
      }
      .btn-main-action ::ng-deep .mdc-button__label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
      }

      .secondary-actions {
        display: flex;
        gap: 12px;
      }
      .btn-chat {
        flex: 1;
        height: 48px !important;
        border-radius: 14px !important;
        font-weight: 700 !important;
        color: var(--color-navy) !important;
        border-color: #cbd5e1 !important;
      }
      .btn-chat:hover {
        background: #f8fafc !important;
        border-color: var(--color-blue-accent) !important;
        color: var(--color-blue-dark) !important;
      }

      .btn-fav-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        border: 1px solid #cbd5e1;
        background: transparent;
        color: var(--color-text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
      }
      .btn-fav-icon:hover {
        background: #fee2e2;
        border-color: #fca5a5;
        color: #ef4444;
      }
      .btn-fav-icon.active {
        background: #ef4444;
        border-color: #ef4444;
        color: white;
        box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
      }

      .btn-edit {
        height: 48px !important;
        border-radius: 14px !important;
        font-weight: 700 !important;
        background: var(--color-gold) !important;
        color: var(--color-navy) !important;
      }
      .btn-delete {
        height: 48px !important;
        border-radius: 14px !important;
        font-weight: 700 !important;
      }

      /* --- HOST CARD --- */
      .host-card {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 24px;
      }
      .host-avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        overflow: hidden;
        background: #e2e8f0;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 2px solid white;
      }
      .host-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
      }
      .host-details {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .host-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .host-name {
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--color-navy);
        margin: 0;
      }
      .host-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
        color: #10b981;
        font-weight: 600;
      }
      .host-badge mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      /* --- RECOMMENDATIONS --- */
      .recommendations-section {
        margin-top: 60px;
        padding-top: 60px;
        border-top: 1px solid #e2e8f0;
      }
      .rec-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 32px;
      }
      .rec-icon {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
        color: var(--color-blue-dark);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .rec-icon mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .section-subtitle {
        font-size: 1.1rem;
        color: var(--color-text-muted);
        margin: 0;
      }

      .recommendations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
      }
      .rel-card-premium {
        background: white;
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.02);
      }
      .rel-card-premium:hover {
        transform: translateY(-10px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
      }
      .rel-image-box {
        position: relative;
        height: 200px;
      }
      .rel-image-box img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .rel-price-overlay {
        position: absolute;
        bottom: 12px;
        right: 12px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(8px);
        color: white;
        padding: 6px 12px;
        border-radius: 10px;
        font-weight: 800;
        font-size: 0.95rem;
      }
      .rel-body {
        padding: 20px;
      }
      .rel-title {
        font-size: 1.1rem;
        font-weight: 800;
        margin: 0 0 10px 0;
        color: var(--color-navy);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .rel-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--color-text-muted);
        font-size: 0.9rem;
        font-weight: 500;
      }
      .rel-meta mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--color-blue-accent);
      }

      @media (max-width: 1024px) {
        .main-details-grid {
          grid-template-columns: 1fr;
        }
        .sticky-wrapper {
          position: static;
        }
      }
      @media (max-width: 768px) {
        .property-title {
          font-size: 2rem;
        }
        .main-stage {
          height: 300px;
          border-radius: 16px;
        }
        .quick-stats-glass {
          flex-wrap: wrap;
          gap: 20px;
          padding: 20px;
        }
        .divider-vertical {
          display: none;
        }
        .stat-item {
          width: 45%;
        }
        .glass-card {
          padding: 24px;
          border-radius: 20px;
        }
        .content-card {
          padding: 24px;
          border-radius: 20px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private favoritesService = inject(FavoritesService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);
  private imageOptimizationService = inject(ImageOptimizationService);

  property = this.propertyService.currentProperty;
  loading = this.propertyService.loading;
  error = signal<string | null>(null);
  currentImageIndex = signal(0);
  isFavorite = signal(false);
  similarProperties = signal<any[]>([]);
  isBumpingProperty = signal(false);
  private readonly propertyId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );

  getAmenityIcon(name: string): string {
    const icons: any = {
      wifi: 'wifi',
      parking: 'local_parking',
      pool: 'pool',
      ac: 'ac_unit',
      heating: 'hot_tub',
      kitchen: 'restaurant',
      tv: 'tv',
      washer: 'local_laundry_service',
      workspace: 'laptop_mac',
      elevator: 'elevator',
      security: 'security',
      generator: 'bolt',
      furniture: 'chair',
      renovated: 'auto_fix_high',
      pets: 'pets',
      metro: 'directions_subway',
      market: 'storefront',
      school: 'school',
      hospital: 'local_hospital',
    };
    return icons[name] || 'check_circle';
  }

  currentImage = computed(() => {
    const prop = this.property();
    if (prop?.images && prop.images.length > 0) {
      const image = prop.images[this.currentImageIndex()];
      const url = image.url || image.imageUrl || '';
      return this.imageOptimizationService.getOptimizedImage(url, 1200, 800);
    }
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1200&auto=format&fit=crop';
  });

  getThumbnailUrl(image: PropertyImage): string {
    const url = image.thumbnailUrl || image.url || image.imageUrl || '';
    return this.imageOptimizationService.getOptimizedImage(url, 200, 150);
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
      { name: 'security', label: "Qo'riqlash", available: prop.hasSecurity },
      { name: 'generator', label: 'Generator', available: prop.hasGenerator },
      { name: 'furniture', label: 'Mebel', available: prop.hasFurniture },
      { name: 'renovated', label: 'Tamirlangan', available: prop.isRenovated },
      { name: 'pets', label: 'Uy hayvonlari', available: prop.petsAllowed },
      { name: 'metro', label: 'Metro yaqinida', available: prop.hasMetroNearby },
      { name: 'market', label: 'Bozor yaqinida', available: prop.hasMarketNearby },
      { name: 'school', label: 'Maktab yaqinida', available: prop.hasSchoolNearby },
      { name: 'hospital', label: 'Shifoxona', available: prop.hasHospitalNearby },
    ];
  });

  constructor() {
    effect(() => {
      const id = this.propertyId();

      if (id) {
        this.loadProperty(id);
        this.loadSimilarProperties(id);
      } else {
        this.error.set('Mulk ID topilmadi');
      }
    });

    effect(() => {
      if (!this.isAuthenticated()) {
        this.favoritesService.clear();
        this.isFavorite.set(false);
        return;
      }

      this.favoritesService.loadFavorites().subscribe({
        error: () => undefined,
      });
    });

    effect(() => {
      const prop = this.property();
      const favoriteItems = this.favoritesService.favoriteItems();

      if (!prop) {
        this.isFavorite.set(false);
        return;
      }

      this.isFavorite.set(favoriteItems.some((item) => item.favorite.propertyId === prop.id));
    });
  }

  loadProperty(id: string): void {
    this.error.set(null);
    this.currentImageIndex.set(0);

    this.propertyService.getPropertyById(id).subscribe({
      error: () => {
        this.error.set("Mulk ma'lumotlarini yuklashda xatolik yuz berdi");
      },
    });
  }

  loadSimilarProperties(id: string): void {
    this.propertyService.searchProperties({ pageSize: 4 }).subscribe({
      next: (res: any) => {
        this.similarProperties.set(res.items.filter((p: any) => p.id !== id));
      },
    });
  }

  selectImage(index: number): void {
    this.currentImageIndex.set(index);
  }

  prevImage(): void {
    this.currentImageIndex.update((i) => {
      const prop = this.property();
      if (!prop?.images) return 0;
      return i === 0 ? prop.images.length - 1 : i - 1;
    });
  }

  nextImage(): void {
    this.currentImageIndex.update((i) => {
      const prop = this.property();
      if (!prop?.images) return 0;
      return i === prop.images.length - 1 ? 0 : i + 1;
    });
  }

  getListingLabel(listingType: string | undefined): string {
    switch (listingType) {
      case 'Rent':
        return 'Ijaraga';
      case 'Sale':
        return 'Sotuvda';
      case 'ShortTermRent':
        return 'Kunlik ijara';
      default:
        return 'Ijara / Sotuv';
    }
  }

  getMainActionLabel(): string {
    const type = this.property()?.listingType;
    if (type === ListingType.Sale) return 'Sotib olish';
    if (type === ListingType.Rent) return 'Ijaraga olish';
    return 'Sanani tanlash va Bron';
  }

  handleMainAction(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const type = this.property()?.listingType;
    if (type === ListingType.ShortTermRent) {
      const bookingPanel = document.querySelector('app-booking-panel');
      if (bookingPanel) {
        bookingPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      this.contactHost();
    }
  }

  contactHost(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const prop = this.property();
    if (prop?.hostId) {
      void this.router.navigate(['/messages'], {
        queryParams: {
          userId: prop.hostId,
          userName: prop.hostName || 'Foydalanuvchi',
          userAvatar: prop.hostAvatarUrl || '',
          propertyId: prop.id,
          propertyTitle: prop.title,
          propertyImage: prop.images?.[0]?.url || '',
        },
      });
    } else {
      this.toastService.error("Host ma'lumotlari topilmadi.");
    }
  }

  toggleFavorite(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const prop = this.property();
    if (!prop) {
      return;
    }

    const favoriteId = this.favoritesService.getFavoriteIdByPropertyId(prop.id);

    const request = favoriteId
      ? this.favoritesService.removeFavoriteById(favoriteId)
      : this.favoritesService.addFavorite(prop.id).pipe(map(() => void 0));

    request.subscribe({
      next: () => {
        this.toastService.success(
          favoriteId ? 'Sevimlilardan olib tashlandi.' : "Sevimlilarga qo'shildi.",
        );
      },
      error: () => {
        this.toastService.error('Sevimlilar bilan ishlashda xatolik yuz berdi.');
      },
    });
  }

  getFavoriteTooltip(): string {
    return this.isFavorite() ? 'Sevimlilardan olib tashlash' : "Sevimlilarga qo'shish";
  }

  bumpPropertyDetail(): void {
    const prop = this.property();
    if (!prop) return;

    this.isBumpingProperty.set(true);
    this.propertyService.bumpProperty(prop.id).subscribe({
      next: () => {
        this.isBumpingProperty.set(false);
        this.toastService.success(`"${prop.title}" tepaga ko'tarildi! ✅`);
      },
      error: () => {
        this.isBumpingProperty.set(false);
        this.toastService.error("Ko'tarishda xatolik yuz berdi");
      },
    });
  }

  deleteProperty(): void {
    const prop = this.property();
    if (!prop) return;

    const dialogData: ConfirmationDialogData = {
      title: "E'lonni o'chirish",
      message: "Bu amalni qaytarib bo'lmaydi. E'lon va unga bog'liq ma'lumotlar o'chiriladi.",
      confirmLabel: "O'chirish",
      cancelLabel: 'Bekor qilish',
      tone: 'danger',
    };

    this.dialog
      .open(ConfirmationDialogComponent, { data: dialogData })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.propertyService.deleteProperty(prop.id).subscribe({
            next: () => {
              this.toastService.success("E'lon muvaffaqiyatli o'chirildi.");
              this.router.navigate(['/properties']);
            },
            error: () => {
              this.toastService.error("E'lonni o'chirishda xatolik yuz berdi.");
            },
          });
        }
      });
  }

  onMainImageError(): void {
    // If main image fails, try next image if available
    const prop = this.property();
    if (prop?.images && prop.images.length > 1) {
      this.nextImage();
    }
  }

  onThumbnailError(index: number): void {
    // Log but don't break - use fallback image
    console.warn(`Thumbnail at index ${index} failed to load`);
  }

  getSimilarPropertyImage(rel: any): string {
    const url =
      rel.images?.[0]?.url ||
      rel.images?.[0]?.thumbnailUrl ||
      rel.imageUrl ||
      rel.mainImageUrl ||
      '';
    if (!url)
      return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=400&auto=format&fit=crop';
    return this.imageOptimizationService.getOptimizedImage(url, 400, 300);
  }
}

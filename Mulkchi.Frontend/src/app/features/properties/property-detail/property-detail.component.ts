import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  CUSTOM_ELEMENTS_SCHEMA,
  PLATFORM_ID,
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
import * as L from 'leaflet';
import { map, Subscription } from 'rxjs';
import { ListingType, PropertyImage, PropertyType } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { FavoritesService } from '../../../core/services/favorites.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { PropertyService } from '../../../core/services/property.service';
import { SeoService } from '../../../core/services/seo.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ToastService } from '../../../core/services/toast.service';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MortgageCalculatorComponent } from '../../../shared/components/mortgage-calculator/mortgage-calculator';
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
    BookingPanelComponent,
    MortgageCalculatorComponent,
    SkeletonLoaderComponent,
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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="property-detail-container">
      <ng-container *ngIf="loading(); else checkError">
        <div class="loading-container p-6">
          <app-skeleton-loader type="detail"></app-skeleton-loader>
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

              <!-- Airbnb Style Image Gallery -->
              <div
                class="airbnb-gallery-section"
                *ngIf="property()?.images && property()!.images!.length > 0; else noImage"
              >
                <div class="gallery-grid" [class.has-multiple]="property()!.images!.length > 1">
                  <div class="main-photo" (click)="openLightbox(0)">
                    <img
                      [src]="getFullImageUrl(property()!.images![0])"
                      [alt]="property()?.title"
                      [style.view-transition-name]="'property-image-' + property()?.id"
                      (error)="onMainImageError()"
                    />
                    
                    <div class="virtual-tours-actions">
                      <button class="btn-3d-tour" (click)="open3DTour($event)">
                        <mat-icon>360</mat-icon>
                        <span>3D Tur</span>
                      </button>
                      
                      <button class="btn-ar-tour" (click)="openARViewer($event)">
                        <mat-icon>view_in_ar</mat-icon>
                        <span>Mebel AR</span>
                      </button>
                    </div>
                  </div>

                  <div class="side-photos" *ngIf="property()!.images!.length > 1">
                    @for (img of property()!.images!.slice(1, 5); track $index) {
                      <div class="side-photo" (click)="openLightbox($index + 1)">
                        <img [src]="getFullImageUrl(img)" [alt]="'Photo ' + ($index + 2)" />
                        <div
                          class="show-all-btn"
                          *ngIf="$index === 3 && property()!.images!.length > 5"
                        >
                          <mat-icon>apps</mat-icon>
                          Barcha {{ property()!.images!.length }} ta
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
              <ng-template #noImage>
                <div class="no-image-placeholder">
                  <mat-icon>landscape</mat-icon>
                  <p>Suratlar mavjud emas</p>
                </div>
              </ng-template>

              <!-- Lightbox Overlay -->
              <div class="lightbox-overlay" *ngIf="isLightboxOpen()" @fadeInUp>
                <button class="lightbox-close" (click)="closeLightbox()">
                  <mat-icon>close</mat-icon>
                </button>
                <div class="lightbox-content">
                  <button class="nav-arrow prev" (click)="prevImage()">
                    <mat-icon>west</mat-icon>
                  </button>
                  <img [src]="currentImage()" alt="Lightbox Image" class="lightbox-img" />
                  <button class="nav-arrow next" (click)="nextImage()">
                    <mat-icon>east</mat-icon>
                  </button>
                </div>
                <div class="count-pill lightbox-counter">
                  {{ currentImageIndex() + 1 }} / {{ property()!.images!.length }}
                </div>
              </div>

              <!-- 3D Viewer Overlay -->
              <div class="lightbox-overlay" *ngIf="is3DViewerOpen()" @fadeInUp>
                <button class="lightbox-close" (click)="close3DViewer()">
                  <mat-icon>close</mat-icon>
                </button>
                <div class="lightbox-content viewer-3d-content">
                   <div id="psv-container" style="width: 100%; height: 100vh;"></div>
                </div>
              </div>

              <!-- AR Viewer Overlay -->
              <div class="lightbox-overlay" *ngIf="isARViewerOpen()" @fadeInUp>
                <button class="lightbox-close" (click)="closeARViewer()">
                  <mat-icon>close</mat-icon>
                </button>
                <div class="lightbox-content viewer-ar-content">
                  <model-viewer
                    src="https://cdn.shopify.com/s/files/1/0456/5509/7511/files/Chair.glb?v=1628335986"
                    ios-src="https://modelviewer.dev/shared-assets/models/Chair.usdz"
                    alt="A 3D model of a chair"
                    ar
                    auto-rotate
                    camera-controls
                    style="width: 100%; height: 80vh; background-color: #f1f5f9; border-radius: 16px;">
                  </model-viewer>
                </div>
              </div>

              <!-- Quick Stats Premium -->
              <div class="quick-stats-glass">
                <div class="stat-item" *ngIf="showRooms()">
                  <div class="stat-icon-wrapper"><mat-icon>bed</mat-icon></div>
                  <div class="stat-info">
                    <span class="stat-value">{{ property()?.numberOfBedrooms || 1 }}</span>
                    <span class="stat-label">Xona</span>
                  </div>
                </div>
                <div class="divider-vertical" *ngIf="showRooms() && showBathrooms()"></div>
                <div class="stat-item" *ngIf="showBathrooms()">
                  <div class="stat-icon-wrapper"><mat-icon>bathtub</mat-icon></div>
                  <div class="stat-info">
                    <span class="stat-value">{{ property()?.numberOfBathrooms || 1 }}</span>
                    <span class="stat-label">Hammom</span>
                  </div>
                </div>
                <div class="divider-vertical" *ngIf="showBathrooms()"></div>
                <div class="stat-item">
                  <div class="stat-icon-wrapper"><mat-icon>square_foot</mat-icon></div>
                  <div class="stat-info">
                    <span class="stat-value">{{ property()?.area }}</span>
                    <span class="stat-label">m²</span>
                  </div>
                </div>
                <div class="divider-vertical" *ngIf="showGuests()"></div>
                <div class="stat-item" *ngIf="showGuests()">
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


              <!-- Location / Map -->
              <div class="location-section content-card">
                <h2 class="section-title">Joylashuv</h2>
                <p class="location-subtitle">
                  {{ property()?.address }}, {{ property()?.district }}, {{ property()?.city }}
                </p>
                <div id="property-detail-map" class="property-map"></div>
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
                          *ngIf="property()?.listingType === ListingType.Sale"
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
                          <div class="edit-content">
                            <mat-icon>edit</mat-icon> Tahrirlash
                          </div>
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
                      *ngIf="property()?.hostAvatarUrl && !avatarLoadError()"
                      [src]="getFullAvatarUrl(property()?.hostAvatarUrl)"
                      [alt]="property()?.hostName"
                      (error)="avatarLoadError.set(true)"
                    />
                    <div
                      *ngIf="!property()?.hostAvatarUrl || avatarLoadError()"
                      class="avatar-placeholder"
                    >
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
                    (property()?.listingType === ListingType.ShortTermRent ||
                      property()?.listingType === ListingType.Rent)
                  "
                  [property]="property()!"
                ></app-booking-panel>

                <!-- Mortgage Calculator (Only for Sale) -->
                <app-mortgage-calculator
                  *ngIf="property()?.listingType === ListingType.Sale && property()?.salePrice"
                  [propertyPrice]="property()!.salePrice!"
                  [currencyType]="property()?.currency || 'UZS'"
                ></app-mortgage-calculator>
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
          
          <!-- Mobile Sticky Action Bar -->
          <div class="mobile-action-bar">
            <div class="mobile-price">
              <span *ngIf="property()?.listingType === ListingType.Sale && property()?.salePrice" class="price-amount">
                {{ property()?.salePrice | number }} <span class="currency">{{ property()?.currency }}</span>
              </span>
              <span *ngIf="property()?.listingType === ListingType.Rent && property()?.monthlyRent" class="price-amount">
                {{ property()?.monthlyRent | number }} <span class="currency">{{ property()?.currency }}</span>/oy
              </span>
              <span *ngIf="property()?.listingType === ListingType.ShortTermRent && property()?.pricePerNight" class="price-amount">
                {{ property()?.pricePerNight | number }} <span class="currency">{{ property()?.currency }}</span>/tun
              </span>
            </div>
            
            <div class="mobile-actions">
              <ng-container *ngIf="isAuthenticated() && !isOwner()">
                <button *ngIf="property()?.listingType === ListingType.Sale" mat-flat-button class="btn-main-action" (click)="handleMainAction()">
                  {{ getMainActionLabel() }}
                </button>
              </ng-container>
              <ng-container *ngIf="!isAuthenticated()">
                <button mat-flat-button class="btn-main-action" (click)="handleMainAction()">Kirish</button>
              </ng-container>
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      :host {
        --color-navy: var(--color-primary);
        --color-gold-dark: var(--color-gold);
        --color-blue-accent: var(--color-info);
        --color-blue-dark: var(--color-info);
        --color-bg: var(--color-background);
        --color-text-main: var(--color-text-primary);
        --color-text-muted: var(--color-text-secondary);
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
        background: linear-gradient(135deg, color-mix(in srgb, var(--color-gold) 15%, transparent), color-mix(in srgb, var(--color-gold) 35%, transparent));
        color: var(--color-gold);
      }
      .badge.verified {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }
      .badge.type {
        background: color-mix(in srgb, var(--color-info) 15%, transparent);
        color: var(--color-info);
      }
      .badge.type.sale {
        background: color-mix(in srgb, var(--color-error) 15%, transparent);
        color: var(--color-error);
      }
      .badge.type.rent {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }
      .badge.type.shorttermrent {
        background: color-mix(in srgb, var(--color-info) 15%, transparent);
        color: var(--color-info);
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

      .airbnb-gallery-section {
        margin-bottom: 32px;
        border-radius: 24px;
        overflow: hidden;
        position: relative;
        background: var(--color-surface);
      }
      .gallery-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        height: 500px;
      }
      .gallery-grid.has-multiple {
        grid-template-columns: 1fr 1fr;
      }
      .main-photo {
        height: 100%;
        overflow: hidden;
        cursor: pointer;
        position: relative;
      }
      .main-photo img,
      .side-photo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition:
          transform 0.5s ease,
          filter 0.3s ease;
      }
      .main-photo:hover img,
      .side-photo:hover img {
        transform: scale(1.03);
        filter: brightness(0.9);
      }
      .side-photos {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr;
        gap: 8px;
        height: 100%;
      }
      .side-photo {
        height: 100%;
        overflow: hidden;
        cursor: pointer;
        position: relative;
      }
      .show-all-btn {
        position: absolute;
        bottom: 16px;
        right: 16px;
        background: white;
        color: var(--color-navy);
        padding: 8px 16px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid var(--color-border);
        transition: transform 0.2s;
      }
      .show-all-btn:hover {
        transform: translateY(-2px);
      }
      .show-all-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .btn-3d-tour {
        background: rgba(15, 23, 42, 0.75);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        backdrop-filter: blur(8px);
        cursor: pointer;
        transition: all 0.3s;
      }
      .btn-3d-tour:hover {
        background: var(--color-gold);
        color: var(--color-navy);
        transform: scale(1.05);
      }
      .virtual-tours-actions {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        z-index: 10;
      }
      .btn-ar-tour {
        background: rgba(124, 58, 237, 0.85);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 8px 16px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        backdrop-filter: blur(8px);
        cursor: pointer;
        transition: all 0.3s;
      }
      .btn-ar-tour:hover {
        background: #6d28d9;
        transform: scale(1.05);
      }

      .btn-3d-tour mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .lightbox-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .lightbox-close {
        position: absolute;
        top: 24px;
        right: 24px;
        background: white;
        border: none;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1001;
      }
      .lightbox-content {
        position: relative;
        width: 90%;
        height: 90%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24px;
      }
      .viewer-3d-content {
        width: 100%;
        height: 100%;
        padding: 0 !important;
        background: #000;
      }
      .lightbox-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 12px;
      }
      .nav-arrow {
        width: 56px;
        height: 56px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
      .nav-arrow:hover {
        background: white;
        color: var(--color-navy);
      }
      .lightbox-counter {
        position: absolute;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      .quick-stats-glass {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 24px 32px;
        border-radius: 24px;
        margin-bottom: 32px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
        border: 1px solid var(--color-border);
      }
      .stat-item {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .stat-icon-wrapper {
        width: 48px;
        height: 48px;
        background: color-mix(in srgb, var(--color-info) 10%, transparent);
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
        background: var(--color-border);
      }

      .content-card {
        background: white;
        padding: 32px;
        border-radius: 24px;
        margin-bottom: 32px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        border: 1px solid var(--color-surface);
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
        color: var(--color-text-primary);
        white-space: pre-wrap;
        margin: 0;
      }

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
        background: var(--color-surface);
        color: var(--color-text-secondary);
        transition: all 0.3s;
      }
      .amenity-icon.active {
        background: color-mix(in srgb, var(--color-info) 10%, transparent);
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
        color: var(--color-text-secondary);
      }
      .unavailable {
        opacity: 0.6;
      }

      .location-section {
        margin-bottom: 32px;
      }
      .location-subtitle {
        font-size: 1.1rem;
        color: var(--color-text-muted);
        margin-bottom: 20px;
      }
      .property-map {
        height: 400px;
        width: 100%;
        border-radius: 16px;
        background: var(--color-border);
        z-index: 1;
        border: 1px solid var(--color-border);
        overflow: hidden;
      }

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
        border-color: var(--color-border) !important;
      }
      .btn-chat:hover {
        background: var(--color-background) !important;
        border-color: var(--color-blue-accent) !important;
        color: var(--color-blue-dark) !important;
      }

      .btn-fav-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        border: 1px solid var(--color-border);
        background: transparent;
        color: var(--color-text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
      }
      .btn-fav-icon:hover {
        background: color-mix(in srgb, var(--color-error) 15%, transparent);
        border-color: var(--color-error);
        color: var(--color-error);
      }
      .btn-fav-icon.active {
        background: var(--color-error);
        border-color: var(--color-error);
        color: white;
        box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
      }

      .btn-edit {
        height: 48px !important;
        border-radius: 14px !important;
        font-weight: 700 !important;
        background: var(--color-gold) !important;
        color: #1b3a6b !important;
        --mdc-filled-button-label-text-color: #1b3a6b !important;
      }
      .edit-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        color: #1b3a6b !important;
      }
      .edit-content mat-icon {
        color: #1b3a6b !important;
      }
      .btn-delete {
        height: 48px !important;
        border-radius: 14px !important;
        font-weight: 700 !important;
      }

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
        background: var(--color-border);
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
        color: var(--color-text-secondary);
      }
      .avatar-placeholder mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
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
        color: var(--color-success);
        font-weight: 600;
      }
      .host-badge mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .recommendations-section {
        margin-top: 60px;
        padding-top: 60px;
        border-top: 1px solid var(--color-border);
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
        background: linear-gradient(135deg, color-mix(in srgb, var(--color-info) 15%, transparent), var(--color-surface));
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
        border: 1px solid var(--color-border);
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.02);
      }
      .rel-card-premium:hover {
        transform: translateY(-10px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        border-color: var(--color-border);
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
      }
      .amenity-icon.active {
        background: color-mix(in srgb, var(--color-gold) 15%, transparent);
        color: var(--color-gold);
      }
      .amenity-label {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }
      .strike {
        text-decoration: line-through;
        color: var(--color-text-secondary);
      }
      .unavailable {
        opacity: 0.5;
      }

      .virtual-tour-container {
        position: relative;
        width: 100%;
        height: 400px;
        border-radius: 16px;
        overflow: hidden;
        background: var(--color-surface-overlay);
        cursor: pointer;
      }
      .tour-bg-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.6;
        transition: opacity 0.4s;
      }
      .tour-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2;
        gap: 12px;
      }
      .tour-overlay p {
        color: white;
        font-size: 1.2rem;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        margin: 0;
      }
      .tour-hint {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85rem;
      }
      .virtual-tour-container:hover .tour-bg-img {
        opacity: 0.35;
      }
      .play-btn {
        transform: scale(1.2);
        transition: transform 0.3s;
      }
      .virtual-tour-container:hover .play-btn {
        transform: scale(1.4);
      }
      .section-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      .section-top .section-title {
        margin: 0;
      }

      .immersive-tour {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: var(--color-background);
        display: flex;
        flex-direction: column;
      }
      .tour-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 24px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        z-index: 2;
      }
      .tour-topbar-left {
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;
        font-weight: 700;
        font-size: 1rem;
      }
      .tour-topbar-left mat-icon {
        color: var(--color-info);
      }
      .tour-counter {
        background: rgba(255, 255, 255, 0.12);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.8);
      }
      .tour-topbar-right {
        display: flex;
        gap: 4px;
      }
      .tour-topbar-right button {
        color: rgba(255, 255, 255, 0.7);
      }
      .tour-topbar-right button:hover {
        color: white;
      }

      .tour-main {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        cursor: grab;
        user-select: none;
      }
      .tour-main:active {
        cursor: grabbing;
      }
      .tour-main-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transition:
          transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
          opacity 0.3s;
      }
      .tour-main-img.dragging {
        transition: none;
      }

      .tour-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(8px);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.25s;
        z-index: 3;
      }
      .tour-nav:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-50%) scale(1.1);
      }
      .tour-nav-prev {
        left: 24px;
      }
      .tour-nav-next {
        right: 24px;
      }
      .tour-nav mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .tour-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
      }
      .tour-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--color-info), var(--color-info));
        transition: width 0.4s ease;
        border-radius: 0 2px 2px 0;
      }

      .tour-thumbnails {
        display: flex;
        gap: 8px;
        padding: 12px 24px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        overflow-x: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      }
      .tour-thumb {
        flex-shrink: 0;
        width: 80px;
        height: 56px;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        opacity: 0.5;
        transition: all 0.25s;
      }
      .tour-thumb:hover {
        opacity: 0.8;
      }
      .tour-thumb.active {
        border-color: var(--color-info);
        opacity: 1;
      }
      .tour-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .location-subtitle {
        font-size: 1rem;
        color: var(--color-text-secondary);
        margin: 0 0 16px 0;
      }
      .property-map {
        width: 100%;
        height: 300px;
        border-radius: 16px;
      }
      
      .mobile-action-bar {
        display: none;
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
        .mobile-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: fixed;
          bottom: 64px; /* Above bottom nav */
          left: 0;
          right: 0;
          background: var(--color-surface-elevated);
          padding: 12px 16px;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
          border-top: 1px solid var(--color-border-soft);
          z-index: 100;
        }
        .mobile-price {
          display: flex;
          flex-direction: column;
        }
        .mobile-price .price-amount {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--color-text-primary);
        }
        .mobile-price .currency {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
        }
        .mobile-actions .btn-main-action {
          height: 44px !important;
          border-radius: 22px !important;
          padding: 0 20px !important;
          font-size: 0.9rem !important;
        }
        .property-content {
          padding-bottom: 120px; /* Space for both mobile bars */
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
  private seoService = inject(SeoService);
  private authService = inject(AuthService);
  private favoritesService = inject(FavoritesService);
  private dialog = inject(MatDialog);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  private imageOptimizationService = inject(ImageOptimizationService);

  property = this.propertyService.currentProperty;
  loading = this.propertyService.loading;
  error = signal<string | null>(null);

  isLightboxOpen = signal(false);
  currentImageIndex = signal(0);
  is3DViewerOpen = signal(false);
  isARViewerOpen = signal(false);
  private viewer: any = null;
  private routeSub: Subscription | null = null;
  
  avatarLoadError = signal<boolean>(false);
  isTourActive = signal<boolean>(false);
  tourCurrentIndex = signal<number>(0);
  isTourAutoplay = signal<boolean>(false);
  isTourDragging = false;
  private tourDragStartX = 0;
  private tourAutoplayInterval: any = null;
  isFavorite = signal(false);
  similarProperties = signal<any[]>([]);
  isBumpingProperty = signal(false);

  readonly propertyId = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
    initialValue: this.route.snapshot.paramMap.get('id'),
  });

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
      return this.getFullImageUrl(image);
    }
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop';
  });

  getFullImageUrl(image: any): string {
    const url = image?.url || image?.imageUrl || image?.mediumUrl || image?.thumbnailUrl || '';
    if (!url) {
      return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop';
    }

    return this.imageOptimizationService.getOptimizedImage(url, 1200, 800);
  }

  getFullAvatarUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return this.imageOptimizationService.getOptimizedImage(url, 200, 200);
  }

  openLightbox(index: number): void {
    this.currentImageIndex.set(index);
    this.isLightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
    document.body.style.overflow = '';
  }

  open3DTour(event: Event) {
    event.stopPropagation();
    this.is3DViewerOpen.set(true);
    document.body.style.overflow = 'hidden';
    
    // Initialize 3D Viewer after view renders
    setTimeout(() => {
      import('@photo-sphere-viewer/core').then(({ Viewer }) => {
        const container = document.querySelector('#psv-container') as HTMLElement;
        if (!container) return;
        
        // Load a dummy 360 image if real one is not present. Real apps would use property().virtualTourUrl
        this.viewer = new Viewer({
          container: container,
          panorama: 'https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg',
          caption: '3D Tur - Mulkchi AI',
          navbar: [
            'zoom',
            'move',
            'download',
            'caption',
            'fullscreen',
          ],
        });
      });
    }, 100);
  }

  close3DViewer() {
    this.is3DViewerOpen.set(false);
    document.body.style.overflow = '';
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }

  openARViewer(event: Event): void {
    event.stopPropagation();
    this.isARViewerOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeARViewer(): void {
    this.isARViewerOpen.set(false);
    document.body.style.overflow = 'auto';
  }

  startVirtualTour(): void {
    const vt = this.property()?.virtualTourUrl;
    if (vt) {
      const url = vt.startsWith('http') ? vt : window.location.origin + vt;
      window.open(url, '_blank');
      return;
    }

    this.tourCurrentIndex.set(0);
    this.isTourActive.set(true);
    this.isTourAutoplay.set(true);
    this.startTourAutoplay();
    document.body.style.overflow = 'hidden';
  }

  closeTour(): void {
    this.isTourActive.set(false);
    this.isTourAutoplay.set(false);
    this.stopTourAutoplay();
    document.body.style.overflow = '';
  }

  tourNext(): void {
    const images = this.property()?.images;
    if (!images) return;
    this.tourCurrentIndex.set((this.tourCurrentIndex() + 1) % images.length);
  }

  tourPrev(): void {
    const images = this.property()?.images;
    if (!images) return;
    this.tourCurrentIndex.set((this.tourCurrentIndex() - 1 + images.length) % images.length);
  }

  tourGoTo(index: number): void {
    this.tourCurrentIndex.set(index);
  }

  toggleTourAutoplay(): void {
    if (this.isTourAutoplay()) {
      this.isTourAutoplay.set(false);
      this.stopTourAutoplay();
    } else {
      this.isTourAutoplay.set(true);
      this.startTourAutoplay();
    }
  }

  private startTourAutoplay(): void {
    this.stopTourAutoplay();
    this.tourAutoplayInterval = setInterval(() => {
      this.tourNext();
    }, 3000);
  }

  private stopTourAutoplay(): void {
    if (this.tourAutoplayInterval) {
      clearInterval(this.tourAutoplayInterval);
      this.tourAutoplayInterval = null;
    }
  }

  onTourDragStart(event: MouseEvent): void {
    this.isTourDragging = true;
    this.tourDragStartX = event.clientX;
    this.stopTourAutoplay();
    this.isTourAutoplay.set(false);
  }

  onTourDragMove(event: MouseEvent): void {
    if (!this.isTourDragging) return;
    const diff = event.clientX - this.tourDragStartX;
    if (Math.abs(diff) > 80) {
      if (diff > 0) {
        this.tourPrev();
      } else {
        this.tourNext();
      }
      this.tourDragStartX = event.clientX;
    }
  }

  onTourDragEnd(): void {
    this.isTourDragging = false;
  }

  onTourTouchStart(event: TouchEvent): void {
    this.isTourDragging = true;
    this.tourDragStartX = event.touches[0].clientX;
    this.stopTourAutoplay();
    this.isTourAutoplay.set(false);
  }

  onTourTouchMove(event: TouchEvent): void {
    if (!this.isTourDragging) return;
    const diff = event.touches[0].clientX - this.tourDragStartX;
    if (Math.abs(diff) > 60) {
      if (diff > 0) {
        this.tourPrev();
      } else {
        this.tourNext();
      }
      this.tourDragStartX = event.touches[0].clientX;
    }
  }

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

  showRooms(): boolean {
    const type = this.property()?.type;
    return type !== PropertyType.Land && type !== PropertyType.Commercial;
  }

  showBathrooms(): boolean {
    const type = this.property()?.type;
    return (
      type !== PropertyType.Land && type !== PropertyType.Commercial && type !== PropertyType.Office
    );
  }

  showGuests(): boolean {
    return this.property()?.listingType === ListingType.ShortTermRent;
  }

  loadProperty(id: string): void {
    this.error.set(null);
    this.currentImageIndex.set(0);

    this.propertyService.getPropertyById(id).subscribe({
      next: (prop) => {
        setTimeout(() => this.initMap(prop), 500);
        
        // Update SEO metadata
        this.seoService.updateMetaTags({
          title: prop.title,
          description: prop.description ? prop.description.substring(0, 150) + '...' : 'Toshkentda zamonaviy ijara va savdo uylari',
          image: prop.images?.length ? this.getFullImageUrl(prop.images[0]) : undefined
        });
      },
      error: () => {
        this.error.set("Mulk ma'lumotlarini yuklashda xatolik yuz berdi");
      },
    });
  }

  private map: L.Map | undefined;

  initMap(prop: any): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const mapContainer = document.getElementById('property-detail-map');
    if (!mapContainer || !prop.latitude || !prop.longitude) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('property-detail-map').setView([prop.latitude, prop.longitude], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background: var(--color-info); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"><i class="material-icons" style="font-size: 20px;">home</i></div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    L.marker([prop.latitude, prop.longitude], { icon: customIcon }).addTo(this.map);
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
    if (type === ListingType.Sale) return "Uy egasi bilan bog'lanish";
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
    if (type === ListingType.ShortTermRent || type === ListingType.Rent) {
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
          propertyImage:
            prop.images?.[0]?.url ||
            prop.images?.[0]?.imageUrl ||
            prop.images?.[0]?.mediumUrl ||
            prop.images?.[0]?.thumbnailUrl ||
            '',
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
    const prop = this.property();
    if (prop?.images && prop.images.length > 1) {
      this.nextImage();
    }
  }

  onThumbnailError(index: number): void {
    console.warn(`Thumbnail at index ${index} failed to load`);
  }

  getSimilarPropertyImage(rel: any): string {
    const url =
      rel.images?.[0]?.url ||
      rel.images?.[0]?.mediumUrl ||
      rel.images?.[0]?.thumbnailUrl ||
      rel.imageUrl ||
      rel.mainImageUrl ||
      '';
    if (!url)
      return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=400&auto=format&fit=crop';
    return this.imageOptimizationService.getOptimizedImage(url, 400, 300);
  }
}

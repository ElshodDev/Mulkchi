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
        <div class="property-content">
          <!-- Breadcrumb -->
          <div class="breadcrumb">
            <a routerLink="/">Bosh sahifa</a>
            <mat-icon>chevron_right</mat-icon>
            <a routerLink="/properties">Ko'chmas mulk</a>
            <mat-icon>chevron_right</mat-icon>
            <span>{{ property()?.title }}</span>
          </div>

          <!-- Property Header (Mobile) -->
          <div class="property-header-mobile">
            <div class="badges">
              <span *ngIf="property()?.isFeatured" class="badge featured"><mat-icon>star</mat-icon> Featured</span>
              <span *ngIf="property()?.isVerified" class="badge verified"><mat-icon>verified</mat-icon> Tasdiqlangan</span>
              <span *ngIf="property()?.isInstantBook" class="badge instant"><mat-icon>bolt</mat-icon> Tez bron</span>
            </div>
            <h1 class="property-title">{{ property()?.title }}</h1>
            <div class="location-row">
              <div class="location">
                <mat-icon>location_on</mat-icon>
                <span>{{ property()?.address }}, {{ property()?.district }}, {{ property()?.city }}</span>
              </div>
            </div>
          </div>

          <!-- Main Grid -->
          <div class="main-details-grid">
            <!-- Left Column -->
            <div class="left-column">
              <!-- Image Gallery -->
              <div class="gallery-section-modern">
                <div class="main-stage">
                  <ng-container *ngIf="currentImage(); else noImage">
                    <img [src]="currentImage()" [alt]="property()?.title" class="stage-img" />
                    <div class="img-overlay"></div>
                  </ng-container>
                  <ng-template #noImage>
                    <div class="no-image-placeholder">
                      <mat-icon>landscape</mat-icon>
                      <p>Suratlar mavjud emas</p>
                    </div>
                  </ng-template>

                  <div class="gallery-controls" *ngIf="property()?.images && property()!.images!.length > 1">
                    <button class="nav-arrow prev" (click)="prevImage()"><mat-icon>west</mat-icon></button>
                    <button class="nav-arrow next" (click)="nextImage()"><mat-icon>east</mat-icon></button>
                    <div class="count-pill">{{ currentImageIndex() + 1 }} / {{ property()!.images!.length }}</div>
                  </div>
                </div>

                <div class="thumbnail-strip" *ngIf="property()?.images && property()!.images!.length > 1">
                  @for (image of property()!.images; track $index) {
                    <div 
                      class="thumb-item" 
                      [class.active]="$index === currentImageIndex()"
                      (click)="selectImage($index)">
                      <img [src]="getThumbnailUrl(image)" [alt]="image.caption || ''" />
                    </div>
                  }
                </div>
              </div>

              <!-- Description -->
              <div class="description-section">
                <h2 class="section-title">
                  <mat-icon>description</mat-icon>
                  Tavsif
                </h2>
                <p class="description-text">{{ property()?.description || 'Tavsif mavjud emas' }}</p>
              </div>

              <mat-divider></mat-divider>

              <!-- Amenities -->
              <div class="amenities-section">
                <h2 class="section-title">
                  <mat-icon>checklist</mat-icon>
                  Qulayliklar
                </h2>
                <div class="amenities-chips-modern">
                  <div
                    *ngFor="let amenity of amenitiesList()"
                    class="amenity-chip-premium"
                    [class.available]="amenity.available"
                  >
                    <mat-icon>{{ getAmenityIcon(amenity.name) }}</mat-icon>
                    <span>{{ amenity.label }}</span>
                  </div>
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
                  <div class="location-item"><span class="location-label">Viloyat</span><span class="location-value">{{ property()?.region }}</span></div>
                  <div class="location-item"><span class="location-label">Shahar</span><span class="location-value">{{ property()?.city }}</span></div>
                  <div class="location-item"><span class="location-label">Tuman</span><span class="location-value">{{ property()?.district }}</span></div>
                  <div class="location-item"><span class="location-label">Mahalla</span><span class="location-value">{{ property()?.mahalla }}</span></div>
                  <div class="location-item full-width"><span class="location-label">Manzil</span><span class="location-value">{{ property()?.address }}</span></div>
                </div>
              </div>
            </div>

            <!-- Right Column (Sidebar) -->
            <div class="info-section">
              <div class="property-header-desktop">
                <div class="badges">
                  <span *ngIf="property()?.isFeatured" class="badge featured"><mat-icon>star</mat-icon> Featured</span>
                  <span *ngIf="property()?.isVerified" class="badge verified"><mat-icon>verified</mat-icon> Tasdiqlangan</span>
                  <span *ngIf="property()?.isInstantBook" class="badge instant"><mat-icon>bolt</mat-icon> Tez bron</span>
                </div>
                <h1 class="property-title">{{ property()?.title }}</h1>
                <div class="location-row">
                  <div class="location">
                    <mat-icon>location_on</mat-icon>
                    <span>{{ property()?.address }}, {{ property()?.district }}, {{ property()?.city }}</span>
                  </div>
                </div>
              </div>

              <!-- Price Card -->
              <div class="price-card">
                <div class="price-display">
                  <span *ngIf="property()?.listingType === ListingType.Sale && property()?.salePrice" class="price-amount">{{ property()?.salePrice | number }} {{ property()?.currency }}</span>
                  <span *ngIf="property()?.listingType === ListingType.Sale && property()?.salePrice" class="price-type sale">Sotuv</span>
                  <span *ngIf="property()?.listingType === ListingType.Rent && property()?.monthlyRent" class="price-amount">{{ property()?.monthlyRent | number }} {{ property()?.currency }}</span>
                  <span *ngIf="property()?.listingType === ListingType.Rent && property()?.monthlyRent" class="price-period">/oy</span>
                  <span *ngIf="property()?.listingType === ListingType.ShortTermRent && property()?.pricePerNight" class="price-amount">{{ property()?.pricePerNight | number }} {{ property()?.currency }}</span>
                  <span *ngIf="property()?.listingType === ListingType.ShortTermRent && property()?.pricePerNight" class="price-period">/tun</span>
                </div>
                <div *ngIf="property()?.averageRating" class="rating-display">
                  <mat-icon>star</mat-icon>
                  <span class="rating-value">{{ property()?.averageRating | number: '1.1-1' }}</span>
                  <span class="rating-count">({{ property()?.viewsCount }} ko'rish)</span>
                </div>
              </div>

              <mat-divider></mat-divider>

              <!-- Quick Stats -->
              <div class="quick-stats">
                <div class="stat-item"><div class="stat-icon"><mat-icon>bed</mat-icon></div><div class="stat-info"><span class="stat-value">{{ property()?.numberOfBedrooms }}</span><span class="stat-label">Xona</span></div></div>
                <div class="stat-item"><div class="stat-icon"><mat-icon>bathtub</mat-icon></div><div class="stat-info"><span class="stat-value">{{ property()?.numberOfBathrooms }}</span><span class="stat-label">Hammom</span></div></div>
                <div class="stat-item"><div class="stat-icon"><mat-icon>square_foot</mat-icon></div><div class="stat-info"><span class="stat-value">{{ property()?.area }}</span><span class="stat-label">m²</span></div></div>
                <div class="stat-item"><div class="stat-icon"><mat-icon>people</mat-icon></div><div class="stat-info"><span class="stat-value">{{ property()?.maxGuests }}</span><span class="stat-label">Mehmon</span></div></div>
              </div>

              <mat-divider></mat-divider>

              <!-- Host Card -->
              <div class="host-card">
                <div class="host-header"><mat-icon>account_circle</mat-icon><h3>Uy egasi haqida</h3></div>
                <div class="host-content">
                  <div class="host-avatar">
                    <img *ngIf="property()?.hostAvatarUrl" [src]="property()?.hostAvatarUrl" [alt]="property()?.hostName">
                    <div *ngIf="!property()?.hostAvatarUrl" class="avatar-placeholder"><mat-icon>person</mat-icon></div>
                  </div>
                  <div class="host-details">
                    <h4 class="host-name">{{ property()?.hostName || 'Foydalanuvchi' }}</h4>
                    <div class="host-badge"><mat-icon>verified</mat-icon><span>Tasdiqlangan</span></div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="actions-section">
                <ng-container *ngIf="isAuthenticated() && !isOwner()">
                  <div class="action-buttons">
                    <button mat-raised-button class="action-btn primary" (click)="bookNow()"><mat-icon>calendar_today</mat-icon> Bron qilish</button>
                    <button mat-stroked-button class="action-btn secondary" (click)="contactHost()"><mat-icon>message</mat-icon> Bog'lanish</button>
                    <button class="favorite-btn" [class.active]="isFavorite()" (click)="toggleFavorite()"><mat-icon>{{ isFavorite() ? 'favorite' : 'favorite_border' }}</mat-icon></button>
                  </div>
                </ng-container>
                <ng-container *ngIf="isAuthenticated() && isOwner()">
                  <div class="owner-actions">
                    <button mat-raised-button class="edit-btn" [routerLink]="['/host/properties/edit', property()?.id]"><mat-icon>edit</mat-icon> Tahrirlash</button>
                    <button mat-stroked-button class="delete-btn" (click)="deleteProperty()"><mat-icon>delete</mat-icon> O'chirish</button>
                  </div>
                </ng-container>
              </div>

              <!-- Booking Panel -->
              <app-booking-panel
                *ngIf="isAuthenticated() && !isOwner() && property()?.listingType === ListingType.ShortTermRent"
                [property]="property()!"
              ></app-booking-panel>
            </div>
          </div>

          <!-- AI Recommendations Section -->
          <div class="recommendations-section" *ngIf="similarProperties().length > 0">
            <h2 class="section-title"><mat-icon>auto_awesome</mat-icon> Sun'iy intellekt tavsiya qiladi</h2>
            <p class="section-subtitle">Ushbu mulkka o'xshash eng yaxshi takliflar</p>
            <div class="recommendations-grid">
              @for (rel of similarProperties(); track rel.id) {
                <div class="rel-card-premium" [routerLink]="['/properties', rel.id]">
                  <div class="rel-image-box">
                    <img [src]="getSimilarPropertyImage(rel)" alt="Similar">
                    <div class="rel-price-overlay">
                      {{ rel.salePrice || rel.monthlyRent | number }} UZS
                    </div>
                  </div>
                  <div class="rel-body">
                    <h4>{{ rel.title }}</h4>
                    <div class="rel-meta">
                      <mat-icon>place</mat-icon>
                      <span>{{ rel.city }}</span>
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
        --color-navy: #1b3a6b;
        --color-navy-light: #2a4a7c;
        --color-gold: #c9a84c;
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

      .property-detail-container { min-height: 100vh; background: var(--color-gray-50); }
      .property-content { max-width: 1280px; margin: 0 auto; padding: 24px; }
      
      .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.875rem; color: var(--color-gray-500); margin-bottom: 24px; }
      .breadcrumb a { color: var(--color-navy); text-decoration: none; }
      .breadcrumb a:hover { color: var(--color-gold); }

      .main-details-grid { display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: start; }

      /* --- GALLERY MODERN --- */
      .gallery-section-modern { margin-bottom: 40px; }
      .main-stage { position: relative; height: 560px; border-radius: 32px; overflow: hidden; background: #0f172a; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
      .stage-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
      .img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.4), transparent 40%); }
      .nav-arrow { width: 56px; height: 56px; background: rgba(255,255,255,0.9); border: none; border-radius: 18px; color: var(--color-navy); cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); transition: all 0.3s; }
      .nav-arrow:hover { background: white; transform: scale(1.1); color: var(--color-gold); }
      .gallery-controls { position: absolute; bottom: 24px; left: 24px; right: 24px; display: flex; justify-content: space-between; align-items: center; z-index: 5; }
      .count-pill { background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); color: white; padding: 8px 16px; border-radius: 12px; font-weight: 700; font-size: 0.85rem; }

      .thumbnail-strip { display: flex; gap: 16px; margin-top: 20px; padding: 4px; overflow-x: auto; }
      .thumb-item { flex-shrink: 0; width: 110px; height: 80px; border-radius: 16px; overflow: hidden; cursor: pointer; border: 3px solid transparent; transition: all 0.3s; }
      .thumb-item.active { border-color: var(--color-gold); transform: translateY(-4px); box-shadow: 0 8px 16px rgba(201,168,76,0.3); }
      .thumb-item img { width: 100%; height: 100%; object-fit: cover; }

      .section-title { font-size: 1.75rem; font-weight: 900; color: var(--color-gray-900); letter-spacing: -0.5px; }
      
      /* --- PRICE CARD PREMIUM --- */
      .price-card { 
        background: white; 
        padding: 32px; 
        border-radius: 32px; 
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08); 
        border: 1px solid rgba(255,255,255,0.8);
        position: relative;
        overflow: hidden;
      }
      .price-card::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 6px; background: var(--color-gold); }

      .recommendations-section { 
        background: white; 
        margin: 80px -24px -24px; 
        padding: 80px 40px; 
        border-top: 1px solid #e2e8f0; 
      }
      .rel-card-premium { 
        background: #f8fafc; 
        border-radius: 28px; 
        overflow: hidden; 
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
        border: 1px solid #f1f5f9;
      }
      .rel-card-premium:hover { transform: translateY(-12px); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.1); border-color: var(--color-gold); }
      .rel-image-box { position: relative; height: 220px; }
      .rel-image-box img { width: 100%; height: 100%; object-fit: cover; }
      .rel-price-overlay { position: absolute; bottom: 16px; right: 16px; background: var(--color-navy); color: white; padding: 8px 16px; border-radius: 12px; font-weight: 800; font-size: 0.9rem; }
      .rel-body { padding: 24px; }
      .rel-body h4 { font-size: 1.1rem; font-weight: 800; margin-bottom: 12px; color: var(--color-navy); }
      .rel-meta { display: flex; align-items: center; gap: 6px; color: #64748b; font-size: 0.85rem; }
      .rel-meta mat-icon { font-size: 16px; width: 16px; height: 16px; }

      @media (max-width: 1024px) {
        .main-details-grid { grid-template-columns: 1fr; }
        .recommendations-section { margin-left: -24px; margin-right: -24px; padding: 60px 24px; }
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
      hospital: 'local_hospital'
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
      { name: 'hospital', label: 'Shifoxona yaqinida', available: prop.hasHospitalNearby },
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
      }
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

  bookNow(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const bookingPanel = document.querySelector('app-booking-panel');
    if (bookingPanel) {
      bookingPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          propertyImage: prop.images?.[0]?.url || ''
        }
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

  getSimilarPropertyImage(rel: any): string {
    const url = rel.images?.[0]?.url || rel.images?.[0]?.thumbnailUrl || '';
    return this.imageOptimizationService.getOptimizedImage(url, 400, 300);
  }
}

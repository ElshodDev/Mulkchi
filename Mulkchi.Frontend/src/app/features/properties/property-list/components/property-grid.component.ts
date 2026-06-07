import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Property } from '../../../../core/models';
import { ComparisonService } from '../../../../core/services/comparison.service';
import { FavoritesService } from '../../../../core/services/favorites.service';
import { ImageOptimizationService } from '../../../../core/services/image-optimization.service';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-property-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    ScrollingModule,
    SkeletonLoaderComponent,
  ],
  template: `
    <div class="property-grid-modern" [class.list-view]="viewMode === 'list'">
      <cdk-virtual-scroll-viewport
        itemSize="450"
        class="viewport-scroll"
        [class.list-view-item]="viewMode === 'list'"
      >
        <div class="grid-layout">
          @if (isLoading) {
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="card-wrapper">
                <app-skeleton-loader type="card"></app-skeleton-loader>
              </div>
            }
          } @else {
            <div
              *cdkVirtualFor="let property of properties; trackBy: trackByPropertyFn"
              class="card-wrapper"
            >
            <div class="premium-card" 
                 (click)="propertyClick.emit(property.id)"
                 [matTooltip]="getAiInsight(property)" 
                 matTooltipClass="ai-tooltip" 
                 matTooltipPosition="above">
              <!-- IMAGE SECTION -->
              <div class="card-media">
                <div class="img-zoom-container">
                  <ng-container
                    *ngIf="property.images && property.images.length > 0; else placeholderImage"
                  >
                    <img
                      [src]="getFullImageUrl(property)"
                      [alt]="property.title"
                      class="main-img"
                      [style.view-transition-name]="'property-image-' + property.id"
                      (error)="
                        $any($event.target).src =
                          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop'
                      "
                    />
                  </ng-container>
                  <ng-template #placeholderImage>
                    <img
                      src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop"
                      alt="Placeholder"
                      class="main-img"
                    />
                  </ng-template>
                </div>

                <!-- Action Buttons Overlay -->
                <div class="media-actions">
                  <button 
                    mat-icon-button 
                    class="btn-action-glass compare" 
                    [class.active-compare]="isCompared(property.id)"
                    (click)="onCompareClick($event, property)"
                    [matTooltip]="isCompared(property.id) ? 'Solishtirishdan olish' : 'Solishtirishga qo‘shish'"
                  >
                    <mat-icon>{{ isCompared(property.id) ? 'compare_arrows' : 'add_road' }}</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    class="btn-action-glass favorite"
                    (click)="onFavoriteClick($event, property.id)"
                    matTooltip="Saqlanganlarga qo'shish"
                  >
                    <mat-icon [style.color]="isFavorite(property.id) ? 'var(--color-error)' : ''">
                      {{ isFavorite(property.id) ? 'favorite' : 'favorite_border' }}
                    </mat-icon>
                  </button>
                </div>

                <!-- Badges -->
                <div class="badge-container">
                  @if (property.isFeatured) {
                    <span class="badge-lux featured">
                      <mat-icon>auto_awesome</mat-icon>
                      Tavsiya
                    </span>
                  }
                  @if (property.isVerified) {
                    <span class="badge-lux verified" matTooltip="Tasdiqlangan">
                      <mat-icon>verified</mat-icon>
                    </span>
                  }
                </div>
              </div>

              <!-- CONTENT SECTION -->
              <div class="card-body">
                <div class="body-header">
                  <div class="rating-box" [class.high]="property.averageRating >= 4.5">
                    <mat-icon>star</mat-icon>
                    <span>{{
                      property.averageRating > 0 ? property.averageRating.toFixed(1) : '4.8'
                    }}</span>
                  </div>
                  <h3 class="card-title">{{ property.title }}</h3>
                </div>

                <div class="card-location">
                  <mat-icon>place</mat-icon>
                  <span
                    >{{ property.city
                    }}{{ property.district ? ', ' + property.district : '' }}</span
                  >
                </div>

                <div class="card-specs">
                  <div class="spec-item" matTooltip="Xonalar">
                    <mat-icon>meeting_room</mat-icon>
                    <span>{{ property.numberOfBedrooms }}</span>
                  </div>
                  <div class="spec-item" matTooltip="Yuvinish xonasi">
                    <mat-icon>shower</mat-icon>
                    <span>{{ property.numberOfBathrooms }}</span>
                  </div>
                  <div class="spec-item" matTooltip="Maydoni">
                    <mat-icon>architecture</mat-icon>
                    <span>{{ property.area }} m²</span>
                  </div>
                </div>

                <div class="card-footer">
                  <div class="price-tag">
                    <span class="price-amount">{{
                      formatPrice(
                        property.salePrice || property.monthlyRent || property.pricePerNight
                      )
                    }}</span>
                    <span class="price-currency">{{ property.currency || 'UZS' }}</span>
                    @if (property.listingType === 'Rent') {
                      <span class="price-period">/oy</span>
                    }
                    @if (property.listingType === 'ShortTermRent') {
                      <span class="price-period">/kun</span>
                    }
                  </div>
                  
                  <div class="footer-badges">
                    <div class="time-pill" matTooltip="Qo'shilgan vaqti">
                      <mat-icon style="font-size: 14px; width: 14px; height: 14px; margin-right: 2px;">schedule</mat-icon>
                      {{ getRelativeTime(property.createdDate) }}
                    </div>
                    <div class="type-pill" [class]="property.listingType.toLowerCase()">
                      {{ getListingTypeLabel(property.listingType) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          }
        </div>
      </cdk-virtual-scroll-viewport>
    </div>
  `,
  styles: [
    `
      :host {
        --navy: var(--color-primary);
        --gold: var(--color-gold);
        --text: var(--color-text-primary);
        --muted: var(--color-text-secondary);
        --border: var(--color-border);
        --white: var(--color-surface);
        --shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
        --shadow-hover: 0 30px 60px rgba(0, 0, 0, 0.12);
        display: block;
      }

      .property-grid-modern {
        height: calc(100vh - 280px);
      }
      .viewport-scroll {
        height: 100%;
        width: 100%;
      }

      .grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 32px;
        padding: 10px;
      }

      .card-wrapper {
        padding: 0;
      }

      .premium-card {
        background: var(--white);
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(0, 0, 0, 0.04);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .premium-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
      }

      .card-media {
        position: relative;
        height: 240px;
        overflow: hidden;
      }

      .img-zoom-container {
        width: 100%;
        height: 100%;
        transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .premium-card:hover .img-zoom-container {
        transform: scale(1.1);
      }

      .main-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .media-actions {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 5;
      }

      .btn-action-glass {
        background: rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(10px);
        color: var(--white) !important;
        border: 1px solid rgba(255, 255, 255, 0.3);
        transition: all 0.3s;
      }
      .btn-action-glass:hover {
        background: var(--white) !important;
        color: var(--navy) !important;
      }
      .btn-action-glass.favorite:hover {
        color: var(--color-error) !important;
      }
      .btn-action-glass.compare.active-compare {
        background: var(--color-primary) !important;
        color: var(--white) !important;
        border-color: var(--color-primary);
      }
      .btn-action-glass.compare:hover {
        color: var(--color-primary) !important;
      }

      .badge-container {
        position: absolute;
        top: 16px;
        left: 16px;
        display: flex;
        gap: 8px;
      }

      .badge-lux {
        padding: 6px 14px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 6px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      }

      .badge-lux.featured {
        background: rgba(201, 168, 76, 0.9);
        color: white;
      }
      .badge-lux.verified {
        background: rgba(255, 255, 255, 0.8);
        color: var(--color-success);
        padding: 6px;
      }
      .badge-lux mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .card-body {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .body-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .card-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--navy);
        margin: 0;
        line-height: 1.3;
        flex: 1;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .rating-box.high {
        background: var(--color-surface-elevated);
        color: var(--color-gold);
      }
      .rating-box mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--color-gold);
      }

      .card-location {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--muted);
        font-size: 0.85rem;
        font-weight: 500;
      }
      .card-location mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--color-text-secondary);
      }

      .card-specs {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 4px;
      }
      .spec-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--color-text-primary);
        background: var(--color-surface-elevated);
        padding: 6px 12px;
        border-radius: 12px;
      }
      .spec-item mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--color-text-secondary);
      }

      .card-footer {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        border-top: 1px dashed var(--color-border);
      }

      .price-tag {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }
      .price-amount {
        font-size: 1.4rem;
        font-weight: 900;
        color: var(--navy);
        letter-spacing: -0.5px;
      }
      .price-currency {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--gold);
      }
      .price-period {
        font-size: 0.8rem;
        color: var(--muted);
        font-weight: 600;
      }

      .type-pill {
        font-size: 0.65rem;
        font-weight: 900;
        padding: 5px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      .type-pill.rent {
        background: color-mix(in srgb, var(--color-success) 15%, transparent);
        color: var(--color-success);
      }
      .type-pill.sale {
        background: color-mix(in srgb, var(--color-warning) 15%, transparent);
        color: var(--color-warning);
      }
      .type-pill.shorttermrent {
        background: color-mix(in srgb, var(--color-info) 15%, transparent);
        color: var(--color-info);
      }
      
      .footer-badges {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
      }
      
      .time-pill {
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--muted);
        display: flex;
        align-items: center;
      }

      .property-grid-modern.list-view .grid-layout {
        grid-template-columns: 1fr;
      }

      .property-grid-modern.list-view .premium-card {
        flex-direction: row;
        height: 260px;
      }

      .property-grid-modern.list-view .card-media {
        width: 380px;
        height: 100%;
        flex-shrink: 0;
      }

      .property-grid-modern.list-view .card-body {
        flex: 1;
        justify-content: space-between;
      }

      @media (max-width: 992px) {
        .property-grid-modern.list-view .premium-card {
          flex-direction: column;
          height: auto;
        }
        .property-grid-modern.list-view .card-media {
          width: 100%;
          height: 240px;
        }
      }

      @media (max-width: 768px) {
        .grid-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PropertyGridComponent {
  @Input() properties: Property[] = [];
  @Input() viewMode = 'grid';
  @Input() isLoading = false;

  @Output() propertyClick = new EventEmitter<string>();
  @Output() compareToggle = new EventEmitter<string>();
  @Output() favoriteToggle = new EventEmitter<string>();

  private favoritesService = inject(FavoritesService);
  private comparisonService = inject(ComparisonService);
  private imageService = inject(ImageOptimizationService);

  trackByPropertyFn(index: number, property: Property): string {
    return property.id;
  }

  getAiInsight(property: Property): string {
    const p = property as any;
    let price = 0;
    if (p.salePrice) price = p.salePrice;
    else if (p.monthlyRent) price = p.monthlyRent;
    
    if (price === 0) return 'AI: Bu uy sarmoya uchun yaxshi tanlov bo\'lishi mumkin.';
    
    // Mock AI logic based on price and area
    if (price > 1000000000) {
      return 'AI Xulosasi: Premium toifadagi mulk. Narxi hudud o\'rtachasidan yuqori, lekin yuqori qulayliklarga ega.';
    } else if (price < 500000000) {
      return 'AI Xulosasi: Qulay narx! Bu mulk o\'z hududidagi o\'rtacha narxdan 10-15% arzonroq.';
    } else {
      return 'AI Xulosasi: Balanslashgan narx. Sarmoya kiritish uchun xavfsiz tanlov.';
    }
  }

  isFavorite(id: string): boolean {
    return this.favoritesService.isFavorite(id);
  }

  isCompared(id: string): boolean {
    return this.comparisonService.isInComparison(id);
  }

  onCompareClick(event: Event, property: any): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.isCompared(property.id)) {
      this.comparisonService.removeFromCompare(property.id);
    } else {
      this.comparisonService.addToCompare(property);
    }
    this.compareToggle.emit(property.id);
  }

  onFavoriteClick(event: Event, id: string): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.isFavorite(id)) {
      this.favoritesService.removeFavoriteByPropertyId(id).subscribe();
    } else {
      this.favoritesService.addFavorite(id).subscribe();
    }
    this.favoriteToggle.emit(id);
  }

  formatPrice(price?: number): string {
    if (!price) return '0';
    return price.toLocaleString('uz-UZ');
  }

  getListingTypeLabel(listingType: string): string {
    switch (listingType) {
      case 'Rent':
        return 'Ijaraga';
      case 'Sale':
        return 'Sotishga';
      case 'ShortTermRent':
        return 'Kunlik';
      default:
        return listingType;
    }
  }

  getFullImageUrl(property: Property): string {
    const rawUrl =
      property.images?.[0]?.url ||
      property.images?.[0]?.imageUrl ||
      property.images?.[0]?.mediumUrl ||
      property.images?.[0]?.thumbnailUrl ||
      '';

    if (!rawUrl) {
      return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
    }

    return this.imageService.getOptimizedImage(rawUrl, 600, 400);
  }

  getRelativeTime(dateString: any): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hozirgina';
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays === 1) return 'Kecha';
    if (diffDays < 7) return `${diffDays} kun oldin`;
    
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

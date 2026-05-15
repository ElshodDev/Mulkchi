import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Property } from '../../../../core/models';
import { OptimizedImageComponent } from '../../../../shared/components/optimized-image/optimized-image.component';

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
    OptimizedImageComponent,
  ],
  template: `
    <div class="virtual-scroll-container" [class.list-view]="viewMode === 'list'">
      <cdk-virtual-scroll-viewport
        itemSize="320"
        [class.list-view-item]="viewMode === 'list'"
        class="property-viewport"
      >
        <div
          *cdkVirtualFor="let property of properties; trackBy: trackByPropertyFn"
          class="virtual-item"
        >
          <mat-card class="property-card" (click)="propertyClick.emit(property.id)">
            <div class="property-image">
              <ng-container
                *ngIf="property.images && property.images.length > 0; else placeholderImage"
              >
                <app-optimized-image
                  [src]="property.images[0].url"
                  [alt]="property.title"
                  [width]="400"
                  [height]="220"
                  [placeholder]="getLowQualityPlaceholder(property)"
                  [placeholderBlur]="true"
                >
                </app-optimized-image>
              </ng-container>
              <ng-template #placeholderImage>
                <app-optimized-image
                  [src]="'/assets/placeholder.svg'"
                  [alt]="property.title"
                  [width]="400"
                  [height]="220"
                >
                </app-optimized-image>
              </ng-template>

              <!-- Compare Button -->
              <button
                mat-icon-button
                class="compare-action-btn"
                (click)="compareToggle.emit(property.id); $event.stopPropagation()"
                matTooltip="Solishtirishga qo'shish"
              >
                <mat-icon aria-hidden="false">add_circle_outline</mat-icon>
              </button>

              <!-- Badges -->
              <div class="property-badges">
                <span *ngIf="property.isFeatured" class="badge featured">Tavsiya</span>
                <span *ngIf="property.isVerified" class="badge verified">
                  <mat-icon>verified</mat-icon>
                </span>
                <span *ngIf="property.isInstantBook" class="badge instant">Tez bron</span>
              </div>
            </div>

            <mat-card-content>
              <div class="property-header">
                <h3>{{ property.title }}</h3>
                <div class="rating">
                  <mat-icon>star</mat-icon>
                  <span>{{ property.averageRating.toFixed(1) }}</span>
                </div>
              </div>

              <div class="location">
                <mat-icon>location_on</mat-icon>
                <span>{{ property.city }}, {{ property.district }}</span>
              </div>

              <div class="features">
                <span>
                  <mat-icon>bed</mat-icon>
                  {{ property.numberOfBedrooms }} xona
                </span>
                <span>
                  <mat-icon>bath</mat-icon>
                  {{ property.numberOfBathrooms }} vannaxona
                </span>
                <span>
                  <mat-icon>straighten</mat-icon>
                  {{ property.area }} m²
                </span>
              </div>

              <div class="amenities-preview">
                <mat-icon *ngIf="property.hasWifi" matTooltip="Wi-Fi">wifi</mat-icon>
                <mat-icon *ngIf="property.hasParking" matTooltip="Parking">local_parking</mat-icon>
                <mat-icon *ngIf="property.hasPool" matTooltip="Pool">pool</mat-icon>
                <mat-icon *ngIf="property.hasAirConditioning" matTooltip="AC">ac_unit</mat-icon>
              </div>

              <div class="price-section">
                <div class="price">
                  <ng-container *ngIf="property.listingType === 'Rent'; else checkSale">
                    {{ formatPrice(property.monthlyRent) }} UZS/oy
                  </ng-container>
                  <ng-template #checkSale>
                    <ng-container *ngIf="property.listingType === 'Sale'; else nightly">
                      {{ formatPrice(property.salePrice) }} UZS
                    </ng-container>
                  </ng-template>
                  <ng-template #nightly>
                    {{ formatPrice(property.pricePerNight) }} UZS/kecha
                  </ng-template>
                </div>
                <span
                  class="type"
                  [class.sale-type]="property.listingType === 'Sale'"
                  [class.rent-type]="property.listingType === 'Rent'"
                  [class.short-term-type]="property.listingType === 'ShortTermRent'"
                >
                  {{ getListingTypeLabel(property.listingType) }}
                </span>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </cdk-virtual-scroll-viewport>
    </div>
  `,
  styles: [
    `
      .virtual-scroll-container {
        height: calc(100vh - 300px);
        min-height: 600px;
        margin-bottom: 32px;
      }

      .property-viewport {
        height: 100%;
        width: 100%;
      }

      .virtual-item {
        padding: 12px;
        box-sizing: border-box;
      }

      .virtual-scroll-container.list-view {
        height: calc(100vh - 200px);
      }

      .virtual-scroll-container.list-view .property-viewport {
        min-height: 180px;
      }

      .virtual-scroll-container.list-view .virtual-item {
        padding: 8px;
      }

      .property-card {
        cursor: pointer;
        background: var(--color-surface-elevated);
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-4);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .property-card:hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-lg);
        border-color: var(--color-brand-200);
      }

      .property-image {
        position: relative;
        height: 240px;
        overflow: hidden;
      }

      .property-image::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, transparent 60%, rgba(0, 0, 0, 0.4));
        pointer-events: none;
      }

      .compare-action-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        z-index: 2;
        color: var(--color-navy);
      }

      .property-badges {
        position: absolute;
        top: 12px;
        left: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 2;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 30px;
        font-size: 0.75rem;
        font-weight: 600;
        backdrop-filter: blur(12px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .badge.featured {
        background: rgba(201, 168, 76, 0.9);
        color: white;
      }

      .badge.verified {
        background: rgba(34, 197, 94, 0.9);
        color: white;
        padding: 6px;
        border-radius: 50%;
      }

      .badge.verified mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .badge.instant {
        background: rgba(27, 58, 107, 0.9);
        color: white;
      }

      mat-card-content {
        padding: var(--space-4);
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .property-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .property-header h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0;
        flex: 1;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.875rem;
      }

      .rating mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .location {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--color-text-secondary);
        font-size: 0.875rem;
        margin-bottom: var(--space-4);
      }

      .location mat-icon {
        font-size: 18px;
        color: var(--color-brand-500);
      }

      .features {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
        padding: var(--space-2) 0;
        border-top: 1px solid var(--color-border-soft);
        border-bottom: 1px solid var(--color-border-soft);
      }

      .features span {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.875rem;
        color: var(--color-text-secondary);
        font-weight: 500;
      }

      .features mat-icon {
        font-size: 18px;
        color: var(--color-text-muted);
      }

      .amenities-preview {
        display: flex;
        gap: 12px;
        margin-bottom: var(--space-4);
      }

      .amenities-preview mat-icon {
        color: var(--color-text-muted);
        font-size: 20px;
        transition: color 0.2s ease;
      }

      .amenities-preview mat-icon:hover {
        color: var(--color-brand-600);
      }

      .price-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding-top: var(--space-3);
      }

      .price {
        font-size: 1.375rem;
        font-weight: 800;
        color: var(--color-brand-700);
      }

      .type {
        font-size: 0.75rem;
        padding: 4px 12px;
        border-radius: 30px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .type.sale-type {
        background: var(--color-brand-50);
        color: var(--color-brand-700);
        border: 1px solid var(--color-brand-100);
      }
      .type.rent-type {
        background: #f0fdf4;
        color: #15803d;
        border: 1px solid #dcfce7;
      }
      .type.short-term-type {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #dbeafe;
      }

      @media (max-width: 768px) {
        .virtual-scroll-container {
          height: calc(100vh - 250px);
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

  trackByPropertyFn(index: number, property: Property): string {
    return property.id;
  }

  getLowQualityPlaceholder(property: Property): string {
    if (!property.images || property.images.length === 0) {
      return '';
    }

    const imageUrl = property.images[0].url;
    return `${imageUrl}?w=20&q=10&blur=10`;
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
}

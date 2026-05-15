import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  color: string;
  query: Record<string, unknown>;
  emoji?: string;
}

@Component({
  selector: 'app-quick-filters',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="quick-filters">
      <div class="filters-header">
        <h3>
          <mat-icon>flash_on</mat-icon>
          Tez filtrlar
        </h3>
      </div>

      <div class="filters-grid">
        <!-- Popular Locations -->
        <button
          *ngFor="let filter of popularLocations"
          mat-stroked-button
          class="quick-filter-btn location"
          (click)="onFilterClick(filter)"
          [matTooltip]="filter.label"
        >
          <mat-icon>{{ filter.icon }}</mat-icon>
          <span>{{ filter.emoji }} {{ filter.label }}</span>
        </button>
      </div>

      <div class="filters-grid">
        <!-- Price Ranges -->
        <button
          *ngFor="let filter of priceRanges"
          mat-stroked-button
          class="quick-filter-btn price"
          (click)="onFilterClick(filter)"
          [matTooltip]="filter.label"
        >
          <mat-icon>{{ filter.icon }}</mat-icon>
          <span>{{ filter.emoji }} {{ filter.label }}</span>
        </button>
      </div>

      <div class="filters-grid">
        <!-- Property Types -->
        <button
          *ngFor="let filter of propertyTypes"
          mat-stroked-button
          class="quick-filter-btn type"
          (click)="onFilterClick(filter)"
          [matTooltip]="filter.label"
        >
          <mat-icon>{{ filter.icon }}</mat-icon>
          <span>{{ filter.emoji }} {{ filter.label }}</span>
        </button>
      </div>

      <div class="filters-grid">
        <!-- Amenities -->
        <button
          *ngFor="let filter of amenities"
          mat-stroked-button
          class="quick-filter-btn amenity"
          (click)="onFilterClick(filter)"
          [matTooltip]="filter.label"
        >
          <mat-icon>{{ filter.icon }}</mat-icon>
          <span>{{ filter.emoji }} {{ filter.label }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .quick-filters {
        padding: 16px 0;
        border-bottom: 1px solid #e2e8f0;
      }

      .filters-header {
        margin-bottom: 12px;
      }

      .filters-header h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 12px 0;
        padding-left: 12px;
      }

      .filters-header mat-icon {
        color: #c9a84c;
        font-size: 18px;
      }

      .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
        margin-bottom: 12px;
        padding: 0 12px;
      }

      .quick-filter-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 12px;
        height: auto;
        min-height: 60px;
        font-size: 0.8rem;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        transition: all 0.2s ease;
      }

      .quick-filter-btn:hover {
        background: #f8fafc;
        border-color: #c9a84c;
        color: #1b3a6b;
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(27, 58, 107, 0.1);
      }

      .quick-filter-btn.location {
        border-color: #10b981;
        color: #059669;
      }

      .quick-filter-btn.location:hover {
        background: rgba(16, 185, 129, 0.05);
        border-color: #10b981;
      }

      .quick-filter-btn.price {
        border-color: #f59e0b;
        color: #d97706;
      }

      .quick-filter-btn.price:hover {
        background: rgba(245, 158, 11, 0.05);
        border-color: #f59e0b;
      }

      .quick-filter-btn.type {
        border-color: #3b82f6;
        color: #2563eb;
      }

      .quick-filter-btn.type:hover {
        background: rgba(59, 130, 246, 0.05);
        border-color: #3b82f6;
      }

      .quick-filter-btn.amenity {
        border-color: #ec4899;
        color: #be185d;
      }

      .quick-filter-btn.amenity:hover {
        background: rgba(236, 72, 153, 0.05);
        border-color: #ec4899;
      }

      .quick-filter-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .quick-filter-btn span {
        text-align: center;
        line-height: 1.3;
        font-weight: 500;
      }

      @media (max-width: 768px) {
        .filters-grid {
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 6px;
          padding: 0 8px;
        }

        .quick-filter-btn {
          min-height: 50px;
          font-size: 0.75rem;
          padding: 6px 8px;
          gap: 4px;
        }

        .quick-filter-btn mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    `,
  ],
})
export class QuickFiltersComponent {
  @Output() filterSelected = new EventEmitter<QuickFilter>();

  popularLocations: QuickFilter[] = [
    {
      id: 'tashkent',
      label: 'Toshkent',
      icon: 'location_city',
      color: '#10b981',
      emoji: '🏙️',
      query: { location: 'Toshkent' },
    },
    {
      id: 'samarkand',
      label: 'Samarqand',
      icon: 'language',
      color: '#10b981',
      emoji: '🕌',
      query: { location: 'Samarqand' },
    },
    {
      id: 'bukhara',
      label: 'Buxoro',
      icon: 'terrain',
      color: '#10b981',
      emoji: '🌏',
      query: { location: 'Buxoro' },
    },
    {
      id: 'fergana',
      label: 'Fargona',
      icon: 'map',
      color: '#10b981',
      emoji: '🗺️',
      query: { location: 'Fargona' },
    },
  ];

  priceRanges: QuickFilter[] = [
    {
      id: 'cheap',
      label: 'Arzon',
      icon: 'trending_down',
      color: '#f59e0b',
      emoji: '💰',
      query: { maxPrice: 10000000 },
    },
    {
      id: 'medium',
      label: "O'rtacha",
      icon: 'show_chart',
      color: '#f59e0b',
      emoji: '💵',
      query: { minPrice: 10000000, maxPrice: 50000000 },
    },
    {
      id: 'expensive',
      label: 'Qimmat',
      icon: 'trending_up',
      color: '#f59e0b',
      emoji: '💎',
      query: { minPrice: 50000000 },
    },
  ];

  propertyTypes: QuickFilter[] = [
    {
      id: 'apartment',
      label: 'Xona',
      icon: 'apartment',
      color: '#3b82f6',
      emoji: '🏢',
      query: { propertyType: 'Apartment' },
    },
    {
      id: 'house',
      label: 'Uy',
      icon: 'house',
      color: '#3b82f6',
      emoji: '🏠',
      query: { propertyType: 'House' },
    },
    {
      id: 'villa',
      label: 'Villa',
      icon: 'villa',
      color: '#3b82f6',
      emoji: '🏰',
      query: { propertyType: 'Villa' },
    },
  ];

  amenities: QuickFilter[] = [
    {
      id: 'wifi',
      label: 'WiFi',
      icon: 'wifi',
      color: '#ec4899',
      emoji: '📶',
      query: { amenities: ['hasWifi'] },
    },
    {
      id: 'parking',
      label: 'Parkovka',
      icon: 'local_parking',
      color: '#ec4899',
      emoji: '🚗',
      query: { amenities: ['hasParking'] },
    },
    {
      id: 'pool',
      label: 'Basseyn',
      icon: 'pool',
      color: '#ec4899',
      emoji: '🏊',
      query: { amenities: ['hasPool'] },
    },
    {
      id: 'pets',
      label: 'Hayvonlar',
      icon: 'pets',
      color: '#ec4899',
      emoji: '🐾',
      query: { amenities: ['petsAllowed'] },
    },
  ];

  onFilterClick(filter: QuickFilter): void {
    this.filterSelected.emit(filter);
  }
}

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
    <div class="quick-filters-modern">
      <div class="header-row">
        <div class="title-group">
          <mat-icon>explore</mat-icon>
          <span>Tezkor qidiruv</span>
        </div>
      </div>

      <div class="filter-sections">
        <!-- Horizontal Scrollable Filters -->
        <div class="scroll-container">
          <div class="filter-group">
            <span class="group-label">Shahar:</span>
            <div class="chip-list">
              @for (filter of popularLocations; track filter.id) {
                <button class="modern-chip" (click)="onFilterClick(filter)">
                  <span class="chip-icon">{{ filter.emoji }}</span>
                  <span class="chip-text">{{ filter.label }}</span>
                </button>
              }
            </div>
          </div>

          <div class="filter-group">
            <span class="group-label">Narx:</span>
            <div class="chip-list">
              @for (filter of priceRanges; track filter.id) {
                <button class="modern-chip price" (click)="onFilterClick(filter)">
                  <mat-icon>{{ filter.icon }}</mat-icon>
                  <span class="chip-text">{{ filter.label }}</span>
                </button>
              }
            </div>
          </div>

          <div class="filter-group">
            <span class="group-label">Tur:</span>
            <div class="chip-list">
              @for (filter of propertyTypes; track filter.id) {
                <button class="modern-chip type" (click)="onFilterClick(filter)">
                  <mat-icon>{{ filter.icon }}</mat-icon>
                  <span class="chip-text">{{ filter.label }}</span>
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quick-filters-modern {
      padding: 24px;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      border: 1px solid #f1f5f9;
      margin-bottom: 24px;
    }

    .header-row {
      margin-bottom: 20px;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      color: #0f172a;
      font-size: 1.1rem;
    }

    .title-group mat-icon {
      color: #c9a84c;
    }

    .scroll-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .group-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 4px 0;
    }

    .chip-list::-webkit-scrollbar {
      display: none; /* Chrome/Safari */
    }

    .modern-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      color: #334155;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .modern-chip:hover {
      background: #ffffff;
      border-color: #c9a84c;
      color: #0f172a;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    }

    .modern-chip.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }

    .modern-chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #64748b;
    }

    .modern-chip:hover mat-icon {
      color: #c9a84c;
    }

    .chip-icon {
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .quick-filters-modern {
        padding: 16px;
      }
      .filter-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class QuickFiltersComponent {
  @Output() filterSelected = new EventEmitter<QuickFilter>();

  popularLocations: QuickFilter[] = [
    { id: 'tashkent', label: 'Toshkent', icon: 'location_city', color: '#10b981', emoji: '🏙️', query: { location: 'Toshkent' } },
    { id: 'samarkand', label: 'Samarqand', icon: 'language', color: '#10b981', emoji: '🕌', query: { location: 'Samarqand' } },
    { id: 'bukhara', label: 'Buxoro', icon: 'terrain', color: '#10b981', emoji: '🌏', query: { location: 'Buxoro' } },
    { id: 'fergana', label: 'Fargona', icon: 'map', color: '#10b981', emoji: '🗺️', query: { location: 'Fargona' } },
  ];

  priceRanges: QuickFilter[] = [
    { id: 'cheap', label: 'Arzon', icon: 'trending_down', color: '#f59e0b', emoji: '💰', query: { maxPrice: 10000000, sortBy: 'price_asc' } },
    { id: 'medium', label: "O'rtacha", icon: 'show_chart', color: '#f59e0b', emoji: '💵', query: { minPrice: 10000000, maxPrice: 50000000 } },
    { id: 'expensive', label: 'Qimmat', icon: 'trending_up', color: '#f59e0b', emoji: '💎', query: { minPrice: 50000000, sortBy: 'price_desc' } },
  ];

  propertyTypes: QuickFilter[] = [
    { id: 'apartment', label: 'Xona', icon: 'apartment', color: '#3b82f6', emoji: '🏢', query: { propertyType: 'Apartment' } },
    { id: 'house', label: 'Uy', icon: 'house', color: '#3b82f6', emoji: '🏠', query: { propertyType: 'House' } },
    { id: 'villa', label: 'Villa', icon: 'villa', color: '#3b82f6', emoji: '🏰', query: { propertyType: 'Villa' } },
  ];

  onFilterClick(filter: QuickFilter): void {
    this.filterSelected.emit(filter);
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  PropertySearchParams,
  PropertyType,
  UzbekistanRegion,
} from '../../../../core/models/property.model';

export interface QuickFilter {
  id: string;
  label: string;
  icon?: string;
  emoji?: string;
  color?: string;
  query: Partial<PropertySearchParams>;
}

@Component({
  selector: 'app-property-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
  ],
  template: `
    <div class="unified-filters animate-fade-in">
      <!-- QUICK SELECTIONS SECTION -->
      <div class="filter-group-modern first">
        <div class="group-header">
          <div class="header-icon"><mat-icon>auto_awesome</mat-icon></div>
          <span>Tezkor tanlovlar</span>
        </div>
        <div class="quick-chips-column">
          @for (filter of quickFilters; track filter.id) {
            <button
              class="quick-card-btn"
              [style.--accent-color]="filter.color"
              (click)="onQuickFilter(filter)"
            >
              <div class="card-btn-content">
                <span class="card-btn-emoji">{{ filter.emoji }}</span>
                <div class="card-btn-text">
                  <span class="card-btn-label">{{ filter.label }}</span>
                  <span class="card-btn-sub">Eng yaxshi takliflar</span>
                </div>
              </div>
              <mat-icon class="card-btn-arrow">arrow_forward_ios</mat-icon>
            </button>
          }
        </div>
      </div>

      <mat-divider class="my-4"></mat-divider>

      <!-- DETAILED FILTERS (ACCORDION) -->
      <form [formGroup]="filterForm">
        <mat-accordion multi="true" class="premium-accordion">
          <!-- LOCATION -->
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>location_on</mat-icon>
                Hudud
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="panel-content">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Viloyat</mat-label>
                <mat-select formControlName="region">
                  <mat-option [value]="null">Barcha hududlar</mat-option>
                  @for (region of regions; track region) {
                    <mat-option [value]="region">{{ region }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </mat-expansion-panel>

          <!-- PRICE -->
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>payments</mat-icon>
                Narx oralig'i
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="panel-content">
              <div class="price-inputs-modern">
                <div class="input-field">
                  <span class="label">Min</span>
                  <input type="number" formControlName="minPrice" placeholder="0" />
                </div>
                <div class="separator"></div>
                <div class="input-field">
                  <span class="label">Max</span>
                  <input type="number" formControlName="maxPrice" placeholder="Max" />
                </div>
              </div>
            </div>
          </mat-expansion-panel>

          <!-- ROOMS -->
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>bed</mat-icon>
                Xonalar
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="panel-content">
              <div class="rooms-selector">
                @for (room of [1, 2, 3, 4, 5]; track room) {
                  <div
                    class="room-option"
                    [class.active]="filterForm.get('bedrooms')?.value === room"
                    (click)="setBedrooms(room)"
                  >
                    {{ room === 5 ? '5+' : room }}
                  </div>
                }
              </div>
            </div>
          </mat-expansion-panel>

          <!-- PROPERTY TYPE -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>home_work</mat-icon>
                Mulk turi
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="panel-content">
              <div class="type-chips">
                @for (type of propertyTypes; track type) {
                  <div
                    class="type-chip"
                    [class.selected]="filterForm.get('propertyType')?.value === type"
                    (click)="setPropertyType(type)"
                  >
                    {{ getPropertyTypeLabel(type) }}
                  </div>
                }
              </div>
            </div>
          </mat-expansion-panel>

          <!-- AMENITIES -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>auto_awesome</mat-icon>
                Qulayliklar
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="panel-content">
              <div class="amenities-grid-modern">
                @for (amenity of amenities; track amenity.value) {
                  <div
                    class="amenity-pill"
                    [class.active]="isAmenitySelected(amenity.value)"
                    (click)="toggleAmenity(amenity.value)"
                  >
                    <mat-icon>{{ amenity.icon }}</mat-icon>
                    <span>{{ amenity.label }}</span>
                  </div>
                }
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>

        <div class="sticky-footer">
          <button mat-flat-button class="btn-apply-unified" (click)="applyFilters()">
            Filtrni qo'llash
          </button>
          <button mat-button class="btn-clear" (click)="onReset()">Tozalash</button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      :host {
        --navy: var(--color-text-primary);
        --gold: var(--color-gold);
        --border: var(--color-border-soft);
        --bg: var(--color-surface-elevated);
        display: block;
      }

      .unified-filters {
        display: flex;
        flex-direction: column;
      }

      .filter-group-modern {
        padding: 8px 0;
      }

      .group-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        padding: 0 2px;
      }
      .header-icon {
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 40%, transparent));
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .header-icon mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--navy);
      }
      .group-header span {
        font-size: 0.8rem;
        font-weight: 800;
        color: var(--navy);
        text-transform: uppercase;
        letter-spacing: 1.2px;
      }

      .quick-chips-column {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .quick-card-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--color-surface-subtle);
        border: 1px solid var(--border);
        padding: 14px 16px;
        border-radius: 18px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .quick-card-btn:hover {
        background: var(--bg);
        border-color: var(--accent-color);
        transform: scale(1.02);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
      }
      .card-btn-content {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .card-btn-emoji {
        font-size: 1.5rem;
      }
      .card-btn-text {
        display: flex;
        flex-direction: column;
        text-align: left;
      }
      .card-btn-label {
        font-size: 0.9rem;
        font-weight: 800;
        color: var(--navy);
      }
      .card-btn-sub {
        font-size: 0.7rem;
        color: var(--color-text-secondary);
        font-weight: 600;
      }
      .card-btn-arrow {
        font-size: 12px !important;
        width: 12px !important;
        height: 12px !important;
        color: var(--color-text-secondary);
      }
      .quick-card-btn:hover .card-btn-arrow {
        color: var(--accent-color);
      }

      .premium-accordion {
        box-shadow: none !important;
      }
      ::ng-deep .mat-expansion-panel {
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
      }
      ::ng-deep .mat-expansion-panel-header {
        padding: 0 8px !important;
      }
      ::ng-deep .mat-expansion-panel-header-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--navy);
        display: flex;
        align-items: center;
        gap: 10px;
      }
      ::ng-deep .mat-expansion-panel-header-title mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--gold);
      }

      .panel-content {
        padding: 12px 4px 16px;
      }

      .price-inputs-modern {
        display: flex;
        align-items: center;
        background: var(--color-surface-subtle);
        border-radius: 12px;
        border: 1px solid var(--border);
        padding: 8px 16px;
      }
      .input-field {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .input-field .label {
        font-size: 0.75rem;
        font-weight: 800;
        color: var(--color-text-muted);
        text-transform: uppercase;
      }
      .input-field input {
        background: transparent;
        border: none;
        outline: none;
        font-weight: 700;
        color: var(--navy);
        width: 100%;
      }
      .separator {
        width: 1px;
        height: 24px;
        background: var(--border);
        margin: 0 16px;
      }

      .rooms-selector {
        display: flex;
        gap: 6px;
        background: var(--color-surface-canvas);
        padding: 4px;
        border-radius: 10px;
      }
      .room-option {
        flex: 1;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--color-text-secondary);
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s;
      }
      .room-option.active {
        background: var(--bg);
        color: var(--navy);
        box-shadow: var(--shadow-sm);
      }

      .type-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .type-chip {
        padding: 6px 14px;
        background: var(--color-surface-subtle);
        border: 1px solid var(--border);
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        cursor: pointer;
        transition: all 0.2s;
      }
      .type-chip.selected {
        background: var(--color-brand-600);
        color: white;
        border-color: var(--color-brand-600);
      }

      .amenities-grid-modern {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .amenity-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        background: var(--color-surface-subtle);
        border: 1px solid var(--border);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .amenity-pill mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--color-text-muted);
      }
      .amenity-pill span {
        font-size: 0.75rem;
        font-weight: 600;
      }
      .amenity-pill.active {
        background: rgba(34, 197, 94, 0.1);
        border-color: var(--color-success-500);
      }
      .amenity-pill.active mat-icon {
        color: var(--color-success-500);
      }

      .sticky-footer {
        margin-top: 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .btn-apply-unified {
        height: 50px !important;
        border-radius: 14px !important;
        background: var(--color-brand-600) !important;
        color: white !important;
        font-weight: 700 !important;
      }
      .btn-clear {
        color: var(--color-text-secondary) !important;
        font-weight: 600 !important;
      }

      .full-width {
        width: 100%;
      }
      .mb-2 {
        margin-bottom: 12px;
      }
      .my-4 {
        margin: 16px 0;
      }
    `,
  ],
})
export class PropertyFiltersComponent implements OnInit, OnChanges {
  @Input() filters: PropertySearchParams = {};
  @Output() filtersChange = new EventEmitter<PropertySearchParams>();
  @Output() filterReset = new EventEmitter<void>();

  filterForm: FormGroup;
  regions = Object.values(UzbekistanRegion);
  propertyTypes = Object.values(PropertyType);

  quickFilters: QuickFilter[] = [
    {
      id: 'cheap',
      label: 'Arzon',
      emoji: '💰',
      color: 'var(--color-gold)',
      query: { maxPrice: 10000000, minPrice: undefined, sortBy: 'price_asc' },
    },
    {
      id: 'expensive',
      label: 'Lux mulklar',
      emoji: '💎',
      color: 'var(--color-info)',
      query: { minPrice: 50000000, maxPrice: undefined, sortBy: 'price_desc' },
    },
    {
      id: 'tashkent',
      label: 'Toshkent',
      emoji: '📍',
      color: 'var(--color-success)',
      query: { location: 'Toshkent' },
    },
    {
      id: 'house',
      label: 'Hovli uylar',
      emoji: '🏡',
      color: 'var(--color-error)',
      query: { propertyType: PropertyType.House },
    },
  ];

  amenities = [
    { label: 'Wi-Fi', icon: 'wifi', value: 'wifi' },
    { label: 'Parking', icon: 'local_parking', value: 'parking' },
    { label: 'Basseyndagi', icon: 'pool', value: 'pool' },
    { label: 'Konditsioner', icon: 'ac_unit', value: 'ac' },
    { label: 'Kir yuvish', icon: 'local_laundry_service', value: 'washer' },
    { label: 'Oshxona', icon: 'kitchen', value: 'kitchen' },
  ];

  selectedAmenities: string[] = [];

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      location: [''],
      region: [null],
      minPrice: [null],
      maxPrice: [null],
      bedrooms: [null],
      propertyType: [null],
      listingType: [null],
    });
  }

  ngOnInit(): void {
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters'] && !changes['filters'].firstChange) {
      this.patchForm();
    }
  }

  private patchForm(): void {
    this.filterForm.patchValue(
      {
        location: this.filters.location || '',
        region: this.filters.region || null,
        minPrice: this.filters.minPrice || null,
        maxPrice: this.filters.maxPrice || null,
        bedrooms: this.filters.bedrooms || null,
        propertyType: this.filters.propertyType || null,
        listingType: this.filters.listingType || null,
      },
      { emitEvent: false },
    );

    this.selectedAmenities = this.filters.amenities || [];
  }

  onQuickFilter(filter: QuickFilter): void {
    this.filtersChange.emit(filter.query);
  }

  setBedrooms(count: number): void {
    const current = this.filterForm.get('bedrooms')?.value;
    this.filterForm.get('bedrooms')?.setValue(current === count ? null : count);
  }

  setPropertyType(type: PropertyType): void {
    const current = this.filterForm.get('propertyType')?.value;
    this.filterForm.get('propertyType')?.setValue(current === type ? null : type);
  }

  toggleAmenity(value: string): void {
    const index = this.selectedAmenities.indexOf(value);
    if (index > -1) {
      this.selectedAmenities.splice(index, 1);
    } else {
      this.selectedAmenities.push(value);
    }
  }

  isAmenitySelected(value: string): boolean {
    return this.selectedAmenities.includes(value);
  }

  applyFilters(): void {
    const formValues = this.filterForm.value;
    const searchParams: PropertySearchParams = {
      ...formValues,
      amenities: this.selectedAmenities.length > 0 ? this.selectedAmenities : undefined,
    };

    Object.keys(searchParams).forEach((key) => {
      if (
        (searchParams as any)[key] === null ||
        (searchParams as any)[key] === undefined ||
        (searchParams as any)[key] === ''
      ) {
        delete (searchParams as any)[key];
      }
    });

    this.filtersChange.emit(searchParams);
  }

  onReset(): void {
    this.filterForm.reset();
    this.selectedAmenities = [];
    this.filterReset.emit();
  }

  getPropertyTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      Apartment: 'Kvartira',
      House: 'Hovli',
      Office: 'Ofis',
      Villa: 'Villa',
      Commercial: 'Tijorat',
    };
    return labels[type] || type;
  }
}

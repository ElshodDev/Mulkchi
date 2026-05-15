import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { PropertySearchParams, ListingType, PropertyType, UzbekistanRegion } from '../../../../core/models/property.model';

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
    MatDividerModule
  ],
  template: `
    <mat-card class="filters-card">
      <mat-card-header>
        <mat-card-title>Filterlar</mat-card-title>
        <button mat-icon-button (click)="filterReset.emit()">
          <mat-icon>refresh</mat-icon>
        </button>
      </mat-card-header>
      <mat-card-content>
        <div class="filter-section">
          <label class="filter-label">Qidirish</label>
          <mat-form-field appearance="outline" class="full-width">
            <input matInput placeholder="Manzil, tuman, mahalla qidiring">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
        </div>

        <div class="filter-section">
          <label class="filter-label">Viloyat</label>
          <mat-select placeholder="Viloyat tanlang" class="full-width">
            <mat-option *ngFor="let region of regions" [value]="region">
              {{ region }}
            </mat-option>
          </mat-select>
        </div>

        <div class="filter-section">
          <label class="filter-label">Narx (UZS)</label>
          <div class="price-range">
            <mat-form-field appearance="outline">
              <input matInput type="number" placeholder="Min">
            </mat-form-field>
            <span>-</span>
            <mat-form-field appearance="outline">
              <input matInput type="number" placeholder="Max">
            </mat-form-field>
          </div>
        </div>

        <div class="filter-section">
          <label class="filter-label">Xonalar soni</label>
          <mat-slider 
            [min]="1" 
            [max]="10" 
            [step]="1" 
            [showTickMarks]="true">
            <input matSliderThumb>
          </mat-slider>
        </div>

        <div class="filter-section">
          <label class="filter-label">Mulk turi</label>
          <mat-select placeholder="Mulk turi tanlang" class="full-width">
            <mat-option value="Apartment">Kvartira</mat-option>
            <mat-option value="House">Uy</mat-option>
            <mat-option value="Villa">Villa</mat-option>
            <mat-option value="Commercial">Tijorat</mat-option>
          </mat-select>
        </div>

        <div class="filter-section">
          <label class="filter-label">Elatma turi</label>
          <mat-select placeholder="Elatma turi tanlang" class="full-width">
            <mat-option [value]="ListingType.Rent">Ijaraga</mat-option>
            <mat-option [value]="ListingType.Sale">Sotishga</mat-option>
            <mat-option [value]="ListingType.ShortTermRent">Kunlik ijaraga</mat-option>
          </mat-select>
        </div>

        <mat-divider></mat-divider>

        <div class="filter-section">
          <label class="filter-label">Qulayliklar</label>
          <div class="amenities-grid">
            <mat-chip
              *ngFor="let amenity of amenities"
              (click)="toggleAmenity(amenity)"
              [class.selected]="amenity.selected">
              <mat-icon matChipAvatar>{{ amenity.icon }}</mat-icon>
              {{ amenity.label }}
            </mat-chip>
          </div>
        </div>

        <div class="filter-actions">
          <button mat-raised-button color="primary" (click)="applyFilters()">
            Qo'llash
          </button>
          <button mat-button (click)="filterReset.emit()">
            Tozalash
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .filters-card {
      position: sticky;
      top: 20px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    }

    .filter-section {
      margin-bottom: 20px;
    }

    .filter-label {
      display: block;
      font-weight: 500;
      color: var(--color-gray-700);
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .full-width {
      width: 100%;
    }

    .price-range {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .price-range mat-form-field {
      flex: 1;
    }

    .amenities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 8px;
    }

    .filter-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .filter-actions button {
      flex: 1;
    }

    @media (max-width: 1024px) {
      .filters-card {
        position: static;
        max-height: none;
      }
    }
  `]
})
export class PropertyFiltersComponent {
  @Input() filters: PropertySearchParams = {
    location: '',
    minPrice: undefined,
    maxPrice: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    propertyType: undefined,
    listingType: undefined,
    amenities: [],
    page: 1,
    pageSize: 12
  };

  @Output() filtersChange = new EventEmitter<PropertySearchParams>();
  @Output() filterReset = new EventEmitter<void>();

  ListingType = ListingType;

  regions = Object.values(UzbekistanRegion);
  propertyTypes = Object.values(PropertyType);

  amenities = [
    { label: 'Wi-Fi', icon: 'wifi', value: 'wifi', selected: false },
    { label: 'Parking', icon: 'local_parking', value: 'parking', selected: false },
    { label: 'Pool', icon: 'pool', value: 'pool', selected: false },
    { label: 'AC', icon: 'ac_unit', value: 'ac', selected: false },
    { label: 'TV', icon: 'tv', value: 'tv', selected: false },
    { label: 'Washer', icon: 'local_laundry_service', value: 'washer', selected: false },
    { label: 'Kitchen', icon: 'kitchen', value: 'kitchen', selected: false },
    { label: 'Gym', icon: 'fitness_center', value: 'gym', selected: false }
  ];

  toggleAmenity(amenity: any): void {
    amenity.selected = !amenity.selected;
    this.updateFilters();
  }

  applyFilters(): void {
    this.filtersChange.emit(this.filters);
  }

  private updateFilters(): void {
    this.filters.amenities = this.amenities
      .filter(a => a.selected)
      .map(a => a.value);
    this.filtersChange.emit(this.filters);
  }
}

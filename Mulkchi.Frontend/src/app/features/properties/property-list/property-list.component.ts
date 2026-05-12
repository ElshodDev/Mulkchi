import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OptimizedImageComponent } from '../../../shared/components/optimized-image/optimized-image.component';
import { PropertyService } from '../../../core/services/property.service';
import { ComparisonService } from '../../../core/services/comparison.service';
import { ToastService } from '../../../core/services/toast.service';
import { Property, ListingType, PropertySearchParams, PropertyResponse, UzbekistanRegion } from '../../../core/models';
import { Subject } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatAutocompleteModule,
    ScrollingModule,
    OptimizedImageComponent
  ],
  template: `
    <div class="property-list-container">
      <!-- Hero Header -->
      <section class="page-header">
        <div class="container">
          <div class="breadcrumb">
            <a routerLink="/">Bosh sahifa</a>
            <mat-icon>chevron_right</mat-icon>
            <span>Ko'chmas mulk</span>
          </div>
          <h1 class="page-title">Barcha e'lonlar</h1>
          <p class="page-subtitle">O'zbekistondagi eng yaxshi mulk e'lonlarini qidirib toping</p>
          
          <!-- Hero Search with Smart Autocomplete -->
          <div class="hero-search">
            <div class="search-input-wrapper">
              <mat-icon class="search-icon">search</mat-icon>
              <input 
                type="text" 
                class="hero-search-input" 
                placeholder="Shahar, tuman yoki ko'cha..."
                [value]="heroSearchValue()"
                (input)="onSearchInput($any($event).target.value)"
                (keyup.enter)="onHeroSearch()"
                [matAutocomplete]="auto">
              <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onLocationSelected($event)">
                <!-- Location Suggestions -->
                @if (searchSuggestions().locations.length > 0) {
                  <mat-optgroup label="📍 Joylashuvlar">
                    @for (loc of searchSuggestions().locations.slice(0, 5); track loc) {
                      <mat-option [value]="loc">
                        <span [innerHTML]="highlightMatch(loc, heroSearchValue())"></span>
                      </mat-option>
                    }
                  </mat-optgroup>
                }
                <!-- Property Types -->
                @if (searchSuggestions().types.length > 0) {
                  <mat-optgroup label="🏠 Mulk turlari">
                    @for (type of searchSuggestions().types.slice(0, 3); track type) {
                      <mat-option [value]="type">{{ type }}</mat-option>
                    }
                  </mat-optgroup>
                }
                <!-- Recent Searches -->
                @if (searchSuggestions().recent.length > 0 && heroSearchValue().length === 0) {
                  <mat-optgroup label="🔍 So'nggi qidiruvlar">
                    @for (recent of searchSuggestions().recent.slice(0, 3); track recent) {
                      <mat-option [value]="recent">
                        <mat-icon style="font-size: 16px; margin-right: 8px;">history</mat-icon>
                        {{ recent }}
                      </mat-option>
                    }
                  </mat-optgroup>
                }
              </mat-autocomplete>
              @if (isSearching()) {
                <mat-spinner diameter="20" class="search-spinner"></mat-spinner>
              }
            </div>
            <button mat-raised-button class="hero-search-btn" (click)="onHeroSearch()">
              <mat-icon>search</mat-icon>
              Qidirish
            </button>
          </div>
        </div>
      </section>

      <div class="container main-content">
        <!-- Filters Sidebar -->
        <aside class="filters-sidebar">
          <div class="filters-card">
            <div class="filters-header">
              <mat-icon>filter_list</mat-icon>
              <h3>Filterlar</h3>
            </div>

            <mat-divider></mat-divider>

            <form [formGroup]="filterForm" (ngSubmit)="applyFilters()">
              <!-- Location -->
              <div class="filter-section">
                <label class="filter-label">
                  <mat-icon>location_on</mat-icon>
                  Joylashuv
                </label>
                <div class="custom-input-wrapper">
                  <input 
                    type="text" 
                    class="custom-input" 
                    formControlName="location" 
                    placeholder="Shahar, tuman">
                </div>
              </div>

              <!-- Property Type -->
              <div class="filter-section">
                <label class="filter-label">
                  <mat-icon>home</mat-icon>
                  Mulk turi
                </label>
                <div class="custom-select-wrapper">
                  <select formControlName="propertyType" class="custom-select">
                    <option value="">Barcha turlar</option>
                    @for (type of propertyTypes; track type.value) {
                      <option [value]="type.value">{{ type.label }}</option>
                    }
                  </select>
                  <mat-icon class="select-arrow">expand_more</mat-icon>
                </div>
              </div>

              <!-- Listing Type -->
              <div class="filter-section">
                <label class="filter-label">
                  <mat-icon>category</mat-icon>
                  E'lon turi
                </label>
                <div class="listing-type-chips">
                  <button 
                    type="button"
                    class="type-chip"
                    [class.active]="filterForm.value.listingType === ''"
                    (click)="filterForm.patchValue({ listingType: '' }); applyFilters()">
                    Barcha
                  </button>
                  @for (type of listingTypes; track type.value) {
                    <button 
                      type="button"
                      class="type-chip"
                      [class.active]="filterForm.value.listingType === type.value"
                      (click)="filterForm.patchValue({ listingType: type.value }); applyFilters()">
                      {{ type.label }}
                    </button>
                  }
                </div>
              </div>

              <!-- Price Range -->
              <div class="filter-section">
                <label class="filter-label">
                  <mat-icon>payments</mat-icon>
                  Narx oralig'i
                </label>
                <div class="price-inputs">
                  <div class="custom-input-wrapper">
                    <span class="input-prefix">$</span>
                    <input 
                      type="number" 
                      class="custom-input with-prefix" 
                      formControlName="minPrice" 
                      placeholder="Min">
                  </div>
                  <div class="custom-input-wrapper">
                    <span class="input-prefix">$</span>
                    <input 
                      type="number" 
                      class="custom-input with-prefix" 
                      formControlName="maxPrice" 
                      placeholder="Max">
                  </div>
                </div>
              </div>

              <!-- Bedrooms -->
              <div class="filter-section">
                <label class="filter-label">
                  <mat-icon>bed</mat-icon>
                  Xonalar soni
                </label>
                <div class="bedroom-options">
                  <button 
                    type="button"
                    class="bedroom-btn"
                    [class.active]="filterForm.value.bedrooms === ''"
                    (click)="filterForm.patchValue({ bedrooms: '' })">
                    Barcha
                  </button>
                  @for (num of bedroomOptions; track num) {
                    <button 
                      type="button"
                      class="bedroom-btn"
                      [class.active]="filterForm.value.bedrooms === num.toString()"
                      (click)="filterForm.patchValue({ bedrooms: num.toString() })">
                      {{ num }}+
                    </button>
                  }
                </div>
              </div>

              <!-- Amenities -->
              <div class="filter-section">
                <label class="filter-label">
                  <mat-icon>check_circle</mat-icon>
                  Qulayliklar
                </label>
                <div class="amenities-chips">
                  @for (amenity of amenitiesList; track amenity.value) {
                    <button 
                      type="button"
                      class="amenity-chip"
                      [class.selected]="isAmenitySelected(amenity.value)"
                      (click)="toggleAmenity(amenity.value)">
                      <mat-icon>{{ amenity.icon }}</mat-icon>
                      {{ amenity.label }}
                    </button>
                  }
                </div>
              </div>

              <button mat-raised-button type="submit" class="apply-btn">
                <mat-icon>search</mat-icon>
                Qidirish
              </button>

              <button mat-button type="button" class="reset-btn" (click)="resetFilters()">
                <mat-icon>refresh</mat-icon>
                Filterlarni tozalash
              </button>
            </form>
          </div>
        </aside>

        <!-- Results Section -->
        <div class="results-section">
          <!-- Results Header -->
          <div class="results-header">
            <div class="results-info">
              <h2 class="results-title">Natijalar</h2>
              <p class="results-count">
                @if (!loading()) {
                  <strong>{{ totalCount() }}</strong> ta e'lon topildi
                } @else {
                  Yuklanmoqda...
                }
              </p>
            </div>
            <div class="view-toggle">
              <button 
                class="view-btn" 
                [class.active]="viewMode() === 'grid'"
                (click)="setViewMode('grid')"
                matTooltip="Grid ko'rinish">
                <mat-icon>grid_view</mat-icon>
              </button>
              <button 
                class="view-btn" 
                [class.active]="viewMode() === 'list'"
                (click)="setViewMode('list')"
                matTooltip="Ro'yxat ko'rinish">
                <mat-icon>view_list</mat-icon>
              </button>
              <button 
                class="view-btn" 
                [class.active]="viewMode() === 'map'"
                (click)="setViewMode('map')"
                matTooltip="Xarita ko'rinish">
                <mat-icon>map</mat-icon>
              </button>
            </div>
          </div>

          <!-- Loading State with Skeleton Cards -->
          @if (loading()) {
            <div class="skeleton-grid" [class]="viewMode()">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="skeleton-card">
                  <div class="skeleton-image"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-footer">
                      <div class="skeleton-badge"></div>
                      <div class="skeleton-price"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Error State -->
          @if (error()) {
            <div class="error-container">
              <mat-icon color="warn">error</mat-icon>
              <p>{{ error() }}</p>
              <button mat-raised-button color="primary" (click)="loadProperties()">Qayta yuklash</button>
            </div>
          }

          <!-- Empty State -->
          @if (!loading() && !error() && properties().length === 0) {
            <div class="empty-container">
              <mat-icon>search_off</mat-icon>
              <h3>Mulk topilmadi</h3>
              <p>Boshqa filterlardan foydalanib ko'ring yoki filterni tozalang</p>
              <button mat-raised-button color="primary" (click)="resetFilters()" class="clear-filters-btn">
                <mat-icon>clear_all</mat-icon>
                Filterni tozalash
              </button>
            </div>
          }

          <!-- Map View -->
          @if (!loading() && !error() && viewMode() === 'map') {
            <div class="map-container">
              <div id="property-map" class="property-map"></div>
            </div>
          }

          <!-- Properties Grid with Virtual Scrolling -->
          @if (!loading() && !error() && properties().length > 0 && viewMode() !== 'map') {
            <div class="virtual-scroll-container" [class.list-view]="viewMode() === 'list'">
              <cdk-virtual-scroll-viewport 
                itemSize="320" 
                [class.list-view-item]="viewMode() === 'list'"
                class="property-viewport">
                <div *cdkVirtualFor="let property of properties(); trackBy: trackByPropertyFn" 
                     class="virtual-item">
                  <mat-card class="property-card" (click)="navigateToProperty(property.id)">
                  <div class="property-image">
                    @if (property.images && property.images.length > 0) {
                      <app-optimized-image 
                        [src]="getImageUrl(property)"
                        [alt]="property.title"
                        [width]="400"
                        [height]="220"
                        [placeholder]="getLowQualityPlaceholder(property)"
                        [placeholderBlur]="true">
                      </app-optimized-image>
                    } @else {
                      <app-optimized-image 
                        [src]="getPlaceholderImage(property)"
                        [alt]="property.title"
                        [width]="400"
                        [height]="220">
                      </app-optimized-image>
                    }
                    
                    <!-- Compare Button -->
                    <button 
                      mat-icon-button 
                      class="compare-action-btn" 
                      [class.active]="comparisonService.isInComparison(property.id)"
                      (click)="toggleCompare($event, property)"
                      [matTooltip]="getCompareTooltip(property.id)">
                      <mat-icon>{{ comparisonService.isInComparison(property.id) ? 'compare_arrows' : 'add_circle_outline' }}</mat-icon>
                    </button>

                    <div class="property-badges">
                      @if (property.isFeatured) {
                        <span class="badge featured">Featured</span>
                      }
                      @if (property.isVerified) {
                        <span class="badge verified">
                          <mat-icon>verified</mat-icon>
                        </span>
                      }
                      @if (property.isInstantBook) {
                        <span class="badge instant">Tez bron</span>
                      }
                    </div>
                  </div>

                  <mat-card-content>
                    <div class="property-header">
                      <h3>{{ property.title }}</h3>
                      <div class="rating" *ngIf="property.averageRating > 0">
                        <mat-icon>star</mat-icon>
                        <span>{{ property.averageRating | number:'1.1-1' }}</span>
                      </div>
                    </div>

                    <p class="location">
                      <mat-icon>location_on</mat-icon>
                      {{ property.city }}, {{ property.district }}
                    </p>

                    <div class="features">
                      <span>
                        <mat-icon>bed</mat-icon>
                        {{ property.numberOfBedrooms }}
                      </span>
                      <span>
                        <mat-icon>bathtub</mat-icon>
                        {{ property.numberOfBathrooms }}
                      </span>
                      <span>
                        <mat-icon>square_foot</mat-icon>
                        {{ property.area }}m²
                      </span>
                    </div>

                    <div class="amenities-preview">
                      @if (property.hasWifi) {
                        <mat-icon matTooltip="Wi-Fi">wifi</mat-icon>
                      }
                      @if (property.hasParking) {
                        <mat-icon matTooltip="Avtoturargoh">local_parking</mat-icon>
                      }
                      @if (property.hasAirConditioning) {
                        <mat-icon matTooltip="Konditsioner">ac_unit</mat-icon>
                      }
                    </div>

                    <div class="price-section"
                         [class.sale]="property.listingType === ListingType.Sale"
                         [class.rent]="property.listingType === ListingType.Rent"
                         [class.short-term]="property.listingType === ListingType.ShortTermRent">
                      @if (property.listingType === ListingType.Sale && property.salePrice) {
                        <span class="price">{{ property.salePrice | number }} {{ property.currency }}</span>
                        <span class="type sale-type">Sotuv</span>
                      } @else if (property.listingType === ListingType.Rent && property.monthlyRent) {
                        <span class="price">{{ property.monthlyRent | number }} {{ property.currency }}/oy</span>
                        <span class="type rent-type">Ijaraga</span>
                      } @else if (property.listingType === ListingType.ShortTermRent && property.pricePerNight) {
                        <span class="price">{{ property.pricePerNight | number }} {{ property.currency }}/tun</span>
                        <span class="type short-term-type">Qisqa muddatli</span>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
                </div>
              </cdk-virtual-scroll-viewport>
            </div>

            <!-- Pagination -->
            <mat-paginator
              [length]="totalCount()"
              [pageSize]="pageSize()"
              [pageIndex]="pageIndex()"
              [pageSizeOptions]="[12, 24, 48]"
              (page)="onPageChange($event)">
            </mat-paginator>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CSS Variables ===== */
    :host {
      --color-navy: #1B3A6B;
      --color-navy-light: #2a4a7c;
      --color-navy-dark: #122a4d;
      --color-gold: #C9A84C;
      --color-gold-light: #d4b86a;
      --color-gold-dark: #a88a3d;
      --color-white: #ffffff;
      --color-gray-50: #f8fafc;
      --color-gray-100: #f1f5f9;
      --color-gray-200: #e2e8f0;
      --color-gray-300: #cbd5e1;
      --color-gray-400: #94a3b8;
      --color-gray-500: #64748b;
      --color-gray-600: #475569;
      --color-gray-700: #334155;
      --color-gray-800: #1e293b;
      --color-gray-900: #0f172a;
      --radius: 8px;
      --radius-lg: 12px;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    }

    /* ===== Layout ===== */
    .property-list-container {
      min-height: 100vh;
      background: var(--color-gray-50);
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ===== Page Header ===== */
    .page-header {
      background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-dark) 100%);
      color: var(--color-white);
      padding: 48px 0 64px;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .breadcrumb a {
      color: var(--color-gold);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .breadcrumb a:hover {
      color: var(--color-gold-light);
    }

    .breadcrumb mat-icon {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.5);
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 8px 0;
    }

    .page-subtitle {
      font-size: 1.125rem;
      opacity: 0.85;
      margin: 0 0 32px 0;
    }

    /* Hero Search */
    .hero-search {
      display: flex;
      gap: 12px;
      max-width: 600px;
    }

    .search-input-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      background: var(--color-white);
      border-radius: var(--radius);
      padding: 0 20px;
    }

    .search-icon {
      color: var(--color-gray-400);
      margin-right: 12px;
    }

    .search-spinner {
      margin-left: 8px;
    }

    .hero-search-input {
      flex: 1;
      border: none;
      outline: none;
      padding: 16px 0;
      font-size: 1rem;
      color: var(--color-gray-800);
      background: transparent;
    }

    .hero-search-input::placeholder {
      color: var(--color-gray-400);
    }

    .hero-search-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      background: var(--color-gold);
      color: var(--color-navy);
      border: none;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .hero-search-btn:hover {
      background: var(--color-gold-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    /* ===== Main Content ===== */
    .main-content {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 32px;
      padding: 32px 0;
    }

    /* ===== Filters Sidebar ===== */
    .filters-sidebar {
      position: sticky;
      top: 24px;
      height: fit-content;
    }

    .filters-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .full-width {
      width: 100%;
    }

    .filters-card form {
      padding: 0 24px 24px;
    }

    .filter-section {
      margin-bottom: 24px;
    }

    .filter-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-gray-700);
      margin-bottom: 10px;
    }

    .filter-label mat-icon {
      font-size: 18px;
      color: var(--color-navy);
    }

    /* Custom Input */
    .custom-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-prefix {
      position: absolute;
      left: 16px;
      color: var(--color-gray-500);
      font-weight: 500;
    }

    .custom-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius);
      font-size: 0.95rem;
      color: var(--color-gray-800);
      background: var(--color-white);
      transition: all 0.3s ease;
    }

    .custom-input.with-prefix {
      padding-left: 32px;
    }

    .custom-input:focus {
      outline: none;
      border-color: var(--color-navy);
      box-shadow: 0 0 0 3px rgba(27, 58, 107, 0.1);
    }

    .custom-input::placeholder {
      color: var(--color-gray-400);
    }

    /* Custom Select */
    .custom-select-wrapper {
      position: relative;
    }

    .custom-select {
      width: 100%;
      padding: 12px 40px 12px 16px;
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius);
      font-size: 0.95rem;
      color: var(--color-gray-800);
      background: var(--color-white);
      appearance: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .custom-select:focus {
      outline: none;
      border-color: var(--color-navy);
      box-shadow: 0 0 0 3px rgba(27, 58, 107, 0.1);
    }

    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-gray-500);
      pointer-events: none;
    }

    /* Price Inputs */
    .price-inputs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    /* Listing Type Chips */
    .listing-type-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .type-chip {
      padding: 8px 16px;
      background: var(--color-gray-100);
      border: 1px solid var(--color-gray-200);
      border-radius: 20px;
      font-size: 0.875rem;
      color: var(--color-gray-600);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .type-chip:hover {
      background: var(--color-gray-200);
    }

    .type-chip.active {
      background: var(--color-navy);
      border-color: var(--color-navy);
      color: var(--color-white);
    }

    /* Bedroom Options */
    .bedroom-options {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .bedroom-btn {
      padding: 10px 16px;
      background: var(--color-gray-100);
      border: 1px solid var(--color-gray-200);
      border-radius: var(--radius);
      font-size: 0.875rem;
      color: var(--color-gray-600);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .bedroom-btn:hover {
      background: var(--color-gray-200);
    }

    .bedroom-btn.active {
      background: var(--color-navy);
      border-color: var(--color-navy);
      color: var(--color-white);
    }

    /* Amenities Chips */
    .amenities-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .amenity-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--color-gray-100);
      border: 1px solid var(--color-gray-200);
      border-radius: 20px;
      font-size: 0.85rem;
      color: var(--color-gray-600);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .amenity-chip:hover {
      background: var(--color-gray-200);
    }

    .amenity-chip.selected {
      background: var(--color-gold);
      border-color: var(--color-gold);
      color: var(--color-navy);
    }

    .amenity-chip mat-icon {
      font-size: 16px;
    }

    /* Filter Buttons */
    .apply-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px;
      background: var(--color-navy);
      color: var(--color-white);
      border: none;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 12px;
    }

    .apply-btn:hover {
      background: var(--color-navy-light);
    }

    .reset-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: transparent;
      color: var(--color-gray-500);
      border: none;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .reset-btn:hover {
      color: var(--color-navy);
    }

    /* ===== Results Section ===== */
    .results-section {
      min-height: 600px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 24px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .results-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .results-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0;
    }

    .results-count {
      margin: 0;
      color: var(--color-gray-500);
      font-size: 0.9rem;
    }

    .results-count strong {
      color: var(--color-navy);
      font-weight: 600;
    }

    .view-toggle {
      display: flex;
      gap: 8px;
    }

    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--color-gray-100);
      border: none;
      border-radius: var(--radius);
      color: var(--color-gray-500);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .view-btn:hover {
      background: var(--color-gray-200);
      color: var(--color-gray-700);
    }

    .view-btn.active {
      background: var(--color-navy);
      color: var(--color-white);
    }

    /* ===== Error & Empty States ===== */
    .error-container,
    .empty-container {
      text-align: center;
      padding: 80px 20px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .error-container mat-icon,
    .empty-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--color-gray-300);
      margin-bottom: 16px;
    }

    .empty-container h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-gray-800);
      margin: 0 0 8px 0;
    }

    .empty-container p {
      color: var(--color-gray-500);
      margin: 0 0 24px 0;
    }

    /* ===== Skeleton Loading ===== */
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 24px;
    }

    .skeleton-grid.list {
      grid-template-columns: 1fr;
    }

    .skeleton-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .skeleton-image {
      height: 220px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      padding: 20px;
    }

    .skeleton-title {
      height: 24px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .skeleton-line.short {
      width: 60%;
    }

    .skeleton-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--color-gray-100);
    }

    .skeleton-badge {
      height: 24px;
      width: 80px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 12px;
    }

    .skeleton-price {
      height: 24px;
      width: 100px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* ===== Map View ===== */
    .map-container {
      width: 100%;
      height: 600px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .property-map {
      width: 100%;
      height: 100%;
    }

    /* Leaflet Popup */
    .property-popup .popup-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
      color: var(--color-gray-900);
    }

    .property-popup .popup-price {
      color: var(--color-navy);
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 8px;
    }

    .property-popup .popup-link {
      color: var(--color-gold);
      text-decoration: none;
      font-size: 12px;
      font-weight: 500;
    }

    .property-popup .popup-link:hover {
      text-decoration: underline;
    }

    /* ===== Virtual Scrolling Container ===== */
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

    /* ===== Properties Grid (Fallback) ===== */
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .properties-grid.list-view {
      grid-template-columns: 1fr;
    }

    /* ===== Property Card ===== */
    .property-card {
      cursor: pointer;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
    }

    .property-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow-xl);
    }

    .property-image {
      position: relative;
      height: 220px;
      overflow: hidden;
    }

    .property-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .property-card:hover .property-image img {
      transform: scale(1.05);
    }

    .property-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      display: flex;
      justify-content: space-between;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.featured {
      background: var(--color-gold);
      color: var(--color-navy);
    }

    .badge.verified {
      background: var(--color-white);
      color: #22c55e;
      padding: 4px;
      border-radius: 50%;
    }

    .badge.verified mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .badge.instant {
      background: var(--color-navy);
      color: var(--color-white);
    }

    .property-card mat-card-content {
      padding: 20px;
    }

    .property-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .property-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0;
      flex: 1;
      line-height: 1.4;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #f59e0b;
    }

    .rating mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .location {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-gray-500);
      font-size: 0.9rem;
      margin-bottom: 12px;
    }

    .location mat-icon {
      font-size: 18px;
      color: var(--color-gray-400);
    }

    .features {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .features span {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
      color: var(--color-gray-600);
    }

    .features mat-icon {
      font-size: 18px;
      color: var(--color-gray-400);
    }

    .amenities-preview {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .amenities-preview mat-icon {
      color: var(--color-gray-500);
      font-size: 20px;
    }

    .price-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid var(--color-gray-200);
    }

    .price {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-navy);
    }

    .type {
      font-size: 0.8rem;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 500;
    }

    .type.sale-type { background: rgba(27, 58, 107, 0.1); color: var(--color-navy); }
    .type.rent-type { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .type.short-term-type { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

    /* ===== Responsive Design ===== */
    @media (max-width: 1200px) {
      .main-content {
        grid-template-columns: 280px 1fr;
      }

      .properties-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .skeleton-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 1024px) {
      .main-content {
        grid-template-columns: 1fr;
      }

      .filters-sidebar {
        position: static;
      }

      .filters-card {
        margin-bottom: 24px;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        padding: 32px 0 48px;
      }

      .page-title {
        font-size: 1.75rem;
      }

      .hero-search {
        flex-direction: column;
      }

      .hero-search-btn {
        width: 100%;
        justify-content: center;
      }

      .results-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }

      .properties-grid {
        grid-template-columns: 1fr;
      }

      .skeleton-grid {
        grid-template-columns: 1fr;
      }

      .map-container {
        height: 400px;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 0 16px;
      }

      .main-content {
        padding: 24px 0;
      }

      .price-inputs {
        grid-template-columns: 1fr;
      }

      .comparison-bar {
        position: fixed;
        top: 64px;
        right: 16px;
        background-color: var(--color-white);
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      }

      .compare-info {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
      }

      .compare-info mat-icon {
        font-size: 24px;
        margin-right: 8px;
      }

      .compare-actions {
        display: flex;
        justify-content: space-between;
      }

      .compare-actions button {
        margin-right: 16px;
      }
    }

    @media (max-width: 768px) {
      .comparison-bar {
        top: 56px;
      }
    }
  `]
})
export class PropertyListComponent implements OnInit {
  private propertyService = inject(PropertyService);
  public comparisonService = inject(ComparisonService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  properties = this.propertyService.properties;
  totalCount = this.propertyService.totalCount;
  loading = this.propertyService.loading;
  error = signal<string | null>(null);
  heroSearchValue = signal<string>('');

  pageSize = signal(12);
  pageIndex = signal(0);
  viewMode = signal<'grid' | 'list' | 'map'>('grid');
  selectedAmenities = signal<string[]>([]);
  
  // Smart Search signals
  searchSuggestions = signal<{locations: string[], types: string[], recent: string[]}>({
    locations: [],
    types: [],
    recent: []
  });
  isSearching = signal<boolean>(false);
  private searchSubject = new Subject<string>();

  ListingType = ListingType;

  // Track by function for virtual scrolling optimization
  trackByPropertyFn(index: number, property: Property): string {
    return property.id;
  }

  // Generate low quality placeholder for progressive loading
  getLowQualityPlaceholder(property: Property): string {
    if (!property.images || property.images.length === 0) {
      return '';
    }
    
    // Generate a very small, blurred version of the image
    const imageUrl = property.images[0];
    return `${imageUrl}?w=20&q=10&blur=10`; // Tiny blurred placeholder
  }

  getCompareTooltip(propertyId: string): string {
    return this.comparisonService.isInComparison(propertyId)
      ? 'Solishtirishdan olib tashlash'
      : "Solishtirishga qo'shish";
  }

  propertyTypes = [
    { value: 'Apartment', label: 'Kvartira' },
    { value: 'House', label: 'Uy' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Office', label: 'Ofis' },
    { value: 'Commercial', label: 'Tijorat' },
    { value: 'Land', label: 'Yer' }
  ];

  listingTypes = [
    { value: 'Sale', label: 'Sotish' },
    { value: 'Rent', label: 'Ijaraga' },
    { value: 'ShortTermRent', label: 'Qisqa muddatli' }
  ];

  bedroomOptions = [1, 2, 3, 4, 5];

  amenitiesList = [
    { value: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
    { value: 'parking', label: 'Parking', icon: 'local_parking' },
    { value: 'pool', label: 'Hovuz', icon: 'pool' },
    { value: 'ac', label: 'Konditsioner', icon: 'ac_unit' },
    { value: 'kitchen', label: 'Oshxona', icon: 'kitchen' },
    { value: 'tv', label: 'TV', icon: 'tv' }
  ];

  filterForm = this.fb.group({
    location: [''],
    propertyType: [''],
    listingType: [''],
    minPrice: [''],
    maxPrice: [''],
    bedrooms: ['']
  });

  ngOnInit(): void {
    // Handle query params from home page search
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.heroSearchValue.set(params['search']);
        this.filterForm.patchValue({ location: params['search'] });
      }
      if (params['listingType']) {
        this.filterForm.patchValue({ listingType: params['listingType'] });
      }
      // Apply filters after setting values
      setTimeout(() => this.applyFilters(), 0);
    });

    // Listen for navigation events from map popup
    window.addEventListener('navigateToProperty', (event: Event) => {
      const customEvent = event as CustomEvent;
      const propertyId = customEvent.detail?.propertyId;
      if (propertyId) {
        this.router.navigate(['/properties', propertyId]);
      }
    });
  }

  loadProperties(): void {
    this.error.set(null);
    
    this.propertyService.getAllProperties(
      this.pageIndex() + 1,
      this.pageSize()
    ).subscribe({
      error: () => {
        this.error.set('Mulklarni yuklashda xatolik yuz berdi');
      }
    });
  }

  applyFilters(): void {
    this.pageIndex.set(0);
    
    // Filter out null values from form
    const formValue = this.filterForm.value;
    const cleanParams: Record<string, unknown> = {};
    
    Object.keys(formValue).forEach(key => {
      const value = (formValue as Record<string, unknown>)[key];
      if (value !== null && value !== undefined && value !== '') {
        cleanParams[key] = value;
      }
    });
    
    const params: PropertySearchParams = {
      ...cleanParams,
      page: 1,
      pageSize: this.pageSize(),
      amenities: this.selectedAmenities()
    };

    this.propertyService.searchProperties(params).subscribe({
      error: () => {
        this.error.set('Qidirishda xatolik yuz berdi');
      }
    });
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.selectedAmenities.set([]);
    this.pageIndex.set(0);
    this.loadProperties();
  }

  isAmenitySelected(value: string): boolean {
    return this.selectedAmenities().includes(value);
  }

  toggleAmenity(value: string): void {
    this.selectedAmenities.update(amenities => {
      if (amenities.includes(value)) {
        return amenities.filter(a => a !== value);
      }
      return [...amenities, value];
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.loadProperties();
  }

  setViewMode(mode: 'grid' | 'list' | 'map'): void {
    this.viewMode.set(mode);
    if (mode === 'map') {
      setTimeout(() => this.initMap(), 100);
    }
  }

  // Get image URL from property (handles multiple image formats)
  // Uses thumbnail for list view (faster loading), medium for detail view
  getImageUrl(property: Property, size: 'thumbnail' | 'medium' | 'full' = 'thumbnail'): string {
    // Try to get from images array first
    if (property.images && property.images.length > 0) {
      // Find primary image or use first one
      const primaryImage = property.images.find(img => img.isPrimary) || property.images[0];
      
      // Return appropriate size
      if (size === 'thumbnail' && primaryImage.thumbnailUrl) {
        return primaryImage.thumbnailUrl;
      }
      if (size === 'medium' && primaryImage.mediumUrl) {
        return primaryImage.mediumUrl;
      }
      return primaryImage.url || primaryImage.imageUrl || '';
    }
    
    // Fallback to legacy properties
    if (size === 'thumbnail' && property.thumbnailUrl) return property.thumbnailUrl;
    if (property.imageUrl) return property.imageUrl;
    if (property.mainImageUrl) return property.mainImageUrl;
    
    return this.getPlaceholderImage(property);
  }

  // Handle image load error
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const propertyType = img.getAttribute('data-property-type') || 'Apartment';
    img.src = this.getPlaceholderImage({ type: propertyType } as Property);
  }

  // Get placeholder image based on property type
  getPlaceholderImage(property: Property): string {
    const type = property.type || 'Apartment';
    const colors: Record<string, string> = {
      'Apartment': '1a1a2e/D4A017',
      'House': '16213e/4ade80',
      'Villa': '0f3460/f59e0b',
      'Office': '1e293b/818cf8'
    };
    const color = colors[type] || '1a1a2e/D4A017';
    return `https://placehold.co/400x220/${color}?text=${encodeURIComponent(type)}`;
  }

  navigateToProperty(id: string): void {
    this.router.navigate(['/properties', id]);
  }

  toggleCompare(event: Event, property: Property): void {
    event.stopPropagation();
    const propertyResponse = property as unknown as PropertyResponse;
    if (this.comparisonService.isInComparison(property.id)) {
      this.comparisonService.removeFromCompare(property.id);
    } else {
      const added = this.comparisonService.addToCompare(propertyResponse);
      if (!added) {
        this.toastService.warning('Bir vaqtning o‘zida eng ko‘pi bilan 4 ta mulkni solishtirish mumkin.');
      }
    }
  }

  // Hero search - update sidebar filter and apply
  onHeroSearch(): void {
    const searchValue = this.heroSearchValue().trim();
    if (searchValue) {
      // Update filter form location field
      this.filterForm.patchValue({ location: searchValue });
      // Scroll to filter sidebar
      document.querySelector('.filters-sidebar')?.scrollIntoView({ behavior: 'smooth' });
      // Apply filters
      this.applyFilters();
    }
  }

  // Leaflet Map instance
  private map: L.Map | null = null;

  // Initialize Leaflet Map
  initMap(): void {
    // Clean up existing map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Wait for DOM to be ready
    const mapContainer = document.getElementById('property-map');
    if (!mapContainer) {
      return;
    }

    // Initialize map centered on Tashkent
    this.map = L.map('property-map').setView([41.2995, 69.2401], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Add markers for properties with coordinates
    const properties = this.properties();
    let markerCount = 0;

    properties.forEach(property => {
      // Check if property has valid coordinates
      if (property.latitude && property.longitude) {
        const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : property.latitude;
        const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : property.longitude;

        if (!isNaN(lat) && !isNaN(lng)) {
          // Create marker
          const marker = L.marker([lat, lng]).addTo(this.map!);

          // Create popup content
          const price = this.getPropertyPrice(property);
          const popupContent = `
            <div class="property-popup">
              <div class="popup-title">${property.title}</div>
              <div class="popup-price">${price}</div>
              <a href="javascript:void(0)" class="popup-link" onclick="window.navigateToPropertyDetail('${property.id}')">Ko'rish</a>
            </div>
          `;

          marker.bindPopup(popupContent);
          markerCount++;
        }
      }
    });

    // Fit bounds if we have markers
    if (markerCount > 0) {
      const bounds = L.latLngBounds(
        properties
          .filter(p => p.latitude && p.longitude)
          .map(p => [
            typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude!,
            typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude!
          ])
      );
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Force map resize after container is visible
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  // Helper to get property price for popup
  private getPropertyPrice(property: Property): string {
    if (property.listingType === ListingType.Sale && property.salePrice) {
      return `${property.salePrice.toLocaleString()} ${property.currency}`;
    } else if (property.listingType === ListingType.Rent && property.monthlyRent) {
      return `${property.monthlyRent.toLocaleString()} ${property.currency}/oy`;
    } else if (property.listingType === ListingType.ShortTermRent && property.pricePerNight) {
      return `${property.pricePerNight.toLocaleString()} ${property.currency}/tun`;
    }
    return 'Narx ko\'rsatilmagan';
  }

  // Smart Search Methods
  private loadRecentSearches(): string[] {
    const recent = localStorage.getItem('recent_searches');
    return recent ? JSON.parse(recent) : ['Toshkent', 'Samarqand', 'Kvartira'];
  }

  private saveSearch(query: string) {
    if (!query.trim()) return;
    const recent = this.loadRecentSearches().filter(s => s !== query);
    recent.unshift(query);
    localStorage.setItem('recent_searches', JSON.stringify(recent.slice(0, 5)));
  }

  onSearchInput(value: string) {
    this.heroSearchValue.set(value);
    this.isSearching.set(true);
    
    // Debounce search
    setTimeout(() => {
      this.updateSearchSuggestions(value);
      this.isSearching.set(false);
    }, 300);
  }

  private updateSearchSuggestions(query: string) {
    const allLocations = Object.values(UzbekistanRegion).map(r => r.toString());
    const propertyTypes = ['Kvartira', 'Uy', 'Villa', 'Ofis', 'Tijorat', 'Yer uchastkasi'];
    
    const locations = query.length > 0 
      ? allLocations.filter(l => l.toLowerCase().includes(query.toLowerCase()))
      : [];
      
    const types = query.length > 0
      ? propertyTypes.filter(t => t.toLowerCase().includes(query.toLowerCase()))
      : [];
    
    this.searchSuggestions.set({
      locations,
      types,
      recent: query.length === 0 ? this.loadRecentSearches() : []
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLocationSelected(event: any) {
    const value = event.option.value;
    this.heroSearchValue.set(value);
    this.saveSearch(value);
    this.searchSuggestions.set({ locations: [], types: [], recent: [] });
  }

  highlightMatch(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }
}

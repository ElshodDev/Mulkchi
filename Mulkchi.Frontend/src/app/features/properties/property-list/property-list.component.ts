import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { Subject } from 'rxjs';
import {
  ListingType,
  Property,
  PropertyResponse,
  PropertySearchParams,
  UzbekistanRegion,
} from '../../../core/models';
import { ComparisonService } from '../../../core/services/comparison.service';
import { PropertyService } from '../../../core/services/property.service';
import { ToastService } from '../../../core/services/toast.service';
import { PropertyFiltersComponent } from './components/property-filters.component';
import { PropertyGridComponent } from './components/property-grid.component';
import { PropertyListHeaderComponent } from './components/property-list-header.component';
import { PropertyMapComponent } from './components/property-map.component';
import { PropertyPaginationComponent } from './components/property-pagination.component';
import { SavedSearch } from './components/saved-searches.component';
import { UIFeedbackService } from '../../../core/services/ui-feedback.service';
import { UIStore } from '../../../core/stores/ui.store';
import { VoiceSearchService } from '../../../core/services/voice-search.service';
import { AIService } from '../../../core/services/ai.service';

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
    PropertyListHeaderComponent,
    PropertyFiltersComponent,
    PropertyGridComponent,
    PropertyMapComponent,
    PropertyPaginationComponent,
    SavedSearchesComponent,
  ],
  template: `
    <div class="property-list-container">
      <!-- Clean Modern Hero Header -->
      <section class="modern-hero-header">
        <div class="hero-decorative-blobs">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
        </div>
        
        <div class="container hero-content">
          <div class="breadcrumb animate-fade-in">
            <a routerLink="/">Bosh sahifa</a>
            <mat-icon>chevron_right</mat-icon>
            <span>Mulklar</span>
          </div>

          <div class="hero-title-group">
            <h1 class="animate-reveal">{{ text().allListings }}</h1>
            <p class="animate-fade-up">{{ text().heroSubtitle }}</p>
          </div>

          <div class="modern-search-wrapper animate-slide-up">
            <div class="search-main">
              <div class="search-input-group">
                <mat-icon class="search-icon-hero">location_on</mat-icon>
                <input
                  type="text"
                  class="hero-input"
                  [placeholder]="text().searchPlaceholder"
                  [value]="heroSearchValue()"
                  (input)="onSearchInput($any($event).target.value)"
                  (keyup.enter)="onHeroSearch()"
                  [matAutocomplete]="auto"
                />
                <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onLocationSelected($event)">
                  <mat-option *ngFor="let loc of searchSuggestions().locations.slice(0, 5)" [value]="loc">
                    <mat-icon>place</mat-icon>
                    <span>{{ loc }}</span>
                  </mat-option>
                </mat-autocomplete>
                
                <button
                  mat-icon-button
                  class="btn-voice"
                  (click)="toggleVoiceSearch()"
                  [class.mic-active]="voiceService.isListening()"
                  [matTooltip]="voiceService.isListening() ? 'Eshitilmoqda...' : 'Ovozli qidiruv'"
                >
                  <mat-icon>{{ voiceService.isListening() ? 'mic' : 'mic_none' }}</mat-icon>
                </button>
              </div>

              <div class="search-divider"></div>

              <div class="search-type-selector">
                <mat-icon>home</mat-icon>
                <mat-select [value]="filtersValue().listingType || 'All'" (selectionChange)="onTypeChange($event.value)">
                  <mat-option value="All">{{ text().allTypes }}</mat-option>
                  <mat-option value="Rent">{{ text().rent }}</mat-option>
                  <mat-option value="Sale">{{ text().sale }}</mat-option>
                  <mat-option value="ShortTermRent">{{ text().shortTerm }}</mat-option>
                </mat-select>
              </div>

              <button mat-flat-button class="search-trigger-btn" (click)="onHeroSearch()">
                <mat-icon>search</mat-icon>
                <span>{{ text().search }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div class="main-content-wrapper">
        <div class="layout-grid">
          <!-- Sidebar Filters -->
          <aside class="filters-sidebar-column">
            <app-saved-searches
              #savedSearchesComponent
              (searchSelected)="onSavedSearchSelected($event)"
              (searchDeleted)="onSavedSearchDeleted($event)"
            ></app-saved-searches>

            <app-property-filters
              [filters]="filtersValue()"
              (filtersChange)="onFiltersChange($event)"
              (filterReset)="resetFilters()"
              (saveSearch)="onSaveSearch($event)"
            ></app-property-filters>

            <div class="sidebar-ad-card">
              <mat-icon>verified_user</mat-icon>
              <h4>Xavfsiz savdo</h4>
              <p>Barcha e'lonlar AI tomonidan tekshiriladi</p>
            </div>
          </aside>

          <!-- Main Content Area -->
          <main class="results-area-plate">
            <app-property-list-header
              [totalCount]="totalCount()"
              [currentView]="viewMode()"
              [currentSort]="sortBy()"
              (viewChange)="setViewMode($event)"
              (sortChange)="setSortBy($event)"
            ></app-property-list-header>

            @if (loading()) {
              <div class="skeleton-dashboard">
                @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                  <div class="skeleton-loader-card"></div>
                }
              </div>
            } @else if (error()) {
              <div class="error-state">
                <mat-icon>error_outline</mat-icon>
                <p>{{ error() }}</p>
                <button mat-stroked-button (click)="loadProperties()">{{ text().retry }}</button>
              </div>
            } @else if (properties().length === 0) {
              <div class="empty-state-modern">
                <div class="empty-illustration">
                  <mat-icon>search_off</mat-icon>
                </div>
                <h3>{{ text().noResults }}</h3>
                <p>{{ text().noResultsSub }}</p>
                <button mat-flat-button color="primary" (click)="resetFilters()">
                  {{ text().clearFilters }}
                </button>
              </div>
            } @else {
              @if (viewMode() !== 'map') {
                <div class="results-grid-container">
                  <app-property-grid
                    [properties]="properties()"
                    [viewMode]="viewMode()"
                    [isLoading]="loading()"
                    (propertyClick)="navigateToProperty($event)"
                  ></app-property-grid>
                </div>

                <div class="pagination-wrapper">
                  <app-property-pagination
                    [currentPage]="pageIndex() + 1"
                    [totalPages]="totalPages()"
                    [pageSize]="pageSize()"
                    (pageChange)="onPageChange($event)"
                    (pageSizeChange)="onPageSizeChange($event)"
                  ></app-property-pagination>
                </div>
              } @else {
                <div class="map-view-container animate-fade-in">
                  @defer (on viewport) {
                    <app-property-map
                      [properties]="properties()"
                      (propertyClick)="navigateToProperty($event)"
                    ></app-property-map>
                  } @placeholder {
                    <div class="map-placeholder pulse">
                      <mat-icon>map</mat-icon>
                      <p>Xarita yuklanmoqda...</p>
                    </div>
                  }
                </div>
              }
            }
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .property-list-container {
        background: var(--color-surface-canvas);
        min-height: 100vh;
      }

      .modern-hero-header {
        position: relative;
        background: var(--color-surface-canvas);
        padding: 40px 0 60px;
        color: var(--color-text-primary);
        overflow: hidden;
        border-bottom: 1px solid var(--color-border-soft);
      }

      .hero-decorative-blobs {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 0;
      }

      .blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        opacity: 0.5;
      }

      .blob-1 {
        top: -100px;
        right: -100px;
        width: 400px;
        height: 400px;
        background: rgba(99, 102, 241, 0.15); /* Indigo tint */
      }

      .blob-2 {
        bottom: -150px;
        left: -100px;
        width: 500px;
        height: 500px;
        background: rgba(168, 85, 247, 0.1); /* Purple tint */
      }

      .hero-content {
        position: relative;
        z-index: 3;
      }
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: var(--color-text-secondary);
        font-weight: 600;
        margin-bottom: 20px;
      }
      .breadcrumb a:hover {
        color: #6366f1;
      }
      .hero-title-group h1 {
        font-size: 3.5rem;
        font-weight: 900;
        letter-spacing: -0.04em;
        margin: 0;
        color: #1e293b;
      }
      .hero-title-group p {
        font-size: 1.15rem;
        color: #64748b;
        margin-top: 12px;
        font-weight: 500;
      }

      .modern-search-wrapper {
        max-width: 900px;
        margin-top: 32px;
      }

      .search-main {
        display: flex;
        align-items: center;
        background: white;
        border-radius: 100px;
        padding: 8px 8px 8px 24px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.05);
        gap: 12px;
      }
      
      .search-input-group {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .search-icon-hero {
        color: #6366f1;
      }
      
      .hero-input {
        flex: 1;
        border: none;
        outline: none;
        padding: 8px 0;
        font-size: 1.05rem;
        font-weight: 500;
        background: transparent;
        color: #1e293b;
      }
      
      .hero-input::placeholder {
        color: #94a3b8;
        font-weight: 400;
      }
      
      .btn-voice {
        color: #94a3b8;
      }
      .btn-voice:hover {
        color: #6366f1;
        background: rgba(99, 102, 241, 0.05);
      }
      
      .search-divider {
        width: 1px;
        height: 32px;
        background: #e2e8f0;
      }
      
      .search-type-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        color: #475569;
        font-weight: 600;
      }
      .search-type-selector mat-icon {
        color: #94a3b8;
      }
      
      .search-trigger-btn {
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
        color: white !important;
        height: 52px !important;
        border-radius: 100px !important;
        padding: 0 32px !important;
        font-weight: 700 !important;
        font-size: 1.05rem !important;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;
      }

      .mic-active {
        color: var(--color-error) !important;
        position: relative;
        z-index: 1;
      }
      .mic-active::before, .mic-active::after {
        content: '';
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 100%; height: 100%;
        border-radius: 50%;
        background: linear-gradient(45deg, var(--color-error), var(--color-primary), var(--color-gold), var(--color-primary-light));
        background-size: 300% 300%;
        z-index: -1;
        animation: siri-wave 1.5s infinite ease-out, siri-gradient 3s infinite linear;
      }
      .mic-active::after {
        animation-delay: 0.75s, 0s;
      }

      @keyframes siri-wave {
        0% { width: 100%; height: 100%; opacity: 0.8; }
        100% { width: 250%; height: 250%; opacity: 0; }
      }
      @keyframes siri-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes pulse-mic {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          opacity: 1;
        }
      }

      .main-content-wrapper {
        padding: 40px 24px 80px;
        position: relative;
        z-index: 10;
        background: #f8fafc; /* Very light slate background for contrast against white cards */
      }

      .layout-grid {
        display: flex;
        align-items: flex-start;
        gap: 24px;
        max-width: 1536px;
        margin: 0 auto;
      }

      .filters-sidebar-column {
        width: 320px;
        flex-shrink: 0;
        position: sticky;
        top: 80px;
        align-self: flex-start;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
      }
      
      /* Custom scrollbar for sidebar */
      .filters-sidebar-column::-webkit-scrollbar {
        width: 6px;
      }
      .filters-sidebar-column::-webkit-scrollbar-thumb {
        background: var(--color-border-strong);
        border-radius: 10px;
      }

      .filters-sidebar-plate {
        background: var(--color-surface-elevated);
        border-radius: var(--radius-xl, 24px);
        box-shadow: var(--shadow-md);
        border: 1px solid var(--color-border-soft);
        overflow: hidden;
        padding: 24px;
      }

      .results-area-plate {
        flex: 1;
        min-width: 0;
        background: var(--color-surface-elevated);
        border-radius: var(--radius-xl, 24px);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--color-border-soft);
        padding: 0 40px 40px;
        min-height: 600px;
        height: fit-content;
      }

      .sidebar-ad-card {
        margin-top: 24px;
        padding: 24px;
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-background) 100%);
        border-radius: 20px;
        color: var(--color-text-inverse, white);
        text-align: center;
      }
      .sidebar-ad-card mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--color-gold);
        margin-bottom: 12px;
      }
      .sidebar-ad-card h4 {
        font-weight: 800;
        margin-bottom: 4px;
      }
      .sidebar-ad-card p {
        font-size: 0.75rem;
        opacity: 0.7;
      }

      .sidebar-info-card {
        margin-top: 16px;
        padding: 24px;
        background: var(--color-surface);
        border-radius: 20px;
        border: 1px solid var(--color-border);
      }
      .widget-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        color: var(--color-navy);
        font-weight: 800;
        font-size: 0.9rem;
      }
      .widget-header mat-icon {
        color: var(--color-gold);
      }
      .widget-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .widget-list li {
        display: flex;
        gap: 12px;
      }
      .widget-list mat-icon {
        color: var(--color-text-secondary);
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .widget-list strong {
        display: block;
        font-size: 0.8rem;
        color: var(--color-navy);
      }
      .widget-list p {
        font-size: 0.7rem;
        color: var(--color-text-secondary);
        margin: 0;
      }

      .results-grid-container {
        margin-top: 10px;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--color-gray-50);
      }
      .sidebar-header span {
        font-weight: 800;
        font-size: 1.1rem;
        color: var(--color-navy);
        flex: 1;
      }
      .sidebar-header mat-icon {
        color: var(--color-gold);
      }

      .skeleton-dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 32px;
      }
      .skeleton-loader-card {
        height: 450px;
        background: var(--color-border-soft);
        border-radius: var(--radius-xl, 24px);
        animation: pulse 1.5s infinite;
      }

      .pagination-wrapper {
        margin-top: 48px;
      }
      .empty-state-modern {
        text-align: center;
        padding: 100px 40px;
      }
      .empty-illustration mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: var(--color-gray-200);
      }

      @keyframes pulse {
        0% {
          opacity: 0.6;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0.6;
        }
      }

      @media (max-width: 1024px) {
        .layout-grid {
          grid-template-columns: 1fr;
        }
        .filters-sidebar-column {
          display: none;
        }
      }
    `,
  ],
})
export class PropertyListComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private uiStore = inject(UIStore);
  private aiService = inject(AIService);
  protected voiceService = inject(VoiceSearchService);

  @ViewChild('savedSearchesComponent') savedSearchesComponent!: SavedSearchesComponent;

  properties = signal<Property[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);
  viewMode = signal<'grid' | 'list' | 'map'>('grid');
  sortBy = signal('newest');
  pageIndex = signal(0);
  pageSize = signal(12);
  heroSearchValue = signal('');
  isSearching = signal(false);
  searchSuggestions = signal<{ locations: string[]; types: string[]; recent: string[] }>({
    locations: [],
    types: [],
    recent: [],
  });

  filtersValue = signal<PropertySearchParams>({});

  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  text = computed(() => {
    const lang = this.uiStore.language();
    const labels = {
      uz: {
        allListings: 'Uy-joy savdosi va ijarasi',
        heroSubtitle: "Ma'lumotlar bazasiga asoslangan zamonaviy web platforma",
        searchPlaceholder: 'Shahar, tuman yoki manzilni kiriting...',
        search: 'Qidirish',
        allTypes: 'Barcha turlar',
        rent: 'Ijaraga olish',
        sale: 'Sotib olish',
        shortTerm: 'Kunlik ijara',
        featured: 'Saralangan',
        verified: 'Tasdiqlangan',
        cheap: 'Hamyonbop',
        luxury: 'Premium mulklar',
        filters: 'Filtrlar',
        reset: 'Tozalash',
        noResults: 'Mulk topilmadi',
        noResultsSub: "Siz ko'rsatgan mezonlar bo'yicha e'lonlar mavjud emas.",
        clearFilters: 'Filtrni tozalash',
        retry: 'Qayta urinish',
      },
      ru: {
        allListings: 'Продажа и аренда жилья',
        heroSubtitle: 'Современная веб-платформа на основе баз данных',
        searchPlaceholder: 'Город, район или улица...',
        search: 'Поиск',
        allTypes: 'Все типы',
        rent: 'Аренда',
        sale: 'Продажа',
        shortTerm: 'Посуточно',
        featured: 'Рекомендуемые',
        verified: 'Проверено',
        cheap: 'Дешевые',
        luxury: 'Люкс',
        filters: 'Фильтры',
        reset: 'Сбросить',
        noResults: 'Ничего не найдено',
        noResultsSub: 'По вашим критериям объявлений не найдено.',
        clearFilters: 'Сбросить фильтры',
        retry: 'Повторить',
      },
      en: {
        allListings: 'All Listings',
        heroSubtitle: 'Best offers across Uzbekistan',
        searchPlaceholder: 'City, district or street...',
        search: 'Search',
        allTypes: 'All types',
        rent: 'Rent',
        sale: 'Sale',
        shortTerm: 'Short term',
        featured: 'Featured',
        verified: 'Verified',
        cheap: 'Budget',
        luxury: 'Luxury',
        filters: 'Filters',
        reset: 'Reset',
        noResults: 'No properties found',
        noResultsSub: 'No listings match your search criteria.',
        clearFilters: 'Clear filters',
        retry: 'Retry',
      },
    };
    return labels[lang as keyof typeof labels] || labels.uz;
  });

  ngOnInit(): void {
    this.voiceService.textResult$.subscribe((text) => {
      this.heroSearchValue.set(text);
      this.onHeroSearch();
    });

    this.route.queryParams.subscribe((params) => {
      const page = params['page'] ? parseInt(params['page']) : 1;
      const size = params['pageSize'] ? parseInt(params['pageSize']) : 12;

      this.pageIndex.set(page - 1);
      this.pageSize.set(size);

      if (params['sortBy']) this.sortBy.set(params['sortBy']);
      if (params['search']) this.heroSearchValue.set(params['search']);

      const searchParams: PropertySearchParams = {
        ...params,
        page: page,
        pageSize: size,
        sortBy: this.sortBy(),
      };

      this.filtersValue.set(searchParams);
      
      if (params['ai_search'] === 'true' && params['search']) {
        this.loadSmartSearch(params['search']);
      } else {
        this.loadProperties();
      }
    });
  }

  loadSmartSearch(query: string): void {
    this.loading.set(true);
    this.propertyService.semanticSearchProperties(query).subscribe({
      next: (res: any) => {
        this.properties.set(res.results.items);
        this.totalCount.set(res.results.totalCount);
        
        // Show parsed info in UI if you want
        if (res.parsedParams) {

        }
        
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Aqlli qidiruv vaqtida xatolik yuz berdi.");
        this.loading.set(false);
      },
    });
  }

  loadProperties(): void {
    this.loading.set(true);
    this.propertyService.searchProperties(this.filtersValue()).subscribe({
      next: (res: any) => {
        this.properties.set(res.items);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.error.set("Ma'lumotlarni yuklashda xatolik yuz berdi.");
        this.loading.set(false);
      },
    });
  }

  onSaveSearch(query: PropertySearchParams): void {
    if (Object.keys(query).length === 0) {
      this.toast.info("Saqlash uchun qidiruv mezonlarini kiriting");
      return;
    }
    
    const searchName = prompt("Qidiruv uchun nom kiriting:", "Mening qidiruvim");
    if (!searchName) return;

    const newSearch: SavedSearch = {
      id: Math.random().toString(36).substr(2, 9),
      name: searchName,
      query: query as Record<string, unknown>,
      icon: 'bookmark',
      color: '#c9a84c',
      createdDate: new Date(),
    };

    if (this.savedSearchesComponent) {
      this.savedSearchesComponent.addSearch(newSearch);
      this.toast.success("Qidiruv muvaffaqiyatli saqlandi!");
    }
  }

  onSavedSearchSelected(search: SavedSearch): void {
    const params = search.query as PropertySearchParams;
    this.filtersValue.set(params);
    this.loadProperties();
    this.toast.info(`"${search.name}" qidiruvi qo'llanildi`);
  }

  onSavedSearchDeleted(id: string): void {
    this.toast.success("Saqlangan qidiruv o'chirildi");
  }

  onHeroSearch(): void {
    const searchValue = this.heroSearchValue();
    if (searchValue.trim().split(' ').length > 1 || this.voiceService.isListening()) {
      // If it's a multi-word phrase or voice search, use AI semantic search
      this.updateUrl({ search: searchValue, page: 1, ai_search: 'true' });
    } else {
      // Standard exact search
      this.updateUrl({ search: searchValue, page: 1 });
    }
  }

  onTypeChange(type: string): void {
    const listingType = type === 'All' ? undefined : type;
    this.updateUrl({ listingType, page: 1 });
  }

  onSearchInput(val: string): void {
    this.heroSearchValue.set(val);
  }

  onLocationSelected(event: any): void {
    this.heroSearchValue.set(event.option.value);
    this.onHeroSearch();
  }

  toggleVoiceSearch() {
    if (this.voiceService.isListening()) {
      this.voiceService.stop();
    } else {
      this.voiceService.setLanguage('uz-UZ');
      this.voiceService.start();
    }
  }

  setViewMode(mode: any): void {
    this.viewMode.set(mode);
  }

  setSortBy(sort: string): void {
    this.updateUrl({ sortBy: sort, page: 1 });
  }

  onPageChange(page: number): void {
    this.updateUrl({ page: page });
  }

  onPageSizeChange(size: number): void {
    this.updateUrl({ pageSize: size, page: 1 });
  }

  resetFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  onSavedSearchSelected(search: SavedSearch): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...(search.query as any), page: 1 },
    });
  }

  onFiltersChange(filters: PropertySearchParams): void {
    this.updateUrl({ ...filters, page: 1 });
  }

  private updateUrl(params: any): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  onSaveCurrentSearch(): void {
    this.toast.success('Qidiruv saqlandi!');
  }

  navigateToProperty(id: string): void {
    this.router.navigate(['/properties', id]);
  }
}

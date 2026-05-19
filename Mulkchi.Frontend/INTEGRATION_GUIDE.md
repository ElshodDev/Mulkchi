/\*\*

- FRONTEND UI/UX IMPROVEMENTS - INTEGRATION GUIDE
-
- This guide shows how to integrate the new UI components and services
- into the property-list component for a better user experience.
  \*/

// ============================================================================
// 1. QUICK FILTERS INTEGRATION
// ============================================================================

// In property-list.component.ts, add:

import { QuickFiltersComponent, type QuickFilter } from './components/quick-filters.component';

export class PropertyListComponent {
// ... existing code ...

onQuickFilterSelected(filter: QuickFilter): void {
// Merge quick filter's query into the current form
this.filterForm.patchValue(filter.query);

    // Special handling for price ranges with min/max
    if ('minPrice' in filter.query && 'maxPrice' in filter.query) {
      this.filterForm.patchValue({
        minPrice: filter.query.minPrice,
        maxPrice: filter.query.maxPrice,
      });
    }

    // Special handling for amenities array
    if ('amenities' in filter.query && Array.isArray(filter.query.amenities)) {
      this.filterForm.patchValue({
        amenities: filter.query.amenities.join(','),
      });
    }

    // Apply the filters to search
    this.applyFilters();

}
}

// In property-list.component.html template, add BEFORE the filters sidebar:
/_
<app-quick-filters (filterSelected)="onQuickFilterSelected($event)"></app-quick-filters>
_/

// ============================================================================
// 2. SAVED SEARCHES INTEGRATION
// ============================================================================

// In property-list.component.ts, add:

import { SavedSearchesComponent, type SavedSearch } from './components/saved-searches.component';
import { UIFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

export class PropertyListComponent {
private uiFeedback = inject(UIFeedbackService);
private localStorage = inject(LocalStorageService);
@ViewChild(SavedSearchesComponent) savedSearchesComponent!: SavedSearchesComponent;

onSaveCurrentSearch(): void {
// Create a saved search from current filters
const currentQuery = this.filtersValue();

    const search: SavedSearch = {
      id: `search_${Date.now()}`,
      name: this.generateSearchName(currentQuery),
      query: currentQuery,
      icon: this.getSearchIcon(currentQuery),
      color: '#3b82f6',
      createdDate: new Date(),
      notificationCount: 0,
    };

    // Add to saved searches
    this.savedSearchesComponent.addSearch(search);
    this.uiFeedback.success(`"${search.name}" saqlandi!`);

}

onSavedSearchSelected(search: SavedSearch): void {
// Load the saved search into filters
this.filterForm.patchValue(search.query);
this.applyFilters();
}

private generateSearchName(query: Record<string, unknown>): string {
const parts: string[] = [];

    if (query['location']) parts.push(query['location'] as string);
    if (query['propertyType']) parts.push(query['propertyType'] as string);
    if (query['minPrice']) parts.push(`${query['minPrice']}+ so'm`);

    return parts.length ? parts.join(' - ') : 'Qidiruv';

}

private getSearchIcon(query: Record<string, unknown>): string {
if (query['propertyType'] === 'Villa') return 'villa';
if (query['propertyType'] === 'House') return 'house';
if (query['propertyType'] === 'Apartment') return 'apartment';
return 'search';
}
}

// In property-list.component.html template, add AFTER quick-filters:
/\*
<app-saved-searches
(searchSelected)="onSavedSearchSelected($event)"
(searchDeleted)="loadSavedSearches()">
</app-saved-searches>

<button mat-raised-button class="save-search-btn" (click)="onSaveCurrentSearch()">
<mat-icon>bookmark_add</mat-icon>
Qidiruvni saqlash
</button>
\*/

// ============================================================================
// 3. IMAGE OPTIMIZATION SERVICE INTEGRATION
// ============================================================================

// In property-grid.component.ts, use ImageOptimizationService:

import { ImageOptimizationService } from 'src/app/core/services/image-optimization.service';

export class PropertyGridComponent {
private imageOpt = inject(ImageOptimizationService);

getPropertyImage(image: PropertyImage | undefined): any {
if (!image?.url) {
return this.imageOpt.getFallbackImage();
}

    return this.imageOpt.createOptimizedImage(image.url, {
      widths: [320, 640, 960], // Responsive widths
      quality: 85, // 85% quality for good balance
      withPlaceholder: true, // Generate low-res placeholder
      lazy: true, // Enable lazy loading
    });

}
}

// In property-grid.component.html template, update image element:
/_
<img
[src]="getPropertyImage(property.images?.[0])?.src"
[srcset]="getPropertyImage(property.images?.[0])?.srcset"
[sizes]="getPropertyImage(property.images?.[0])?.sizes"
loading="lazy"
[alt]="property.title"
class="property-image"
/>
_/

// ============================================================================
// 4. UI FEEDBACK SERVICE INTEGRATION
// ============================================================================

// In ANY component, inject and use UIFeedbackService:

import { UIFeedbackService } from 'src/app/core/services/ui-feedback.service';

export class SomeComponent {
private uiFeedback = inject(UIFeedbackService);

// Success notification
uiFeedback.success('Qidiruvlar saqlandi!');

// Error notification
uiFeedback.error('Qidiruvda xato yuz berdi. Iltimos, qayta urinib ko\'ring.');

// Info notification
uiFeedback.info('3 ta yangi e\'lonlar topildi');

// Loading notification (persistent)
uiFeedback.loading('E\'lonlar yuklanmoqda...');

// Confirmation with promise
const confirmed = await this.uiFeedback.confirm('Bu e\'lonni o\'chirmoqchimisiz?');
if (confirmed) {
// Delete the item
}

// Warning
uiFeedback.warning('Bu e\'lon tezda tugaydi');
}

// ============================================================================
// 5. LOCAL STORAGE SERVICE INTEGRATION
// ============================================================================

// In property-list.component.ts, use LocalStorageService:

import { LocalStorageService } from 'src/app/core/services/local-storage.service';

export class PropertyListComponent {
private localStorage = inject(LocalStorageService);

// Save search history (keep last 10 searches)
saveSearchHistory(query: Record<string, unknown>): void {
this.localStorage.addToArray('search_history', query, 10);
}

// Load search history
getSearchHistory(): any[] {
return this.localStorage.getArray('search_history');
}

// Clear history
clearSearchHistory(): void {
this.localStorage.removeItem('search_history');
}

// Set user preferences
setUserPreferences(prefs: any): void {
this.localStorage.setItem('user_prefs', prefs);
}

// Get with expiration (expires in 1 hour)
saveTempData(data: any): void {
this.localStorage.setItem('temp_data', data, 60); // 60 minutes
}
}

// ============================================================================
// 6. COMPLETE PROPERTY-LIST COMPONENT IMPORTS
// ============================================================================

import { Component, OnInit, OnDestroy, ViewChild, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// NEW IMPORTS
import { QuickFiltersComponent } from './components/quick-filters.component';
import { SavedSearchesComponent } from './components/saved-searches.component';
import { ImageOptimizationService } from 'src/app/core/services/image-optimization.service';
import { UIFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { LocalStorageService } from 'src/app/core/services/local-storage.service';

@Component({
selector: 'app-property-list',
standalone: true,
imports: [
CommonModule,
ReactiveFormsModule,
MatButtonModule,
MatIconModule,
// NEW COMPONENTS
QuickFiltersComponent,
SavedSearchesComponent,
// ... existing imports ...
],
template: `
<!-- Quick Filters -->
<app-quick-filters
(filterSelected)="onQuickFilterSelected($event)"
class="quick-filters-section">
</app-quick-filters>

    <!-- Saved Searches -->
    <app-saved-searches
      (searchSelected)="onSavedSearchSelected($event)"
      (searchDeleted)="onSavedSearchDeleted($event)"
      class="saved-searches-section">
    </app-saved-searches>

    <!-- Save Current Search Button -->
    <button
      mat-raised-button
      class="save-search-btn"
      (click)="onSaveCurrentSearch()"
      color="accent">
      <mat-icon>bookmark_add</mat-icon>
      Qidiruvni saqlash
    </button>

    <!-- ... rest of template ... -->

`,
  styles: [`
.quick-filters-section {
margin-bottom: 16px;
}

    .saved-searches-section {
      margin-bottom: 16px;
    }

    .save-search-btn {
      margin-bottom: 16px;
    }

`],
})
export class PropertyListComponent {
// Services
private imageOpt = inject(ImageOptimizationService);
private uiFeedback = inject(UIFeedbackService);
private localStorage = inject(LocalStorageService);

// Template references
@ViewChild(SavedSearchesComponent) savedSearchesComponent!: SavedSearchesComponent;

// ... rest of component implementation ...
}

// ============================================================================
// 7. USAGE EXAMPLES IN TEMPLATES
// ============================================================================

// Property grid with optimized images:
/\*

<div class="property-grid">
  <mat-card *ngFor="let property of properties">
    <img
      [src]="getPropertyImage(property.images?.[0])?.src"
      [srcset]="getPropertyImage(property.images?.[0])?.srcset"
      [sizes]="getPropertyImage(property.images?.[0])?.sizes"
      loading="lazy"
      alt="{{ property.title }}"
    />
  </mat-card>
</div>
*/

// Filter form with quick filters and saved searches:
/\*

<div class="filters-container">
  <app-quick-filters (filterSelected)="onQuickFilterSelected($event)"></app-quick-filters>
  <app-saved-searches (searchSelected)="onSavedSearchSelected($event)"></app-saved-searches>
  
  <form [formGroup]="filterForm">
    <!-- Filter inputs -->
  </form>
</div>
*/

// ============================================================================
// 8. STYLING RECOMMENDATIONS
// ============================================================================

/\*
CSS for responsive layout:

.filters-container {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 16px;
padding: 16px;
background: #f8fafc;
border-radius: 8px;
}

@media (max-width: 768px) {
.filters-container {
grid-template-columns: 1fr;
gap: 8px;
padding: 8px;
}
}
\*/

// ============================================================================
// 9. LAZY LOADING WITH INTERSECTION OBSERVER (Optional Enhancement)
// ============================================================================

/\*
import { Directive, ElementRef, OnInit, inject } from '@angular/core';

@Directive({
selector: 'img[appLazyLoad]',
standalone: true,
})
export class LazyLoadDirective implements OnInit {
private el = inject(ElementRef);

ngOnInit(): void {
const observer = new IntersectionObserver((entries) => {
entries.forEach((entry) => {
if (entry.isIntersecting) {
const img = entry.target as HTMLImageElement;
if (img.dataset['src']) {
img.src = img.dataset['src'];
observer.unobserve(img);
}
}
});
});

    observer.observe(this.el.nativeElement);

}
}

// Usage: <img appLazyLoad [data-src]="imageUrl" />
\*/

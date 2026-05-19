import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { PagedResult, Property, PropertySearchParams } from '../models';
import { PropertyService } from '../services/property.service';

@Injectable({ providedIn: 'root' })
export class PropertyStore {
  private readonly propertyService = inject(PropertyService);

  readonly filters = signal<PropertySearchParams>({ page: 1, pageSize: 20 });
  readonly properties = computed(() => this.propertyService.properties());
  readonly selectedProperty = computed(() => this.propertyService.currentProperty());
  readonly filteredProperties = computed(() => this.properties());
  readonly totalCount = computed(() => this.propertyService.totalCount());
  readonly loading = computed(() => this.propertyService.loading());

  loadProperties(filters: Partial<PropertySearchParams> = {}): Observable<PagedResult<Property>> {
    const nextFilters = { ...this.filters(), ...filters };
    this.filters.set(nextFilters);

    return this.propertyService.getAllProperties(
      nextFilters.page ?? 1,
      nextFilters.pageSize ?? 20,
      nextFilters,
    );
  }

  applyFilter(filters: Partial<PropertySearchParams>): Observable<PagedResult<Property>> {
    return this.loadProperties({ ...filters, page: 1 });
  }

  clearFilters(): Observable<PagedResult<Property>> {
    this.filters.set({ page: 1, pageSize: 20 });
    return this.loadProperties(this.filters());
  }
}

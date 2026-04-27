import { Injectable, signal, computed } from '@angular/core';
import { PropertyResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private properties = signal<PropertyResponse[]>([]);

  // Computed signals
  selectedProperties = computed(() => this.properties());
  count = computed(() => this.properties().length);
  isEmpty = computed(() => this.properties().length === 0);

  addToCompare(property: PropertyResponse): boolean {
    if (this.properties().length >= 4) {
      return false; // Maksimal 4 ta mulkni solishtirish mumkin
    }

    if (this.properties().some(p => p.id === property.id)) {
      return false; // Allaqachon bor
    }

    this.properties.update(prev => [...prev, property]);
    return true;
  }

  removeFromCompare(propertyId: string): void {
    this.properties.update(prev => prev.filter(p => p.id !== propertyId));
  }

  clear(): void {
    this.properties.set([]);
  }

  isInComparison(propertyId: string): boolean {
    return this.properties().some(p => p.id === propertyId);
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PropertyResponse } from '../models';
import { Observable } from 'rxjs';

export interface PropertyComparisonDetail {
  propertyId: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  district: string;
  pros: string[];
  cons: string[];
  score: number;
  valueRating: string;
}

export interface ComparisonResult {
  comparedPropertyIds: string[];
  summary: string;
  details: PropertyComparisonDetail[];
  recommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/compare`;
  private readonly STORAGE_KEY = 'mulkchi_compare_properties';

  private properties = signal<PropertyResponse[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  // Computed signals
  selectedProperties = computed(() => this.properties());
  count = computed(() => this.properties().length);
  isEmpty = computed(() => this.properties().length === 0);

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.properties.set(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading compared properties from localStorage', e);
    }
  }

  private saveToStorage(items: PropertyResponse[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error saving compared properties to localStorage', e);
    }
  }

  addToCompare(property: PropertyResponse): boolean {
    if (this.properties().length >= 4) {
      return false; // Maksimal 4 ta mulkni solishtirish mumkin
    }

    if (this.properties().some(p => p.id === property.id)) {
      return false; // Allaqachon bor
    }

    this.properties.update(prev => {
      const updated = [...prev, property];
      this.saveToStorage(updated);
      return updated;
    });
    return true;
  }

  removeFromCompare(propertyId: string): void {
    this.properties.update(prev => {
      const updated = prev.filter(p => p.id !== propertyId);
      this.saveToStorage(updated);
      return updated;
    });
  }

  clear(): void {
    this.properties.set([]);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing localStorage', e);
    }
  }

  isInComparison(propertyId: string): boolean {
    return this.properties().some(p => p.id === propertyId);
  }

  getSmartComparison(): Observable<ComparisonResult> {
    const ids = this.properties().map(p => p.id);
    return this.http.post<ComparisonResult>(this.apiUrl, ids);
  }
}

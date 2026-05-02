import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, tap, throwError } from 'rxjs';

export interface MarketOverview {
  totalListings: number;
  totalForSale: number;
  totalForRent: number;
  averageSalePrice: number;
  averageRentPrice: number;
  mostActiveCity?: string;
  newListingsToday?: number;
  topCity?: string;
  topCityCount?: number;
  newListingsYesterday?: number;
  avgNewListingsPerDay?: number;
  averagePricePerSqm?: number;
  priceChangePercent?: number;
  lastUpdated?: string;
}

export interface RegionAnalytics {
  region: string;
  listingsCount: number;
  averageSalePrice: number;
  averageRentPrice: number;
}

export interface PriceTrend {
  month: string;
  averagePrice: number;
  listingsCount: number;
}

export interface DistrictAnalytics {
  region: string;
  district: string;
  listingsCount: number;
  averageSalePrice: number;
  averageRentPrice: number;
  minSalePrice: number;
  maxSalePrice: number;
  minRentPrice: number;
  maxRentPrice: number;
  pricePerSqm: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Analytics`;

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  getMarketOverview(): Observable<MarketOverview> {
    this.loading.set(true);
    return this.http.get<MarketOverview>(`${this.apiUrl}/market-overview`).pipe(
      tap(() => this.loading.set(false)),
      catchError(err => {
        this.error.set('Bozor maʼlumotlarini yuklashda xatolik yuz berdi');
        this.loading.set(false);
        return throwError(() => err);
      })
    );
  }

  getAnalyticsByRegion(): Observable<RegionAnalytics[]> {
    return this.http.get<RegionAnalytics[]>(`${this.apiUrl}/by-region`);
  }

  getPriceTrends(): Observable<PriceTrend[]> {
    return this.http.get<PriceTrend[]>(`${this.apiUrl}/price-trends`);
  }

  getAnalyticsByDistrict(): Observable<DistrictAnalytics[]> {
    return this.http.get<DistrictAnalytics[]>(`${this.apiUrl}/by-district`);
  }
}

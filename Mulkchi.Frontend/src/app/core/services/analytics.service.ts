import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { PropertyResponse } from '../models/property.model';

// ========== BASIC ANALYTICS ==========

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

// ========== SMART ANALYTICS - PROPERTY ANALYSIS ==========

export type PriceStatus = 'Underpriced' | 'Fair' | 'Overpriced';

export interface PropertyAnalysisResult {
  propertyId: string;
  currentPrice: number;
  estimatedMarketPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  status: PriceStatus;
  valueScore: number;
  confidence: number;
  comparableCount: number;
  reasoning: string[];
  recommendation: string;
  pricePerSqm: number;
  marketPricePerSqm: number;
}

export interface PropertyDealScore {
  propertyId: string;
  dealScore: number;
  valueForMoney: number;
  negotiationPotential: number;
  urgencyLevel: number;
  bestTimeToBuy: string;
  reasoning: string[];
}

// ========== SMART ANALYTICS - LOCATION INTELLIGENCE ==========

export interface LocationScore {
  district: string;
  region: string;
  overallScore: number;
  affordabilityScore: number;
  infrastructureScore: number;
  connectivityScore: number;
  amenitiesScore: number;
  safetyScore: number;
  growthScore: number;
  investmentPotentialScore: number;
  averagePrice: number;
  medianPrice: number;
  pricePerSqm: number;
  totalListings: number;
  rentalYield: number;
}

export interface LocationInsight {
  district: string;
  region: string;
  summary: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  demographics: {
    familyFriendly: boolean;
    youngProfessionals: boolean;
    retirees: boolean;
    students: boolean;
  };
  lifestyle: {
    quiet: boolean;
    active: boolean;
    central: boolean;
    suburban: boolean;
  };
  marketTrend: 'Rising' | 'Stable' | 'Declining';
  futureOutlook: string;
  nearbyAmenities: string[];
  transportOptions: string[];
}

// ========== SMART ANALYTICS - PRICE INTELLIGENCE ==========

export interface PricePrediction {
  propertyId: string;
  currentPrice: number;
  predictedPrice: number;
  predictedChangePercent: number;
  confidence: number;
  predictionDate: string;
  timeHorizon: string;
  factors: PriceFactor[];
}

export interface PriceFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface PriceTrendForecast {
  region: string;
  district: string;
  currentTrend: 'Rising' | 'Stable' | 'Falling';
  forecastMonths: number;
  monthlyForecasts: MonthlyForecast[];
  summary: string;
  confidence: number;
}

export interface MonthlyForecast {
  month: string;
  predictedPrice: number;
  changePercent: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

// ========== SMART FILTERS ==========

export interface SmartFilterResult {
  properties: PropertyResponse[];
  totalCount: number;
  filterType: 'best-deals' | 'high-roi' | 'fast-selling';
  averageScore: number;
}

export interface PriceHistoryItem {
  date: string;
  price: number;
  type: 'sale' | 'rent';
  source: string;
}

export interface HostDashboardStats {
  totalListings: number;
  totalViews: number;
  totalBookings: number;
  averageRating: number;
  totalRevenue: number;
}

@Injectable({
  providedIn: 'root',
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
      catchError((err) => {
        this.error.set('Bozor maʼlumotlarini yuklashda xatolik yuz berdi');
        this.loading.set(false);
        return throwError(() => err);
      }),
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

  // ========== SMART ANALYTICS METHODS ==========

  /**
   * Analyze a specific property for pricing insights
   */
  analyzeProperty(propertyId: string): Observable<PropertyAnalysisResult> {
    this.loading.set(true);
    return this.http
      .get<PropertyAnalysisResult>(`${this.apiUrl}/property-analysis/${propertyId}`)
      .pipe(
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.error.set('Mulk tahlilini yuklashda xatolik');
          this.loading.set(false);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Get location score for a district
   */
  getLocationScore(district: string, region?: string): Observable<LocationScore> {
    const params: any = { district };
    if (region) params.region = region;
    return this.http.get<LocationScore>(`${this.apiUrl}/location-score`, { params });
  }

  /**
   * Get detailed location insights
   */
  getLocationInsights(district: string, region?: string): Observable<LocationInsight> {
    const params: any = { district };
    if (region) params.region = region;
    return this.http.get<LocationInsight>(`${this.apiUrl}/location-insights`, { params });
  }

  /**
   * Get smart filtered properties
   */
  getSmartDeals(limit = 10): Observable<SmartFilterResult> {
    return this.http.get<SmartFilterResult>(`${this.apiUrl}/smart-filters/best-deals`, {
      params: { limit: limit.toString() },
    });
  }

  getHighRoiProperties(limit = 10): Observable<SmartFilterResult> {
    return this.http.get<SmartFilterResult>(`${this.apiUrl}/smart-filters/high-roi`, {
      params: { limit: limit.toString() },
    });
  }

  getFastSellingProperties(limit = 10): Observable<SmartFilterResult> {
    return this.http.get<SmartFilterResult>(`${this.apiUrl}/smart-filters/fast-selling`, {
      params: { limit: limit.toString() },
    });
  }

  /**
   * Get price prediction for a property
   */
  getPricePrediction(propertyId: string): Observable<PricePrediction> {
    return this.http.get<PricePrediction>(`${this.apiUrl}/price-prediction/${propertyId}`);
  }

  /**
   * Get price forecast for a region/district
   */
  getPriceForecast(district: string, region?: string, months = 6): Observable<PriceTrendForecast> {
    const params: any = { district, months: months.toString() };
    if (region) params.region = region;
    return this.http.get<PriceTrendForecast>(`${this.apiUrl}/price-forecast`, { params });
  }

  /**
   * Get property deal score
   */
  getPropertyDealScore(propertyId: string): Observable<PropertyDealScore> {
    return this.http.get<PropertyDealScore>(`${this.apiUrl}/property-deal-score/${propertyId}`);
  }

  /**
   * Get price history for a property
   */
  getPriceHistory(propertyId: string): Observable<PriceHistoryItem[]> {
    return this.http.get<PriceHistoryItem[]>(`${this.apiUrl}/price-history/${propertyId}`);
  }

  /**
   * Get host dashboard statistics
   */
  getHostDashboardStats(): Observable<HostDashboardStats> {
    return this.http.get<HostDashboardStats>(`${this.apiUrl}/host-dashboard`);
  }
}

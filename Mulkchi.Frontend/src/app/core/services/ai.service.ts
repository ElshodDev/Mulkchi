import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Property } from '../../core/models';

export interface AIPriceRequest {
  region: string;
  propertyType: string;
  area: number;
  rooms: number;
  floor: number;
  listingType: 'Sale' | 'Rent';
}

export interface AIPriceResponse {
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  pricePerSqm?: number;
  marketAverage: number;
  comparisonPercentage: number;
  comparisonMessage: string;
  confidence: number;
  priceLevel?: string;
  similarCount?: number;
  factorBreakdown?: { [key: string]: number };
  regionalData?: {
    region: string;
    averagePrice: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private readonly apiUrl = `${environment.apiUrl}/airecommendations`;

  // Signals for state management
  private readonly _priceResult = signal<AIPriceResponse | null>(null);
  private readonly _recommendations = signal<Property[]>([]);
  private readonly _similarProperties = signal<Property[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly priceResult = () => this._priceResult();
  readonly recommendations = () => this._recommendations();
  readonly similarProperties = () => this._similarProperties();
  readonly loading = () => this._loading();
  readonly error = () => this._error();

  // Computed signals
  readonly hasRecommendations = computed(() => this._recommendations().length > 0);
  readonly hasSimilarProperties = computed(() => this._similarProperties().length > 0);

  constructor(private http: HttpClient) {}

  predictPrice(request: AIPriceRequest): Observable<AIPriceResponse> {
    this._loading.set(true);
    this._error.set(null);

    // Map frontend model to backend model
    const backendRequest = {
      region: request.region,
      propertyType: request.propertyType,
      area: request.area,
      rooms: request.rooms,
      floor: request.floor,
      listingType: request.listingType
    };

    return this.http.post<AIPriceResponse>(`${this.apiUrl}/predict-price`, backendRequest).pipe(
      tap(result => {
        this._priceResult.set(result);
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        // Specific error messages based on HTTP status
        if (error.status === 404) {
          this._error.set('AI xizmati hozircha mavjud emas, tez orada ishga tushiriladi');
        } else if (error.status === 401) {
          this._error.set('Iltimos, tizimga kiring');
        } else {
          this._error.set('Xatolik yuz berdi, qayta urinib ko\'ring');
        }
        return throwError(() => error);
      })
    );
  }

  getRecommendations(count: number = 5): Observable<Property[]> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams().set('count', count.toString());

    return this.http.get<Property[]>(`${this.apiUrl}/recommendations`, { params }).pipe(
      tap(properties => {
        this._recommendations.set(properties);
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        this._error.set('Tavsiyalarni yuklashda xatolik yuz berdi');
        this._recommendations.set([]);
        return throwError(() => error);
      })
    );
  }

  getSimilarProperties(propertyId: string, count: number = 5): Observable<Property[]> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams().set('count', count.toString());

    return this.http.get<Property[]>(`${this.apiUrl}/similar/${propertyId}`, { params }).pipe(
      tap(properties => {
        this._similarProperties.set(properties);
        this._loading.set(false);
      }),
      catchError(error => {
        this._loading.set(false);
        this._error.set('O\'xshash mulklarni yuklashda xatolik yuz berdi');
        this._similarProperties.set([]);
        return throwError(() => error);
      })
    );
  }

  clearResult(): void {
    this._priceResult.set(null);
    this._error.set(null);
  }

  clearRecommendations(): void {
    this._recommendations.set([]);
    this._similarProperties.set([]);
    this._error.set(null);
  }
}

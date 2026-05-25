import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Property } from '../../core/models';

export interface HybridRecommendationProperty {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  city: string;
  region: string;
  propertyType: string;
  listingType: string;
  area: number;
  roomsCount: number;
  bathroomsCount: number;
  imageUrl: string;
  images: string[];
  hostId: string;
  hostName: string;
  rating: number;
  reviewsCount: number;
  viewsCount: number;
  distanceKm?: number;
  isFeatured: boolean;
  isVerified: boolean;
}

export interface HybridRecommendationResponse {
  id: string;
  userId?: string;
  propertyId: string;
  recommendationType: string;
  abVariant: string;
  score: number;
  reason: string;
  property: HybridRecommendationProperty;
  createdAt: string;
  isViewed: boolean;
  isClicked: boolean;
}

export interface AIPriceRequest {
  region: string;
  propertyType: string;
  listingType: 'Sale' | 'Rent' | 'ShortTermRent';
  area: number;
  rooms: number;
  floor: number;
  totalFloors?: number;
  buildingAge?: number;
  hasFurniture?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasAirConditioning?: boolean;
  hasWifi?: boolean;
  hasSecurity?: boolean;
  isRenovated?: boolean;
  hasMetroNearby?: boolean;
  hasPool?: boolean;
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
  factorBreakdown?: Record<string, number>;
  regionalData?: {
    region: string;
    averagePrice: number;
  }[];
}

export interface AIDescriptionRequest {
  region: string;
  propertyType: string;
  area: number;
  rooms: number;
  floor: number;
  totalFloors: number;
  amenities: string[];
}

export interface AIDescriptionResponse {
  description: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root',
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

    return this.http.post<AIPriceResponse>(`${this.apiUrl}/predict-price`, request).pipe(
      tap((result) => {
        this._priceResult.set(result);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        // Specific error messages based on HTTP status
        if (error.status === 404) {
          this._error.set('AI xizmati hozircha mavjud emas, tez orada ishga tushiriladi');
        } else if (error.status === 401) {
          this._error.set('Iltimos, tizimga kiring');
        } else {
          this._error.set("Xatolik yuz berdi, qayta urinib ko'ring");
        }
        return throwError(() => error);
      }),
    );
  }

  getRecommendations(count = 5): Observable<Property[]> {
    this._loading.set(true);
    this._error.set(null);

    // Use hybrid endpoint which auto-generates recommendations
    const request = { limit: count };

    return this.http.post<HybridRecommendationResponse[]>(`${this.apiUrl}/hybrid`, request).pipe(
      map((responses) => responses.map((r) => this.mapHybridToProperty(r.property))),
      tap((properties) => {
        this._recommendations.set(properties);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        this._error.set('Tavsiyalarni yuklashda xatolik yuz berdi');
        this._recommendations.set([]);
        return throwError(() => error);
      }),
    );
  }

  private mapHybridToProperty(hybrid: HybridRecommendationProperty): Property {
    return {
      id: hybrid.id,
      title: hybrid.title || 'Mulk',
      description: hybrid.description || '',
      type: hybrid.propertyType as any,
      category: 'Residential' as any,
      status: 'Active' as any,
      listingType: hybrid.listingType as any,
      monthlyRent: hybrid.listingType === 'Rent' ? hybrid.price : undefined,
      salePrice: hybrid.listingType === 'Sale' ? hybrid.price : undefined,
      pricePerNight: undefined,
      area: hybrid.area,
      numberOfBedrooms: hybrid.roomsCount,
      numberOfBathrooms: hybrid.bathroomsCount,
      maxGuests: 0,
      region: 'Toshkent' as any,
      city: hybrid.city || 'Toshkent',
      district: hybrid.region || '',
      address: hybrid.address || '',
      isVacant: true,
      isFeatured: hybrid.isFeatured,
      isVerified: hybrid.isVerified,
      averageRating: hybrid.rating,
      viewsCount: hybrid.viewsCount,
      favoritesCount: 0,
      images:
        hybrid.images?.map(
          (imgUrl, index) =>
            ({
              id: `${hybrid.id}-img-${index}`,
              propertyId: hybrid.id,
              url: imgUrl,
              imageUrl: imgUrl,
              mediumUrl: imgUrl,
              thumbnailUrl: imgUrl,
              isPrimary: index === 0,
              sortOrder: index,
              createdDate: new Date(),
            }) as any,
        ) || [],
      hostId: hybrid.hostId,
      hostName: hybrid.hostName || '',
      currency: 'UZS' as any,
      exchangeRate: 1,
      createdDate: new Date(),
      updatedDate: new Date(),
      // Default amenities
      hasWifi: false,
      hasParking: false,
      hasPool: false,
      petsAllowed: false,
      isInstantBook: false,
      hasMetroNearby: false,
      hasBusStop: false,
      hasMarketNearby: false,
      hasSchoolNearby: false,
      hasHospitalNearby: false,
      distanceToCityCenter: 0,
      hasElevator: false,
      hasSecurity: false,
      hasGenerator: false,
      hasGas: false,
      hasFurniture: false,
      isRenovated: false,
      hasAirConditioning: false,
      hasHeating: false,
      hasWasher: false,
      hasKitchen: false,
      hasTV: false,
      hasWorkspace: false,
      isSelfCheckIn: false,
      isChildFriendly: false,
      isAccessible: false,
    } as Property;
  }

  getSimilarProperties(propertyId: string, count = 5): Observable<Property[]> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams().set('count', count.toString());

    return this.http.get<Property[]>(`${this.apiUrl}/similar/${propertyId}`, { params }).pipe(
      tap((properties) => {
        this._similarProperties.set(properties);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        this._error.set("O'xshash mulklarni yuklashda xatolik yuz berdi");
        this._similarProperties.set([]);
        return throwError(() => error);
      }),
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

  generateDescription(request: AIDescriptionRequest): Observable<AIDescriptionResponse> {
    return this.http.post<AIDescriptionResponse>(`${this.apiUrl}/generate-description`, request);
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PagedResult,
  Property,
  PropertyCreateRequest,
  PropertyCreateResponse,
  PropertyImage,
  PropertySearchParams,
} from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private readonly apiUrl = `${environment.apiUrl}/properties`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // Signals for state management
  private readonly _properties = signal<Property[]>([]);
  private readonly _featuredProperties = signal<Property[]>([]);
  private readonly _currentProperty = signal<Property | null>(null);
  private readonly _totalCount = signal<number>(0);
  private readonly _loading = signal<boolean>(false);

  // Public readonly signals for consumer access
  readonly properties = this._properties.asReadonly();
  readonly featuredProperties = this._featuredProperties.asReadonly();
  readonly currentProperty = this._currentProperty.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly loading = this._loading.asReadonly();


  // Get all properties with pagination
  getAllProperties(
    page = 1,
    pageSize = 20,
    params?: Partial<PropertySearchParams>,
  ): Observable<PagedResult<Property>> {
    const searchParams: PropertySearchParams = {
      ...params,
      page,
      pageSize,
    };
    return this.searchProperties(searchParams);
  }

  // Search properties
  searchProperties(searchParams: PropertySearchParams): Observable<PagedResult<Property>> {
    this._loading.set(true);
    const params = this.buildHttpParams(searchParams);

    return this.http.get<PagedResult<Property>>(`${this.apiUrl}/search`, { params }).pipe(
      tap((result) => {
        this._properties.set(result.items);
        this._totalCount.set(result.totalCount);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        return throwError(() => this.handleError(error));
      }),
    );
  }

  /**
   * Helper to build HttpParams from search params object
   */
  private buildHttpParams(searchParams: PropertySearchParams): HttpParams {
    let params = new HttpParams();

    const paramMappings: Record<string, string | number | undefined | null> = {
      location: searchParams.location,
      city: searchParams.location,
      searchQuery: searchParams.location,
      minPrice: searchParams.minPrice,
      maxPrice: searchParams.maxPrice,
      bedrooms: searchParams.bedrooms,
      bathrooms: searchParams.bathrooms,
      propertyType: searchParams.propertyType,
      listingType: searchParams.listingType,
      region: searchParams.region,
      sortBy: searchParams.sortBy,
      page: searchParams.page,
      pageSize: searchParams.pageSize,
      latitude: searchParams.latitude,
      longitude: searchParams.longitude,
      radiusKm: searchParams.radiusKm,
    };

    Object.entries(paramMappings).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    if (searchParams.amenities?.length) {
      params = params.set('amenities', searchParams.amenities.join(','));
    }

    return params;
  }

  private handleError(error: any): string {
    console.error('PropertyService Error:', error);
    return error.error?.message || "Mulk ma'lumotlarini olishda xatolik yuz berdi";
  }

  // Get property by ID
  getPropertyById(id: string): Observable<Property> {
    this._loading.set(true);

    return this.http.get<Property>(`${this.apiUrl}/${id}`).pipe(
      tap((property) => {
        this._currentProperty.set(property);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        return throwError(() => error);
      }),
    );
  }

  // Get featured properties
  getFeaturedProperties(count = 8): Observable<Property[]> {
    return this.http
      .get<Property[]>(`${this.apiUrl}/featured`, {
        params: new HttpParams().set('count', count.toString()),
      })
      .pipe(
        tap((properties) => this._featuredProperties.set(properties)),
        catchError((error) => throwError(() => error)),
      );
  }

  // Get similar properties
  getSimilarProperties(propertyId: string, count = 6): Observable<Property[]> {
    return this.http
      .get<Property[]>(`${this.apiUrl}/${propertyId}/similar`, {
        params: new HttpParams().set('count', count.toString()),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  // Autocomplete locations
  autocompleteLocations(query: string): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.apiUrl}/autocomplete`, {
        params: new HttpParams().set('query', query),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  // Create property (any authenticated user - auto-upgraded to Host)
  createProperty(request: PropertyCreateRequest): Observable<Property> {
    return this.http.post<PropertyCreateResponse>(this.apiUrl, request).pipe(
      tap((response) => {
        this._currentProperty.set(response.property);

        // If new tokens are provided (user was upgraded to Host), update stored tokens
        if (response.tokens) {
          const mappedTokens = this.authService.mapApiAuthResponse(response.tokens);
          this.authService.handleAuthResponse(mappedTokens);
        }
      }),
      map((response) => response.property),
      catchError((error) => throwError(() => error)),
    );
  }

  // Update property (Host only)
  updateProperty(id: string, request: Partial<PropertyCreateRequest>): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/${id}`, request).pipe(
      tap((property) => this._currentProperty.set(property)),
      catchError((error) => throwError(() => error)),
    );
  }

  // Upload property image
  uploadPropertyImage(file: File, propertyId: string): Observable<PropertyImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('propertyId', propertyId);

    return this.http.post<PropertyImage>(`${environment.apiUrl}/PropertyImagesUpload/upload`, formData).pipe(
      catchError((error) => throwError(() => error)),
    );
  }

  // Delete property (Host only)
  deleteProperty(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError((error) => throwError(() => error)));
  }

  // Get host properties
  getHostProperties(page = 1, pageSize = 20): Observable<PagedResult<Property>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<PagedResult<Property>>(`${this.apiUrl}/my/listings`, { params })
      .pipe(catchError((error) => throwError(() => error)));
  }

  // Bump property to top (Monetization feature)
  bumpProperty(id: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/${id}/bump`, {})
      .pipe(catchError((error) => throwError(() => error)));
  }
}

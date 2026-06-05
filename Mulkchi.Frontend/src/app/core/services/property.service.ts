import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
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

  private readonly _properties = signal<Property[]>([]);
  private readonly _featuredProperties = signal<Property[]>([]);
  private readonly _currentProperty = signal<Property | null>(null);
  private readonly _totalCount = signal<number>(0);
  private readonly _loading = signal<boolean>(false);

  readonly properties = this._properties.asReadonly();
  readonly featuredProperties = this._featuredProperties.asReadonly();
  readonly currentProperty = this._currentProperty.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly loading = this._loading.asReadonly();

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

  semanticSearchProperties(query: string): Observable<{ parsedParams: any, results: PagedResult<Property> }> {
    this._loading.set(true);
    return this.http.get<{ parsedParams: any, results: PagedResult<Property> }>(`${this.apiUrl}/semantic-search`, { 
      params: new HttpParams().set('query', query) 
    }).pipe(
      tap((response) => {
        this._properties.set(response.results.items);
        this._totalCount.set(response.results.totalCount);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        return throwError(() => this.handleError(error));
      }),
    );
  }

  private buildHttpParams(searchParams: PropertySearchParams): HttpParams {
    let params = new HttpParams();

    const paramMappings: Record<string, string | number | undefined | null> = {
      searchQuery: searchParams.location || searchParams.search,
      city: searchParams.location && false ? searchParams.location : undefined, // Ignore city mapping from location
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

  getSimilarProperties(propertyId: string, count = 6): Observable<Property[]> {
    return this.http
      .get<Property[]>(`${this.apiUrl}/${propertyId}/similar`, {
        params: new HttpParams().set('count', count.toString()),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  autocompleteLocations(query: string): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.apiUrl}/autocomplete`, {
        params: new HttpParams().set('query', query),
      })
      .pipe(catchError((error) => throwError(() => error)));
  }

  createProperty(request: PropertyCreateRequest): Observable<Property> {
    return this.http.post<PropertyCreateResponse>(this.apiUrl, request).pipe(
      tap((response) => {
        this._currentProperty.set(response.property);

        if (response.tokens) {
          const mappedTokens = this.authService.mapApiAuthResponse(response.tokens);
          this.authService.handleAuthResponse(mappedTokens);
        }
      }),
      map((response) => response.property),
      catchError((error) => throwError(() => error)),
    );
  }

  updateProperty(id: string, request: Partial<PropertyCreateRequest>): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/${id}`, request).pipe(
      tap((property) => this._currentProperty.set(property)),
      catchError((error) => throwError(() => error)),
    );
  }

  uploadPropertyImage(file: File, propertyId: string): Observable<PropertyImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('propertyId', propertyId);

    return this.http
      .post<PropertyImage>(`${environment.apiUrl}/PropertyImagesUpload/upload`, formData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 413) {
            return throwError(() => new Error('Fayl hajmi 10MB dan oshmasligi kerak'));
          }

          return throwError(() => error);
        }),
      );
  }

  deleteProperty(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getHostProperties(page = 1, pageSize = 20): Observable<PagedResult<Property>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<PagedResult<Property>>(`${this.apiUrl}/my/listings`, { params })
      .pipe(catchError((error) => throwError(() => error)));
  }

  bumpProperty(id: string): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/${id}/bump`, {})
      .pipe(catchError((error) => throwError(() => error)));
  }
}

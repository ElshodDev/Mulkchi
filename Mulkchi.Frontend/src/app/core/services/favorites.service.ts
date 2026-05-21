import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult, Property } from '../models';
import { AuthService } from './auth.service';

export interface FavoriteRecord {
  id: string;
  userId: string;
  propertyId: string;
  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date | null;
}

export interface FavoriteItem {
  favorite: FavoriteRecord;
  property: Property;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly apiUrl = `${environment.apiUrl}/favorites`;
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly _favoriteItems = signal<FavoriteItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly favoriteItems = this._favoriteItems.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly favoritePropertyIds = computed(
    () => new Set(this._favoriteItems().map((item) => item.favorite.propertyId)),
  );

  loadFavorites(): Observable<FavoriteItem[]> {
    if (!this.authService.isAuthenticated()) {
      this._favoriteItems.set([]);
      this._error.set(null);
      return of([]);
    }

    this._loading.set(true);

    return this.http.get<PagedResult<FavoriteRecord>>(this.apiUrl).pipe(
      switchMap((result) => {
        const favorites = result.items ?? [];

        if (favorites.length === 0) {
          return of([] as FavoriteItem[]);
        }

        return forkJoin(
          favorites.map((favorite) =>
            this.http.get<Property>(`${environment.apiUrl}/properties/${favorite.propertyId}`).pipe(
              map((property) => ({ favorite, property })),
              catchError((error) => {
                if (error?.status !== 404) {
                  console.error('Error loading favorite property:', error);
                }
                return of(null);
              }),
            ),
          ),
        ).pipe(map((items) => items.filter((item): item is FavoriteItem => item !== null)));
      }),
      tap((items) => {
        this._favoriteItems.set(items);
        this._error.set(null);
      }),
      catchError((error) => {
        this._error.set('Sevimlilarni yuklashda xato');
        return throwError(() => error);
      }),
      finalize(() => this._loading.set(false)),
    );
  }

  addFavorite(propertyId: string): Observable<FavoriteRecord> {
    const payload = {
      Id: crypto.randomUUID(),
      PropertyId: propertyId,
    };

    return this.http.post<FavoriteRecord>(this.apiUrl, payload).pipe(
      switchMap((favorite) => this.loadFavorites().pipe(map(() => favorite))),
      catchError((error) => throwError(() => error)),
    );
  }

  removeFavoriteById(favoriteId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${favoriteId}`).pipe(
      switchMap(() => this.loadFavorites().pipe(map(() => void 0))),
      catchError((error) => throwError(() => error)),
    );
  }

  removeFavoriteByPropertyId(propertyId: string): Observable<void> {
    const favoriteId = this._favoriteItems().find((item) => item.favorite.propertyId === propertyId)
      ?.favorite.id;

    if (!favoriteId) {
      return of(void 0);
    }

    return this.removeFavoriteById(favoriteId);
  }

  isFavorite(propertyId: string): boolean {
    return this._favoriteItems().some((item) => item.favorite.propertyId === propertyId);
  }

  getFavoriteIdByPropertyId(propertyId: string): string | null {
    return (
      this._favoriteItems().find((item) => item.favorite.propertyId === propertyId)?.favorite.id ??
      null
    );
  }

  clear(): void {
    this._favoriteItems.set([]);
    this._error.set(null);
    this._loading.set(false);
  }
}

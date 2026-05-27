import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Booking,
  CreateBookingRequest,
  BookingHold,
  CreateHoldRequest,
  BookingStatus,
  PagedResult,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly apiUrl = `${environment.apiUrl}/bookings`;

  private readonly _bookings = signal<Booking[]>([]);
  private readonly _currentBooking = signal<Booking | null>(null);
  private readonly _activeHold = signal<BookingHold | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _availabilityCalendar = signal<Record<string, boolean>>({});

  readonly bookings = () => this._bookings();
  readonly currentBooking = () => this._currentBooking();
  readonly activeHold = () => this._activeHold();
  readonly loading = () => this._loading();
  readonly availabilityCalendar = () => this._availabilityCalendar();

  constructor(private http: HttpClient) {}

  getMyBookings(page = 1, pageSize = 20): Observable<PagedResult<Booking>> {
    this._loading.set(true);

    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<Booking[]>(`${this.apiUrl}/my`, { params }).pipe(
      map((bookings) => ({
        items: bookings,
        totalCount: bookings.length,
        page,
        pageSize,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      })),
      tap((result) => {
        this._bookings.set(result.items);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        return throwError(() => error);
      }),
    );
  }

  getHostBookings(
    page = 1,
    pageSize = 20,
    status?: BookingStatus,
  ): Observable<PagedResult<Booking>> {
    this._loading.set(true);

    let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);

    return this.http.get<Booking[]>(`${this.apiUrl}/host`, { params }).pipe(
      map((bookings) => ({
        items: bookings,
        totalCount: bookings.length,
        page,
        pageSize,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      })),
      tap((result) => {
        this._bookings.set(result.items);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        return throwError(() => error);
      }),
    );
  }

  getBookingById(id: string): Observable<Booking> {
    this._loading.set(true);

    return this.http.get<Booking>(`${this.apiUrl}/${id}`).pipe(
      tap((booking) => {
        this._currentBooking.set(booking);
        this._loading.set(false);
      }),
      catchError((error) => {
        this._loading.set(false);
        return throwError(() => error);
      }),
    );
  }

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, request).pipe(
      tap((booking) => {
        this._currentBooking.set(booking);
        this._activeHold.set(null);
      }),
      catchError((error) => throwError(() => error)),
    );
  }

  confirmBooking(id: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/${id}/confirm`, {}).pipe(
      tap((booking) => this._currentBooking.set(booking)),
      catchError((error) => throwError(() => error)),
    );
  }

  cancelBooking(id: string, reason?: string): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/${id}/cancel`, { reason }).pipe(
      tap((booking) => this._currentBooking.set(booking)),
      catchError((error) => throwError(() => error)),
    );
  }

  createHold(request: CreateHoldRequest): Observable<BookingHold> {
    return this.http.post<BookingHold>(`${this.apiUrl}/hold`, request).pipe(
      tap((hold) => this._activeHold.set(hold)),
      catchError((error) => throwError(() => error)),
    );
  }

  cancelHold(holdId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/hold/${holdId}`).pipe(
      tap(() => this._activeHold.set(null)),
      catchError((error) => throwError(() => error)),
    );
  }

  checkAvailability(
    propertyId: string,
    year: number,
    month: number,
  ): Observable<Record<string, boolean>> {
    const params = new HttpParams().set('year', year.toString()).set('month', month.toString());

    return this.http
      .get<Record<string, boolean>>(`${this.apiUrl}/availability/${propertyId}`, { params })
      .pipe(
        tap((calendar) => this._availabilityCalendar.set(calendar)),
        catchError((error) => throwError(() => error)),
      );
  }
}

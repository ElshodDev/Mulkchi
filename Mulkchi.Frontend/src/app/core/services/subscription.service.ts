import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SubscriptionPlan {
  id: string;
  name: string;
  nameUz: string;
  nameRu: string;
  description: string;
  descriptionUz: string;
  descriptionRu: string;
  monthlyPrice: number;
  maxListings: number;
  monthlyBoosts: number;
  hasAnalytics: boolean;
  hasPrioritySupport: boolean;
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;
  startDate: string;
  endDate: string;
  status: number; // 1: Active, 2: Expired, etc.
  autoRenew: boolean;
  remainingBoosts: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  private _plans = signal<SubscriptionPlan[]>([]);
  private _mySubscription = signal<UserSubscription | null>(null);
  private _loading = signal(false);

  readonly plans = this._plans.asReadonly();
  readonly mySubscription = this._mySubscription.asReadonly();
  readonly loading = this._loading.asReadonly();

  getPlans(): Observable<SubscriptionPlan[]> {
    this._loading.set(true);
    return this.http.get<SubscriptionPlan[]>(`${this.apiUrl}/plans`).pipe(
      tap((plans) => {
        this._plans.set(plans);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  getMySubscription(): Observable<UserSubscription> {
    this._loading.set(true);
    return this.http.get<UserSubscription>(`${this.apiUrl}/my`).pipe(
      tap((sub) => {
        this._mySubscription.set(sub);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  subscribe(planId: string): Observable<UserSubscription> {
    this._loading.set(true);
    return this.http.post<UserSubscription>(this.apiUrl, { planId }).pipe(
      tap((sub) => {
        this._mySubscription.set(sub);
        this._loading.set(false);
      }),
      catchError((err) => {
        this._loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  cancelSubscription(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/cancel`, {});
  }

  getRemainingBoosts(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/remaining-boosts`);
  }
}

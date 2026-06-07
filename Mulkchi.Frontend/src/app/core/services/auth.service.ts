import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  map,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiAuthResponse,
  ApiRegisterRequest,
  AuthResponse,
  Gender,
  HostBadge,
  LoginRequest,
  RegisterRequest,
  User,
  UserRole,
} from '../models';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly usersUrl = `${environment.apiUrl}/users`;

  private readonly _currentUser = signal<User | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _currentMode = signal<UserRole>(UserRole.Guest);
  private readonly _isRestoringSession = signal(false);

  private refreshRequest$: Observable<AuthResponse> | null = null;

  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => !!this._accessToken() && !!this._currentUser());
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly currentMode = computed(() => this._currentMode());
  readonly isRestoringSession = computed(() => this._isRestoringSession());

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiAuthResponse>(`${this.apiUrl}/login`, {
        Email: request.email,
        Password: request.password,
      })
      .pipe(
        map((apiResponse) => this.mapApiAuthResponse(apiResponse)),
        tap((response) => {
          this.handleAuthResponse(response);
          this.sessionService.emitLogin();
        }),
      );
  }

  sendEmailCode(email: string): Observable<{ sessionId: string; devCode?: string }> {
    return this.http.post<{ sessionId: string; devCode?: string }>(
      `${this.apiUrl}/email/send-code`,
      { email },
    );
  }

  verifyEmailCode(email: string, sessionId: string, code: string): Observable<AuthResponse> {
    return this.http
      .post<ApiAuthResponse>(`${this.apiUrl}/email/verify-code`, { email, sessionId, code })
      .pipe(
        map((apiResponse) => this.mapApiAuthResponse(apiResponse)),
        tap((response) => {
          this.handleAuthResponse(response);
          this.sessionService.emitLogin();
        }),
      );
  }

  register(credentials: RegisterRequest): Observable<AuthResponse> {
    const apiRequest: ApiRegisterRequest = {
      FirstName: credentials.firstName,
      LastName: credentials.lastName,
      Email: credentials.email,
      Phone: credentials.phone || '',
      Password: credentials.password,
      PreferredLanguage: 'uz',
    };

    return this.http
      .post<ApiAuthResponse>(`${this.apiUrl}/register`, apiRequest, { observe: 'response' })
      .pipe(
        tap((httpResponse) => {
          if (httpResponse.status === 200 || httpResponse.status === 201) {
            const response = this.mapApiAuthResponse(httpResponse.body!);
            this.handleAuthResponse(response, true);
            this.sessionService.emitLogin();
          }
        }),
        map((httpResponse) => this.mapApiAuthResponse(httpResponse.body!)),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => this.handleError(error));
        }),
      );
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<ApiAuthResponse>(`${this.apiUrl}/google`, { idToken }).pipe(
      map((apiResponse) => this.mapApiAuthResponse(apiResponse)),
      tap((response) => {
        this.handleAuthResponse(response);
        this.sessionService.emitLogin();
      }),
    );
  }

  bootstrapSession(): void {
    if (this.isAuthenticated() || this._isRestoringSession()) {
      return;
    }

    if (!this.hasReadableCookie('XSRF-TOKEN')) {
      return;
    }

    this._isRestoringSession.set(true);

    this.refreshToken()
      .pipe(
        switchMap(() => this.getCurrentUser()),
        take(1),
        finalize(() => this._isRestoringSession.set(false)),
      )
      .subscribe({
        error: () => this.clearAuth(false),
      });
  }

  private hasReadableCookie(cookieName: string): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    return document.cookie.split('; ').some((entry) => entry.startsWith(`${cookieName}=`));
  }

  private getAbsoluteUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const normalized = url.startsWith('/') ? url.substring(1) : url;
    if (!normalized.includes('/')) {
      return `${baseUrl}/avatars/${normalized}`;
    }
    return `${baseUrl}/${normalized}`;
  }

  mapApiAuthResponse(apiResponse: ApiAuthResponse | Record<string, any>): AuthResponse {
    const data = apiResponse as Record<string, any>;
    const get = (key: string) => data[key] ?? data[key.charAt(0).toUpperCase() + key.slice(1)];

    return {
      token: get('accessToken') || get('token'),
      refreshToken: get('refreshToken') || '',
      expiresAt: new Date(get('expiresAt')),
      userId: get('userId'),
      email: get('email'),
      firstName: get('firstName'),
      lastName: get('lastName'),
      avatarUrl: this.getAbsoluteUrl(get('avatarUrl')),
      role: get('role') as UserRole,
      currentMode: (get('currentMode') || get('role')) as UserRole,
    };
  }

  refreshToken(): Observable<AuthResponse> {
    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.refreshRequest$ = this.http
      .post<ApiAuthResponse>(`${this.apiUrl}/refresh-token`, null)
      .pipe(
        map((apiResponse) => this.mapApiAuthResponse(apiResponse)),
        tap((response) => {
          this.handleAuthResponse(response, false);
          this.sessionService.emitLogin();
        }),
        catchError((error) => {
          this.clearAuth(false);
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshRequest$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshRequest$;
  }

  logout(): void {
    this.http
      .post<void>(`${this.apiUrl}/logout`, null)
      .pipe(take(1))
      .subscribe({
        next: () => this.clearAuth(),
        error: () => this.clearAuth(),
      });
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        user.avatarUrl = this.getAbsoluteUrl(user.avatarUrl);
        this._currentUser.set(user);
        this._currentMode.set(user.currentMode ?? user.role ?? UserRole.Guest);
      }),
    );
  }

  updateProfile(user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.usersUrl}/me`, user).pipe(
      tap((updatedUser) => {
        updatedUser.avatarUrl = this.getAbsoluteUrl(updatedUser.avatarUrl);
        this._currentUser.set(updatedUser);
        this._currentMode.set(updatedUser.currentMode ?? updatedUser.role ?? UserRole.Guest);
      }),
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, { email });
  }

  verifyHost(authCode: string): Observable<User> {
    return this.http.post<User>(`${this.usersUrl}/verify-host`, { AuthCode: authCode }).pipe(
      tap((updatedUser) => {
        updatedUser.avatarUrl = this.getAbsoluteUrl(updatedUser.avatarUrl);
        this._currentUser.set(updatedUser);
        this._currentMode.set(updatedUser.currentMode ?? updatedUser.role ?? UserRole.Guest);
      })
    );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  handleAuthResponse(response: AuthResponse, fetchProfile = true): void {
    this._accessToken.set(response.token);
    this._currentMode.set(response.currentMode ?? response.role ?? UserRole.Guest);
    this._currentUser.set({
      id: response.userId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      avatarUrl: response.avatarUrl,
      role: response.role,
      currentMode: response.currentMode ?? response.role,
      gender: Gender.Other,
      isVerified: false,
      emailConfirmed: false,
      badge: HostBadge.New,
      rating: 0,
      responseRate: 0,
      responseTimeMinutes: 0,
      totalListings: 0,
      totalBookings: 0,
      preferredLanguage: 'uz',
      createdDate: new Date(),
      updatedDate: new Date(),
    } as User);

    if (fetchProfile) {
      this.getCurrentUser()
        .pipe(take(1))
        .subscribe({
          error: (err) => {
            console.warn('Failed to fetch current user profile:', err);
          },
        });
    }
  }

  clearAuth(redirectToLogin = true): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    this._currentMode.set(UserRole.Guest);
    this.sessionService.emitLogout();

    if (redirectToLogin) {
      void this.router.navigate(['/auth/login']);
    }
  }

  switchMode(request: { TargetMode: UserRole }): Observable<AuthResponse> {
    return this.http
      .post<Record<string, any>>(`${this.apiUrl}/switch-role`, { TargetMode: request.TargetMode })
      .pipe(
        map((apiResponse) => this.mapApiAuthResponse(apiResponse)),
        tap((response) => this.handleAuthResponse(response, false)),
      );
  }

  isInHostMode(): boolean {
    const mode = this.currentMode();
    return mode === UserRole.Host || mode === UserRole.Admin || mode === UserRole.SuperAdmin;
  }

  isInGuestMode(): boolean {
    return this.currentMode() === UserRole.Guest;
  }

  getAccessToken(): string | null {
    return this._accessToken();
  }

  isHost(): boolean {
    const role = this._currentUser()?.role;
    return role === UserRole.Host || role === UserRole.Admin || role === UserRole.SuperAdmin;
  }

  isAdmin(): boolean {
    const role = this._currentUser()?.role;
    return role === UserRole.Admin || role === UserRole.SuperAdmin;
  }

  uploadAvatar(file: File): Observable<User> {
    const userId = this._currentUser()?.id;
    if (!userId) return throwError(() => new Error('Foydalanuvchi aniqlanmadi'));

    const formData = new FormData();
    formData.append('avatarFile', file);

    return this.http.put<User>(`${this.usersUrl}/me/avatar`, formData).pipe(
      tap((updatedUser) => {
        const currentUser = this._currentUser();
        if (currentUser) {
          this._currentUser.set({
            ...currentUser,
            avatarUrl: this.getAbsoluteUrl(updatedUser.avatarUrl),
          });
        }
      }),
    );
  }

  private handleError(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return 'Tarmoq xatosi: ' + error.error.message;
    }
    const status = error.status;
    if (status === 400) return "Noto'g'ri ma'lumot kiritildi";
    if (status === 401) return "Email yoki parol noto'g'ri";
    if (status === 409) return "Bu email allaqachon ro'yxatdan o'tgan";
    if (status === 500) return "Server xatosi. Iltimos keyinroq urinib ko'ring";
    return `Xatolik: ${status} - ${error.message}`;
  }
}

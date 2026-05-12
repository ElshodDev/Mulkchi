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

  mapApiAuthResponse(apiResponse: ApiAuthResponse | Record<string, unknown>): AuthResponse {
    const getValue = (camelKey: string, pascalKey: string): unknown =>
      (apiResponse as Record<string, unknown>)[camelKey] ??
      (apiResponse as Record<string, unknown>)[pascalKey];

    const token = (getValue('accessToken', 'AccessToken') || getValue('token', 'Token')) as string;

    return {
      token,
      refreshToken: (getValue('refreshToken', 'RefreshToken') as string | undefined) ?? '',
      expiresAt: new Date(getValue('expiresAt', 'ExpiresAt') as string),
      userId: getValue('userId', 'UserId') as string,
      email: getValue('email', 'Email') as string,
      firstName: getValue('firstName', 'FirstName') as string,
      lastName: getValue('lastName', 'LastName') as string,
      avatarUrl: getValue('avatarUrl', 'AvatarUrl') as string | undefined,
      role: getValue('role', 'Role') as UserRole,
      currentMode: getValue('currentMode', 'CurrentMode') as UserRole | undefined,
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
        this._currentUser.set(user);
        this._currentMode.set(user.currentMode ?? user.role ?? UserRole.Guest);
      }),
    );
  }

  updateProfile(user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.usersUrl}/me`, user).pipe(
      tap((updatedUser) => {
        this._currentUser.set(updatedUser);
        this._currentMode.set(updatedUser.currentMode ?? updatedUser.role ?? UserRole.Guest);
      }),
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, { email });
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
    });

    if (!fetchProfile) {
      return;
    }

    this.getCurrentUser()
      .pipe(take(1))
      .subscribe({
        error: () => undefined,
      });
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
    const body = {
      TargetMode: request.TargetMode,
    };

    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/switch-role`, body).pipe(
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

    if (!userId) {
      return throwError(() => new Error('Foydalanuvchi aniqlanmadi'));
    }

    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.put<User>(`${this.usersUrl}/${userId}/avatar`, formData).pipe(
      tap((updatedUser) => {
        const currentUser = this._currentUser();
        if (!currentUser) {
          return;
        }

        this._currentUser.set({
          ...currentUser,
          avatarUrl: updatedUser.avatarUrl,
        });
      }),
    );
  }

  private handleError(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return 'Tarmoq xatosi: ' + error.error.message;
    } else {
      if (error.status === 400) {
        return "Noto'g'ri ma'lumot kiritildi";
      } else if (error.status === 401) {
        return "Email yoki parol noto'g'ri";
      } else if (error.status === 409) {
        return "Bu email allaqachon ro'yxatdan o'tgan";
      } else if (error.status === 500) {
        return "Server xatosi. Iltimos keyinroq urinib ko'ring";
      }
      return `Xatolik: ${error.status} - ${error.message}`;
    }
  }
}

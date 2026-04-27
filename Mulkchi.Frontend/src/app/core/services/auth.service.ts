import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, LoginRequest, RegisterRequest, SwitchModeRequest, UserRole, Gender, HostBadge, ApiRegisterRequest, ApiAuthResponse } from '../models';
import { LoggerService } from './logger.service';
import { ChatService } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly usersUrl = `${environment.apiUrl}/users`;
  
  // Signals for state management
  private readonly _currentUser = signal<User | null>(null);
  private readonly _accessToken = signal<string | null>(null);
  private readonly _isAuthenticated = computed(() => !!this._accessToken() && !!this._currentUser());
  
  // Public readonly signals
  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => this._isAuthenticated());
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  
  // Single Identity: Current Mode Management
  private readonly _currentMode = new BehaviorSubject<UserRole>(UserRole.Guest);
  readonly currentMode$ = this._currentMode.asObservable();
  readonly currentMode = computed(() => this._currentUser()?.currentMode ?? this._currentUser()?.role ?? UserRole.Guest);
  
  private chatService = inject(ChatService);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }
  
  private loadStoredAuth(): void {
    const token = localStorage.getItem('access_token');
    const userJson = localStorage.getItem('user');
    
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this._accessToken.set(token);
        this._currentUser.set(user);
        // Initialize current mode from stored user
        const mode = user.currentMode ?? user.role ?? UserRole.Guest;
        this._currentMode.next(mode);
      } catch {
        this.clearAuth();
      }
    }
  }
  
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiAuthResponse>(`${this.apiUrl}/login`, {
      Email: request.email,
      Password: request.password
    }).pipe(
      map(apiResponse => this.mapApiAuthResponse(apiResponse)),
      tap(response => {
        this.handleAuthResponse(response);
        // SignalR ga qayta ulash
        this.chatService.reconnect();
      }),
      catchError(error => throwError(() => error))
    );
  }
  
  register(request: RegisterRequest): Observable<AuthResponse> {
    // Convert camelCase to PascalCase for C# backend compatibility
    const apiRequest: ApiRegisterRequest = {
      FirstName: request.firstName,
      LastName: request.lastName,
      Email: request.email,
      Phone: request.phone || '', // Phone is required on backend
      Password: request.password,
      PreferredLanguage: 'uz'
    };
    
    return this.http.post<ApiAuthResponse>(`${this.apiUrl}/register`, apiRequest).pipe(
      map(apiResponse => this.mapApiAuthResponse(apiResponse)),
      tap(response => {
        this.handleAuthResponse(response);
        // SignalR ga qayta ulash
        this.chatService.reconnect();
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Google Login
  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<ApiAuthResponse>(`${this.apiUrl}/google`, {
      idToken: idToken
    }).pipe(
      map(apiResponse => this.mapApiAuthResponse(apiResponse)),
      tap(response => {
        if (!response.token) {
          throw new Error('Token missing in authentication response');
        }
        this.handleAuthResponse(response);
        // SignalR ga qayta ulash
        this.chatService.reconnect();
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Map API response (ApiAuthResponse) to internal AuthResponse format.
   * Public so other services can convert backend responses.
   */
  mapApiAuthResponse(apiResponse: ApiAuthResponse | Record<string, unknown>): AuthResponse {
    // Support both PascalCase (C#) and camelCase (TypeScript) responses
    const getValue = (camelKey: string, pascalKey: string): unknown => {
      return (apiResponse as Record<string, unknown>)[camelKey] ?? 
             (apiResponse as Record<string, unknown>)[pascalKey];
    };

    const token = (getValue('accessToken', 'AccessToken') || getValue('token', 'Token')) as string;
    const refreshToken = getValue('refreshToken', 'RefreshToken') as string;
    const expiresAt = getValue('expiresAt', 'ExpiresAt') as string;
    const userId = getValue('userId', 'UserId') as string;
    const email = getValue('email', 'Email') as string;
    const firstName = getValue('firstName', 'FirstName') as string;
    const lastName = getValue('lastName', 'LastName') as string;
    const avatarUrl = getValue('avatarUrl', 'AvatarUrl') as string | undefined;
    const role = getValue('role', 'Role') as string;
    
    return {
      token: token,
      refreshToken: refreshToken,
      expiresAt: new Date(expiresAt),
      userId: userId,
      email: email,
      firstName: firstName,
      lastName: lastName,
      avatarUrl: avatarUrl,
      role: role as UserRole
    };
  }
  
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    
    return this.http.post<ApiAuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      map(apiResponse => this.mapApiAuthResponse(apiResponse)),
      tap(response => {
        this.handleAuthResponse(response);
        // SignalR ga qayta ulash
        this.chatService.reconnect();
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }
  
  logout(): void {
    const refreshToken = localStorage.getItem('refresh_token');
    const body = refreshToken ? { refreshToken } : {};
    
    this.http.post(`${this.apiUrl}/logout`, body).subscribe({
      next: () => this.clearAuth(),
      error: () => this.clearAuth() // Clear locally even if server fails
    });
  }
  
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => this._currentUser.set(user)),
      catchError(error => throwError(() => error))
    );
  }
  
  updateProfile(user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.usersUrl}/me`, user).pipe(
      tap(updatedUser => {
        this._currentUser.set(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }),
      catchError(error => throwError(() => error))
    );
  }
  
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, { token, newPassword }).pipe(
      catchError(error => throwError(() => error))
    );
  }
  
  /** 
   * Handle authentication response - updates signals, localStorage, and fetches user details.
   * Public so other services (like PropertyService) can update tokens after role upgrade.
   */
  handleAuthResponse(response: AuthResponse): void {
    this._accessToken.set(response.token);
    const mode = response.currentMode ?? response.role ?? UserRole.Guest;
    this._currentMode.next(mode);
    this._currentUser.set({
      id: response.userId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      avatarUrl: response.avatarUrl,
      role: response.role,
      currentMode: response.currentMode ?? response.role, // Set current mode from response
      gender: Gender.Other, // Will be populated by getCurrentUser()
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
      updatedDate: new Date()
    });
    
    localStorage.setItem('access_token', response.token);
    localStorage.setItem('refresh_token', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(this._currentUser()));
    
    // Fetch full user details after signal update is processed
    Promise.resolve().then(() => {
      if (this._accessToken()) {
        this.getCurrentUser().subscribe({
          error: () => {
            // Silently ignore errors from getCurrentUser
            // User data from login response is sufficient
          }
        });
      }
    });
  }
  
  clearAuth(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    this._currentMode.next(UserRole.Guest);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.router.navigate(['/auth/login']);
  }

  // Single Identity: Switch between Guest and Host modes
  switchMode(request: { TargetMode: UserRole }): Observable<AuthResponse> {
    // Get refresh token from localStorage
    const refreshToken = localStorage.getItem('refresh_token') || '';
    // Explicitly construct request body to match backend SwitchRoleRequest DTO
    const body = {
      TargetMode: request.TargetMode,
      RefreshToken: refreshToken
    };
    return this.http.post<AuthResponse>(`${this.apiUrl}/switch-role`, body).pipe(
      map(apiResponse => this.mapApiAuthResponse(apiResponse as unknown as Record<string, unknown>)),
      tap(response => {
        // Update current mode
        this._currentMode.next(response.currentMode ?? response.role);
        // Update stored user with new mode
        const currentUser = this._currentUser();
        if (currentUser) {
          currentUser.currentMode = response.currentMode ?? response.role;
          localStorage.setItem('user', JSON.stringify(currentUser));
          this._currentUser.set({ ...currentUser });
        }
        this._accessToken.set(response.token);
        localStorage.setItem('access_token', response.token);
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Check if user is in Host mode (Single Identity)
  isInHostMode(): boolean {
    const mode = this.currentMode();
    return mode === UserRole.Host || mode === UserRole.Admin || mode === UserRole.SuperAdmin;
  }

  // Check if user is in Guest mode
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
}

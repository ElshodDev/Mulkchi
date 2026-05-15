import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { environment } from '../../../environments/environment';
import { UserRole } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let sessionServiceSpy: jasmine.SpyObj<SessionService>;

  const apiUrl = `${environment.apiUrl}/auth`;

  const mockApiResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    firstName: 'Ali',
    lastName: 'Valiyev',
    role: UserRole.Guest,
    currentMode: UserRole.Guest,
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { url: '/home' });
    sessionServiceSpy = jasmine.createSpyObj('SessionService', ['emitLogin', 'emitLogout'], {
      authChanges$: { pipe: () => ({ subscribe: () => ({}) }) },
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: SessionService, useValue: sessionServiceSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── isAuthenticated ───────────────────────────────────────────────────────

  it('should initially be unauthenticated', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  // ─── login ────────────────────────────────────────────────────────────────

  it('login() — should authenticate user on success', () => {
    service
      .login({ email: 'test@example.com', password: 'P@ssw0rd!' })
      .subscribe((response) => {
        expect(response.token).toBe('mock-access-token');
        expect(response.email).toBe('test@example.com');
        expect(service.isAuthenticated()).toBeTrue();
      });

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockApiResponse);

    // /auth/me is fetched after login for full profile
    const meReq = httpMock.expectOne(`${apiUrl}/me`);
    meReq.flush({ ...mockApiResponse, isVerified: true });

    expect(sessionServiceSpy.emitLogin).toHaveBeenCalled();
  });

  // ─── getAccessToken ───────────────────────────────────────────────────────

  it('getAccessToken() — should return null when not authenticated', () => {
    expect(service.getAccessToken()).toBeNull();
  });

  it('getAccessToken() — should return token after successful login', () => {
    service.login({ email: 'test@example.com', password: 'P@ssw0rd!' }).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/login`);
    req.flush(mockApiResponse);

    const meReq = httpMock.expectOne(`${apiUrl}/me`);
    meReq.flush({ ...mockApiResponse, isVerified: true });

    expect(service.getAccessToken()).toBe('mock-access-token');
  });

  // ─── clearAuth ────────────────────────────────────────────────────────────

  it('clearAuth() — should clear user and token', () => {
    // Prime the service with a fake token/user
    service.handleAuthResponse(
      {
        token: 'tok',
        refreshToken: 'ref',
        expiresAt: new Date(),
        userId: 'uid',
        email: 'e@e.com',
        firstName: 'A',
        lastName: 'B',
        role: UserRole.Guest,
      },
      false,
    );

    expect(service.isAuthenticated()).toBeTrue();

    service.clearAuth(false);

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getAccessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(sessionServiceSpy.emitLogout).toHaveBeenCalled();
  });

  // ─── isHost / isAdmin ─────────────────────────────────────────────────────

  it('isHost() — should return false for Guest role', () => {
    service.handleAuthResponse(
      {
        token: 'tok',
        refreshToken: 'ref',
        expiresAt: new Date(),
        userId: 'uid',
        email: 'e@e.com',
        firstName: 'A',
        lastName: 'B',
        role: UserRole.Guest,
      },
      false,
    );

    expect(service.isHost()).toBeFalse();
    expect(service.isAdmin()).toBeFalse();
  });

  it('isHost() — should return true for Host role', () => {
    service.handleAuthResponse(
      {
        token: 'tok',
        refreshToken: 'ref',
        expiresAt: new Date(),
        userId: 'uid',
        email: 'e@e.com',
        firstName: 'A',
        lastName: 'B',
        role: UserRole.Host,
      },
      false,
    );

    expect(service.isHost()).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
  });

  // ─── mapApiAuthResponse ───────────────────────────────────────────────────

  it('mapApiAuthResponse() — should handle both camelCase and PascalCase fields', () => {
    const camelCase = {
      accessToken: 'tok',
      refreshToken: 'ref',
      expiresAt: new Date().toISOString(),
      userId: 'uid',
      email: 'e@e.com',
      firstName: 'F',
      lastName: 'L',
      role: UserRole.Guest,
    };

    const pascalCase = {
      AccessToken: 'tok2',
      RefreshToken: 'ref2',
      ExpiresAt: new Date().toISOString(),
      UserId: 'uid2',
      Email: 'e2@e.com',
      FirstName: 'F2',
      LastName: 'L2',
      Role: UserRole.Host,
    };

    const camelResult = service.mapApiAuthResponse(camelCase);
    expect(camelResult.token).toBe('tok');
    expect(camelResult.email).toBe('e@e.com');

    const pascalResult = service.mapApiAuthResponse(pascalCase);
    expect(pascalResult.token).toBe('tok2');
    expect(pascalResult.email).toBe('e2@e.com');
  });

  // ─── forgotPassword ───────────────────────────────────────────────────────

  it('forgotPassword() — should POST to forgot-password endpoint', () => {
    service.forgotPassword('test@example.com').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush(null);
  });
});

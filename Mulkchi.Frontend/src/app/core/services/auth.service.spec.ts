import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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
  let routerSpy: any;
  let sessionServiceSpy: any;

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
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    (routerSpy as any).url = '/home';
    sessionServiceSpy = jasmine.createSpyObj('SessionService', ['emitLogin', 'emitLogout']);
    (sessionServiceSpy as any).authChanges$ = { pipe: () => ({ subscribe: () => ({}) }) };

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


  it('should initially be unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });


  it('login() — should authenticate user on success', () => {
    service.login({ email: 'test@example.com', password: 'P@ssw0rd!' }).subscribe((response) => {
      expect(response.token).toBe('mock-access-token');
      expect(response.email).toBe('test@example.com');
      expect(service.isAuthenticated()).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockApiResponse);

    const meReq = httpMock.expectOne(`${apiUrl}/me`);
    meReq.flush({ ...mockApiResponse, isVerified: true });

    expect(sessionServiceSpy.emitLogin).toHaveBeenCalled();
  });


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


  it('clearAuth() — should clear user and token', () => {
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

    expect(service.isAuthenticated()).toBe(true);

    service.clearAuth(false);

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getAccessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(sessionServiceSpy.emitLogout).toHaveBeenCalled();
  });


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

    expect(service.isHost()).toBe(false);
    expect(service.isAdmin()).toBe(false);
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

    expect(service.isHost()).toBe(true);
    expect(service.isHost()).toBe(true);
    expect(service.isAdmin()).toBe(false);
  });


  it('mapApiAuthResponse() — should handle both camelCase and PascalCase fields', () => {
    const mockPagedResult = {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
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


  it('forgotPassword() — should POST to forgot-password endpoint', () => {
    service.forgotPassword('test@example.com').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush(null);
  });
});

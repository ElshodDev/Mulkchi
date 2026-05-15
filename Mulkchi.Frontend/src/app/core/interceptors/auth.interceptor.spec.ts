import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  HttpClient,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── Token qo'shish ───────────────────────────────────────────────────────

  it('should attach Authorization header for API requests when token exists', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.get(`${apiUrl}/properties`).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/properties`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
    req.flush([]);
  });

  it('should NOT attach Authorization header when no token', () => {
    authServiceSpy.getAccessToken.and.returnValue(null);

    httpClient.get(`${apiUrl}/properties`).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/properties`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  // ─── Auth-free paths ─────────────────────────────────────────────────────

  it('should NOT attach token for /auth/login path', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.post(`${apiUrl}/auth/login`, {}).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should NOT attach token for /auth/register path', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.post(`${apiUrl}/auth/register`, {}).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/auth/register`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should NOT attach token for /auth/refresh-token path', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.post(`${apiUrl}/auth/refresh-token`, null).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/auth/refresh-token`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  // ─── Tashqi URL ───────────────────────────────────────────────────────────

  it('should NOT attach token for external URLs', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.get('https://external-api.com/data').subscribe();

    const req = httpMock.expectOne('https://external-api.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  // ─── withCredentials ─────────────────────────────────────────────────────

  it('should always set withCredentials for API requests', () => {
    authServiceSpy.getAccessToken.and.returnValue(null);

    httpClient.get(`${apiUrl}/properties`).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/properties`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
  });
});

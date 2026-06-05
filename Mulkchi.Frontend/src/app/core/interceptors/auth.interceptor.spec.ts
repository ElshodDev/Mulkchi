import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authServiceSpy: any;

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
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });


  it('should NOT attach token for /auth/login path', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.post(`${apiUrl}/auth/login`, {}).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should NOT attach token for /auth/register path', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.post(`${apiUrl}/auth/register`, {}).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/auth/register`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should NOT attach token for /auth/refresh-token path', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.post(`${apiUrl}/auth/refresh-token`, null).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/auth/refresh-token`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });


  it('should NOT attach token for external URLs', () => {
    authServiceSpy.getAccessToken.and.returnValue('valid-token');

    httpClient.get('https://external-api.com/data').subscribe();

    const req = httpMock.expectOne('https://external-api.com/data');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });


  it('should always set withCredentials for API requests', () => {
    authServiceSpy.getAccessToken.and.returnValue(null);

    httpClient.get(`${apiUrl}/properties`).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/properties`);
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });
});

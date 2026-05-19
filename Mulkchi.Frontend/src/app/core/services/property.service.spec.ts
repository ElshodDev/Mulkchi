import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { PropertyService } from './property.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { Property, PagedResult } from '../models';

describe('PropertyService', () => {
  let service: PropertyService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/properties`;

  const mockProperty: Property = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: '3-xonali kvartira Yunusobodda',
    description: 'Zamonaviy ta\'mir',
    city: 'Toshkent',
    district: 'Yunusobod',
    listingType: 'Rent' as any,
    monthlyRent: 1500000,
    currency: 'UZS',
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    area: 75,
    isFeatured: true,
    isInstantBook: false,
    images: [],
  } as unknown as Property;

  const mockPagedResult: PagedResult<Property> = {
    items: [mockProperty],
    totalCount: 1,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'mapApiAuthResponse',
      'handleAuthResponse',
      'getAccessToken',
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        PropertyService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(PropertyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ─── initial state ────────────────────────────────────────────────────────

  it('should initialize with empty state', () => {
    expect(service.properties()).toEqual([]);
    expect(service.featuredProperties()).toEqual([]);
    expect(service.currentProperty()).toBeNull();
    expect(service.totalCount()).toBe(0);
    expect(service.loading()).toBe(false);
  });

  // ─── getAllProperties ─────────────────────────────────────────────────────

  it('getAllProperties() — should fetch paged properties and update signals', () => {
    service.getAllProperties(1, 20).subscribe((result) => {
      expect(result.items.length).toBe(1);
      expect(result.totalCount).toBe(1);
      expect(service.properties().length).toBe(1);
      expect(service.properties()[0].title).toBe('3-xonali kvartira Yunusobodda');
      expect(service.totalCount()).toBe(1);
      expect(service.loading()).toBe(false);
    });

    const req = httpMock.expectOne(`${apiUrl}/search?page=1&pageSize=20`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);
  });

  it('getAllProperties() — should set loading to false on error', () => {
    service.getAllProperties().subscribe({
      error: () => {
        expect(service.loading()).toBe(false);
      },
    });

    const req = httpMock.expectOne(`${apiUrl}/search?page=1&pageSize=20`);
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
  });

  // ─── getPropertyById ─────────────────────────────────────────────────────

  it('getPropertyById() — should fetch single property and update signal', () => {
    const id = mockProperty.id;

    service.getPropertyById(id).subscribe((property) => {
      expect(property.id).toBe(id);
      expect(property.title).toBe(mockProperty.title);
      expect(service.currentProperty()?.id).toBe(id);
    });

    const req = httpMock.expectOne(`${apiUrl}/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProperty);
  });

  // ─── getFeaturedProperties ────────────────────────────────────────────────

  it('getFeaturedProperties() — should return array and update signal', () => {
    service.getFeaturedProperties(3).subscribe((properties) => {
      expect(properties.length).toBe(1);
      expect(service.featuredProperties().length).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/featured?count=3`);
    req.flush([mockProperty]);
  });

  // ─── searchProperties ────────────────────────────────────────────────────

  it('searchProperties() — should include location params in request', () => {
    service
      .searchProperties({ location: 'Toshkent', listingType: 'Rent' as any })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url === `${apiUrl}/search`);
    expect(req.request.params.get('location')).toBe('Toshkent');
    req.flush(mockPagedResult);
  });

  // ─── deleteProperty ──────────────────────────────────────────────────────

  it('deleteProperty() — should send DELETE request', () => {
    const id = mockProperty.id;
    service.deleteProperty(id).subscribe();

    const req = httpMock.expectOne(`${apiUrl}/${id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});

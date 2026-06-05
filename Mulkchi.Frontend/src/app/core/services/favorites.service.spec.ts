import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FavoritesService } from './favorites.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let httpMock: HttpTestingController;
  let authServiceSpy: any;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: jasmine.createSpy('isAuthenticated')
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FavoritesService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    authServiceSpy.isAuthenticated.and.returnValue(true);

    service = TestBed.inject(FavoritesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty if not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    
    service.loadFavorites().subscribe(items => {
      expect(items.length).toBe(0);
    });
    
    // No HTTP request should be made
    httpMock.expectNone(`${environment.apiUrl}/favorites`);
  });

  it('should load favorites successfully', () => {
    const mockFavoritesResponse = {
      items: [
        { id: 'fav1', propertyId: 'prop1', userId: 'user1', createdDate: new Date(), updatedDate: new Date() }
      ]
    };
    
    const mockProperty = { id: 'prop1', title: 'Test Prop' };

    service.loadFavorites().subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].property.title).toBe('Test Prop');
    });

    const favReq = httpMock.expectOne(`${environment.apiUrl}/favorites`);
    expect(favReq.request.method).toBe('GET');
    favReq.flush(mockFavoritesResponse);

    const propReq = httpMock.expectOne(`${environment.apiUrl}/properties/prop1`);
    expect(propReq.request.method).toBe('GET');
    propReq.flush(mockProperty);

    expect(service.isFavorite('prop1')).toBe(true);
  });

  it('should add a favorite', () => {
    const mockFavorite = { id: 'fav1', propertyId: 'prop1', userId: 'user1', createdDate: new Date(), updatedDate: new Date() };

    service.addFavorite('prop1').subscribe(fav => {
      expect(fav.id).toBe('fav1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/favorites`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.PropertyId).toBe('prop1');
    req.flush(mockFavorite);

    // After adding, it reloads favorites
    const loadReq = httpMock.expectOne(`${environment.apiUrl}/favorites`);
    expect(loadReq.request.method).toBe('GET');
    loadReq.flush({ items: [] });
  });

  it('should clear favorites state', () => {
    service.clear();
    expect(service.favoriteItems().length).toBe(0);
  });
});

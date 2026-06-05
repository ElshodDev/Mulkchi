import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AIService, AIPriceRequest, SmartSearchRequest } from './ai.service';
import { environment } from '../../../environments/environment';

describe('AIService', () => {
  let service: AIService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AIService]
    });
    service = TestBed.inject(AIService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should predict price successfully', () => {
    const mockRequest: AIPriceRequest = {
      region: 'Tashkent',
      propertyType: 'Apartment',
      listingType: 'Sale',
      area: 75,
      rooms: 3,
      floor: 2
    };

    const mockResponse = {
      recommendedPrice: 75000,
      minPrice: 70000,
      maxPrice: 80000,
      currency: 'USD',
      marketAverage: 73000,
      comparisonPercentage: 2,
      comparisonMessage: 'Above average',
      confidence: 0.85
    };

    service.predictPrice(mockRequest).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/airecommendations/predict-price`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.priceResult()).toEqual(mockResponse);
    expect(service.loading()).toBe(false);
  });

  it('should handle predict price error', () => {
    const mockRequest: AIPriceRequest = {
      region: 'Tashkent',
      propertyType: 'Apartment',
      listingType: 'Sale',
      area: 75,
      rooms: 3,
      floor: 2
    };

    service.predictPrice(mockRequest).subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(404);
      }
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/airecommendations/predict-price`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(service.error()).toBe('AI xizmati hozircha mavjud emas, tez orada ishga tushiriladi');
    expect(service.loading()).toBe(false);
  });

  it('should get recommendations', () => {
    const mockResponses = [
      {
        id: 'rec1',
        propertyId: 'prop1',
        recommendationType: 'Test',
        abVariant: 'A',
        score: 0.9,
        reason: 'Test reason',
        property: {
          id: 'prop1',
          title: 'Test Prop',
          price: 100,
          city: 'Tashkent',
          region: 'Chilonzor',
          propertyType: 'Apartment',
          listingType: 'Rent',
          area: 50,
          roomsCount: 2,
          bathroomsCount: 1,
          isFeatured: true,
          isVerified: true
        },
        createdAt: '2023-01-01',
        isViewed: false,
        isClicked: false
      }
    ];

    service.getRecommendations(5).subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('prop1');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/airecommendations/hybrid`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ limit: 5 });
    req.flush(mockResponses);

    expect(service.recommendations().length).toBe(1);
    expect(service.hasRecommendations()).toBe(true);
  });
});

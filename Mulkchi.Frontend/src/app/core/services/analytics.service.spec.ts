import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../../environments/environment';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AnalyticsService]
    });
    service = TestBed.inject(AnalyticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get market overview', () => {
    const mockOverview = {
      totalListings: 100,
      totalForSale: 60,
      totalForRent: 40,
      averageSalePrice: 50000,
      averageRentPrice: 500
    };

    service.getMarketOverview().subscribe((res) => {
      expect(res).toEqual(mockOverview);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/Analytics/market-overview`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOverview);

    expect(service.loading()).toBe(false);
  });

  it('should analyze property', () => {
    const mockAnalysis = {
      propertyId: 'prop1',
      currentPrice: 1000,
      estimatedMarketPrice: 1100,
      priceDifference: 100,
      priceDifferencePercent: 10,
      status: 'Fair' as any,
      valueScore: 80,
      confidence: 90,
      comparableCount: 5,
      reasoning: [],
      recommendation: 'Good',
      pricePerSqm: 10,
      marketPricePerSqm: 11
    };

    service.analyzeProperty('prop1').subscribe((res) => {
      expect(res).toEqual(mockAnalysis);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/Analytics/property-analysis/prop1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAnalysis);

    expect(service.loading()).toBe(false);
  });

  it('should get high ROI properties', () => {
    const mockResults = {
      properties: [],
      totalCount: 0,
      filterType: 'high-roi' as const,
      averageScore: 90
    };

    service.getHighRoiProperties(5).subscribe((res) => {
      expect(res).toEqual(mockResults);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/Analytics/smart-filters/high-roi?limit=5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResults);
  });
});

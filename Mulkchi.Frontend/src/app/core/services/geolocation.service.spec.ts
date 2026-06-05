import { TestBed } from '@angular/core/testing';
import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeolocationService]
    });
    service = TestBed.inject(GeolocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should clear location', () => {
    service.setLocation({ latitude: 10, longitude: 20 });
    expect(service.getLocation()).not.toBeNull();
    
    service.clearLocation();
    expect(service.getLocation()).toBeNull();
  });

  it('should set location directly', () => {
    const coords = { latitude: 41.2995, longitude: 69.2401 }; // Tashkent
    service.setLocation(coords);
    expect(service.getLocation()).toEqual(coords);
  });

  it('should return default Uzbekistan bounds', () => {
    const bounds = service.getUzbekistanBounds();
    expect(bounds.center.latitude).toBe(41.38);
    expect(bounds.center.longitude).toBe(64.58);
  });

  it('should handle missing geolocation object gracefully', (done) => {
    // Save original navigator.geolocation
    const originalGeolocation = navigator.geolocation;
    
    // Mock missing geolocation
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: undefined,
      configurable: true
    });

    service.getCurrentLocation().subscribe({
      next: () => fail('Should not emit next'),
      error: (err) => {
        expect(err).toBe("Geolokatsiya brauzeringizda qo'llab-quvvatlanmaydi");
        
        // Restore
        Object.defineProperty(globalThis.navigator, 'geolocation', {
          value: originalGeolocation,
          configurable: true
        });
        
        done();
      }
    });
  });
});

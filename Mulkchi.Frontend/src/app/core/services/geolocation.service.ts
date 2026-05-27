import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  private currentLocation = signal<GeolocationCoordinates | null>(null);
  private locationError = signal<string | null>(null);
  private isLoadingLocation = signal(false);

  currentLocation$ = new BehaviorSubject<GeolocationCoordinates | null>(null);
  locationError$ = new BehaviorSubject<string | null>(null);
  isLoadingLocation$ = new BehaviorSubject(false);

  constructor() {}

  getCurrentLocation(): Observable<GeolocationCoordinates> {
    return new Observable((observer) => {
      this.isLoadingLocation.set(true);
      this.isLoadingLocation$.next(true);
      this.locationError.set(null);
      this.locationError$.next(null);

      if (!navigator.geolocation) {
        const error = "Geolokatsiya brauzeringizda qo'llab-quvvatlanmaydi";
        this.locationError.set(error);
        this.locationError$.next(error);
        this.isLoadingLocation.set(false);
        this.isLoadingLocation$.next(false);
        observer.error(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          this.currentLocation.set(coords);
          this.currentLocation$.next(coords);
          this.isLoadingLocation.set(false);
          this.isLoadingLocation$.next(false);

          observer.next(coords);
          observer.complete();
        },
        (error) => {
          let errorMessage = 'Joylashuvni aniqlash imkonsiz';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                'Siz geolokatsiyaga ruxsat bermadingiz. Brauzer sozlamalarida ruxsat bering.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Joylashuvni aniqlash imkonsiz';
              break;
            case error.TIMEOUT:
              errorMessage = "Joylashuvni aniqlashda vaqt tugadi. Iltimos, qayta urinib ko'ring.";
              break;
          }

          this.locationError.set(errorMessage);
          this.locationError$.next(errorMessage);
          this.isLoadingLocation.set(false);
          this.isLoadingLocation$.next(false);

          observer.error(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      );
    });
  }

  getLocation(): GeolocationCoordinates | null {
    return this.currentLocation();
  }

  getLocationSignal() {
    return this.currentLocation;
  }

  getErrorSignal() {
    return this.locationError;
  }

  getLoadingSignal() {
    return this.isLoadingLocation;
  }

  clearLocation(): void {
    this.currentLocation.set(null);
    this.currentLocation$.next(null);
    this.locationError.set(null);
    this.locationError$.next(null);
  }

  setLocation(coords: GeolocationCoordinates): void {
    this.currentLocation.set(coords);
    this.currentLocation$.next(coords);
  }

  async getReverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<{ city: string; district: string }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'Accept-Language': 'uz',
          },
        },
      );

      const data = await response.json();

      const address = data.address || {};
      const city = address.city || address.town || address.county || '';
      const district = address.suburb || address.district || '';

      return { city, district };
    } catch {
      console.warn('Reverse geocoding failed');
      return { city: '', district: '' };
    }
  }

  getUzbekistanBounds() {
    return {
      north: 45.594,
      south: 37.184,
      east: 73.606,
      west: 55.45,
      center: { latitude: 41.38, longitude: 64.58 },
    };
  }
}

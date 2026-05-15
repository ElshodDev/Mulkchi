import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as L from 'leaflet';
import { icon } from 'leaflet';
import {
  GeolocationCoordinates,
  GeolocationService,
} from '../../core/services/geolocation.service';

@Component({
  selector: 'app-location-picker-map',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDividerModule,
  ],
  template: `
    <div class="location-picker">
      <div class="picker-header">
        <h2 class="picker-title">Joylashuvni tanlang</h2>
        <button mat-icon-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="picker-content">
        @if (isLoadingLocation()) {
          <div class="loading-overlay">
            <mat-spinner [diameter]="40"></mat-spinner>
            <p>Joylashuvni aniqlayapman...</p>
          </div>
        }

        <div #mapContainer class="map-container"></div>

        @if (selectedLocation()) {
          <div class="location-info">
            <div class="info-header">
              <mat-icon class="success-icon">location_on</mat-icon>
              <span class="info-title">Tanlangan joylashuv</span>
            </div>
            <p class="coordinates">
              {{ selectedLocation()?.latitude | number: '1.4-4' }},
              {{ selectedLocation()?.longitude | number: '1.4-4' }}
            </p>
            @if (locationName()) {
              <p class="location-name">
                {{ locationName()?.city }}
                @if (locationName()?.district) {
                  <span>, {{ locationName()?.district }}</span>
                }
              </p>
            }
          </div>
        }

        @if (error()) {
          <div class="error-message">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <p>{{ error() }}</p>
          </div>
        }
      </div>

      <mat-divider></mat-divider>

      <div class="picker-footer">
        <button mat-stroked-button (click)="useCurrentLocation()">
          <mat-icon>my_location</mat-icon>
          Joriy joylashuv
        </button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="!selectedLocation()"
          (click)="confirmLocation()"
        >
          <mat-icon>check</mat-icon>
          Tasdiqlash
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .location-picker {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 600px;
        max-height: 90vh;
        background: #fff;
        border-radius: 8px;
      }

      .picker-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: linear-gradient(135deg, #1b3a6b 0%, #2a4a7c 100%);
        color: white;
        border-radius: 8px 8px 0 0;
      }

      .picker-title {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
      }

      .picker-content {
        flex: 1;
        overflow-y: auto;
        position: relative;
      }

      .map-container {
        width: 100%;
        height: 300px;
        border: 1px solid #e2e8f0;

        ::ng-deep .leaflet-container {
          border-radius: 4px;
        }

        ::ng-deep .leaflet-marker-icon {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.9);
        z-index: 10;
        gap: 16px;

        p {
          margin: 0;
          color: #475569;
          font-size: 14px;
        }
      }

      .location-info {
        padding: 16px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }

      .info-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .success-icon {
        color: #10b981;
        font-size: 20px;
      }

      .info-title {
        font-weight: 500;
        color: #1e293b;
        font-size: 14px;
      }

      .coordinates {
        margin: 4px 0;
        font-size: 12px;
        color: #64748b;
        font-family: 'Courier New', monospace;
        word-break: break-all;
      }

      .location-name {
        margin: 8px 0 0 0;
        font-size: 14px;
        color: #1e293b;
        font-weight: 500;
      }

      .error-message {
        padding: 16px;
        margin: 8px;
        background: #fee2e2;
        border: 1px solid #fecaca;
        border-radius: 4px;
        display: flex;
        gap: 8px;
        align-items: flex-start;

        .error-icon {
          color: #dc2626;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          color: #7f1d1d;
          font-size: 13px;
        }
      }

      .picker-footer {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid #e2e8f0;
        border-radius: 0 0 8px 8px;
        background: #f8fafc;
      }

      button {
        flex: 1;
      }

      mat-icon {
        margin-right: 4px;
      }
    `,
  ],
})
export class LocationPickerMapComponent implements OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Output() locationSelected = new EventEmitter<{
    coordinates: GeolocationCoordinates;
    name: { city: string; district: string };
  }>();

  dialogRef = inject(MatDialogRef<LocationPickerMapComponent>);
  private geolocationService = inject(GeolocationService);

  private leafletMap: any;
  private userMarker: any;
  private searchMarker: any;

  selectedLocation = this.geolocationService.getLocationSignal();
  isLoadingLocation = this.geolocationService.getLoadingSignal();
  error = this.geolocationService.getErrorSignal();
  locationName = signal<{ city: string; district: string } | null>(null);

  ngOnInit(): void {
    setTimeout(() => {
      this.initializeMap();
      this.useCurrentLocation();
    }, 200);
  }

  private initializeMap(): void {
    const bounds = this.geolocationService.getUzbekistanBounds();

    this.leafletMap = L.map(this.mapContainer.nativeElement, {
      center: [bounds.center.latitude, bounds.center.longitude],
      zoom: 6,
      maxBounds: [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east],
      ],
      maxBoundsViscosity: 1.0,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.leafletMap);

    // Add click handler
    this.leafletMap.on('click', (e: any) => {
      this.onMapClick(e.latlng.lat, e.latlng.lng);
    });
  }

  private async onMapClick(lat: number, lng: number): Promise<void> {
    const coords: GeolocationCoordinates = {
      latitude: lat,
      longitude: lng,
    };

    this.geolocationService.setLocation(coords);

    // Update marker
    this.updateMarker(lat, lng);

    // Get location name
    const locName = await this.geolocationService.getReverseGeocode(lat, lng);
    this.locationName.set(locName);
  }

  useCurrentLocation(): void {
    this.geolocationService.getCurrentLocation().subscribe({
      next: (coords) => {
        this.updateMarker(coords.latitude, coords.longitude);
        this.leafletMap.setView([coords.latitude, coords.longitude], 13);
        this.onMapClick(coords.latitude, coords.longitude);
      },
      error: () => {
        // Error message is already set in service
      },
    });
  }

  private updateMarker(lat: number, lng: number): void {
    // Remove old marker
    if (this.searchMarker) {
      this.leafletMap.removeLayer(this.searchMarker);
    }

    // Add new marker with custom icon
    const markerIcon = icon({
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.searchMarker = L.marker([lat, lng], { icon: markerIcon })
      .bindPopup('Tanlangan joylashuv')
      .addTo(this.leafletMap)
      .openPopup();
  }

  confirmLocation(): void {
    const coords = this.selectedLocation();
    if (coords) {
      const locName = this.locationName() || { city: '', district: '' };
      this.locationSelected.emit({
        coordinates: coords,
        name: locName,
      });
      this.dialogRef.close({
        coordinates: coords,
        name: locName,
      });
    }
  }
}

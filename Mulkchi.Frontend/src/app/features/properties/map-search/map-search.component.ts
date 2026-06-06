import { Component, OnInit, OnDestroy, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PropertyService } from '../../../core/services/property.service';
import { Property } from '../../../core/models';
import * as L from 'leaflet';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map-search',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="map-search-container">
      <!-- Sidebar for Property List -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>Xaritadagi uylar</h2>
          <p>{{ properties().length }} ta e'lon topildi</p>
        </div>
        
        <div class="property-list">
          @if (isLoading()) {
            <div class="loading-state">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          } @else {
            @for (prop of properties(); track prop.id) {
              <div class="prop-card" (click)="goToDetail(prop.id)" (mouseenter)="highlightMarker(prop.id)" (mouseleave)="unhighlightMarker(prop.id)">
                <img [src]="prop.images?.[0]?.url || 'assets/images/placeholder-house.png'" alt="House">
                <div class="prop-info">
                  <div class="prop-price">{{ formatPrice(prop.salePrice || prop.monthlyRent || prop.pricePerNight) }}</div>
                  <div class="prop-title">{{ prop.title }}</div>
                  <div class="prop-specs">
                    <span><mat-icon>meeting_room</mat-icon> {{ prop.numberOfBedrooms }}</span>
                    <span><mat-icon>shower</mat-icon> {{ prop.numberOfBathrooms }}</span>
                    <span><mat-icon>architecture</mat-icon> {{ prop.area }} m²</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Full Map Area -->
      <div class="map-area">
        <div id="full-map"></div>
      </div>
    </div>
  `,
  styles: [`
    .map-search-container {
      display: flex;
      height: calc(100vh - 88px); /* Adjust based on navbar height */
      width: 100%;
      overflow: hidden;
      background: #fff;
    }

    .sidebar {
      width: 400px;
      min-width: 400px;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #e2e8f0;
      background: #f8fafc;
      z-index: 10;
      box-shadow: 2px 0 10px rgba(0,0,0,0.05);
    }

    .sidebar-header {
      padding: 20px;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
    }

    .sidebar-header h2 {
      margin: 0 0 5px 0;
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }

    .sidebar-header p {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .property-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .prop-card {
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
    }

    .prop-card:hover {
      border-color: #006AFF;
      box-shadow: 0 8px 20px rgba(0, 106, 255, 0.1);
      transform: translateY(-2px);
    }

    .prop-card img {
      width: 100%;
      height: 180px;
      object-fit: cover;
    }

    .prop-info {
      padding: 16px;
    }

    .prop-price {
      font-size: 1.25rem;
      font-weight: 800;
      color: #006AFF;
      margin-bottom: 4px;
    }

    .prop-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .prop-specs {
      display: flex;
      gap: 12px;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .prop-specs span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .prop-specs mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .map-area {
      flex: 1;
      height: 100%;
      position: relative;
    }

    #full-map {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    /* Custom Map Markers */
    ::ng-deep .zillow-marker {
      background: transparent;
      border: none;
    }

    ::ng-deep .zillow-bubble {
      background: #fff;
      border-radius: 8px;
      padding: 4px 8px;
      font-weight: 800;
      font-size: 0.85rem;
      color: #0f172a;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      border: 1px solid #e2e8f0;
      white-space: nowrap;
      transition: all 0.2s ease;
      position: relative;
    }

    ::ng-deep .zillow-bubble::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid #fff;
    }

    ::ng-deep .zillow-marker.highlight .zillow-bubble,
    ::ng-deep .zillow-marker:hover .zillow-bubble {
      background: #006AFF;
      color: #fff;
      border-color: #006AFF;
      transform: scale(1.1) translateY(-4px);
      z-index: 1000 !important;
    }

    ::ng-deep .zillow-marker.highlight .zillow-bubble::after,
    ::ng-deep .zillow-marker:hover .zillow-bubble::after {
      border-top-color: #006AFF;
    }

    @media (max-width: 768px) {
      .map-search-container {
        flex-direction: column-reverse;
      }
      .sidebar {
        width: 100%;
        min-width: 100%;
        height: 40vh;
        border-right: none;
        border-top: 1px solid #e2e8f0;
      }
      .map-area {
        height: 60vh;
      }
      .property-list {
        flex-direction: row;
        overflow-x: auto;
        overflow-y: hidden;
      }
      .prop-card {
        min-width: 280px;
        flex-direction: row;
        height: 120px;
      }
      .prop-card img {
        width: 120px;
        height: 100%;
      }
    }
  `]
})
export class MapSearchComponent implements OnInit, AfterViewInit, OnDestroy {
  private propertyService = inject(PropertyService);
  private router = inject(Router);

  private map!: L.Map;
  private markers: { [id: string]: L.Marker } = {};
  
  properties = signal<Property[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.fetchProperties();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private fetchProperties() {
    this.isLoading.set(true);
    // Fetch top properties for the map initially
    this.propertyService.getAllProperties(1, 50).subscribe({
      next: (response) => {
        this.properties.set(response.items || []);
        this.isLoading.set(false);
        this.addMarkersToMap();
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private initMap() {
    // Default to Tashkent coordinates
    this.map = L.map('full-map', {
      zoomControl: false
    }).setView([41.311081, 69.240562], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this.map);

    // Re-fetch properties when user stops dragging the map
    this.map.on('moveend', () => {
      // In a real app, we would send this.map.getBounds() to API
      // this.fetchPropertiesByBounds(this.map.getBounds());
    });
  }

  private addMarkersToMap() {
    if (!this.map) return;

    // Clear old markers
    Object.values(this.markers).forEach(m => m.remove());
    this.markers = {};

    const bounds = L.latLngBounds([]);

    this.properties().forEach(prop => {
      // Fake coordinates for demo if missing
      const lat = prop.latitude || (41.311081 + (Math.random() - 0.5) * 0.1);
      const lng = prop.longitude || (69.240562 + (Math.random() - 0.5) * 0.1);

      const priceStr = this.formatShortPrice(prop.salePrice || prop.monthlyRent || prop.pricePerNight);
      
      const icon = L.divIcon({
        className: 'zillow-marker',
        html: `<div class="zillow-bubble">${priceStr}</div>`,
        iconSize: [60, 30],
        iconAnchor: [30, 30]
      });

      const marker = L.marker([lat, lng], { icon }).addTo(this.map);
      
      marker.on('click', () => {
        this.goToDetail(prop.id);
      });

      this.markers[prop.id] = marker;
      bounds.extend([lat, lng]);
    });

    if (this.properties().length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  highlightMarker(id: string) {
    const marker = this.markers[id];
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.add('highlight');
    }
  }

  unhighlightMarker(id: string) {
    const marker = this.markers[id];
    if (marker && marker.getElement()) {
      marker.getElement()?.classList.remove('highlight');
    }
  }

  goToDetail(id: string) {
    this.router.navigate(['/properties', id]);
  }

  formatPrice(price: number | undefined): string {
    if (!price) return "Narx belgilanmagan";
    return Math.round(price).toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";
  }

  formatShortPrice(price: number | undefined): string {
    if (!price) return "0";
    if (price >= 1000000) return (price / 1000000).toFixed(1) + "M";
    if (price >= 1000) return (price / 1000).toFixed(0) + "K";
    return price.toString();
  }
}

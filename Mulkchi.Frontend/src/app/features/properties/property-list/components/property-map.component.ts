import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../../../core/models';
import * as L from 'leaflet';

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div #map class="property-map"></div>
    </div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      height: 600px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .property-map {
      width: 100%;
      height: 100%;
    }

    @media (max-width: 768px) {
      .map-container {
        height: 400px;
      }
    }
  `]
})
export class PropertyMapComponent implements AfterViewInit, OnDestroy {
  @Input() properties: Property[] = [];
  @Input() center: [number, number] = [41.2995, 69.2401]; // Tashkent default

  @Output() markerClick = new EventEmitter<string>();

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    // Initialize map centered on Tashkent
    this.map = L.map('map').setView(this.center, 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Add property markers
    this.addMarkers();
  }

  private addMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Add new markers for properties with coordinates
    this.properties.forEach(property => {
      if (property.latitude && property.longitude) {
        const marker = L.marker([property.latitude, property.longitude])
          .addTo(this.map!)
          .on('click', () => this.markerClick.emit(property.id));

        // Create popup content
        const popupContent = this.createPopupContent(property);
        marker.bindPopup(popupContent);

        this.markers.push(marker);
      }
    });

    // Fit map to show all markers
    if (this.markers.length > 0 && this.map) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private createPopupContent(property: Property): string {
    const price = this.formatPrice(property);
    const imageUrl = property.images && property.images.length > 0 
      ? property.images[0].thumbnailUrl 
      : '/assets/placeholder.svg';

    return `
      <div class="property-popup">
        <div class="popup-image">
          <img src="${imageUrl}" alt="${property.title}" style="width: 200px; height: 120px; object-fit: cover; border-radius: 8px;">
        </div>
        <div class="popup-title">${property.title}</div>
        <div class="popup-price">${price}</div>
        <div class="popup-location">${property.city}, ${property.district}</div>
        <a href="/properties/${property.id}" class="popup-link">Batafsil</a>
      </div>
    `;
  }

  private formatPrice(property: Property): string {
    if (property.listingType === 'Rent' && property.monthlyRent) {
      return `${property.monthlyRent.toLocaleString('uz-UZ')} UZS/oy`;
    } else if (property.listingType === 'Sale' && property.salePrice) {
      return `${property.salePrice.toLocaleString('uz-UZ')} UZS`;
    } else if (property.listingType === 'ShortTermRent' && property.pricePerNight) {
      return `${property.pricePerNight.toLocaleString('uz-UZ')} UZS/kecha`;
    }
    return 'Narx so\'ralmagan';
  }
}

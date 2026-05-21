import { Component, Input, Output, EventEmitter, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../../../core/models';
import * as L from 'leaflet';

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container animate-fade-in">
      <div id="map" class="property-map"></div>
    </div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      height: 600px;
      background: #f8fafc;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      position: relative;
    }

    .property-map {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    ::ng-deep .property-popup {
      padding: 5px;
      font-family: 'Inter', sans-serif;
    }

    ::ng-deep .popup-image img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 10px;
    }

    ::ng-deep .popup-title {
      font-weight: 800;
      font-size: 1rem;
      color: #0f172a;
      margin-bottom: 4px;
    }

    ::ng-deep .popup-price {
      color: #c9a84c;
      font-weight: 900;
      font-size: 1.1rem;
      margin-bottom: 8px;
    }

    ::ng-deep .popup-link {
      display: block;
      text-align: center;
      background: #0f172a;
      color: white !important;
      padding: 8px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.85rem;
      transition: opacity 0.2s;
    }

    ::ng-deep .popup-link:hover {
      opacity: 0.9;
    }

    ::ng-deep .custom-price-marker {
      background: transparent;
      border: none;
    }

    ::ng-deep .marker-bubble {
      background: white;
      border-radius: 20px;
      padding: 6px 12px;
      font-weight: 800;
      font-size: 0.85rem;
      color: #0f172a;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      border: 2px solid white;
      white-space: nowrap;
      display: inline-block;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    ::ng-deep .marker-bubble::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid white;
      transition: all 0.3s ease;
    }

    ::ng-deep .custom-price-marker:hover .marker-bubble {
      background: #0f172a;
      color: white;
      transform: scale(1.1) translateY(-4px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.2);
      border-color: #0f172a;
      z-index: 1000 !important;
    }

    ::ng-deep .custom-price-marker:hover .marker-bubble::after {
      border-top-color: #0f172a;
    }

    @media (max-width: 768px) {
      .map-container {
        height: 400px;
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PropertyMapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() properties: Property[] = [];
  @Input() center: [number, number] = [41.2995, 69.2401];

  @Output() propertyClick = new EventEmitter<string>();

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['properties'] && !changes['properties'].firstChange) {
      this.addMarkers();
    }
  }

  ngAfterViewInit(): void {
    // Delay initialization slightly to ensure the container is ready
    setTimeout(() => this.initializeMap(), 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap(): void {
    if (this.map) return;

    // Initialize map
    this.map = L.map('map', {
      scrollWheelZoom: true,
      zoomControl: true
    }).setView(this.center, 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; Mulkchi Maps'
    }).addTo(this.map);

    this.addMarkers();
  }

  private addMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    if (!this.properties || this.properties.length === 0) return;

    const bounds: L.LatLngExpression[] = [];

    this.properties.forEach(property => {
      if (property.latitude && property.longitude) {
        const shortPrice = this.formatShortPrice(property);
        
        const customIcon = L.divIcon({
          className: 'custom-price-marker',
          html: `<div class="marker-bubble">${shortPrice}</div>`,
          iconSize: [0, 0],
          iconAnchor: [30, 40]
        });

        const marker = L.marker([property.latitude, property.longitude], { icon: customIcon })
          .addTo(this.map!)
          .on('click', () => {
            this.propertyClick.emit(property.id);
          });

        const popupContent = this.createPopupContent(property);
        marker.bindPopup(popupContent, { offset: [30, -30] });

        this.markers.push(marker);
        bounds.push([property.latitude, property.longitude]);
      }
    });

    // Auto-fit bounds if we have markers
    if (bounds.length > 0) {
      this.map.fitBounds(L.latLngBounds(bounds).pad(0.2));
    }
  }

  private createPopupContent(property: Property): string {
    const price = this.formatPrice(property);
    const imageUrl = property.images && property.images.length > 0 
      ? property.images[0].url 
      : 'https://placehold.co/600x400/0f172a/c9a84c?text=Mulk';

    return `
      <div class="property-popup">
        <div class="popup-image">
          <img src="${imageUrl}" alt="${property.title}" onerror="this.src='https://placehold.co/600x400/0f172a/c9a84c?text=Mulk'">
        </div>
        <div class="popup-title">${property.title}</div>
        <div class="popup-price">${price}</div>
        <div class="popup-location">${property.city || ''}, ${property.district || ''}</div>
        <a href="/properties/${property.id}" class="popup-link">Batafsil ko'rish</a>
      </div>
    `;
  }

  private formatPrice(property: Property): string {
    const p = property as any;
    if (p.salePrice) return `${p.salePrice.toLocaleString()} UZS`;
    if (p.monthlyRent) return `${p.monthlyRent.toLocaleString()} UZS/oy`;
    if (p.pricePerNight) return `${p.pricePerNight.toLocaleString()} UZS/tun`;
    return 'Narx so\'ralmagan';
  }

  private formatShortPrice(property: Property): string {
    const p = property as any;
    let price = 0;
    if (p.salePrice) price = p.salePrice;
    else if (p.monthlyRent) price = p.monthlyRent;
    else if (p.pricePerNight) price = p.pricePerNight;
    else return 'N/A';

    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} mlrd`;
    }
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} mln`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}k`;
    }
    return price.toString();
  }
}

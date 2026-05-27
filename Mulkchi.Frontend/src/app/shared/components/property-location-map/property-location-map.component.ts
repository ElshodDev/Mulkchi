import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-property-location-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div #map id="map" class="map"></div>
      <div *ngIf="showControls" class="map-controls">
        <button class="map-btn" (click)="zoomIn()" title="Yaqinlashtirish">
          <span>+</span>
        </button>
        <button class="map-btn" (click)="zoomOut()" title="Uzoqlashtirish">
          <span>-</span>
        </button>
        <button class="map-btn" (click)="resetView()" title="Qayta tiklash">
          <span>⟲</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .map-container {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 8px;
        overflow: hidden;
      }

      .map {
        width: 100%;
        height: 100%;
        min-height: 300px;
      }

      .map-controls {
        position: absolute;
        top: 12px;
        right: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1000;
      }

      .map-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 600;
        color: #333;
        transition: all 0.2s;
      }

      .map-btn:hover {
        background: #f5f5f5;
        transform: scale(1.05);
      }

      :host ::ng-deep .leaflet-popup-content-wrapper {
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }

      :host ::ng-deep .leaflet-popup-content {
        margin: 12px 16px;
        font-family: inherit;
      }

      :host ::ng-deep .leaflet-container {
        font-family: inherit;
      }

      :host ::ng-deep .custom-price-marker {
        background: transparent;
        border: none;
      }

      :host ::ng-deep .marker-bubble {
        background: white;
        border-radius: 20px;
        padding: 8px 14px;
        font-weight: 800;
        font-size: 0.9rem;
        color: #0f172a;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 2px solid white;
        white-space: nowrap;
        display: inline-block;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        cursor: pointer;
      }

      :host ::ng-deep .marker-bubble::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
        transition: all 0.3s ease;
      }

      :host ::ng-deep .custom-price-marker:hover .marker-bubble {
        background: #0f172a;
        color: white;
        transform: scale(1.15) translateY(-6px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
        border-color: #0f172a;
        z-index: 1000 !important;
      }

      :host ::ng-deep .custom-price-marker:hover .marker-bubble::after {
        border-top-color: #0f172a;
      }

      .popup-content {
        text-align: center;
        min-width: 150px;
      }

      .popup-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
        color: #333;
      }

      .popup-address {
        font-size: 12px;
        color: #666;
      }
    `,
  ],
})
export class PropertyLocationMapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;

  @Input() latitude = 41.2995;
  @Input() longitude = 69.2401;
  @Input() zoom = 13;
  @Input() showControls = true;
  @Input() showPopup = true;
  @Input() title = 'Mulk joylashuvi';
  @Input() address = '';
  @Input() height = '300px';
  @Input() draggable = false;
  @Input() price: number | null = null;
  @Input() currency = 'UZS';
  @Output() locationChange = new EventEmitter<{ lat: number; lng: number }>();

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && (changes['latitude'] || changes['longitude'])) {
      this.updateLocation(this.latitude, this.longitude);
    }
  }

  private initMap(): void {

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
    });

    const mapId = this.mapElement.nativeElement.id || 'map';
    this.map = L.map(mapId || this.mapElement.nativeElement, {
      center: [this.latitude, this.longitude],
      zoom: this.zoom,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    L.control
      .attribution({
        position: 'bottomright',
      })
      .addTo(this.map);

    this.addMarker();

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.updateLocation(event.latlng.lat, event.latlng.lng);
    });

    if (this.draggable && this.marker) {
      this.marker.dragging?.enable();
      this.marker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        this.latitude = position.lat;
        this.longitude = position.lng;
        this.locationChange.emit({ lat: this.latitude, lng: this.longitude });
      });
    }
  }

  private addMarker(): void {
    if (!this.map) return;

    const customIcon = this.price ? this.createPriceBubbleMarker() : this.createStandardMarker();

    this.marker = L.marker([this.latitude, this.longitude], {
      icon: customIcon,
      draggable: this.draggable,
    }).addTo(this.map);

    if (this.showPopup) {
      const popupContent = `
        <div class="popup-content">
          <div class="popup-title">${this.title}</div>
          ${this.price ? `<div class="popup-price">${this.formatPriceDisplay(this.price)}</div>` : ''}
          ${this.address ? `<div class="popup-address">${this.address}</div>` : ''}
        </div>
      `;
      this.marker.bindPopup(popupContent);
    }
  }

  private createPriceBubbleMarker(): L.DivIcon {
    const shortPrice = this.formatShortPrice(this.price || 0);
    return L.divIcon({
      className: 'custom-price-marker',
      html: `<div class="marker-bubble">${shortPrice}</div>`,
      iconSize: [0, 0],
      iconAnchor: [30, 40],
    });
  }

  private createStandardMarker(): L.DivIcon {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
        ">
          <svg style="
            width: 20px;
            height: 20px;
            transform: rotate(45deg);
            fill: white;
          " viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  }

  private formatShortPrice(price: number): string {
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

  private formatPriceDisplay(price: number): string {
    return `${price.toLocaleString()} ${this.currency}`;
  }

  zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  resetView(): void {
    if (this.map) {
      this.map.setView([this.latitude, this.longitude], this.zoom);
    }
  }

  updateLocation(lat: number, lng: number): void {
    this.latitude = lat;
    this.longitude = lng;

    if (this.map && this.marker) {
      this.marker.setLatLng([lat, lng]);
      this.map.setView([lat, lng], this.zoom);
    }

    this.locationChange.emit({ lat, lng });
  }

  getCurrentLocation(): { lat: number; lng: number } | null {
    if (this.marker) {
      const pos = this.marker.getLatLng();
      return { lat: pos.lat, lng: pos.lng };
    }
    return null;
  }
}

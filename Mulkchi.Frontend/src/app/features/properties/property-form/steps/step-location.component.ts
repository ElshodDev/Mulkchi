import { Component, EventEmitter, Input, Output, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';

@Component({
  selector: 'app-step-location',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <div class="step-wrapper">
      <div class="section-header">
        <h1>Joylashuv</h1>
        <p>Mulk qayerda joylashganini ko'rsating. Xaritadan aniq nuqtani belgilashni unutmang.</p>
      </div>

      <form [formGroup]="form" class="premium-form">
        <div class="form-grid">
          <div class="form-section">
            <label class="section-label">Manzil ma'lumotlari</label>
            
            <div class="input-row">
              <mat-form-field appearance="outline" class="premium-field half">
                <mat-label>Viloyat</mat-label>
                <mat-select formControlName="region" (selectionChange)="onRegionChange($event.value)">
                  <mat-option *ngFor="let region of regions" [value]="region.value">
                    {{ region.label }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="form.get('region')?.invalid">Viloyatni tanlang</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="premium-field half">
                <mat-label>Shahar / Tuman</mat-label>
                <input matInput formControlName="city" placeholder="Masalan: Mirzo Ulug'bek">
                <mat-error *ngIf="form.get('city')?.invalid">Shahar yoki tumanni kiriting</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="premium-field full">
              <mat-label>Tuman / Mahalla (ixtiyoriy)</mat-label>
              <input matInput formControlName="district" placeholder="Masalan: TTZ-2">
            </mat-form-field>

            <mat-form-field appearance="outline" class="premium-field full">
              <mat-label>To'liq manzil</mat-label>
              <textarea matInput formControlName="address" rows="2" placeholder="Ko'cha, uy va xonadon raqami"></textarea>
              <mat-error *ngIf="form.get('address')?.invalid">Manzilni to'liq kiriting</mat-error>
            </mat-form-field>
          </div>

          <div class="map-section">
            <label class="section-label">Xaritada belgilash</label>
            <div class="map-container-wrapper">
              <div id="map" class="map-instance"></div>
              <div class="map-hint">
                <mat-icon>location_on</mat-icon>
                <span>Aniq manzilni belgilash uchun markerni suring</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button mat-button type="button" class="btn-cancel" (click)="onPrevious()">Orqaga</button>
          <button mat-flat-button class="btn-next" [disabled]="form.invalid" (click)="onSubmit()">
            Davom etish
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .step-wrapper { max-width: 1000px; margin: 0 auto; }
    .section-header { margin-bottom: 40px; }
    .section-header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
    .section-header p { color: #64748b; font-size: 1.1rem; margin-top: 8px; }

    .premium-form { display: flex; flex-direction: column; gap: 32px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; }

    @media (max-width: 900px) {
      .form-grid { grid-template-columns: 1fr; }
    }

    .section-label { display: block; font-size: 0.95rem; font-weight: 700; color: #334155; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .input-row { display: flex; gap: 16px; width: 100%; }
    .half { flex: 1; }
    .full { width: 100%; }

    ::ng-deep .premium-field .mat-mdc-text-field-wrapper {
      background-color: white !important;
      border-radius: 16px !important;
      transition: all 0.2s ease;
    }

    .map-container-wrapper {
      position: relative;
      height: 400px;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    .map-instance { width: 100%; height: 100%; z-index: 1; }

    .map-hint {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      padding: 10px 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 1000;
      font-size: 0.85rem;
      color: #1e293b;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .map-hint mat-icon { color: #ef4444; font-size: 20px; width: 20px; height: 20px; }

    .form-footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 32px;
      border-top: 1px solid #f1f5f9;
    }

    .btn-next {
      height: 56px;
      padding: 0 40px;
      border-radius: 16px;
      font-weight: 700;
      font-size: 1.1rem;
      background: #1e293b;
      color: white;
      transition: all 0.3s ease;
    }

    .btn-next:hover:not(:disabled) { background: #0f172a; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
    .btn-cancel { height: 56px; padding: 0 32px; color: #64748b; font-weight: 600; }
  `]
})
export class StepLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() form!: FormGroup;
  @Output() stepComplete = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  private map?: L.Map;
  private marker?: L.Marker;

  regions = [
    { value: 'Toshkent', label: 'Toshkent', coords: [41.2995, 69.2401] },
    { value: 'ToshkentViloyati', label: 'Toshkent viloyati', coords: [41.2000, 69.5000] },
    { value: 'Samarqand', label: 'Samarqand', coords: [39.6270, 66.9750] },
    { value: 'Buxoro', label: 'Buxoro', coords: [39.7747, 64.4286] },
    { value: 'Andijon', label: 'Andijon', coords: [40.7833, 72.3333] },
    { value: 'Fargona', label: "Farg'ona", coords: [40.3833, 71.7833] },
    { value: 'Namangan', label: 'Namangan', coords: [40.9983, 71.6726] },
    { value: 'Xiva', label: 'Xorazm', coords: [41.3775, 60.3585] },
    { value: 'Navoi', label: 'Navoi', coords: [40.1039, 65.3739] },
    { value: 'Jizzax', label: 'Jizzax', coords: [40.1158, 67.8422] },
    { value: 'Sirdaryo', label: 'Sirdaryo', coords: [40.4858, 68.7842] },
    { value: 'Surxondaryo', label: 'Surxondaryo', coords: [37.2242, 67.2783] },
    { value: 'Qashqadaryo', label: 'Qashqadaryo', coords: [38.8417, 65.7892] },
    { value: 'Nukus', label: "Qoraqalpog'iston", coords: [42.4603, 59.6122] },
  ];

  ngOnInit() {
    // Ensure latitude and longitude are initialized
    if (!this.form.get('latitude')?.value) {
      this.form.patchValue({ latitude: 41.2995, longitude: 69.2401 });
    }
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const lat = this.form.get('latitude')?.value || 41.2995;
    const lng = this.form.get('longitude')?.value || 69.2401;

    this.map = L.map('map', {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

    this.marker = L.marker([lat, lng], { draggable: true, icon: iconDefault }).addTo(this.map);

    this.marker.on('dragend', () => {
      const position = this.marker?.getLatLng();
      if (position) {
        this.form.patchValue({
          latitude: position.lat,
          longitude: position.lng
        });
      }
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker?.setLatLng(e.latlng);
      this.form.patchValue({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      });
    });

    // Fix map size after container is fully rendered
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  onRegionChange(regionValue: string) {
    const region = this.regions.find(r => r.value === regionValue);
    if (region && this.map) {
      this.map.setView(region.coords as L.LatLngExpression, 12);
      this.marker?.setLatLng(region.coords as L.LatLngExpression);
      this.form.patchValue({
        latitude: region.coords[0],
        longitude: region.coords[1]
      });
    }
  }

  onSubmit() {
    if (this.form.valid) {
      this.stepComplete.emit();
    } else {
      this.form.markAllAsTouched();
    }
  }

  onPrevious() {
    this.previous.emit();
  }
}

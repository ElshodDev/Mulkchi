import {
  Component,
  EventEmitter,
  Input,
  Output,
  AfterViewInit,
  OnDestroy,
  OnInit,
  signal,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

interface NominatimResult {
  display_name: string;
  address: {
    road?: string;
    pedestrian?: string;
    house_number?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

@Component({
  selector: 'app-step-location',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="step-wrapper">

      <!-- HEADER -->
      <div class="section-header">
        <div class="header-text">
          <h1>📍 Joylashuvni belgilang</h1>
          <p>Xaritada bosing yoki markerni suring — manzil avtomatik to'ldiriladi</p>
        </div>
        <button mat-flat-button class="btn-gps" (click)="useMyLocation()" [disabled]="geocoding()">
          <mat-icon>my_location</mat-icon>
          Mening joyim
        </button>
      </div>

      <!-- MAP CARD -->
      <div class="map-card">
        <div class="map-container-wrapper">
          <div id="location-map" class="map-instance"></div>

          <!-- Loading overlay -->
          <div class="map-overlay" *ngIf="geocoding()">
            <mat-progress-spinner diameter="40" mode="indeterminate" color="primary"></mat-progress-spinner>
            <span>Manzil aniqlanmoqda...</span>
          </div>

          <!-- Pin hint -->
          <div class="map-pin-hint" *ngIf="!geocoding() && !hasPickedLocation()">
            <mat-icon>touch_app</mat-icon>
            <span>Xaritaga bosing va manzilni belgilang</span>
          </div>

          <!-- Success badge -->
          <div class="map-success-badge" *ngIf="hasPickedLocation() && !geocoding()">
            <mat-icon>check_circle</mat-icon>
            <span>Manzil aniqlandi!</span>
          </div>
        </div>

        <!-- Detected Address Preview -->
        <div class="address-preview" *ngIf="detectedAddress()">
          <mat-icon color="primary">location_on</mat-icon>
          <div class="preview-text">
            <span class="preview-label">Aniqlangan manzil:</span>
            <span class="preview-value">{{ detectedAddress() }}</span>
          </div>
        </div>
      </div>

      <!-- FORM FIELDS (auto-filled) -->
      <form [formGroup]="form" class="address-form">
        <div class="form-row">
          <!-- Region -->
          <div class="form-field-wrap">
            <label class="field-label">
              <mat-icon>map</mat-icon> Viloyat
            </label>
            <mat-form-field appearance="outline" class="premium-field full-w">
              <mat-select formControlName="region" (selectionChange)="onRegionChange($event.value)">
                <mat-option *ngFor="let r of regions" [value]="r.value">{{ r.label }}</mat-option>
              </mat-select>
              <mat-error>Viloyatni tanlang</mat-error>
            </mat-form-field>
          </div>

          <!-- City -->
          <div class="form-field-wrap">
            <label class="field-label">
              <mat-icon>location_city</mat-icon> Shahar / Tuman
            </label>
            <mat-form-field appearance="outline" class="premium-field full-w">
              <input matInput formControlName="city" placeholder="Masalan: Mirzo Ulug'bek" />
              <mat-error>Shahar yoki tumanni kiriting</mat-error>
            </mat-form-field>
          </div>
        </div>

        <div class="form-row">
          <!-- District / Mahalla -->
          <div class="form-field-wrap">
            <label class="field-label">
              <mat-icon>place</mat-icon> Mahalla / Ko'cha
            </label>
            <mat-form-field appearance="outline" class="premium-field full-w">
              <input matInput formControlName="district" placeholder="Masalan: Yunusobod, Lochin ko'chasi" />
            </mat-form-field>
          </div>

          <!-- Address -->
          <div class="form-field-wrap">
            <label class="field-label">
              <mat-icon>home</mat-icon> To'liq manzil
            </label>
            <mat-form-field appearance="outline" class="premium-field full-w">
              <input matInput formControlName="address" placeholder="Ko'cha, uy raqami" />
              <mat-error>Manzilni kiriting</mat-error>
            </mat-form-field>
          </div>
        </div>

        <!-- Coordinates (read-only visual) -->
        <div class="coords-strip" *ngIf="form.get('latitude')?.value !== 41.2995 || hasPickedLocation()">
          <mat-icon>gps_fixed</mat-icon>
          <span>
            Koordinatalar: {{ form.get('latitude')?.value | number:'1.4-4' }}°N,
            {{ form.get('longitude')?.value | number:'1.4-4' }}°E
          </span>
        </div>
      </form>

      <!-- FOOTER BUTTONS -->
      <div class="form-footer">
        <button mat-button class="btn-back" (click)="onPrevious()">
          <mat-icon>arrow_back</mat-icon> Orqaga
        </button>
        <button
          mat-flat-button
          class="btn-next"
          [disabled]="form.invalid || geocoding()"
          (click)="onSubmit()"
        >
          Davom etish
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .step-wrapper {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }
    .header-text h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .header-text p {
      color: #64748b;
      font-size: 1rem;
      margin-top: 6px;
    }
    .btn-gps {
      background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
      color: white !important;
      border-radius: 14px !important;
      height: 48px;
      padding: 0 24px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }
    .btn-gps mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .map-card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .map-container-wrapper {
      position: relative;
      height: 420px;
    }
    @media (max-width: 640px) {
      .map-container-wrapper { height: 260px; }
    }

    .map-instance {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .map-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(6px);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      font-weight: 600;
      color: #6366f1;
    }

    .map-pin-hint {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15,23,42,0.85);
      backdrop-filter: blur(8px);
      color: white;
      padding: 10px 20px;
      border-radius: 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 500;
      white-space: nowrap;
      pointer-events: none;
    }
    .map-pin-hint mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .map-success-badge {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 10px 20px;
      border-radius: 40px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 500;
      pointer-events: none;
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes popIn {
      from { transform: translateX(-50%) scale(0.7); opacity: 0; }
      to   { transform: translateX(-50%) scale(1);   opacity: 1; }
    }
    .map-success-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .address-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .address-preview mat-icon { flex-shrink: 0; }
    .preview-text { display: flex; flex-direction: column; gap: 2px; }
    .preview-label { font-size: 0.75rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
    .preview-value { font-size: 0.95rem; color: #1e293b; font-weight: 600; }

    .address-form {
      background: white;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 8px;
    }
    @media (max-width: 640px) {
      .form-row { grid-template-columns: 1fr; }
    }
    .form-field-wrap { display: flex; flex-direction: column; }

    .field-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .field-label mat-icon { font-size: 16px; width: 16px; height: 16px; color: #6366f1; }

    .full-w { width: 100%; }

    ::ng-deep .premium-field .mat-mdc-text-field-wrapper {
      background-color: #f8fafc !important;
      border-radius: 14px !important;
      transition: all 0.2s ease !important;
    }
    ::ng-deep .premium-field.mat-focused .mat-mdc-text-field-wrapper {
      background-color: white !important;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
    }

    .coords-strip {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 8px 16px;
      border-radius: 10px;
      margin-top: 8px;
    }
    .coords-strip mat-icon { font-size: 16px; width: 16px; height: 16px; color: #6366f1; }

    .form-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 24px;
      border-top: 1px solid #f1f5f9;
    }
    .btn-back {
      height: 52px;
      padding: 0 28px;
      color: #64748b;
      font-weight: 600;
    }
    .btn-next {
      height: 52px;
      padding: 0 40px;
      border-radius: 16px;
      font-weight: 700;
      font-size: 1rem;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
      color: white !important;
      box-shadow: 0 8px 20px rgba(99,102,241,0.25);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-next:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(99,102,241,0.35);
    }
    .btn-next mat-icon { font-size: 20px; width: 20px; height: 20px; }
  `],
})
export class StepLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() form!: FormGroup;
  @Output() stepComplete = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  private map?: L.Map;
  private marker?: L.Marker;
  private readonly http = inject(HttpClient);
  private readonly zone = inject(NgZone);
  private readonly snackBar = inject(MatSnackBar);

  geocoding = signal(false);
  hasPickedLocation = signal(false);
  detectedAddress = signal('');

  regions = [
    { value: 'Toshkent',        label: 'Toshkent shahri',    coords: [41.2995, 69.2401] as [number, number] },
    { value: 'ToshkentViloyati',label: 'Toshkent viloyati',  coords: [41.1143, 69.5542] as [number, number] },
    { value: 'Samarqand',       label: 'Samarqand',          coords: [39.627,  66.975 ] as [number, number] },
    { value: 'Buxoro',          label: 'Buxoro',             coords: [39.7747, 64.4286] as [number, number] },
    { value: 'Andijon',         label: 'Andijon',            coords: [40.7833, 72.3333] as [number, number] },
    { value: 'Fargona',         label: "Farg'ona",           coords: [40.3833, 71.7833] as [number, number] },
    { value: 'Namangan',        label: 'Namangan',           coords: [40.9983, 71.6726] as [number, number] },
    { value: 'Xiva',            label: 'Xorazm',             coords: [41.3775, 60.3585] as [number, number] },
    { value: 'Navoi',           label: 'Navoiy',             coords: [40.1039, 65.3739] as [number, number] },
    { value: 'Jizzax',          label: 'Jizzax',             coords: [40.1158, 67.8422] as [number, number] },
    { value: 'Sirdaryo',        label: 'Sirdaryo',           coords: [40.4858, 68.7842] as [number, number] },
    { value: 'Surxondaryo',     label: 'Surxondaryo',        coords: [37.2242, 67.2783] as [number, number] },
    { value: 'Qashqadaryo',     label: "Qashqadaryo",        coords: [38.8417, 65.7892] as [number, number] },
    { value: 'Nukus',           label: "Qoraqalpog'iston",   coords: [42.4603, 59.6122] as [number, number] },
  ];

  ngOnInit() {
    if (!this.form.get('latitude')?.value) {
      this.form.patchValue({ latitude: 41.2995, longitude: 69.2401 });
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 150);
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private initMap(): void {
    const lat = this.form.get('latitude')?.value ?? 41.2995;
    const lng = this.form.get('longitude')?.value ?? 69.2401;

    this.map = L.map('location-map', {
      center: [lat, lng],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    const pinIcon = L.divIcon({
      className: '',
      html: `
        <div style="
          width:40px; height:40px;
          background:linear-gradient(135deg,#6366f1,#a855f7);
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 14px rgba(99,102,241,0.5);
          border:3px solid white;
        ">
          <div style="
            width:10px; height:10px;
            background:white;
            border-radius:50%;
            transform:rotate(45deg);
          "></div>
        </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    this.marker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker!.getLatLng();
      this.zone.run(() => this.onLocationPicked(pos.lat, pos.lng));
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker!.setLatLng(e.latlng);
      this.zone.run(() => this.onLocationPicked(e.latlng.lat, e.latlng.lng));
    });

    setTimeout(() => this.map?.invalidateSize(), 300);
  }

  private onLocationPicked(lat: number, lng: number): void {
    this.form.patchValue({ latitude: lat, longitude: lng });
    this.geocoding.set(true);
    this.hasPickedLocation.set(false);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=uz,ru`;

    this.http.get<NominatimResult>(url).subscribe({
      next: (result) => {
        this.zone.run(() => this.fillFormFromNominatim(result, lat, lng));
      },
      error: () => {
        this.zone.run(() => {
          this.geocoding.set(false);
          this.hasPickedLocation.set(true);
          this.snackBar.open("Manzil aniqlanmadi. Qo'lda kiriting.", 'OK', { duration: 3000 });
        });
      },
    });
  }

  private fillFormFromNominatim(result: NominatimResult, lat: number, lng: number): void {
    const a = result.address;

    const street      = a.road || a.pedestrian || '';
    const houseNumber = a.house_number ? `, ${a.house_number}` : '';
    const suburb      = a.neighbourhood || a.suburb || '';
    const city        = a.city || a.town || a.village || a.county || '';
    const state       = a.state || '';

    const regionMatch = this.matchRegion(state, city);

    const addressLine = [street + houseNumber, suburb].filter(Boolean).join(', ');

    const fullDisplay = result.display_name;

    this.form.patchValue({
      latitude:  lat,
      longitude: lng,
      region:    regionMatch,
      city:      city,
      district:  suburb,
      address:   addressLine || fullDisplay.split(',').slice(0, 3).join(',').trim(),
    });

    this.detectedAddress.set(
      [street + houseNumber, suburb, city, state].filter(Boolean).join(', ')
    );

    this.geocoding.set(false);
    this.hasPickedLocation.set(true);

    const reg = this.regions.find(r => r.value === regionMatch);
    if (reg && this.map) {
      // Region match found, could do something with map here
    }

    this.snackBar.open('✅ Manzil avtomatik aniqlandi!', '', { duration: 2000 });
  }

  private matchRegion(state: string, city: string): string {
    const s = (state + ' ' + city).toLowerCase();

    if (s.includes('toshkent') && (s.includes('shahar') || s.includes('city') || s.includes('toshkent sh'))) return 'Toshkent';
    if (s.includes('toshkent')) return 'ToshkentViloyati';
    if (s.includes('samarqand') || s.includes('самарканд')) return 'Samarqand';
    if (s.includes('buxoro') || s.includes('бухара'))       return 'Buxoro';
    if (s.includes('andijon') || s.includes('андижан'))     return 'Andijon';
    if (s.includes("farg'ona") || s.includes('fergana') || s.includes('фергана')) return 'Fargona';
    if (s.includes('namangan') || s.includes('наманган'))   return 'Namangan';
    if (s.includes('xorazm') || s.includes('хорезм'))       return 'Xiva';
    if (s.includes('navoiy') || s.includes('navoi') || s.includes('навои')) return 'Navoi';
    if (s.includes('jizzax') || s.includes('джизак'))       return 'Jizzax';
    if (s.includes('sirdaryo') || s.includes('сырдарья'))   return 'Sirdaryo';
    if (s.includes('surxondaryo') || s.includes('сурхандарья')) return 'Surxondaryo';
    if (s.includes('qashqadaryo') || s.includes('кашкадарья')) return 'Qashqadaryo';
    if (s.includes('qoraqalpog') || s.includes('каракалп') || s.includes('nukus')) return 'Nukus';

    return this.form.get('region')?.value || 'Toshkent';
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.snackBar.open("Brauzer geolokatsiyani qo'llab-quvvatlamaydi", 'OK', { duration: 3000 });
      return;
    }

    this.geocoding.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.zone.run(() => {
          this.map?.setView([lat, lng], 16);
          this.marker?.setLatLng([lat, lng]);
          this.onLocationPicked(lat, lng);
        });
      },
      () => {
        this.zone.run(() => {
          this.geocoding.set(false);
          this.snackBar.open("Joylashuv aniqlanmadi. Ruxsat berilganini tekshiring.", 'OK', { duration: 4000 });
        });
      },
      { timeout: 8000 }
    );
  }

  onRegionChange(regionValue: string): void {
    const region = this.regions.find(r => r.value === regionValue);
    if (region && this.map) {
      this.map.setView(region.coords, 12);
      this.marker?.setLatLng(region.coords);
      this.form.patchValue({ latitude: region.coords[0], longitude: region.coords[1] });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.stepComplete.emit();
    } else {
      this.form.markAllAsTouched();
    }
  }

  onPrevious(): void {
    this.previous.emit();
  }
}

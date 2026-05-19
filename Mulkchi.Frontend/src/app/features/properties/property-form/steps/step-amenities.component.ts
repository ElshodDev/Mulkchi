import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-step-amenities',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatCheckboxModule],
  template: `
    <div class="step-wrapper">
      <div class="section-header">
        <h1>Qulayliklar va sharoitlar</h1>
        <p>Mulkingizdagi barcha qulayliklarni belgilang, bu qidiruvda muhim rol o'ynaydi</p>
      </div>

      <form [formGroup]="form" class="premium-form">
        <div class="amenities-grid">
          <div 
            *ngFor="let item of amenityList" 
            class="amenity-item"
            [class.active]="form.get(item.key)?.value"
            (click)="toggleAmenity(item.key)"
          >
            <div class="amenity-icon-box">
              <mat-icon>{{ item.icon }}</mat-icon>
            </div>
            <span class="amenity-label">{{ item.label }}</span>
            <div class="amenity-check" *ngIf="form.get(item.key)?.value">
              <mat-icon>check_circle</mat-icon>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button mat-button type="button" class="btn-cancel" (click)="onPrevious()">Orqaga</button>
          <button mat-flat-button class="btn-continue" (click)="onNext()">
            Davom etish
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .step-wrapper { max-width: 900px; margin: 0 auto; }
    .section-header { margin-bottom: 40px; }
    .section-header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
    .section-header p { color: #64748b; font-size: 1.1rem; margin-top: 8px; }

    .amenities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 16px;
    }

    .amenity-item {
      background: white;
      border: 2px solid #f1f5f9;
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .amenity-item:hover {
      border-color: #6366f1;
      background: #f8faff;
      transform: translateY(-2px);
    }

    .amenity-item.active {
      border-color: #6366f1;
      background: #f5f3ff;
      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.05);
    }

    .amenity-icon-box {
      width: 44px;
      height: 44px;
      background: #f1f5f9;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.3s ease;
    }

    .active .amenity-icon-box {
      background: #6366f1;
      color: white;
    }

    .amenity-label {
      font-weight: 600;
      color: #334155;
      font-size: 0.9rem;
      text-align: center;
    }

    .amenity-check {
      position: absolute;
      top: 10px;
      right: 10px;
      color: #6366f1;
    }

    .form-footer {
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 32px;
      border-top: 1px solid #f1f5f9;
    }

    .btn-continue {
      height: 56px;
      padding: 0 40px;
      border-radius: 16px;
      font-weight: 700;
      font-size: 1.1rem;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
    }

    .btn-cancel { height: 56px; padding: 0 32px; color: #64748b; font-weight: 600; }

    @media (max-width: 640px) {
      .amenities-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class StepAmenitiesComponent {
  @Input() form!: FormGroup;
  @Output() stepComplete = new EventEmitter<boolean>();
  @Output() previous = new EventEmitter<void>();

  amenityList = [
    { key: 'hasWifi', label: 'Wi-Fi', icon: 'wifi' },
    { key: 'hasParking', label: 'Avtoturargoh', icon: 'local_parking' },
    { key: 'hasPool', label: 'Basseyn', icon: 'pool' },
    { key: 'hasAirConditioning', label: 'Konditsioner', icon: 'ac_unit' },
    { key: 'hasHeating', label: 'Isitish tizimi', icon: 'heating' },
    { key: 'hasKitchen', label: 'Oshxona', icon: 'restaurant' },
    { key: 'hasTV', label: 'Televizor', icon: 'tv' },
    { key: 'hasWasher', label: 'Kir yuvish m.', icon: 'local_laundry_service' },
    { key: 'hasElevator', label: 'Lift', icon: 'elevator' },
    { key: 'hasSecurity', label: 'Xavfsizlik', icon: 'security' },
    { key: 'hasFurniture', label: 'Mebel', icon: 'chair' },
    { key: 'isRenovated', label: 'Yevro remont', icon: 'auto_awesome' },
    { key: 'hasMetroNearby', label: 'Metro yaqin', icon: 'subway' },
    { key: 'hasBusStop', label: 'Bekat yaqin', icon: 'directions_bus' },
    { key: 'hasMarketNearby', label: 'Bozor yaqin', icon: 'shopping_basket' },
  ];

  toggleAmenity(key: string) {
    const currentValue = this.form.get(key)?.value;
    this.form.patchValue({ [key]: !currentValue });
  }

  onNext() {
    this.stepComplete.emit(true);
  }

  onPrevious() {
    this.previous.emit();
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-step-basic-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <div class="step-wrapper">
      <div class="section-header">
        <h1>Mulk haqida asosiy ma'lumotlar</h1>
        <p>Xaridorlarga mulkingiz haqida qisqacha ma'lumot bering</p>
      </div>

      <form [formGroup]="form" class="premium-form">
        <!-- Title Section -->
        <div class="form-section">
          <label class="section-label">E'lon sarlavhasi</label>
          <mat-form-field appearance="outline" class="full-width premium-field">
            <input matInput formControlName="title" placeholder="Masalan: Shimoliy vokzal yaqinidagi 3 xonali uy" />
            <mat-icon matPrefix>title</mat-icon>
            <mat-error *ngIf="form.get('title')?.invalid">Sarlavha kiritish shart</mat-error>
          </mat-form-field>
        </div>

        <!-- Choice Cards: Property Type -->
        <div class="form-section">
          <label class="section-label">Mulk turi</label>
          <div class="choice-grid">
            <div 
              *ngFor="let type of propertyTypes" 
              class="choice-card"
              [class.active]="form.get('type')?.value === type.value"
              (click)="selectType(type.value)"
            >
              <div class="choice-icon">
                <mat-icon>{{ type.icon }}</mat-icon>
              </div>
              <span class="choice-label">{{ type.label }}</span>
              <div class="choice-check" *ngIf="form.get('type')?.value === type.value">
                <mat-icon>check_circle</mat-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Choice Cards: Listing Type -->
        <div class="form-section">
          <label class="section-label">E'lon turi</label>
          <div class="choice-grid columns-3">
            <div 
              *ngFor="let type of listingTypes" 
              class="choice-card small"
              [class.active]="form.get('listingType')?.value === type.value"
              (click)="selectListingType(type.value)"
            >
              <span class="choice-label">{{ type.label }}</span>
            </div>
          </div>
        </div>

        <div class="row-grid">
          <!-- Price Input -->
          <div class="form-section flex-2" *ngIf="form.get('listingType')?.value">
            <label class="section-label">Narxi ({{ form.get('currency')?.value }})</label>
            <mat-form-field appearance="outline" class="full-width premium-field price-input">
              <input matInput type="number" 
                     [formControlName]="getActivePriceControl()" 
                     placeholder="0.00" />
              <mat-icon matPrefix>payments</mat-icon>
              <span matSuffix class="currency-tag">{{ form.get('currency')?.value }}</span>
            </mat-form-field>
          </div>

          <!-- Currency Select -->
          <div class="form-section flex-1">
            <label class="section-label">Valyuta</label>
            <mat-form-field appearance="outline" class="full-width premium-field">
              <mat-select formControlName="currency">
                <mat-option value="UZS">UZS (So'm)</mat-option>
                <mat-option value="USD">USD (Dollar)</mat-option>
              </mat-select>
              <mat-icon matPrefix>language</mat-icon>
            </mat-form-field>
          </div>
        </div>

        <div class="row-grid">
          <div class="form-section">
            <label class="section-label">Maydoni (m²)</label>
            <mat-form-field appearance="outline" class="full-width premium-field">
              <input matInput type="number" formControlName="area" />
              <mat-icon matPrefix>square_foot</mat-icon>
            </mat-form-field>
          </div>
          <div class="form-section">
            <label class="section-label">Xonalar</label>
            <mat-form-field appearance="outline" class="full-width premium-field">
              <input matInput type="number" formControlName="numberOfBedrooms" />
              <mat-icon matPrefix>bed</mat-icon>
            </mat-form-field>
          </div>
          <div class="form-section">
            <label class="section-label">Hammom</label>
            <mat-form-field appearance="outline" class="full-width premium-field">
              <input matInput type="number" formControlName="numberOfBathrooms" />
              <mat-icon matPrefix>bathtub</mat-icon>
            </mat-form-field>
          </div>
        </div>

        <div class="form-footer">
          <button mat-button type="button" class="btn-cancel" (click)="onCancel()">Bekor qilish</button>
          <button mat-flat-button class="btn-continue" (click)="onNext()">
            Davom etish
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .step-wrapper {
      max-width: 800px;
      margin: 0 auto;
    }

    .section-header {
      margin-bottom: 40px;
    }

    .section-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .section-header p {
      color: #64748b;
      font-size: 1.1rem;
      margin-top: 8px;
    }

    .premium-form {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .section-label {
      display: block;
      font-size: 0.95rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .choice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
    }

    .choice-grid.columns-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    .choice-card {
      background: white;
      border: 2px solid #f1f5f9;
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .choice-card:hover {
      border-color: #6366f1;
      background: #f8faff;
      transform: translateY(-2px);
    }

    .choice-card.active {
      border-color: #6366f1;
      background: #f5f3ff;
      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.1);
    }

    .choice-card.small {
      padding: 16px;
    }

    .choice-icon {
      width: 48px;
      height: 48px;
      background: #f1f5f9;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.3s ease;
    }

    .active .choice-icon {
      background: #6366f1;
      color: white;
    }

    .choice-label {
      font-weight: 600;
      color: #334155;
      font-size: 0.95rem;
    }

    .choice-check {
      position: absolute;
      top: 12px;
      right: 12px;
      color: #6366f1;
    }

    .row-grid {
      display: flex;
      gap: 20px;
    }

    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }

    .full-width { width: 100%; }

    ::ng-deep .premium-field .mat-mdc-text-field-wrapper {
      background-color: white !important;
      border-radius: 16px !important;
      transition: all 0.3s ease !important;
    }

    ::ng-deep .premium-field.mat-focused .mat-mdc-text-field-wrapper {
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
    }

    .price-input input {
      font-size: 1.5rem !important;
      font-weight: 800 !important;
      color: #6366f1 !important;
    }

    .currency-tag {
      font-weight: 800;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
    }

    .form-footer {
      margin-top: 40px;
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

    .btn-cancel {
      height: 56px;
      padding: 0 32px;
      color: #64748b;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .row-grid { flex-direction: column; }
      .choice-grid.columns-3 { grid-template-columns: 1fr; }
    }
  `]
})
export class StepBasicInfoComponent {
  @Input() form!: FormGroup;
  @Output() stepComplete = new EventEmitter<boolean>();
  @Output() cancel = new EventEmitter<void>();

  propertyTypes = [
    { value: 'Apartment', label: 'Kvartira', icon: 'apartment' },
    { value: 'House', label: 'Hovli / Uy', icon: 'home' },
    { value: 'Office', label: 'Ofis', icon: 'business' },
    { value: 'Shop', label: 'Do\'kon', icon: 'storefront' },
    { value: 'Land', label: 'Yer', icon: 'landscape' },
    { value: 'Other', label: 'Boshqa', icon: 'more_horiz' },
  ];

  listingTypes = [
    { value: 'Sale', label: 'Sotish' },
    { value: 'Rent', label: 'Ijara (Oylik)' },
    { value: 'ShortTermRent', label: 'Kunlik ijara' },
  ];

  selectType(value: string) {
    this.form.patchValue({ type: value });
  }

  selectListingType(value: string) {
    this.form.patchValue({ listingType: value });
  }

  getActivePriceControl(): string {
    const type = this.form.get('listingType')?.value;
    if (type === 'Sale') return 'salePrice';
    if (type === 'Rent') return 'monthlyRent';
    if (type === 'ShortTermRent') return 'pricePerNight';
    return 'salePrice';
  }

  onNext() {
    if (this.form.valid) {
      this.stepComplete.emit(true);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}

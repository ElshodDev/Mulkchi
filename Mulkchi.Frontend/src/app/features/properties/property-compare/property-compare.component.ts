import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { ComparisonService } from '../../../core/services/comparison.service';

@Component({
  selector: 'app-property-compare',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink
  ],
  template: `
    <div class="compare-container">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <h1>
            <mat-icon>compare</mat-icon>
            Mulklarni Solishtirish
          </h1>
          <p>Tanlangan mulklarning asosiy ko'rsatkichlarini bir-biri bilan solishtiring (Maksimal 4 ta)</p>
          
          <div class="header-actions" *ngIf="!comparisonService.isEmpty()">
            <button mat-stroked-button color="warn" (click)="comparisonService.clear()">
              <mat-icon>delete_sweep</mat-icon>
              Hammasini tozalash
            </button>
          </div>
        </div>

        @if (comparisonService.isEmpty()) {
          <div class="empty-state">
            <mat-icon class="empty-icon">compare_arrows</mat-icon>
            <h3>Solishtirish uchun mulklar tanlanmagan</h3>
            <p>Mulklar ro'yxatidan o'zingizga ma'qul bo'lganlarini tanlang va solishtiring</p>
            <button mat-raised-button color="primary" routerLink="/properties">
              Mulk qidirishga o'tish
            </button>
          </div>
        } @else {
          <div class="compare-grid" [style.grid-template-columns]="'200px repeat(' + comparisonService.count() + ', 1fr)'">
            <!-- Sidebar labels -->
            <div class="compare-sidebar">
              <div class="feature-label header-row">Xususiyatlar</div>
              <div class="feature-label">Rasm</div>
              <div class="feature-label">Narxi</div>
              <div class="feature-label">Manzil</div>
              <div class="feature-label">Turi</div>
              <div class="feature-label">Maydoni</div>
              <div class="feature-label">Xonalar</div>
              <div class="feature-label">Qavat</div>
              <div class="feature-label">Qulayliklar</div>
              <div class="feature-label actions-row">Amallar</div>
            </div>

            <!-- Property columns -->
            @for (property of comparisonService.selectedProperties(); track property.id) {
              <div class="compare-column">
                <!-- Header (Title) -->
                <div class="compare-cell header-row">
                  <span class="property-title">{{ property.title }}</span>
                  <button mat-icon-button color="warn" (click)="comparisonService.removeFromCompare(property.id)" class="remove-btn">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>

                <!-- Image -->
                <div class="compare-cell image-cell">
                  <img [src]="property.images && property.images.length > 0 ? property.images[0].url : 'assets/no-image.png'" [alt]="property.title">
                </div>

                <!-- Price -->
                <div class="compare-cell price-cell">
                  <span class="price">
                    {{ property.listingType === 'Sale' ? formatCurrency(property.salePrice || 0) : formatCurrency(property.monthlyRent || 0) + ' / oy' }}
                  </span>
                </div>

                <!-- Address -->
                <div class="compare-cell">
                  {{ property.city }}, {{ property.district }}
                </div>

                <!-- Type -->
                <div class="compare-cell">
                  {{ property.type }} ({{ property.listingType }})
                </div>

                <!-- Area -->
                <div class="compare-cell">
                  {{ property.area }} m²
                </div>

                <!-- Rooms -->
                <div class="compare-cell">
                  {{ property.numberOfBedrooms }} xona
                </div>

                <!-- Floor -->
                <div class="compare-cell">
                  {{ property.floor }} / {{ property.totalFloors }}
                </div>

                <!-- Amenities -->
                <div class="compare-cell amenities-cell">
                  <div class="amenity-tags">
                    <span *ngIf="property.hasWifi" class="tag"><mat-icon>wifi</mat-icon> WiFi</span>
                    <span *ngIf="property.hasAirConditioning" class="tag"><mat-icon>ac_unit</mat-icon> AC</span>
                    <span *ngIf="property.hasFurniture" class="tag"><mat-icon>chair</mat-icon> Mebel</span>
                    <span *ngIf="property.hasParking" class="tag"><mat-icon>local_parking</mat-icon> Avto</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="compare-cell actions-row">
                  <button mat-raised-button color="primary" [routerLink]="['/properties', property.id]">
                    Batafsil
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .compare-container {
      min-height: calc(100vh - 64px);
      background-color: #f8fafc;
      padding: 40px 0;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .page-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .page-header h1 mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #3b82f6;
    }

    .header-actions {
      margin-top: 20px;
    }

    .empty-state {
      text-align: center;
      padding: 100px 0;
      background: white;
      border-radius: 24px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .empty-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #cbd5e1;
      margin-bottom: 24px;
    }

    .compare-grid {
      display: grid;
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      border: 1px solid #e2e8f0;
    }

    .compare-sidebar {
      background-color: #f1f5f9;
      border-right: 1px solid #e2e8f0;
    }

    .feature-label {
      padding: 20px;
      font-weight: 600;
      color: #475569;
      height: 80px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
    }

    .compare-column {
      border-right: 1px solid #e2e8f0;
      position: relative;
    }

    .compare-cell {
      padding: 20px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }

    .header-row {
      height: 100px;
      background-color: #f8fafc;
      font-weight: 700;
    }

    .property-title {
      font-size: 1rem;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .remove-btn {
      position: absolute;
      top: 5px;
      right: 5px;
    }

    .image-cell {
      height: 180px;
    }

    .image-cell img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }

    .feature-label:nth-child(2), .image-cell { height: 180px; }

    .price-cell {
      background-color: #f0f9ff;
    }

    .price {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0369a1;
    }

    .amenities-cell {
      height: 150px;
    }

    .feature-label:nth-child(9), .amenities-cell { height: 150px; }

    .amenity-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }

    .tag {
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .tag mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .actions-row {
      height: 100px;
      border-bottom: none;
    }

    .feature-label:last-child { border-bottom: none; }
  `]
})
export class PropertyCompareComponent {
  public comparisonService = inject(ComparisonService);

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
}

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property, PropertyResponse } from '../../../core/models';

@Component({
  selector: 'app-property-compare',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
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
          <p>Ikkita mulkni tanlab ularning xususiyatlarini solishtiring</p>
          
          @if (hasSelectedProperties()) {
            <div class="header-actions">
              <button mat-stroked-button color="warn" (click)="clearSelection()">
                <mat-icon>delete_sweep</mat-icon>
                Tanlovi tozalash
              </button>
            </div>
          }
        </div>

        <!-- Step 1: Select Properties -->
        @if (!canCompare()) {
          <div class="selection-phase">
            <div class="selection-header">
              <h2>
                @if (selectedCount() === 0) {
                  Solishtirish uchun 2 ta mulk tanlang
                } @else {
                  Yana 1 ta mulk tanlang ({{ selectedCount() }}/2)
                }
              </h2>
              <p>Barcha mulklardan o'zingizga ma'qul keladigan 2 tasini tanlang</p>
            </div>

            @if (loading()) {
              <div class="loading-container">
                <mat-spinner diameter="50"></mat-spinner>
                <p>Mulklar yuklanmoqda...</p>
              </div>
            } @else if (properties().length === 0) {
              <div class="empty-state">
                <mat-icon class="empty-icon">home</mat-icon>
                <h3>Hozircha mulklar mavjud emas</h3>
                <button mat-raised-button color="primary" routerLink="/properties">
                  <mat-icon>search</mat-icon>
                  Mulk qidirish
                </button>
              </div>
            } @else {
              <div class="properties-grid">
                @for (property of properties(); track property.id) {
                  <mat-card class="property-card" 
                            [class.selected]="isSelected(property.id)"
                            (click)="toggleSelection(property)">
                    <div class="property-image">
                      @if (property.images && property.images.length > 0) {
                        <img [src]="property.images[0].url || property.images[0].imageUrl" [alt]="property.title">
                      } @else {
                        <div class="no-image">
                          <mat-icon>home</mat-icon>
                        </div>
                      }
                      @if (isSelected(property.id)) {
                        <div class="selection-badge">
                          <mat-icon>check_circle</mat-icon>
                          <span>{{ getSelectionOrder(property.id) }}</span>
                        </div>
                      }
                    </div>
                    <mat-card-content>
                      <h3 class="property-title">{{ property.title }}</h3>
                      <p class="property-location">{{ property.city }}, {{ property.district }}</p>
                      <div class="property-price">
                        @if (property.salePrice) {
                          <span>{{ formatCurrency(property.salePrice) }}</span>
                        } @else if (property.monthlyRent) {
                          <span>{{ formatCurrency(property.monthlyRent) }} / oy</span>
                        }
                      </div>
                      <div class="property-features">
                        <span>{{ property.area }} m²</span>
                        <span>{{ property.numberOfBedrooms }} xona</span>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            }
          </div>
        }

        <!-- Step 2: Comparison Table -->
        @if (canCompare()) {
          <div class="comparison-result">
            <div class="comparison-header">
              <h2>Solishtirish natijasi</h2>
              <button mat-stroked-button color="primary" (click)="changeSelection()">
                <mat-icon>swap_horiz</mat-icon>
                Boshqa mulklar tanlash
              </button>
            </div>

            <div class="compare-table-container">
              <table class="compare-table">
                <thead>
                  <tr>
                    <th class="feature-col">Xususiyat</th>
                    <th class="property-col">
                      <div class="property-header">
                        <img [src]="firstSelected()?.images?.[0]?.url || firstSelected()?.images?.[0]?.imageUrl || 'assets/no-image.png'" 
                             [alt]="firstSelected()?.title">
                        <span>{{ firstSelected()?.title }}</span>
                      </div>
                    </th>
                    <th class="property-col">
                      <div class="property-header">
                        <img [src]="secondSelected()?.images?.[0]?.url || secondSelected()?.images?.[0]?.imageUrl || 'assets/no-image.png'" 
                             [alt]="secondSelected()?.title">
                        <span>{{ secondSelected()?.title }}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="feature-name">Narx</td>
                    <td class="value-cell" [class.highlight]="isBetterPrice(firstSelected(), secondSelected())">
                      {{ firstSelected()?.salePrice ? formatCurrency(firstSelected()!.salePrice!) : formatCurrency(firstSelected()!.monthlyRent || 0) }}
                      @if (firstSelected()?.monthlyRent) { <small>/oy</small> }
                    </td>
                    <td class="value-cell" [class.highlight]="isBetterPrice(secondSelected(), firstSelected())">
                      {{ secondSelected()?.salePrice ? formatCurrency(secondSelected()!.salePrice!) : formatCurrency(secondSelected()!.monthlyRent || 0) }}
                      @if (secondSelected()?.monthlyRent) { <small>/oy</small> }
                    </td>
                  </tr>
                  <tr>
                    <td class="feature-name">Manzil</td>
                    <td class="value-cell">{{ firstSelected()?.city }}, {{ firstSelected()?.district }}</td>
                    <td class="value-cell">{{ secondSelected()?.city }}, {{ secondSelected()?.district }}</td>
                  </tr>
                  <tr>
                    <td class="feature-name">Maydon</td>
                    <td class="value-cell" [class.highlight]="(firstSelected()?.area || 0) >= (secondSelected()?.area || 0)">
                      {{ firstSelected()?.area }} m²
                    </td>
                    <td class="value-cell" [class.highlight]="(secondSelected()?.area || 0) >= (firstSelected()?.area || 0)">
                      {{ secondSelected()?.area }} m²
                    </td>
                  </tr>
                  <tr>
                    <td class="feature-name">Xonalar</td>
                    <td class="value-cell">{{ firstSelected()?.numberOfBedrooms }}</td>
                    <td class="value-cell">{{ secondSelected()?.numberOfBedrooms }}</td>
                  </tr>
                  <tr>
                    <td class="feature-name">Hammom</td>
                    <td class="value-cell">{{ firstSelected()?.numberOfBathrooms }}</td>
                    <td class="value-cell">{{ secondSelected()?.numberOfBathrooms }}</td>
                  </tr>
                  <tr>
                    <td class="feature-name">Qavat</td>
                    <td class="value-cell">{{ getFloorInfo(firstSelected()) }}</td>
                    <td class="value-cell">{{ getFloorInfo(secondSelected()) }}</td>
                  </tr>
                  <tr>
                    <td class="feature-name">Reyting</td>
                    <td class="value-cell" [class.highlight]="(firstSelected()?.averageRating || 0) >= (secondSelected()?.averageRating || 0)">
                      <mat-icon>star</mat-icon> {{ firstSelected()?.averageRating }}
                    </td>
                    <td class="value-cell" [class.highlight]="(secondSelected()?.averageRating || 0) >= (firstSelected()?.averageRating || 0)">
                      <mat-icon>star</mat-icon> {{ secondSelected()?.averageRating }}
                    </td>
                  </tr>
                  <tr>
                    <td class="feature-name">WiFi</td>
                    <td class="value-cell">
                      <mat-icon [class.has-feature]="firstSelected()?.hasWifi">{{ firstSelected()?.hasWifi ? 'check_circle' : 'cancel' }}</mat-icon>
                    </td>
                    <td class="value-cell">
                      <mat-icon [class.has-feature]="secondSelected()?.hasWifi">{{ secondSelected()?.hasWifi ? 'check_circle' : 'cancel' }}</mat-icon>
                    </td>
                  </tr>
                  <tr>
                    <td class="feature-name">Konditsioner</td>
                    <td class="value-cell">
                      <mat-icon [class.has-feature]="firstSelected()?.hasAirConditioning">{{ firstSelected()?.hasAirConditioning ? 'check_circle' : 'cancel' }}</mat-icon>
                    </td>
                    <td class="value-cell">
                      <mat-icon [class.has-feature]="secondSelected()?.hasAirConditioning">{{ secondSelected()?.hasAirConditioning ? 'check_circle' : 'cancel' }}</mat-icon>
                    </td>
                  </tr>
                  <tr>
                    <td class="feature-name">Mebel</td>
                    <td class="value-cell">
                      <mat-icon [class.has-feature]="firstSelected()?.hasFurniture">{{ firstSelected()?.hasFurniture ? 'check_circle' : 'cancel' }}</mat-icon>
                    </td>
                    <td class="value-cell">
                      <mat-icon [class.has-feature]="secondSelected()?.hasFurniture">{{ secondSelected()?.hasFurniture ? 'check_circle' : 'cancel' }}</mat-icon>
                    </td>
                  </tr>
                  <tr>
                    <td class="feature-name">Avtoturargoh</td>
                    <td class="value-cell">
                      <mat-icon [class.has-feature]="firstSelected()?.hasParking">{{ firstSelected()?.hasParking ? 'check_circle' : 'cancel' }}</mat-icon>
                    </td>
                    <td class="value-cell">
                      <mat-icon [class.has-feature]="secondSelected()?.hasParking">{{ secondSelected()?.hasParking ? 'check_circle' : 'cancel' }}</mat-icon>
                    </td>
                  </tr>
                  <tr class="action-row">
                    <td></td>
                    <td>
                      <button mat-raised-button color="primary" [routerLink]="['/properties', firstSelected()?.id]">
                        Batafsil
                      </button>
                    </td>
                    <td>
                      <button mat-raised-button color="primary" [routerLink]="['/properties', secondSelected()?.id]">
                        Batafsil
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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

    .empty-state .button-group {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .empty-state button {
      display: flex;
      align-items: center;
      gap: 8px;
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

    /* Selection Phase Styles */
    .selection-phase {
      animation: fadeIn 0.3s ease;
    }

    .selection-header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .selection-header h2 {
      font-size: 1.75rem;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .selection-header p {
      color: #64748b;
      font-size: 1rem;
    }

    .loading-container {
      text-align: center;
      padding: 100px 0;
      color: #64748b;
    }

    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
    }

    .property-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 3px solid transparent;
      position: relative;
    }

    .property-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    }

    .property-card.selected {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
    }

    .property-image {
      position: relative;
      height: 180px;
      overflow: hidden;
    }

    .property-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      width: 100%;
      height: 100%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .no-image mat-icon {
      font-size: 48px;
      color: #94a3b8;
    }

    .selection-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      animation: scaleIn 0.2s ease;
    }

    .selection-badge mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .property-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 12px 0 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .property-location {
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .property-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 8px;
    }

    .property-features {
      display: flex;
      gap: 12px;
      color: #64748b;
      font-size: 0.85rem;
    }

    /* Comparison Table Styles */
    .comparison-result {
      animation: fadeIn 0.4s ease;
    }

    .comparison-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 20px 0;
    }

    .comparison-header h2 {
      font-size: 1.5rem;
      color: #1e293b;
      margin: 0;
    }

    .compare-table-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .compare-table {
      width: 100%;
      border-collapse: collapse;
    }

    .compare-table th,
    .compare-table td {
      padding: 20px;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }

    .compare-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #1e293b;
    }

    .feature-col {
      width: 200px;
      text-align: left !important;
      background: #f1f5f9;
      font-weight: 600;
      color: #475569;
    }

    .property-col {
      width: calc((100% - 200px) / 2);
    }

    .property-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .property-header img {
      width: 120px;
      height: 90px;
      object-fit: cover;
      border-radius: 8px;
    }

    .property-header span {
      font-size: 1rem;
      font-weight: 600;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .feature-name {
      text-align: left;
      font-weight: 500;
      color: #64748b;
    }

    .value-cell {
      font-size: 1rem;
      color: #334155;
    }

    .value-cell.highlight {
      background: #dcfce7;
      color: #166534;
      font-weight: 600;
    }

    .value-cell mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .value-cell mat-icon.has-feature {
      color: #22c55e;
    }

    .value-cell mat-icon:not(.has-feature) {
      color: #ef4444;
    }

    .action-row td {
      padding: 24px;
      border-bottom: none;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes scaleIn {
      from { transform: scale(0); }
      to { transform: scale(1); }
    }
  `]
})
export class PropertyCompareComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private snackBar = inject(MatSnackBar);

  // State signals
  private _properties = signal<PropertyResponse[]>([]);
  private _selectedIds = signal<string[]>([]);
  private _loading = signal<boolean>(false);

  // Computed signals
  properties = computed(() => this._properties());
  selectedIds = computed(() => this._selectedIds());
  loading = computed(() => this._loading());
  selectedCount = computed(() => this._selectedIds().length);
  canCompare = computed(() => this._selectedIds().length === 2);
  hasSelectedProperties = computed(() => this._selectedIds().length > 0);

  firstSelected = computed(() => {
    const ids = this._selectedIds();
    if (ids.length < 1) return null;
    return this._properties().find(p => p.id === ids[0]) || null;
  });

  secondSelected = computed(() => {
    const ids = this._selectedIds();
    if (ids.length < 2) return null;
    return this._properties().find(p => p.id === ids[1]) || null;
  });

  // Helper to get floor display
  getFloorInfo(property: PropertyResponse | null): string {
    if (!property) return '-';
    if (property.floor && property.totalFloors) {
      return `${property.floor} / ${property.totalFloors}`;
    }
    if (property.floor) {
      return `${property.floor}`;
    }
    return '-';
  }

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this._loading.set(true);
    this.propertyService.getAllProperties(1, 50).subscribe({
      next: (result) => {
        this._properties.set(result.items);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this.snackBar.open('Mulklarni yuklashda xatolik yuz berdi', 'OK', { duration: 3000 });
      }
    });
  }

  isSelected(propertyId: string): boolean {
    return this._selectedIds().includes(propertyId);
  }

  getSelectionOrder(propertyId: string): number {
    return this._selectedIds().indexOf(propertyId) + 1;
  }

  toggleSelection(property: PropertyResponse): void {
    const currentIds = this._selectedIds();
    const index = currentIds.indexOf(property.id);

    if (index > -1) {
      // Deselect
      this._selectedIds.set(currentIds.filter(id => id !== property.id));
    } else if (currentIds.length < 2) {
      // Select (max 2)
      this._selectedIds.set([...currentIds, property.id]);

      if (this._selectedIds().length === 2) {
        this.snackBar.open('Ikkala mulk tanlandi! Solishtirishni boshlash mumkin', 'OK', { duration: 2000 });
      }
    } else {
      // Already 2 selected
      this.snackBar.open('Faqat 2 ta mulkni solishtirish mumkin', 'OK', { duration: 2000 });
    }
  }

  clearSelection(): void {
    this._selectedIds.set([]);
  }

  changeSelection(): void {
    this.clearSelection();
  }

  isBetterPrice(first: PropertyResponse | null, second: PropertyResponse | null): boolean {
    if (!first || !second) return false;
    const firstPrice = first.salePrice || first.monthlyRent || 0;
    const secondPrice = second.salePrice || second.monthlyRent || 0;
    return firstPrice > 0 && (secondPrice === 0 || firstPrice < secondPrice);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0
    }).format(value);
  }
}

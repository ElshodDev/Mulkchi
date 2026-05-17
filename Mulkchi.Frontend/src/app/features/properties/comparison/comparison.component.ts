import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { ComparisonService } from '../../../core/services/comparison.service';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';

import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule, MatDividerModule, RouterLink, MatChipsModule],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        query('.compare-col', [
          style({ opacity: 0, transform: 'translateX(20px)' }),
          stagger(100, [
            animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="compare-page">
      <div class="container py-12">
        <!-- Header -->
        <header class="mb-12 flex justify-between items-end">
          <div>
            <h1 class="text-4xl font-black text-slate-900 mb-2">Mulklarni <span class="text-blue-700">Solishtirish</span></h1>
            <p class="text-slate-500">Tanlangan mulklarning texnik ko'rsatkichlarini yonma-yon taqqoslang</p>
          </div>
          @if (!comparisonService.isEmpty()) {
            <button mat-stroked-button color="warn" (click)="comparisonService.clear()" class="!rounded-xl">
              <mat-icon>delete_sweep</mat-icon> Ro'yxatni tozalash
            </button>
          }
        </header>

        @if (comparisonService.isEmpty()) {
          <div class="empty-state text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <mat-icon class="!text-4xl text-slate-300">compare</mat-icon>
            </div>
            <h2 class="text-2xl font-bold text-slate-900 mb-2">Solishtirish uchun mulk tanlanmagan</h2>
            <p class="text-slate-500 mb-8">E'lonlar ro'yxatidan o'zingizga ma'qul uylarni solishtirishga qo'shing</p>
            <button mat-flat-button color="primary" routerLink="/properties" class="!px-8 !py-6 !rounded-2xl !font-bold">
              Mulklarni ko'rish
            </button>
          </div>
        } @else {
          <div class="compare-grid-wrapper overflow-x-auto pb-8" @listAnimation>
            <div class="compare-table min-w-[800px]">
              <!-- Labels Column -->
              <div class="labels-col sticky left-0 z-20 bg-slate-50/80 backdrop-blur-sm border-r border-slate-200 pt-[320px]">
                @for (label of compareLabels; track label.key) {
                  <div class="label-row">{{ label.title }}</div>
                }
              </div>

              <!-- Property Columns -->
              @for (prop of comparisonService.selectedProperties(); track prop.id) {
                <div class="compare-col">
                  <!-- Property Card (Header) -->
                  <div class="prop-header mb-6 relative group">
                    <button class="remove-btn" (click)="comparisonService.removeFromCompare(prop.id)">
                      <mat-icon>close</mat-icon>
                    </button>
                    <div class="aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-sm">
                      <img [src]="getImg(prop)" [alt]="prop.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    </div>
                    <h3 class="font-bold text-slate-900 truncate px-2" [title]="prop.title">{{ prop.title }}</h3>
                    <div class="text-blue-700 font-black text-lg px-2">{{ prop.salePrice || prop.monthlyRent | number }} UZS</div>
                    <div class="px-2 mt-4">
                        <button mat-flat-button color="primary" [routerLink]="['/properties', prop.id]" class="w-full !rounded-xl !text-xs !py-1">Ko'rish</button>
                    </div>
                  </div>

                  <!-- Property Attributes -->
                  @for (label of compareLabels; track label.key) {
                    <div class="value-row">
                      @if (label.key === 'type') {
                        <mat-chip class="!bg-blue-50 !text-blue-700 !font-bold">{{ prop.type }}</mat-chip>
                      } @else if (label.key === 'area') {
                        <span class="font-bold">{{ prop.area }} m²</span>
                      } @else if (label.key === 'rooms') {
                        <span class="font-bold">{{ prop.numberOfBedrooms }} xona</span>
                      } @else if (label.key === 'bathrooms') {
                        <span>{{ prop.numberOfBathrooms }} ta</span>
                      } @else if (label.key === 'location') {
                        <span class="text-xs text-slate-600 line-clamp-2">{{ prop.city }}, {{ prop.district }}</span>
                      } @else if (label.key === 'features') {
                        <div class="flex flex-wrap gap-1 justify-center">
                            @if (prop.hasWifi) { <mat-icon class="!text-sm text-green-500" matTooltip="WiFi">wifi</mat-icon> }
                            @if (prop.hasParking) { <mat-icon class="!text-sm text-blue-500" matTooltip="Parking">local_parking</mat-icon> }
                            @if (prop.hasElevator) { <mat-icon class="!text-sm text-slate-500" matTooltip="Elevator">elevator</mat-icon> }
                        </div>
                      } @else {
                        <span>-</span>
                      }
                    </div>
                  }
                </div>
              }

              <!-- Add More Column (if < 4) -->
              @if (comparisonService.count() < 4) {
                <div class="add-col flex flex-col items-center justify-center pt-[320px] opacity-40 hover:opacity-100 transition-opacity">
                    <button class="w-16 h-16 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center mb-4 text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-colors" routerLink="/properties">
                        <mat-icon class="!text-3xl">add</mat-icon>
                    </button>
                    <span class="text-xs font-bold text-slate-500">Yana qo'shish</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .compare-page {
      min-height: 100vh;
      background: #f8fafc;
    }

    .compare-grid-wrapper {
      background: white;
      border-radius: 32px;
      padding: 32px;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
      border: 1px solid #f1f5f9;
    }

    .compare-table {
      display: flex;
    }

    .labels-col {
      width: 180px;
      flex-shrink: 0;
    }

    .compare-col {
      width: 260px;
      flex-shrink: 0;
      padding: 0 16px;
      border-right: 1px solid #f1f5f9;
      transition: background 0.3s;
    }

    .compare-col:hover {
      background: #f8fafc;
    }

    .add-col {
        width: 200px;
        flex-shrink: 0;
    }

    .label-row, .value-row {
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-size: 14px;
    }

    .label-row {
      font-weight: 600;
      color: #64748b;
    }

    .value-row {
      justify-content: center;
      text-align: center;
      color: #0f172a;
    }

    .prop-header {
        height: 320px;
    }

    .remove-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 32px;
        height: 32px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.2s;
    }

    .compare-col:hover .remove-btn {
        opacity: 1;
        transform: scale(1);
    }

    .remove-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    @media (max-width: 640px) {
        .labels-col { width: 120px; font-size: 12px; }
        .compare-col { width: 200px; }
    }
  `]
})
export class ComparisonComponent {
  comparisonService = inject(ComparisonService);
  private imageService = inject(ImageOptimizationService);

  compareLabels = [
    { key: 'type', title: 'Mulk turi' },
    { key: 'area', title: 'Maydoni' },
    { key: 'rooms', title: 'Xonalar soni' },
    { key: 'bathrooms', title: 'Hammom' },
    { key: 'location', title: 'Joylashuvi' },
    { key: 'features', title: 'Qulayliklar' }
  ];

  getImg(prop: any): string {
    const url = prop.images?.[0]?.url || prop.images?.[0]?.imageUrl || '';
    return this.imageService.getOptimizedImage(url, 400, 300);
  }
}

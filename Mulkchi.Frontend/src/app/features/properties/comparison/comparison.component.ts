import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import {
  ComparisonService,
  ComparisonResult,
  PropertyComparisonDetail,
} from '../../../core/services/comparison.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    RouterLink,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  animations: [
    trigger('listAnimation', [
      transition(':enter', [
        query(
          '.compare-col',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(100, [
              animate(
                '400ms cubic-bezier(0.16, 1, 0.3, 1)',
                style({ opacity: 1, transform: 'translateY(0)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="compare-page">
      <div class="container py-12">
        <!-- Header -->
        <header class="compare-header">
          <div class="header-titles">
            <h1 class="page-title">Mulklarni <span class="highlight-text">Solishtirish</span></h1>
            <p class="page-subtitle">
              Tanlangan mulklarning texnik va moliyaviy ko'rsatkichlarini yonma-yon taqqoslang
            </p>
          </div>
          @if (!comparisonService.isEmpty()) {
            <button
              mat-stroked-button
              color="warn"
              (click)="comparisonService.clear()"
              class="btn-clear-all"
            >
              <mat-icon>delete_sweep</mat-icon>
              <span>Ro'yxatni tozalash</span>
            </button>
          }
        </header>

        @if (comparisonService.isEmpty()) {
          <div class="empty-state">
            <div class="icon-circle">
              <mat-icon>compare</mat-icon>
            </div>
            <h2 class="empty-title">Solishtirish uchun mulk tanlanmagan</h2>
            <p class="empty-desc">
              E'lonlar ro'yxatidan o'zingizga ma'qul uylarni solishtirishga qo'shing
            </p>
            <button mat-flat-button color="primary" routerLink="/properties" class="btn-explore">
              <mat-icon>travel_explore</mat-icon>
              <span>Mulklarni ko'rish va qidirish</span>
            </button>
          </div>
        } @else {
          <!-- AI Summary Alert -->
          @if (apiResult()) {
            <div class="ai-summary-alert" @fadeAnimation>
              <div class="ai-icon"><mat-icon>auto_awesome</mat-icon></div>
              <div class="ai-content">
                <h3>Sun'iy intellekt tahlili</h3>
                <p [innerHTML]="formatSummary(apiResult()!.summary)"></p>
                <div class="recommendation-badge">
                  <mat-icon>verified</mat-icon>
                  <span>{{ apiResult()!.recommendation }}</span>
                </div>
              </div>
            </div>
          } @else if (isLoading()) {
            <div class="ai-loading">
              <mat-spinner diameter="24"></mat-spinner>
              <span>Bozor narxlari va tahlillar yuklanmoqda...</span>
            </div>
          }

          <div class="compare-grid-wrapper" @listAnimation>
            <div class="compare-table">
              <!-- Labels Column (Fixed on Left) -->
              <div class="labels-col sticky-col">
                <div class="prop-header-spacer">
                  <span class="lbl-summary"
                    >Taqqoslash jadvali ({{ comparisonService.count() }} / 4)</span
                  >
                </div>
                @for (label of compareLabels; track label.key) {
                  <div
                    class="label-cell"
                    [class.highlight-label]="label.key === 'valueRating' || label.key === 'score'"
                  >
                    {{ label.title }}
                  </div>
                }
              </div>

              <!-- Property Columns -->
              <div class="properties-container">
                @for (prop of comparisonService.selectedProperties(); track prop.id) {
                  <div class="compare-col">
                    <!-- Property Card (Header) -->
                    <div class="prop-header">
                      <button
                        class="remove-btn"
                        (click)="removeProperty(prop.id)"
                        matTooltip="Solishtirishdan olib tashlash"
                      >
                        <mat-icon>close</mat-icon>
                      </button>
                      <div class="img-frame" (click)="viewProperty(prop.id)">
                        <img [src]="getImg(prop)" [alt]="prop.title" (error)="onImgError($event)" />
                        <!-- WARNING FIXED: prop.listingType?.toLowerCase() replaced with safe check -->
                        <div class="listing-badge" [class]="(prop.listingType || '').toLowerCase()">
                          {{ getListingLabel(prop.listingType) }}
                        </div>
                      </div>
                      <h3 class="prop-title" [title]="prop.title" (click)="viewProperty(prop.id)">
                        {{ prop.title }}
                      </h3>
                      <div class="prop-price">
                        {{ formatPrice(prop.salePrice || prop.monthlyRent || prop.pricePerNight) }}
                      </div>
                      <div class="action-wrap">
                        <button
                          mat-flat-button
                          color="primary"
                          [routerLink]="['/properties', prop.id]"
                          class="btn-view-prop"
                        >
                          Batafsil ko'rish
                        </button>
                      </div>
                    </div>

                    <!-- Property Attributes -->
                    <div class="attr-rows">
                      <div class="value-cell">
                        <mat-chip class="custom-chip">{{ getTypeName(prop.type) }}</mat-chip>
                      </div>
                      <div class="value-cell highlight">
                        <span
                          ><strong>{{ prop.area }}</strong> m²</span
                        >
                      </div>
                      <div class="value-cell font-medium">
                        <span
                          ><strong>{{ prop.numberOfBedrooms || 1 }}</strong> ta yotoqxona</span
                        >
                      </div>
                      <div class="value-cell font-medium">
                        <span
                          ><strong>{{ prop.numberOfBathrooms || 1 }}</strong> ta hammom</span
                        >
                      </div>
                      <div
                        class="value-cell location-text"
                        [title]="prop.city + ', ' + prop.district"
                      >
                        <span>{{ prop.city || 'Toshkent' }}, {{ prop.district || 'Markaz' }}</span>
                      </div>
                      <div class="value-cell features-wrap">
                        <div class="feature-icons">
                          <span [class.active]="prop.hasWifi" matTooltip="Yuqori tezlikdagi WiFi"
                            ><mat-icon>wifi</mat-icon></span
                          >
                          <span [class.active]="prop.hasParking" matTooltip="Avtoturargoh"
                            ><mat-icon>local_parking</mat-icon></span
                          >
                          <span [class.active]="prop.hasElevator" matTooltip="Lift mavjud"
                            ><mat-icon>elevator</mat-icon></span
                          >
                          <span [class.active]="prop.hasAirConditioning" matTooltip="Konditsioner"
                            ><mat-icon>ac_unit</mat-icon></span
                          >
                        </div>
                      </div>

                      <!-- AI SMART DATA CELLS -->
                      <div class="value-cell score-cell">
                        @if (getAiDetail(prop.id); as detail) {
                          <div
                            class="score-circle"
                            [class.high]="detail.score >= 80"
                            [class.medium]="detail.score >= 60 && detail.score < 80"
                            [class.low]="detail.score < 60"
                          >
                            {{ detail.score }}
                          </div>
                        } @else {
                          <span class="text-gray-400">-</span>
                        }
                      </div>
                      <div class="value-cell value-rating-cell">
                        @if (getAiDetail(prop.id); as detail) {
                          <span
                            class="rating-badge"
                            [class.great]="detail.valueRating.includes('Arzon')"
                            [class.premium]="detail.valueRating.includes('Premium')"
                            [class.avg]="detail.valueRating.includes('rtacha')"
                          >
                            {{ detail.valueRating }}
                          </span>
                        } @else {
                          <span class="text-gray-400">-</span>
                        }
                      </div>
                    </div>
                  </div>
                }

                <!-- Add More Column (if < 4) -->
                @if (comparisonService.count() < 4) {
                  <div class="add-col">
                    <div class="add-box" routerLink="/properties" matTooltip="Yana mulk qo'shish">
                      <div class="add-circle"><mat-icon>add</mat-icon></div>
                      <span class="add-lbl">Yana mulk qo'shish</span>
                      <span class="add-sub"
                        >{{ 4 - comparisonService.count() }} ta o'rin bo'sh</span
                      >
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background-color: #f8fafc;
        font-family: 'Inter', sans-serif;
        color: #0f172a;
      }

      .container {
        max-width: 1320px;
        margin: 0 auto;
        padding: 40px 24px;
      }

      .compare-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 30px;
        flex-wrap: wrap;
        gap: 20px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
      }
      .header-titles {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .page-title {
        font-size: 2.5rem;
        font-weight: 900;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.5px;
      }
      .highlight-text {
        color: #1e40af;
      }
      .page-subtitle {
        font-size: 1.1rem;
        color: #64748b;
        margin: 0;
      }

      .btn-clear-all {
        border-radius: 16px !important;
        height: 48px !important;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }

      .ai-summary-alert {
        background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 32px;
        display: flex;
        gap: 20px;
        border: 1px solid #c7d2fe;
        box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.1);
      }
      .ai-icon {
        width: 48px;
        height: 48px;
        background: #4f46e5;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }
      .ai-content h3 {
        font-size: 1.2rem;
        font-weight: 800;
        color: #1e3a8a;
        margin: 0 0 12px 0;
      }
      .ai-content p {
        color: #334155;
        line-height: 1.6;
        margin: 0 0 16px 0;
        font-size: 1rem;
      }
      .recommendation-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #10b981;
        color: white;
        padding: 8px 16px;
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.95rem;
      }
      .recommendation-badge mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .ai-loading {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
        background: white;
        border-radius: 16px;
        margin-bottom: 32px;
        border: 1px solid #e2e8f0;
        color: #64748b;
        font-weight: 600;
      }

      .empty-state {
        background: white;
        border: 2px dashed #cbd5e1;
        border-radius: 32px;
        padding: 80px 32px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.05);
      }
      .icon-circle {
        width: 88px;
        height: 88px;
        background: #f1f5f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
      }
      .icon-circle mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: #94a3b8;
      }
      .empty-title {
        font-size: 1.8rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 12px 0;
      }
      .empty-desc {
        font-size: 1.1rem;
        color: #64748b;
        margin: 0 0 32px 0;
        max-width: 450px;
      }
      .btn-explore {
        border-radius: 20px !important;
        height: 56px !important;
        padding: 0 32px !important;
        font-size: 1.1rem !important;
        font-weight: 700 !important;
      }

      .compare-grid-wrapper {
        background: white;
        border-radius: 32px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08);
        overflow: hidden;
        overflow-x: auto;
      }

      .compare-table {
        display: flex;
        min-width: 960px;
      }

      .labels-col {
        width: 220px;
        flex-shrink: 0;
        background: #f8fafc;
        border-right: 2px solid #e2e8f0;
        z-index: 20;
      }
      .prop-header-spacer {
        height: 350px;
        padding: 24px;
        display: flex;
        align-items: flex-end;
        border-bottom: 1px solid #e2e8f0;
      }
      .lbl-summary {
        font-weight: 800;
        color: #475569;
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .label-cell {
        height: 72px;
        padding: 0 24px;
        display: flex;
        align-items: center;
        font-weight: 700;
        color: #334155;
        font-size: 1.05rem;
        border-bottom: 1px solid #f1f5f9;
      }
      .label-cell:last-child {
        border-bottom: none;
      }
      .label-cell.highlight-label {
        color: #4f46e5;
        background: #eef2ff;
      }

      .properties-container {
        display: flex;
        flex: 1;
      }

      .compare-col {
        width: 310px;
        flex-shrink: 0;
        border-right: 1px solid #e2e8f0;
        transition: background 0.3s ease;
        display: flex;
        flex-direction: column;
      }
      .compare-col:hover {
        background: #fbfcfd;
      }

      .prop-header {
        height: 350px;
        padding: 24px;
        position: relative;
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid #e2e8f0;
      }

      .remove-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: #ef4444;
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 10;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      }
      .compare-col:hover .remove-btn {
        opacity: 1;
        transform: scale(1);
      }
      .remove-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .img-frame {
        width: 100%;
        height: 180px;
        border-radius: 20px;
        overflow: hidden;
        margin-bottom: 16px;
        cursor: pointer;
        position: relative;
        background: #0f172a;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }
      .img-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }
      .img-frame:hover img {
        transform: scale(1.08);
      }

      .listing-badge {
        position: absolute;
        bottom: 12px;
        left: 12px;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 800;
        color: white;
        backdrop-filter: blur(8px);
        text-transform: uppercase;
      }
      .listing-badge.rent {
        background: rgba(16, 185, 129, 0.9);
      }
      .listing-badge.sale {
        background: rgba(239, 68, 68, 0.9);
      }
      .listing-badge.shorttermrent {
        background: rgba(59, 130, 246, 0.9);
      }

      .prop-title {
        font-size: 1.15rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 6px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
      }
      .prop-price {
        font-size: 1.35rem;
        font-weight: 900;
        color: #1e40af;
        margin-bottom: 16px;
      }

      .btn-view-prop {
        width: 100%;
        border-radius: 14px !important;
        height: 40px !important;
        font-weight: 700 !important;
      }

      .value-cell {
        height: 72px;
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 1rem;
        color: #1e293b;
        border-bottom: 1px solid #f1f5f9;
      }
      .value-cell:last-child {
        border-bottom: none;
      }
      .value-cell.highlight {
        color: #1e40af;
        font-size: 1.1rem;
      }
      .value-cell.location-text {
        font-size: 0.95rem;
        color: #475569;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .custom-chip {
        background: #eff6ff !important;
        color: #1e40af !important;
        font-weight: 800 !important;
        font-size: 0.85rem !important;
      }

      .feature-icons {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: center;
      }
      .feature-icons span {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #f1f5f9;
        color: #cbd5e1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
      }
      .feature-icons span.active {
        background: #ecfdf5;
        color: #10b981;
        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
      }
      .feature-icons mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .score-cell {
        background: #f8fafc;
      }
      .score-circle {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 1.1rem;
        color: white;
      }
      .score-circle.high {
        background: #10b981;
        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
      }
      .score-circle.medium {
        background: #f59e0b;
        box-shadow: 0 4px 10px rgba(245, 158, 11, 0.3);
      }
      .score-circle.low {
        background: #ef4444;
        box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
      }

      .value-rating-cell {
        background: #f8fafc;
      }
      .rating-badge {
        padding: 6px 16px;
        border-radius: 20px;
        font-weight: 800;
        font-size: 0.9rem;
      }
      .rating-badge.great {
        background: #ecfdf5;
        color: #059669;
        border: 1px solid #10b981;
      }
      .rating-badge.premium {
        background: #fff1f2;
        color: #e11d48;
        border: 1px solid #f43f5e;
      }
      .rating-badge.avg {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #cbd5e1;
      }

      .add-col {
        width: 310px;
        flex-shrink: 0;
        padding: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .add-box {
        width: 100%;
        height: 100%;
        min-height: 400px;
        border: 2px dashed #cbd5e1;
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s;
        background: #f8fafc;
      }
      .add-box:hover {
        border-color: #1e40af;
        background: #eff6ff;
        transform: translateY(-4px);
      }
      .add-circle {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        margin-bottom: 16px;
        transition: all 0.3s;
      }
      .add-box:hover .add-circle {
        color: #1e40af;
        background: white;
        box-shadow: 0 12px 24px rgba(30, 64, 175, 0.15);
      }
      .add-lbl {
        font-size: 1.1rem;
        font-weight: 800;
        color: #334155;
        margin-bottom: 4px;
      }
      .add-sub {
        font-size: 0.9rem;
        color: #94a3b8;
        font-weight: 600;
      }

      @media (max-width: 768px) {
        .container {
          padding: 24px 16px;
        }
        .page-title {
          font-size: 2rem;
        }
        .labels-col {
          width: 160px;
        }
        .label-cell {
          font-size: 0.95rem;
          padding: 0 16px;
        }
        .compare-col,
        .add-col {
          width: 260px;
        }
        .value-cell {
          padding: 0 16px;
          font-size: 0.95rem;
        }
        .ai-summary-alert {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ComparisonComponent implements OnInit {
  comparisonService = inject(ComparisonService);
  private imageService = inject(ImageOptimizationService);

  apiResult = signal<ComparisonResult | null>(null);
  isLoading = signal<boolean>(false);

  compareLabels = [
    { key: 'type', title: 'Mulk turi' },
    { key: 'area', title: 'Maydoni' },
    { key: 'rooms', title: 'Xonalar soni' },
    { key: 'bathrooms', title: 'Hammom' },
    { key: 'location', title: 'Joylashuvi' },
    { key: 'features', title: 'Qulayliklar' },
    { key: 'score', title: "Sun'iy Intellekt Balli" },
    { key: 'valueRating', title: 'Bozor bahosi' },
  ];

  constructor() {
    effect(
      () => {
        const count = this.comparisonService.count();
        if (count > 1) {
          this.fetchSmartComparison();
        } else {
          this.apiResult.set(null);
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit() {
    if (this.comparisonService.count() > 1) {
      this.fetchSmartComparison();
    }
  }

  fetchSmartComparison() {
    this.isLoading.set(true);
    this.comparisonService.getSmartComparison().subscribe({
      next: (res) => {
        this.apiResult.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching comparison', err);
        this.isLoading.set(false);
      },
    });
  }

  removeProperty(id: string) {
    this.comparisonService.removeFromCompare(id);
  }

  getAiDetail(propertyId: string): PropertyComparisonDetail | undefined {
    return this.apiResult()?.details.find((d) => d.propertyId === propertyId);
  }

  formatSummary(summary: string): string {
    if (!summary) return '';
    return summary
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/- /g, '<br/>• ');
  }

  getImg(prop: any): string {
    const url = prop.images?.[0]?.url || prop.images?.[0]?.imageUrl || prop.imageUrl || '';
    return this.imageService.getOptimizedImage(url, 400, 300);
  }

  onImgError(e: any): void {
    e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
  }

  viewProperty(id: string): void {
    window.location.href = `/properties/${id}`;
  }

  getTypeName(type: string): string {
    const types: Record<string, string> = {
      Apartment: 'Kvartira',
      House: 'Hovli uy',
      Office: 'Ofis',
      Land: 'Yer maydoni',
      Villa: 'Villa',
      Cottage: 'Dala hovli',
      Commercial: 'Tijorat mulki',
    };
    return types[type] || type || 'Kvartira';
  }

  getListingLabel(listingType: string): string {
    switch (listingType) {
      case 'Rent':
        return 'Ijaraga';
      case 'Sale':
        return 'Sotuvda';
      case 'ShortTermRent':
        return 'Kunlik ijara';
      default:
        return 'Ijara / Sotuv';
    }
  }

  formatPrice(price: any): string {
    if (!price || isNaN(price)) return "0 so'm";
    const num = Number(price);
    return Math.round(num).toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";
  }
}

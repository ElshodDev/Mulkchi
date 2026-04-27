import { Component, OnInit, inject, signal, viewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { AIService, AIPriceRequest } from '../../core/services/ai.service';
import { UzbekistanRegion } from '../../core/models';

@Component({
  selector: 'app-ai-price',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <div class="ai-price-container">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <h1>
            <mat-icon>psychology</mat-icon>
            AI Narx Bashorati
          </h1>
          <p>Sun'iy intellekt yordamida mulkingizning bozor qiymatini aniqlang</p>
        </div>

        <div class="content-grid">
          <!-- Form Section -->
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>Mulk ma'lumotlari</mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <form [formGroup]="priceForm" (ngSubmit)="onSubmit()">
                <!-- Region -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Viloyat</mat-label>
                  <mat-select formControlName="region" required>
                    @for (region of regions; track region) {
                      <mat-option [value]="region">{{ region }}</mat-option>
                    }
                  </mat-select>
                  @if (priceForm.get('region')?.hasError('required')) {
                    <mat-error>Viloyatni tanlang</mat-error>
                  }
                </mat-form-field>

                <!-- Property Type -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Mulk turi</mat-label>
                  <mat-select formControlName="propertyType" required>
                    @for (type of propertyTypes; track type.value) {
                      <mat-option [value]="type.value">{{ type.label }}</mat-option>
                    }
                  </mat-select>
                  @if (priceForm.get('propertyType')?.hasError('required')) {
                    <mat-error>Mulk turini tanlang</mat-error>
                  }
                </mat-form-field>

                <!-- Area -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Maydon (m²)</mat-label>
                  <input matInput type="number" formControlName="area" min="1" required>
                  <span matSuffix>m²</span>
                  @if (priceForm.get('area')?.hasError('required')) {
                    <mat-error>Maydonni kiriting</mat-error>
                  }
                  @if (priceForm.get('area')?.hasError('min')) {
                    <mat-error>Maydon 0 dan katta bo'lishi kerak</mat-error>
                  }
                </mat-form-field>

                <!-- Rooms -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Xonalar soni</mat-label>
                  <mat-select formControlName="rooms" required>
                    @for (num of roomOptions; track num) {
                      <mat-option [value]="num">{{ num }} xona</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <!-- Floor -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Qavat</mat-label>
                  <input matInput type="number" formControlName="floor" min="1" required>
                  @if (priceForm.get('floor')?.hasError('required')) {
                    <mat-error>Qavatni kiriting</mat-error>
                  }
                </mat-form-field>

                <!-- Listing Type -->
                <div class="listing-type-group">
                  <label class="group-label">E'lon turi</label>
                  <mat-radio-group formControlName="listingType" class="radio-group">
                    <mat-radio-button value="Sale">Sotish</mat-radio-button>
                    <mat-radio-button value="Rent">Ijara</mat-radio-button>
                  </mat-radio-group>
                </div>

                <!-- Submit Button -->
                <button 
                  mat-raised-button 
                  color="primary" 
                  class="submit-btn"
                  type="submit"
                  [disabled]="priceForm.invalid || aiService.loading()">
                  @if (aiService.loading()) {
                    <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
                    <span>Hisoblanmoqda...</span>
                  } @else {
                    <ng-container>
                      <mat-icon>calculate</mat-icon>
                      <span>Narxni hisoblash</span>
                    </ng-container>
                  }
                </button>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Results Section -->
          <div class="results-section">
            @if (aiService.loading()) {
              <!-- Loading Skeleton -->
              <mat-card class="result-card loading-card">
                <mat-card-content>
                  <div class="skeleton-header"></div>
                  <div class="skeleton-gauge"></div>
                  <div class="skeleton-price"></div>
                  <div class="skeleton-details">
                    <div class="skeleton-row"></div>
                    <div class="skeleton-row"></div>
                    <div class="skeleton-row"></div>
                  </div>
                </mat-card-content>
              </mat-card>
            }
            
            @if (aiService.priceResult()) {
              <mat-card class="result-card">
                <mat-card-header>
                  <mat-card-title>
                    <mat-icon class="success-icon">check_circle</mat-icon>
                    Tavsiya etilgan narx
                  </mat-card-title>
                </mat-card-header>

                <mat-card-content>
                  <!-- Animated Price Gauge -->
                  <div class="price-gauge-container">
                    <div class="gauge-wrapper">
                      <svg class="gauge-svg" viewBox="0 0 200 120">
                        <!-- Background arc -->
                        <path d="M 20 100 A 80 80 0 0 1 180 100" 
                              fill="none" 
                              stroke="#e2e8f0" 
                              stroke-width="20" />
                        <!-- Value arc with animation -->
                        <path class="gauge-arc" 
                              d="M 20 100 A 80 80 0 0 1 180 100" 
                              fill="none" 
                              [attr.stroke]="getGaugeColor(aiService.priceResult()?.confidence || 0)"
                              stroke-width="20"
                              stroke-dasharray="251.2"
                              [attr.stroke-dashoffset]="getGaugeOffset(aiService.priceResult()?.confidence || 0)"
                              stroke-linecap="round" />
                        <!-- Center value -->
                        <text x="100" y="85" text-anchor="middle" class="gauge-value">
                          {{ ((aiService.priceResult()?.confidence || 0) * 100).toFixed(0) }}%
                        </text>
                        <text x="100" y="105" text-anchor="middle" class="gauge-label">Ishonch</text>
                      </svg>
                    </div>
                  </div>

                  <!-- Price Range Display -->
                  <div class="price-range-section">
                    <div class="price-bar-container">
                      <div class="price-bar-labels">
                        <span class="min-label">Min: {{ formatPrice(aiService.priceResult()?.minPrice) }}</span>
                        <span class="rec-label highlight">Tavsiya: {{ formatPrice(aiService.priceResult()?.recommendedPrice) }}</span>
                        <span class="max-label">Max: {{ formatPrice(aiService.priceResult()?.maxPrice) }}</span>
                      </div>
                      <div class="price-bar">
                        <div class="price-segment min-segment" [style.width.%]="25"></div>
                        <div class="price-segment rec-segment recommended" [style.width.%]="50">
                          <span class="marker"></span>
                        </div>
                        <div class="price-segment max-segment" [style.width.%]="25"></div>
                      </div>
                    </div>
                  </div>

                  <mat-divider></mat-divider>

                  <!-- Comparison Bar -->
                  <div class="comparison-bar-section">
                    <div class="comparison-header">
                      <span>Bozor taqqoslash</span>
                      <span class="comparison-badge" [class.positive]="getComparisonPercentage() <= 0" [class.negative]="getComparisonPercentage() > 0">
                        {{ getComparisonPercentage() > 0 ? '+' : '' }}{{ getComparisonPercentage() }}%
                      </span>
                    </div>
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="getComparisonBarValue()"
                      [class.comparison-positive]="getComparisonPercentage() <= 0"
                      [class.comparison-negative]="getComparisonPercentage() > 0">
                    </mat-progress-bar>
                    <p class="comparison-text">
                      {{ getComparisonLabel() }}
                    </p>
                  </div>

                  <!-- Details -->
                  <div class="price-details-grid">
                    <div class="detail-card">
                      <mat-icon>attach_money</mat-icon>
                      <div class="detail-info">
                        <span class="label">m² narxi</span>
                        <span class="value">{{ formatPrice(getPricePerSqm()) }} {{ aiService.priceResult()?.currency }}</span>
                      </div>
                    </div>
                    <div class="detail-card">
                      <mat-icon>trending_up</mat-icon>
                      <div class="detail-info">
                        <span class="label">Narx segmenti</span>
                        <span class="value">{{ aiService.priceResult()?.priceLevel || 'O\'rta' }}</span>
                      </div>
                    </div>
                    <div class="detail-card" *ngIf="aiService.priceResult()?.similarCount">
                      <mat-icon>home</mat-icon>
                      <div class="detail-info">
                        <span class="label">O'xshash mulklar</span>
                        <span class="value">{{ aiService.priceResult()?.similarCount }} ta</span>
                      </div>
                    </div>
                  </div>

                  <!-- Factor Breakdown -->
                  @if (aiService.priceResult()?.factorBreakdown && getFactorKeys().length > 0) {
                    <div class="factors-section">
                      <h4>
                        <mat-icon>analytics</mat-icon>
                        Narxga ta'sir etuvchi omillar
                      </h4>
                      <div class="factor-chips">
                        @for (factor of getFactorEntries(); track factor.key) {
                          <mat-chip class="factor-chip">
                            <mat-icon>add_circle</mat-icon>
                            {{ factor.key }}: +{{ factor.value }}%
                          </mat-chip>
                        }
                      </div>
                    </div>
                  }

                  <!-- Tips -->
                  <div class="tips-section">
                    <h4>
                      <mat-icon>lightbulb</mat-icon>
                      Maslahatlar
                    </h4>
                    <ul>
                      @if ((aiService.priceResult()?.comparisonPercentage || 0) < -5) {
                        <li>Narxingiz bozordan past. Siz tezroq sotishingiz mumkin.</li>
                      }
                      @if ((aiService.priceResult()?.comparisonPercentage || 0) > 5) {
                        <li>Narxingiz bozordan yuqori. Buni asoslash uchun qo'shimcha qulayliklar qo'shing.</li>
                      }
                      @if ((aiService.priceResult()?.confidence || 0) < 0.7) {
                        <li>Ishonch darajasi past. Ko'proq ma'lumot kiritish narx aniqligini oshiradi.</li>
                      }
                    </ul>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Chart Section -->
              @if (aiService.priceResult()?.regionalData && aiService.priceResult()?.regionalData!.length > 0) {
                <mat-card class="chart-card">
                  <mat-card-header>
                    <mat-card-title>Viloyat bo'yicha o'rtacha narxlari</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="chart-container">
                      <canvas #chartCanvas></canvas>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            } @else if (aiService.error()) {
              <mat-card class="error-card">
                <mat-card-content>
                  <mat-icon color="warn">error</mat-icon>
                  <p>{{ aiService.error() }}</p>
                  <button mat-raised-button color="primary" (click)="aiService.clearResult()">
                    Qayta urinib ko'rish
                  </button>
                </mat-card-content>
              </mat-card>
            } @else {
              <!-- Empty State -->
              <mat-card class="empty-card">
                <mat-card-content>
                  <mat-icon class="empty-icon">calculate</mat-icon>
                  <h3>Narxni hisoblash uchun formani to'ldiring</h3>
                  <p>AI mulkingizning bozor qiymatini tahlil qilib, eng yaxshi narxni tavsiya qiladi</p>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-price-container {
      min-height: calc(100vh - 64px);
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 40px 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .page-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .page-header h1 mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #667eea;
    }

    .page-header p {
      font-size: 1.1rem;
      color: #64748b;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 32px;
    }

    /* Form Card */
    .form-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      height: fit-content;
    }

    mat-card-header {
      padding-bottom: 16px;
    }

    mat-card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #0F172A;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .listing-type-group {
      margin-bottom: 24px;
    }

    .group-label {
      display: block;
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 8px;
    }

    .radio-group {
      display: flex;
      gap: 24px;
    }

    .submit-btn {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .submit-btn mat-progress-spinner {
      display: inline-block;
    }

    /* Results Section */
    .results-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .result-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .result-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .success-icon {
      color: #10b981;
    }

    .price-main {
      text-align: center;
      padding: 32px 0;
    }

    .price-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
    }

    .price-currency {
      font-size: 1.5rem;
      color: #64748b;
      margin-left: 8px;
    }

    .price-details {
      padding: 24px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row .label {
      color: #64748b;
    }

    .detail-row .value {
      font-weight: 600;
      color: #0F172A;
    }

    .comparison-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      margin: 24px 0;
      font-weight: 500;
    }

    .comparison-message.positive {
      background: #dcfce7;
      color: #166534;
    }

    .comparison-message.negative {
      background: #fee2e2;
      color: #991b1b;
    }

    .comparison-message mat-icon {
      font-size: 24px;
    }

    .tips-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
    }

    .tips-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px 0;
      color: #0F172A;
    }

    .tips-section h4 mat-icon {
      color: #f59e0b;
    }

    .tips-section ul {
      margin: 0;
      padding-left: 20px;
      color: #64748b;
    }

    .tips-section li {
      margin-bottom: 8px;
    }

    /* Chart Card */
    .chart-card {
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .chart-container {
      position: relative;
      height: 300px;
      margin-top: 16px;
    }

    /* Loading Skeleton */
    .loading-card {
      min-height: 400px;
    }

    .skeleton-header {
      height: 24px;
      width: 60%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 32px;
    }

    .skeleton-gauge {
      height: 150px;
      width: 200px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 100px 100px 0 0;
      margin: 0 auto 32px;
    }

    .skeleton-price {
      height: 40px;
      width: 80%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin: 0 auto 24px;
    }

    .skeleton-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-row {
      height: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Price Gauge */
    .price-gauge-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .gauge-wrapper {
      width: 200px;
      height: 120px;
    }

    .gauge-svg {
      width: 100%;
      height: 100%;
    }

    .gauge-arc {
      transition: stroke-dashoffset 1.5s ease-out;
    }

    .gauge-value {
      font-size: 32px;
      font-weight: 700;
      fill: #0F172A;
    }

    .gauge-label {
      font-size: 14px;
      fill: #64748b;
    }

    /* Price Range Section */
    .price-range-section {
      margin-bottom: 24px;
    }

    .price-bar-container {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
    }

    .price-bar-labels {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 0.875rem;
    }

    .min-label, .max-label {
      color: #64748b;
    }

    .rec-label {
      font-weight: 600;
      color: #667eea;
    }

    .price-bar {
      display: flex;
      height: 12px;
      border-radius: 6px;
      overflow: hidden;
      background: #e2e8f0;
    }

    .price-segment {
      height: 100%;
    }

    .min-segment {
      background: #94a3b8;
    }

    .rec-segment {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rec-segment.recommended::after {
      content: '★';
      color: white;
      font-size: 10px;
    }

    .max-segment {
      background: #94a3b8;
    }

    /* Comparison Bar Section */
    .comparison-bar-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .comparison-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .comparison-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .comparison-badge.positive {
      background: #dcfce7;
      color: #166534;
    }

    .comparison-badge.negative {
      background: #fee2e2;
      color: #991b1b;
    }

    .comparison-text {
      margin-top: 12px;
      font-size: 0.875rem;
      color: #64748b;
    }

    :host ::ng-deep .comparison-positive .mat-mdc-progress-bar-fill {
      background-color: #10b981 !important;
    }

    :host ::ng-deep .comparison-negative .mat-mdc-progress-bar-fill {
      background-color: #ef4444 !important;
    }

    /* Price Details Grid */
    .price-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .detail-card {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f8fafc;
      padding: 16px;
      border-radius: 12px;
    }

    .detail-card mat-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .detail-info {
      display: flex;
      flex-direction: column;
    }

    .detail-info .label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .detail-info .value {
      font-weight: 600;
      color: #0F172A;
      font-size: 0.875rem;
    }

    /* Factors Section */
    .factors-section {
      margin-bottom: 24px;
    }

    .factors-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px 0;
      color: #0F172A;
      font-size: 0.875rem;
    }

    .factor-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .factor-chip {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .factor-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    /* Error & Empty Cards */
    .error-card,
    .empty-card {
      border-radius: 16px;
      text-align: center;
      padding: 40px 20px;
    }

    .error-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #cbd5e1;
      margin-bottom: 24px;
    }

    .empty-card h3 {
      color: #0F172A;
      margin-bottom: 8px;
    }

    .empty-card p {
      color: #64748b;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .page-header h1 {
        font-size: 1.75rem;
      }

      .price-details-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AiPriceComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  aiService = inject(AIService);

  chartCanvas = viewChild<any>('chartCanvas');
  private chart: Chart | null = null;

  // Form options
  regions = Object.values(UzbekistanRegion);

  propertyTypes = [
    { value: 'Apartment', label: 'Kvartira' },
    { value: 'House', label: 'Uy' },
    { value: 'Office', label: 'Ofis' },
    { value: 'Commercial', label: 'Tijorat' }
  ];

  roomOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  // Reactive Form
  priceForm = this.fb.group({
    region: ['', Validators.required],
    propertyType: ['', Validators.required],
    area: [0, [Validators.required, Validators.min(1)]],
    rooms: [1, [Validators.required, Validators.min(1)]],
    floor: [1, [Validators.required, Validators.min(1)]],
    listingType: ['Sale' as 'Sale' | 'Rent', Validators.required]
  });

  ngOnInit(): void {
    // Clear any previous results
    this.aiService.clearResult();
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  onSubmit(): void {
    if (this.priceForm.invalid) return;

    const formValue = this.priceForm.value;
    const request: AIPriceRequest = {
      region: formValue.region!,
      propertyType: formValue.propertyType!,
      area: formValue.area!,
      rooms: formValue.rooms!,
      floor: formValue.floor!,
      listingType: formValue.listingType!
    };

    this.aiService.predictPrice(request).subscribe({
      next: () => {
        setTimeout(() => this.renderChart(), 100);
      },
      error: () => {
        // Error is already shown in UI
      }
    });
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return '0';
    return price.toLocaleString('uz-UZ');
  }

  // Gauge helper methods
  getGaugeColor(confidence: number): string {
    if (confidence >= 0.8) return '#10b981'; // Green
    if (confidence >= 0.6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  getGaugeOffset(confidence: number): number {
    // 251.2 is the length of the arc (π * 80)
    return 251.2 - (251.2 * confidence);
  }

  // Comparison methods
  getComparisonPercentage(): number {
    const result = this.aiService.priceResult();
    if (!result) return 0;
    return Math.round(result.comparisonPercentage || 0);
  }

  getComparisonBarValue(): number {
    const percentage = this.getComparisonPercentage();
    // Normalize to 0-100 range, where 50 is market average
    return Math.max(0, Math.min(100, 50 + percentage));
  }

  getComparisonLabel(): string {
    return this.getComparisonPercentage() <= 0
      ? "✓ Bozor o'rtachasidan past narxdasiz"
      : "⚠ Bozor o'rtachasidan yuqori narxdasiz";
  }

  // Price per sqm calculation
  getPricePerSqm(): number {
    const result = this.aiService.priceResult();
    const area = this.priceForm.value.area;
    if (!result || !area || area <= 0) return 0;
    return Math.round((result.recommendedPrice || 0) / area);
  }

  // Factor breakdown helpers
  getFactorKeys(): string[] {
    const result = this.aiService.priceResult();
    if (!result?.factorBreakdown) return [];
    return Object.keys(result.factorBreakdown);
  }

  getFactorEntries(): { key: string; value: number }[] {
    const result = this.aiService.priceResult();
    if (!result?.factorBreakdown) return [];
    return Object.entries(result.factorBreakdown).map(([key, value]) => ({
      key,
      value: value as number
    }));
  }

  private renderChart(): void {
    const canvas = this.chartCanvas()?.nativeElement;
    if (!canvas) return;

    const regionalData = this.aiService.priceResult()?.regionalData;
    if (!regionalData || regionalData.length === 0) return;

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: regionalData.map(d => d.region),
        datasets: [{
          label: 'O\'rtacha narx (UZS)',
          data: regionalData.map(d => d.averagePrice),
          backgroundColor: 'rgba(102, 126, 234, 0.8)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return this.formatPrice(context.raw as number) + ' UZS';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                const num = value as number;
                if (num >= 1000000) {
                  return (num / 1000000).toFixed(1) + 'M';
                }
                if (num >= 1000) {
                  return (num / 1000).toFixed(0) + 'K';
                }
                return num;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }
}

import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import {
  AnalyticsService,
  PropertyAnalysisResult,
  PricePrediction,
  PriceHistoryItem,
  PriceStatus,
} from '../../../core/services/analytics.service';

@Component({
  selector: 'app-property-analysis-widget',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  template: `
    @if (loading()) {
      <mat-card class="analysis-loading">
        <mat-card-content>
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          <p class="loading-text">
            <mat-icon>psychology</mat-icon>
            AQILLI tahlil qilinmoqda...
          </p>
        </mat-card-content>
      </mat-card>
    } @else if (analysis()) {
      <mat-card class="property-analysis-card" [class]="getStatusClass(analysis()?.status)">
        <mat-card-header>
          <mat-icon mat-card-avatar class="analysis-icon">analytics</mat-icon>
          <mat-card-title>Narx tahlili</mat-card-title>
          <mat-card-subtitle>Sun'iy intellekt yordamida baholangan</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Status Badge -->
          <div class="status-section">
            <div class="status-badge" [class]="getStatusClass(analysis()?.status)">
              <mat-icon>{{ getStatusIcon(analysis()?.status) }}</mat-icon>
              <span>{{ getStatusText(analysis()?.status) }}</span>
            </div>
            <div class="confidence-badge" matTooltip="Ishonchlilik darajasi">
              <mat-icon>verified</mat-icon>
              <span>{{ analysis()?.confidence | number: '1.0-0' }}% ishonch</span>
            </div>
          </div>

          <!-- Price Comparison -->
          <div class="price-comparison">
            <div class="price-item current">
              <span class="label">Joriy narx</span>
              <span class="value">{{ formatPrice(analysis()?.currentPrice || 0) }}</span>
            </div>
            <div class="price-arrow">
              <mat-icon>
                {{ (analysis()?.priceDifference || 0) > 0 ? 'trending_up' : 'trending_down' }}
              </mat-icon>
            </div>
            <div class="price-item market">
              <span class="label">Bozor narxi</span>
              <span class="value">{{ formatPrice(analysis()?.estimatedMarketPrice || 0) }}</span>
            </div>
          </div>

          <!-- Price Difference -->
          <div class="difference-section">
            <div
              class="difference-bar"
              [class.positive]="(analysis()?.priceDifference || 0) < 0"
              [class.negative]="(analysis()?.priceDifference || 0) > 0"
            >
              <div class="bar-fill" [style.width.%]="getDifferencePercent()"></div>
              <span class="difference-text">
                {{ (analysis()?.priceDifference || 0) > 0 ? '+' : '' }}
                {{ formatPrice(analysis()?.priceDifference || 0) }}
                ({{ analysis()?.priceDifferencePercent | number: '1.1-1' }}%)
              </span>
            </div>
          </div>

          <!-- Value Score -->
          <div class="value-score-section">
            <div class="score-header">
              <span>Qiymat bahosi</span>
              <span class="score-value">{{ analysis()?.valueScore | number: '1.0-0' }}/100</span>
            </div>
            <mat-progress-bar
              mode="determinate"
              [value]="analysis()?.valueScore"
              [class.high-score]="(analysis()?.valueScore || 0) >= 70"
              [class.medium-score]="
                (analysis()?.valueScore || 0) >= 40 && (analysis()?.valueScore || 0) < 70
              "
              [class.low-score]="(analysis()?.valueScore || 0) < 40"
            >
            </mat-progress-bar>
          </div>

          <mat-divider class="section-divider"></mat-divider>

          <!-- Price per sqm -->
          <div class="price-per-sqm">
            <div class="sqm-comparison">
              <div class="sqm-item">
                <span class="label">Mulk narxi (m²)</span>
                <span class="value">{{ formatPrice(analysis()?.pricePerSqm || 0) }}</span>
              </div>
              <div class="sqm-item market">
                <span class="label">Bozor narxi (m²)</span>
                <span class="value">{{ formatPrice(analysis()?.marketPricePerSqm || 0) }}</span>
              </div>
            </div>
          </div>

          <!-- Reasoning -->
          @if (analysis()?.reasoning?.length) {
            <div class="reasoning-section">
              <h4><mat-icon>lightbulb</mat-icon> Tahlil asoslari:</h4>
              <ul>
                @for (reason of analysis()?.reasoning; track reason) {
                  <li>{{ reason }}</li>
                }
              </ul>
            </div>
          }

          <!-- Recommendation -->
          <div class="recommendation-section" [class]="getRecommendationClass(analysis()?.status)">
            <mat-icon>{{ getRecommendationIcon(analysis()?.status) }}</mat-icon>
            <p>{{ analysis()?.recommendation }}</p>
          </div>

          <!-- Comparable Count -->
          <div class="comparable-info">
            <mat-icon>compare</mat-icon>
            <span>{{ analysis()?.comparableCount }} ta o'xshash mulk asosida tahlil qilindi</span>
          </div>
        </mat-card-content>

        @if (showPrediction) {
          <mat-card-actions align="end">
            <button mat-button color="primary" (click)="showPricePrediction()">
              <mat-icon>trending_up</mat-icon>
              Narx prognozi
            </button>
          </mat-card-actions>
        }
      </mat-card>

      <!-- Price Prediction Section -->
      @if (predictionVisible() && pricePrediction()) {
        <mat-card class="prediction-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>trending_up</mat-icon>
            <mat-card-title>Kelajakdagi narx prognozi</mat-card-title>
            <mat-card-subtitle>6 oy ichida kutilayotgan o'zgarishlar</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="prediction-summary">
              <div class="prediction-main">
                <span class="current"
                  >Hozir: {{ formatPrice(pricePrediction()?.currentPrice || 0) }}</span
                >
                <mat-icon>arrow_forward</mat-icon>
                <span
                  class="predicted"
                  [class.up]="(pricePrediction()?.predictedChangePercent || 0) > 0"
                  [class.down]="(pricePrediction()?.predictedChangePercent || 0) < 0"
                >
                  {{ formatPrice(pricePrediction()?.predictedPrice || 0) }}
                </span>
              </div>
              <div class="prediction-change">
                <span
                  [class.up]="(pricePrediction()?.predictedChangePercent || 0) > 0"
                  [class.down]="(pricePrediction()?.predictedChangePercent || 0) < 0"
                >
                  {{ (pricePrediction()?.predictedChangePercent || 0) > 0 ? '+' : '' }}
                  {{ pricePrediction()?.predictedChangePercent | number: '1.1-1' }}%
                </span>
                <span class="confidence"
                  >Ishonch: {{ pricePrediction()?.confidence | number: '1.0-0' }}%</span
                >
              </div>
            </div>

            @if (pricePrediction()?.factors?.length) {
              <div class="factors-section">
                <h4>Ta'sir etuvchi omillar:</h4>
                <div class="factors-list">
                  @for (factor of pricePrediction()?.factors; track factor.name) {
                    <div class="factor-item" [class]="factor.impact">
                      <mat-icon>{{
                        factor.impact === 'positive'
                          ? 'trending_up'
                          : factor.impact === 'negative'
                            ? 'trending_down'
                            : 'remove'
                      }}</mat-icon>
                      <div class="factor-info">
                        <span class="name">{{ factor.name }}</span>
                        <span class="description">{{ factor.description }}</span>
                      </div>
                      <span class="weight">{{ factor.weight }}%</span>
                    </div>
                  }
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }

      <!-- Price History Chart Placeholder -->
      @if (showHistory && priceHistory().length > 0) {
        <mat-card class="history-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>history</mat-icon>
            <mat-card-title>Narx o'zgarish tarixi</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="history-list">
              @for (item of priceHistory(); track item.date) {
                <div class="history-item">
                  <span class="date">{{ formatDate(item.date) }}</span>
                  <span class="price">{{ formatPrice(item.price) }}</span>
                  <span
                    class="type"
                    [class.sale]="item.type === 'sale'"
                    [class.rent]="item.type === 'rent'"
                  >
                    {{ item.type === 'sale' ? 'Sotuv' : 'Ijara' }}
                  </span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }
    } @else if (error()) {
      <mat-card class="analysis-error">
        <mat-card-content>
          <mat-icon>error_outline</mat-icon>
          <p>Tahlilni yuklashda xatolik yuz berdi</p>
          <button mat-button color="primary" (click)="loadAnalysis()">
            <mat-icon>refresh</mat-icon> Qayta yuklash
          </button>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [
    `
      .property-analysis-card {
        margin-bottom: 16px;
        transition: all 0.3s ease;

        &.underpriced {
          border-left: 4px solid #4caf50;
        }

        &.fair {
          border-left: 4px solid #ff9800;
        }

        &.overpriced {
          border-left: 4px solid #f44336;
        }
      }

      .analysis-icon {
        color: #7c4dff;
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .status-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 24px;
        font-weight: 600;
        font-size: 0.9rem;

        &.underpriced {
          background: #e8f5e9;
          color: #2e7d32;
        }

        &.fair {
          background: #fff3e0;
          color: #ef6c00;
        }

        &.overpriced {
          background: #ffebee;
          color: #c62828;
        }

        mat-icon {
          font-size: 20px;
        }
      }

      .confidence-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
        color: #666;

        mat-icon {
          font-size: 18px;
          color: #4caf50;
        }
      }

      .price-comparison {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 12px;

        .price-item {
          display: flex;
          flex-direction: column;
          align-items: center;

          .label {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 4px;
          }

          .value {
            font-size: 1.3rem;
            font-weight: 700;
            color: #333;
          }

          &.market .value {
            color: #2196f3;
          }
        }

        .price-arrow {
          mat-icon {
            font-size: 32px;
            color: #9e9e9e;
          }
        }
      }

      .difference-section {
        margin-bottom: 20px;

        .difference-bar {
          position: relative;
          height: 40px;
          background: #e0e0e0;
          border-radius: 20px;
          overflow: hidden;

          .bar-fill {
            position: absolute;
            height: 100%;
            background: #ff9800;
            transition: width 0.5s ease;

            &.positive {
              background: #4caf50;
            }

            &.negative {
              background: #f44336;
            }
          }

          .difference-text {
            position: absolute;
            width: 100%;
            text-align: center;
            line-height: 40px;
            font-weight: 600;
            color: #333;
            z-index: 1;
          }

          &.positive .bar-fill {
            background: #4caf50;
          }

          &.negative .bar-fill {
            background: #f44336;
          }
        }
      }

      .value-score-section {
        margin-bottom: 20px;

        .score-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .score-value {
            font-weight: 700;
            color: #333;
          }
        }

        ::ng-deep {
          .high-score .mdc-linear-progress__bar-inner {
            background-color: #4caf50 !important;
          }

          .medium-score .mdc-linear-progress__bar-inner {
            background-color: #ff9800 !important;
          }

          .low-score .mdc-linear-progress__bar-inner {
            background-color: #f44336 !important;
          }
        }
      }

      .section-divider {
        margin: 20px 0;
      }

      .price-per-sqm {
        margin-bottom: 20px;

        .sqm-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;

          .sqm-item {
            display: flex;
            flex-direction: column;
            padding: 12px;
            background: #f5f5f5;
            border-radius: 8px;

            .label {
              font-size: 0.8rem;
              color: #666;
              margin-bottom: 4px;
            }

            .value {
              font-weight: 600;
              color: #333;
            }

            &.market {
              background: #e3f2fd;
            }
          }
        }
      }

      .reasoning-section {
        margin-bottom: 20px;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          color: #333;

          mat-icon {
            color: #ffc107;
          }
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            padding: 8px 0;
            padding-left: 24px;
            position: relative;
            color: #555;
            line-height: 1.5;

            &::before {
              content: '•';
              position: absolute;
              left: 8px;
              color: #7c4dff;
              font-weight: bold;
            }
          }
        }
      }

      .recommendation-section {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 16px;

        &.buy {
          background: #e8f5e9;
          color: #2e7d32;
        }

        &.consider {
          background: #fff3e0;
          color: #ef6c00;
        }

        &.avoid {
          background: #ffebee;
          color: #c62828;
        }

        mat-icon {
          font-size: 24px;
        }

        p {
          margin: 0;
          line-height: 1.5;
          font-weight: 500;
        }
      }

      .comparable-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #666;

        mat-icon {
          font-size: 18px;
        }
      }

      .prediction-card {
        margin-top: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;

        mat-card-subtitle {
          color: rgba(255, 255, 255, 0.8);
        }

        .prediction-summary {
          text-align: center;
          margin-bottom: 20px;

          .prediction-main {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 12px;

            .current,
            .predicted {
              font-size: 1.3rem;
              font-weight: 600;
            }

            .predicted {
              &.up {
                color: #a5d6a7;
              }

              &.down {
                color: #ffcc80;
              }
            }

            mat-icon {
              color: rgba(255, 255, 255, 0.6);
            }
          }

          .prediction-change {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;

            .up {
              color: #a5d6a7;
              font-weight: 700;
            }

            .down {
              color: #ffcc80;
              font-weight: 700;
            }

            .confidence {
              background: rgba(255, 255, 255, 0.2);
              padding: 4px 12px;
              border-radius: 16px;
              font-size: 0.85rem;
            }
          }
        }

        .factors-section {
          h4 {
            margin-bottom: 12px;
            font-size: 1rem;
          }

          .factors-list {
            display: flex;
            flex-direction: column;
            gap: 8px;

            .factor-item {
              display: grid;
              grid-template-columns: 32px 1fr 50px;
              align-items: center;
              gap: 12px;
              padding: 12px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 8px;

              &.positive {
                border-left: 3px solid #a5d6a7;
              }

              &.negative {
                border-left: 3px solid #ffcc80;
              }

              &.neutral {
                border-left: 3px solid rgba(255, 255, 255, 0.3);
              }

              mat-icon {
                font-size: 20px;
              }

              .factor-info {
                display: flex;
                flex-direction: column;

                .name {
                  font-weight: 600;
                  font-size: 0.9rem;
                }

                .description {
                  font-size: 0.8rem;
                  opacity: 0.8;
                }
              }

              .weight {
                text-align: right;
                font-weight: 600;
                font-size: 0.9rem;
              }
            }
          }
        }
      }

      .history-card {
        margin-top: 16px;

        .history-list {
          .history-item {
            display: grid;
            grid-template-columns: 1fr 1fr auto;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #eee;

            &:last-child {
              border-bottom: none;
            }

            .date {
              color: #666;
              font-size: 0.9rem;
            }

            .price {
              font-weight: 600;
              color: #333;
            }

            .type {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 600;

              &.sale {
                background: #e3f2fd;
                color: #1976d2;
              }

              &.rent {
                background: #f3e5f5;
                color: #7b1fa2;
              }
            }
          }
        }
      }

      .analysis-loading,
      .analysis-error {
        text-align: center;
        padding: 40px;

        .loading-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          color: #666;

          mat-icon {
            color: #7c4dff;
          }
        }
      }

      .analysis-error {
        mat-icon {
          font-size: 48px;
          color: #f44336;
          margin-bottom: 16px;
        }

        p {
          color: #666;
          margin-bottom: 16px;
        }
      }
    `,
  ],
})
export class PropertyAnalysisWidgetComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  @Input() propertyId!: string;
  @Input() showPrediction = true;
  @Input() showHistory = false;

  analysis = signal<PropertyAnalysisResult | null>(null);
  pricePrediction = signal<PricePrediction | null>(null);
  priceHistory = signal<PriceHistoryItem[]>([]);
  loading = this.analyticsService.loading;
  error = this.analyticsService.error;
  predictionVisible = signal(false);

  ngOnInit() {
    if (this.propertyId) {
      this.loadAnalysis();
    }
  }

  loadAnalysis() {
    this.analyticsService.analyzeProperty(this.propertyId).subscribe({
      next: (result) => this.analysis.set(result),
      error: () => this.analysis.set(null),
    });
  }

  showPricePrediction() {
    this.predictionVisible.set(true);
    this.analyticsService.getPricePrediction(this.propertyId).subscribe({
      next: (result) => this.pricePrediction.set(result),
      error: () => this.pricePrediction.set(null),
    });
  }

  loadPriceHistory() {
    this.analyticsService.getPriceHistory(this.propertyId).subscribe({
      next: (result) => this.priceHistory.set(result),
      error: () => this.priceHistory.set([]),
    });
  }

  getStatusClass(status: PriceStatus | undefined): string {
    if (!status) return '';
    return status.toLowerCase();
  }

  getStatusText(status: PriceStatus | undefined): string {
    switch (status) {
      case 'Underpriced':
        return 'Arzon';
      case 'Fair':
        return "O'rtacha";
      case 'Overpriced':
        return 'Qimmat';
      default:
        return "Noma'lum";
    }
  }

  getStatusIcon(status: PriceStatus | undefined): string {
    switch (status) {
      case 'Underpriced':
        return 'trending_down';
      case 'Fair':
        return 'remove';
      case 'Overpriced':
        return 'trending_up';
      default:
        return 'help';
    }
  }

  getRecommendationClass(status: PriceStatus | undefined): string {
    switch (status) {
      case 'Underpriced':
        return 'buy';
      case 'Fair':
        return 'consider';
      case 'Overpriced':
        return 'avoid';
      default:
        return '';
    }
  }

  getRecommendationIcon(status: PriceStatus | undefined): string {
    switch (status) {
      case 'Underpriced':
        return 'check_circle';
      case 'Fair':
        return 'help';
      case 'Overpriced':
        return 'warning';
      default:
        return 'help';
    }
  }

  getDifferencePercent(): number {
    const diff = this.analysis()?.priceDifferencePercent || 0;
    return Math.min(Math.abs(diff) * 2, 100);
  }

  formatPrice(price: number): string {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + ' mlrd';
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + ' mln';
    }
    return price.toLocaleString('uz-UZ');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('uz-UZ');
  }
}

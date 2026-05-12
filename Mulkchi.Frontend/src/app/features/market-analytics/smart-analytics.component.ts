import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { PropertyResponse } from '../../core/models/property.model';
import {
  AnalyticsService,
  LocationInsight,
  LocationScore,
  MarketOverview,
  SmartFilterResult,
} from '../../core/services/analytics.service';

@Component({
  selector: 'app-smart-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  template: `
    <div class="smart-analytics-container">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <h1>
            <mat-icon>psychology</mat-icon>
            AQILLI TAHLIL
          </h1>
          <p>Sun'iy intellekt yordamida mulk va hudud tahlili</p>
        </div>

        @if (marketOverview()) {
          <div class="overview-section">
            <mat-card class="overview-card">
              <mat-card-content>
                <div class="overview-grid">
                  <div class="overview-item">
                    <mat-icon>home_work</mat-icon>
                    <span class="label">Jami e'lonlar</span>
                    <span class="value">{{ marketOverview()?.totalListings || 0 }}</span>
                  </div>
                  <div class="overview-item">
                    <mat-icon>sell</mat-icon>
                    <span class="label">Sotuv o'rtacha narxi</span>
                    <span class="value">{{
                      formatPrice(marketOverview()?.averageSalePrice || 0)
                    }}</span>
                  </div>
                  <div class="overview-item">
                    <mat-icon>calendar_month</mat-icon>
                    <span class="label">Kunlik yangi e'lonlar</span>
                    <span class="value">{{ marketOverview()?.newListingsToday || 0 }}</span>
                  </div>
                  <div class="overview-item">
                    <mat-icon>location_city</mat-icon>
                    <span class="label">Faol shahar</span>
                    <span class="value">{{ getActiveCityLabel() }}</span>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        }

        @if (recommendationSummary()) {
          <div class="summary-section">
            <mat-card class="summary-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>psychology_alt</mat-icon>
                  AI tavsiya xulosasi
                </mat-card-title>
                <mat-card-subtitle>{{ recommendationSummary()?.subtitle }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p class="summary-text">{{ recommendationSummary()?.summary }}</p>

                <div class="summary-points">
                  @for (point of recommendationSummary()?.points || []; track point.label) {
                    <div class="summary-point">
                      <mat-icon>{{ point.icon }}</mat-icon>
                      <div>
                        <span class="label">{{ point.label }}</span>
                        <span class="value">{{ point.value }}</span>
                      </div>
                    </div>
                  }
                </div>

                <mat-chip-set class="summary-chips">
                  @for (chip of recommendationSummary()?.chips || []; track chip) {
                    <mat-chip>{{ chip }}</mat-chip>
                  }
                </mat-chip-set>

                @if (recommendationSummary()?.reasons?.length) {
                  <div class="reasons-section">
                    <h4>Nega tavsiya qilindi</h4>
                    <ul>
                      @for (reason of recommendationSummary()?.reasons || []; track reason) {
                        <li>{{ reason }}</li>
                      }
                    </ul>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          </div>
        }

        <!-- Navigation Tabs -->
        <mat-tab-group [(selectedIndex)]="selectedTab" class="analytics-tabs">
          <!-- TAB 1: Smart Deals -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">local_offer</mat-icon>
              <span>Eng yaxshi takliflar</span>
            </ng-template>

            <div class="tab-content">
              <div class="filter-actions">
                <button
                  mat-raised-button
                  color="primary"
                  (click)="loadSmartDeals()"
                  [disabled]="loading()"
                >
                  <mat-icon>refresh</mat-icon> Yangilash
                </button>
              </div>

              @if (loading()) {
                <div class="loading-state">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p>AQILLI tahlil qilinmoqda...</p>
                </div>
              } @else if (smartDeals()?.properties?.length) {
                <div class="properties-grid">
                  @for (property of smartDeals()?.properties; track property.id) {
                    <mat-card
                      class="property-card deal-card"
                      [routerLink]="['/properties', property.id]"
                    >
                      <div class="deal-badge">TOP TAKLIF</div>
                      <div class="recommendation-badge deal-badge-text">
                        Nega: {{ getRecommendationReason('deal', property) }}
                      </div>
                      <img
                        [src]="property.mainImageUrl || '/assets/images/property-placeholder.jpg'"
                        [alt]="property.title"
                        class="property-image"
                      />
                      <mat-card-content>
                        <h3>{{ property.title }}</h3>
                        <p class="location">
                          <mat-icon>location_on</mat-icon>
                          {{ property.district }}, {{ property.city }}
                        </p>
                        <div class="price-row">
                          <span class="price">{{
                            formatPrice(property.salePrice || property.monthlyRent || 0)
                          }}</span>
                          @if (property.salePrice) {
                            <span class="badge sale">Sotuv</span>
                          } @else {
                            <span class="badge rent">Ijara</span>
                          }
                        </div>
                        <div class="features">
                          <span><mat-icon>bed</mat-icon> {{ property.numberOfBedrooms }}</span>
                          <span><mat-icon>square_foot</mat-icon> {{ property.area }} m²</span>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>search_off</mat-icon>
                  <p>Hozircha eng yaxshi takliflar topilmadi</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- TAB 2: High ROI Properties -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">trending_up</mat-icon>
              <span>Yuqori ROI</span>
            </ng-template>

            <div class="tab-content">
              <div class="info-banner">
                <mat-icon>info</mat-icon>
                <span>Bu ro'yxat investitsiya uchun eng foydali mulklarni ko'rsatadi</span>
              </div>

              <div class="filter-actions">
                <button
                  mat-raised-button
                  color="accent"
                  (click)="loadHighRoi()"
                  [disabled]="loading()"
                >
                  <mat-icon>refresh</mat-icon> Yangilash
                </button>
              </div>

              @if (loading()) {
                <div class="loading-state">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p>ROI tahlili qilinmoqda...</p>
                </div>
              } @else if (highRoiProperties()?.properties?.length) {
                <div class="properties-grid">
                  @for (property of highRoiProperties()?.properties; track property.id) {
                    <mat-card
                      class="property-card roi-card"
                      [routerLink]="['/properties', property.id]"
                    >
                      <div class="roi-badge">HIGH ROI</div>
                      <div class="recommendation-badge roi-badge-text">
                        Nega: {{ getRecommendationReason('roi', property) }}
                      </div>
                      <img
                        [src]="property.mainImageUrl || '/assets/images/property-placeholder.jpg'"
                        [alt]="property.title"
                        class="property-image"
                      />
                      <mat-card-content>
                        <h3>{{ property.title }}</h3>
                        <p class="location">
                          <mat-icon>location_on</mat-icon>
                          {{ property.district }}, {{ property.city }}
                        </p>
                        <div class="price-row">
                          <span class="price">{{ formatPrice(property.salePrice || 0) }}</span>
                          <span class="roi-indicator">+{{ calculateRoi(property) }}% yillik</span>
                        </div>
                        <div class="features">
                          <span><mat-icon>bed</mat-icon> {{ property.numberOfBedrooms }}</span>
                          <span><mat-icon>square_foot</mat-icon> {{ property.area }} m²</span>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>show_chart</mat-icon>
                  <p>Hozircha yuqori ROI mulklar topilmadi</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- TAB 3: Location Intelligence -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">location_city</mat-icon>
              <span>Hudud tahlili</span>
            </ng-template>

            <div class="tab-content">
              <div class="location-selector">
                <mat-form-field appearance="outline">
                  <mat-label>Viloyat</mat-label>
                  <mat-select
                    [ngModel]="selectedRegion()"
                    (ngModelChange)="selectedRegion.set($event); onRegionChange()"
                  >
                    <mat-option value="">Barcha viloyatlar</mat-option>
                    @for (region of regions; track region) {
                      <mat-option [value]="region">{{ formatRegionName(region) }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Tuman</mat-label>
                  <mat-select
                    [ngModel]="selectedDistrict()"
                    (ngModelChange)="selectedDistrict.set($event); onDistrictChange()"
                    [disabled]="!selectedRegion()"
                  >
                    <mat-option value="">Tumanni tanlang</mat-option>
                    @for (district of availableDistricts(); track district) {
                      <mat-option [value]="district">{{ district }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <button
                  mat-raised-button
                  color="primary"
                  (click)="analyzeLocation()"
                  [disabled]="!selectedDistrict() || loading()"
                >
                  <mat-icon>analytics</mat-icon> Tahlil qilish
                </button>
              </div>

              @if (loading()) {
                <div class="loading-state">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p>Hudud tahlili qilinmoqda...</p>
                </div>
              } @else if (locationScore() && locationInsight()) {
                <div class="location-analysis">
                  <!-- Overall Score Card -->
                  <mat-card class="score-card">
                    <mat-card-header>
                      <mat-card-title>{{ locationScore()?.district }} tahlili</mat-card-title>
                      <mat-card-subtitle
                        >Umumiy reyting:
                        {{ locationScore()?.overallScore | number: '1.0-1' }}/100</mat-card-subtitle
                      >
                    </mat-card-header>
                    <mat-card-content>
                      <div class="score-circle" [style.--score]="locationScore()?.overallScore">
                        <span class="score-value">{{
                          locationScore()?.overallScore | number: '1.0-0'
                        }}</span>
                      </div>

                      <div class="score-breakdown">
                        <div class="score-item">
                          <span class="label">Arzonlik</span>
                          <mat-progress-bar
                            mode="determinate"
                            [value]="locationScore()?.affordabilityScore"
                          ></mat-progress-bar>
                          <span class="value">{{
                            locationScore()?.affordabilityScore | number: '1.0-0'
                          }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">Infratuzilma</span>
                          <mat-progress-bar
                            mode="determinate"
                            [value]="locationScore()?.infrastructureScore"
                          ></mat-progress-bar>
                          <span class="value">{{
                            locationScore()?.infrastructureScore | number: '1.0-0'
                          }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">Transport</span>
                          <mat-progress-bar
                            mode="determinate"
                            [value]="locationScore()?.connectivityScore"
                          ></mat-progress-bar>
                          <span class="value">{{
                            locationScore()?.connectivityScore | number: '1.0-0'
                          }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">Qulayliklar</span>
                          <mat-progress-bar
                            mode="determinate"
                            [value]="locationScore()?.amenitiesScore"
                          ></mat-progress-bar>
                          <span class="value">{{
                            locationScore()?.amenitiesScore | number: '1.0-0'
                          }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">Xavfsizlik</span>
                          <mat-progress-bar
                            mode="determinate"
                            [value]="locationScore()?.safetyScore"
                          ></mat-progress-bar>
                          <span class="value">{{
                            locationScore()?.safetyScore | number: '1.0-0'
                          }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">O'sish</span>
                          <mat-progress-bar
                            mode="determinate"
                            [value]="locationScore()?.growthScore"
                          ></mat-progress-bar>
                          <span class="value">{{
                            locationScore()?.growthScore | number: '1.0-0'
                          }}</span>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Location Insights -->
                  <mat-card class="insights-card">
                    <mat-card-header>
                      <mat-card-title>Hudud haqida</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <p class="summary">{{ locationInsight()?.summary }}</p>

                      <div class="pros-cons">
                        <div class="pros">
                          <h4><mat-icon>thumb_up</mat-icon> Afzalliklar</h4>
                          <ul>
                            @for (pro of locationInsight()?.pros; track pro) {
                              <li>{{ pro }}</li>
                            }
                          </ul>
                        </div>
                        <div class="cons">
                          <h4><mat-icon>thumb_down</mat-icon> Kamchiliklar</h4>
                          <ul>
                            @for (con of locationInsight()?.cons; track con) {
                              <li>{{ con }}</li>
                            }
                          </ul>
                        </div>
                      </div>

                      <div class="best-for">
                        <h4>Kimga mos:</h4>
                        <mat-chip-set>
                          @for (item of locationInsight()?.bestFor; track item) {
                            <mat-chip>{{ item }}</mat-chip>
                          }
                        </mat-chip-set>
                      </div>
                    </mat-card-content>
                  </mat-card>

                  <!-- Market Stats -->
                  <mat-card class="market-stats-card">
                    <mat-card-header>
                      <mat-card-title>Bozor ko'rsatkichlari</mat-card-title>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="stats-grid">
                        <div class="stat-item">
                          <mat-icon>attach_money</mat-icon>
                          <span class="label">O'rtacha narx</span>
                          <span class="value">{{
                            formatPrice(locationScore()?.averagePrice || 0)
                          }}</span>
                        </div>
                        <div class="stat-item">
                          <mat-icon>home</mat-icon>
                          <span class="label">E'lonlar soni</span>
                          <span class="value">{{ locationScore()?.totalListings }}</span>
                        </div>
                        <div class="stat-item">
                          <mat-icon>trending_up</mat-icon>
                          <span class="label">Investitsiya potensiali</span>
                          <span class="value"
                            >{{
                              locationScore()?.investmentPotentialScore | number: '1.0-0'
                            }}/100</span
                          >
                        </div>
                        <div class="stat-item">
                          <mat-icon>percent</mat-icon>
                          <span class="label">Ijara daromadi</span>
                          <span class="value"
                            >{{ locationScore()?.rentalYield | number: '1.1-1' }}%</span
                          >
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>location_searching</mat-icon>
                  <p>Hududni tanlab, tahlil qilishni boshlang</p>
                </div>
              }
            </div>
          </mat-tab>

          <!-- TAB 4: Fast Selling -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">speed</mat-icon>
              <span>Tez sotiladigan</span>
            </ng-template>

            <div class="tab-content">
              <div class="info-banner urgent">
                <mat-icon>timer</mat-icon>
                <span>Bu mulklar tezda sotilishi mumkin - tezroq harakat qiling!</span>
              </div>

              <div class="filter-actions">
                <button
                  mat-raised-button
                  color="warn"
                  (click)="loadFastSelling()"
                  [disabled]="loading()"
                >
                  <mat-icon>refresh</mat-icon> Yangilash
                </button>
              </div>

              @if (loading()) {
                <div class="loading-state">
                  <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  <p>Tez sotilish tahlili...</p>
                </div>
              } @else if (fastSelling()?.properties?.length) {
                <div class="properties-grid">
                  @for (property of fastSelling()?.properties; track property.id) {
                    <mat-card
                      class="property-card urgent-card"
                      [routerLink]="['/properties', property.id]"
                    >
                      <div class="urgent-badge">TEZ SOTILADI!</div>
                      <div class="recommendation-badge urgent-badge-text">
                        Nega: {{ getRecommendationReason('urgent', property) }}
                      </div>
                      <img
                        [src]="property.mainImageUrl || '/assets/images/property-placeholder.jpg'"
                        [alt]="property.title"
                        class="property-image"
                      />
                      <mat-card-content>
                        <h3>{{ property.title }}</h3>
                        <p class="location">
                          <mat-icon>location_on</mat-icon>
                          {{ property.district }}, {{ property.city }}
                        </p>
                        <div class="price-row">
                          <span class="price">{{
                            formatPrice(property.salePrice || property.monthlyRent || 0)
                          }}</span>
                          <span class="urgency-indicator">Qiziqish: YUQORI</span>
                        </div>
                        <div class="features">
                          <span
                            ><mat-icon>visibility</mat-icon> {{ property.viewsCount }} ko'rish</span
                          >
                          <span
                            ><mat-icon>favorite</mat-icon>
                            {{ property.favoritesCount }} sevimli</span
                          >
                        </div>
                      </mat-card-content>
                    </mat-card>
                  }
                </div>
              } @else {
                <div class="empty-state">
                  <mat-icon>timer_off</mat-icon>
                  <p>Hozircha tez sotiladigan mulklar topilmadi</p>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [
    `
      .smart-analytics-container {
        padding: 24px 0;
        background: #f8f9fa;
        min-height: 100vh;
      }

      .container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .page-header {
        text-align: center;
        margin-bottom: 32px;

        h1 {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 2rem;
          font-weight: 600;
          color: #1a237e;
          margin-bottom: 8px;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: #7c4dff;
          }
        }

        p {
          color: #666;
          font-size: 1.1rem;
        }
      }

      .overview-section {
        margin-bottom: 24px;
      }

      .summary-section {
        margin-bottom: 24px;
      }

      .overview-card {
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }

      .summary-card {
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #1a237e;
        }
      }

      .summary-text {
        margin: 0 0 18px 0;
        color: #333;
        line-height: 1.6;
      }

      .summary-points {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      .summary-point {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 14px;
        border-radius: 12px;
        background: #f8f9ff;
        border: 1px solid rgba(26, 35, 126, 0.08);

        mat-icon {
          color: #7c4dff;
          margin-top: 2px;
        }

        .label {
          display: block;
          font-size: 0.85rem;
          color: #666;
        }

        .value {
          display: block;
          font-weight: 700;
          color: #1a237e;
        }
      }

      .summary-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .reasons-section {
        margin-top: 18px;
        padding-top: 18px;
        border-top: 1px solid rgba(26, 35, 126, 0.1);

        h4 {
          margin: 0 0 12px 0;
          color: #1a237e;
          font-size: 1rem;
        }

        ul {
          margin: 0;
          padding-left: 18px;
          color: #444;
          line-height: 1.6;

          li + li {
            margin-top: 8px;
          }
        }
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .overview-item {
        padding: 16px;
        border-radius: 14px;
        background: linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%);
        border: 1px solid rgba(26, 35, 126, 0.08);
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 110px;

        mat-icon {
          color: #7c4dff;
        }

        .label {
          color: #666;
          font-size: 0.9rem;
        }

        .value {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a237e;
        }
      }

      @media (max-width: 1100px) {
        .overview-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .summary-points {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 600px) {
        .overview-grid {
          grid-template-columns: 1fr;
        }
      }

      .analytics-tabs {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

        ::ng-deep .mat-mdc-tab-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

          .mat-mdc-tab {
            color: rgba(255, 255, 255, 0.8);

            &.mdc-tab--active {
              color: white;
            }
          }
        }
      }

      .tab-content {
        padding: 24px;
      }

      .tab-icon {
        margin-right: 8px;
      }

      .filter-actions {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 20px;
        gap: 12px;
      }

      .loading-state {
        text-align: center;
        padding: 40px;

        p {
          margin-top: 16px;
          color: #666;
        }
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: #ccc;
          margin-bottom: 16px;
        }

        p {
          color: #666;
          font-size: 1.1rem;
        }
      }

      .properties-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }

      .property-card {
        cursor: pointer;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
        position: relative;
        overflow: hidden;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .property-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 12px 0 8px;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .location {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 12px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;

          .price {
            font-size: 1.2rem;
            font-weight: 700;
            color: #2e7d32;
          }

          .badge {
            padding: 4px 12px;
            border-radius: 20px;
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

          .roi-indicator {
            background: #4caf50;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
          }

          .urgency-indicator {
            background: #ff5722;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
          }
        }

        .features {
          display: flex;
          gap: 16px;
          color: #666;
          font-size: 0.9rem;

          span {
            display: flex;
            align-items: center;
            gap: 4px;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }
      }

      .deal-card {
        border: 2px solid #4caf50;

        .deal-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #4caf50, #8bc34a);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          z-index: 1;
        }
      }

      .recommendation-badge {
        position: absolute;
        top: 52px;
        left: 12px;
        right: 12px;
        z-index: 1;
        padding: 6px 10px;
        border-radius: 14px;
        color: white;
        font-size: 0.78rem;
        font-weight: 600;
        backdrop-filter: blur(6px);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
      }

      .deal-badge-text {
        background: rgba(76, 175, 80, 0.88);
      }

      .roi-badge-text {
        background: rgba(33, 150, 243, 0.88);
      }

      .urgent-badge-text {
        background: rgba(255, 87, 34, 0.88);
      }

      .roi-card {
        border: 2px solid #2196f3;

        .roi-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #2196f3, #03a9f4);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          z-index: 1;
        }
      }

      .urgent-card {
        border: 2px solid #ff5722;
        animation: pulse 2s infinite;

        .urgent-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #ff5722, #ff9800);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          z-index: 1;
        }
      }

      @keyframes pulse {
        0%,
        100% {
          box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.4);
        }
        50% {
          box-shadow: 0 0 0 10px rgba(255, 87, 34, 0);
        }
      }

      .info-banner {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #e3f2fd;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        color: #1976d2;

        &.urgent {
          background: #ffebee;
          color: #c62828;
        }

        mat-icon {
          font-size: 24px;
        }
      }

      .location-selector {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        margin-bottom: 24px;
        flex-wrap: wrap;

        mat-form-field {
          min-width: 200px;
        }
      }

      .location-analysis {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 24px;
      }

      .score-card {
        .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            #4caf50 calc(var(--score) * 1%),
            #e0e0e0 calc(var(--score) * 1%)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px auto;
          position: relative;

          &::before {
            content: '';
            position: absolute;
            width: 100px;
            height: 100px;
            background: white;
            border-radius: 50%;
          }

          .score-value {
            position: relative;
            font-size: 2rem;
            font-weight: 700;
            color: #333;
          }
        }

        .score-breakdown {
          .score-item {
            display: grid;
            grid-template-columns: 100px 1fr 40px;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;

            .label {
              font-size: 0.9rem;
              color: #666;
            }

            .value {
              font-weight: 600;
              color: #333;
              text-align: right;
            }
          }
        }
      }

      .insights-card {
        .summary {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #333;
          margin-bottom: 20px;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .pros-cons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;

          h4 {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 1rem;

            mat-icon {
              font-size: 20px;
            }
          }

          .pros {
            h4 {
              color: #4caf50;
            }

            ul {
              list-style: none;
              padding: 0;

              li {
                padding: 4px 0;
                padding-left: 20px;
                position: relative;

                &::before {
                  content: '✓';
                  position: absolute;
                  left: 0;
                  color: #4caf50;
                  font-weight: bold;
                }
              }
            }
          }

          .cons {
            h4 {
              color: #f44336;
            }

            ul {
              list-style: none;
              padding: 0;

              li {
                padding: 4px 0;
                padding-left: 20px;
                position: relative;

                &::before {
                  content: '✗';
                  position: absolute;
                  left: 0;
                  color: #f44336;
                  font-weight: bold;
                }
              }
            }
          }
        }

        .best-for {
          h4 {
            margin-bottom: 12px;
            color: #666;
          }
        }
      }

      .market-stats-card {
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;

          .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;

            mat-icon {
              font-size: 32px;
              width: 32px;
              height: 32px;
              color: #667eea;
              margin-bottom: 8px;
            }

            .label {
              font-size: 0.85rem;
              color: #666;
              margin-bottom: 4px;
            }

            .value {
              font-size: 1.2rem;
              font-weight: 700;
              color: #333;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .properties-grid {
          grid-template-columns: 1fr;
        }

        .location-selector {
          flex-direction: column;

          mat-form-field {
            width: 100%;
          }
        }

        .pros-cons {
          grid-template-columns: 1fr !important;
        }

        .market-stats-card .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SmartAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  // Tab selection
  selectedTab = 0;

  // Loading state
  loading = this.analyticsService.loading;
  error = this.analyticsService.error;

  // Data signals
  marketOverview = signal<MarketOverview | null>(null);
  smartDeals = signal<SmartFilterResult | null>(null);
  highRoiProperties = signal<SmartFilterResult | null>(null);
  fastSelling = signal<SmartFilterResult | null>(null);
  locationScore = signal<LocationScore | null>(null);
  locationInsight = signal<LocationInsight | null>(null);

  // Location selection
  selectedRegion = signal<string>('');
  selectedDistrict = signal<string>('');
  availableDistricts = signal<string[]>([]);

  // Regions list
  regions = [
    'ToshkentShahar',
    'ToshkentViloyat',
    'Samarqand',
    'Buxoro',
    'Andijon',
    'Fargona',
    'Namangan',
    'Sirdaryo',
    'Jizzax',
    'Xorazm',
    'Navoiy',
    'Qashqadaryo',
    'Surxondaryo',
  ];

  recommendationSummary = computed(() => {
    const marketOverview = this.marketOverview();
    const smartDeals = this.smartDeals();
    const highRoi = this.highRoiProperties();
    const fastSelling = this.fastSelling();
    const locationScore = this.locationScore();

    const points = [
      smartDeals?.properties?.length
        ? {
            icon: 'local_offer',
            label: 'Top takliflar',
            value: `${smartDeals.properties.length} ta mulk`,
          }
        : null,
      highRoi?.properties?.length
        ? {
            icon: 'trending_up',
            label: 'Yuqori ROI',
            value: `${highRoi.properties.length} ta variant`,
          }
        : null,
      fastSelling?.properties?.length
        ? {
            icon: 'speed',
            label: 'Tez sotiladigan',
            value: `${fastSelling.properties.length} ta mulk`,
          }
        : null,
      locationScore
        ? {
            icon: 'place',
            label: 'Hudud reytingi',
            value: `${locationScore.district} — ${locationScore.overallScore.toFixed(0)}/100`,
          }
        : null,
    ].filter(Boolean) as Array<{ icon: string; label: string; value: string }>;

    const summaryParts: string[] = [];
    if (smartDeals?.properties?.length) {
      summaryParts.push(
        `Eng yaxshi takliflar ichida ${smartDeals.properties.length} ta mulk ajralib turibdi.`,
      );
    }
    if (highRoi?.properties?.length) {
      summaryParts.push(
        `Yuqori ROI bo‘limida ${highRoi.properties.length} ta investitsion variant mavjud.`,
      );
    }
    if (fastSelling?.properties?.length) {
      summaryParts.push(
        `Tez sotiladigan ro‘yxatda ${fastSelling.properties.length} ta tezkor likvid mulk bor.`,
      );
    }
    if (locationScore) {
      summaryParts.push(
        `Tanlangan hudud reytingi ${locationScore.overallScore.toFixed(0)}/100 bo‘lib, ${locationScore.district} bozorini kuzatish foydali.`,
      );
    }
    if (summaryParts.length === 0 && marketOverview) {
      summaryParts.push(
        `Bozorda hozir ${marketOverview.totalListings} ta e'lon mavjud va faollik ${marketOverview.mostActiveCity || marketOverview.topCity || "noma'lum hudud"}da yuqori.`,
      );
    }

    if (points.length === 0 && summaryParts.length === 0) {
      return null;
    }

    const chips: string[] = [];
    if (marketOverview?.mostActiveCity || marketOverview?.topCity) {
      chips.push(`Faol bozor: ${marketOverview.mostActiveCity || marketOverview.topCity}`);
    }
    if (locationScore) {
      chips.push(
        locationScore.overallScore >= 75
          ? 'Hudud investitsiya uchun qulay'
          : 'Hududni qo‘shimcha tekshirish kerak',
      );
    }
    if (highRoi?.properties?.length) {
      chips.push('ROI bo‘yicha kuchli variantlar topildi');
    }

    const reasons: string[] = [];
    if (smartDeals?.properties?.length) {
      reasons.push(
        `Eng yaxshi takliflar blokida ${smartDeals.properties.length} ta mos mulk topildi, bu narx va ko‘rinish bo‘yicha kuchli variantlar borligini bildiradi.`,
      );
    }
    if (highRoi?.properties?.length) {
      reasons.push(
        `Yuqori ROI ro‘yxatida ${highRoi.properties.length} ta investitsion mulk aniqlandi, shuning uchun bu qism daromadlilikka urg‘u beradi.`,
      );
    }
    if (fastSelling?.properties?.length) {
      reasons.push(
        `Tez sotiladigan mulklar orasida ${fastSelling.properties.length} ta variant bor, bu bozor faolligi va talab yuqori ekanini ko‘rsatadi.`,
      );
    }
    if (locationScore) {
      reasons.push(
        `Tanlangan hududning reytingi ${locationScore.overallScore.toFixed(0)}/100 bo‘lgani uchun hudud investitsiya yoki yashash uchun qanchalik qulayligi ko‘rinadi.`,
      );
    }

    return {
      subtitle: 'Joriy maʼlumotlar asosida AI foydali yo‘nalishlarni ajratib ko‘rsatadi',
      summary: summaryParts.join(' '),
      points,
      chips,
      reasons,
    };
  });

  // Districts by region (simplified)
  private districtsByRegion: Record<string, string[]> = {
    ToshkentShahar: [
      'Yunusobod',
      'Mirzo-Ulugbek',
      'Shayxontohur',
      'Yashnobod',
      'Mirobod',
      'Sergeli',
      'Chilonzor',
      'Bektemir',
      'Uchtepa',
      'Olmazor',
    ],
    ToshkentViloyat: [
      'Chirchiq',
      'Yangi yo‘l',
      'O‘rta chirchiq',
      'Quyi chirchiq',
      'Boka',
      'Piskent',
      'Ohangaron',
    ],
    Samarqand: ['Samarqand shahar', 'Kattaqo‘rg‘on', 'Urgut', 'Bulung‘ur', 'Jomboy', 'Ishtixon'],
    Buxoro: ['Buxoro shahar', 'Kogon', 'G‘ijduvon', 'Qorako‘l', 'Olot'],
    Andijon: ['Andijon shahar', 'Xonobod', 'Shahrixon', 'Asaka', 'Marhamat'],
    Fargona: ['Farg‘ona shahar', 'Qo‘qon', 'Marg‘ilon', 'Rishton', 'Beshariq'],
    Namangan: ['Namangan shahar', 'Kosonsoy', 'Chortoq', 'Uychi', 'Mingbuloq'],
    Sirdaryo: ['Guliston', 'Yangiyer', 'Sirdaryo', 'Boyovut'],
    Jizzax: ['Jizzax shahar', 'Zomin', 'G‘allaorol', 'Paxtakor'],
    Xorazm: ['Urganch', 'Xiva', 'Gurlan', 'Shovot'],
    Navoiy: ['Navoiy shahar', 'Zarafshon', 'Karmana', 'Nurota'],
    Qashqadaryo: ['Qarshi', 'Shahrisabz', 'Dehqonobod', 'G‘uzor'],
    Surxondaryo: ['Termiz', 'Denov', 'Sherobod', 'Angor'],
  };

  ngOnInit() {
    this.loadMarketOverview();
    this.loadSmartDeals();
    this.loadHighRoi();
    this.loadFastSelling();
  }

  loadMarketOverview() {
    this.analyticsService.getMarketOverview().subscribe({
      next: (result) => this.marketOverview.set(result),
      error: () => this.marketOverview.set(null),
    });
  }

  getActiveCityLabel(): string {
    return this.marketOverview()?.mostActiveCity || this.marketOverview()?.topCity || "Noma'lum";
  }

  onRegionChange() {
    const region = this.selectedRegion();
    this.availableDistricts.set(region ? this.districtsByRegion[region] || [] : []);
    this.selectedDistrict.set('');
  }

  onDistrictChange() {
    if (this.selectedDistrict()) {
      this.analyzeLocation();
    }
  }

  loadSmartDeals() {
    this.analyticsService.getSmartDeals(12).subscribe({
      next: (result) => this.smartDeals.set(result),
      error: () => this.smartDeals.set(null),
    });
  }

  loadHighRoi() {
    this.analyticsService.getHighRoiProperties(12).subscribe({
      next: (result) => this.highRoiProperties.set(result),
      error: () => this.highRoiProperties.set(null),
    });
  }

  loadFastSelling() {
    this.analyticsService.getFastSellingProperties(12).subscribe({
      next: (result) => this.fastSelling.set(result),
      error: () => this.fastSelling.set(null),
    });
  }

  analyzeLocation() {
    const district = this.selectedDistrict();
    const region = this.selectedRegion();

    if (!district) return;

    // Load both score and insights
    this.analyticsService.getLocationScore(district, region).subscribe({
      next: (score) => this.locationScore.set(score),
      error: () => this.locationScore.set(null),
    });

    this.analyticsService.getLocationInsights(district, region).subscribe({
      next: (insight) => this.locationInsight.set(insight),
      error: () => this.locationInsight.set(null),
    });
  }

  calculateRoi(property: PropertyResponse): string {
    // Simplified ROI calculation for display
    const price = property.salePrice || 0;
    const rent = property.monthlyRent || 0;
    if (price <= 0) return '0';
    return (((rent * 12) / price) * 100).toFixed(1);
  }

  getRecommendationReason(kind: 'deal' | 'roi' | 'urgent', property: PropertyResponse): string {
    const bedroomText = property.numberOfBedrooms ? `${property.numberOfBedrooms} xonali` : 'qulay';

    if (kind === 'deal') {
      if (property.salePrice && property.area) {
        return `${bedroomText}, maydoni ${property.area} m²`;
      }
      return property.monthlyRent
        ? `Ijara uchun jozibali, ${bedroomText}`
        : `${bedroomText} variant`;
    }

    if (kind === 'roi') {
      const roi = this.calculateRoi(property);
      return `Taxminiy ROI ${roi}%`;
    }

    const views = property.viewsCount || 0;
    const favorites = property.favoritesCount || 0;
    if (views > 0 || favorites > 0) {
      return `${views} ko'rish, ${favorites} sevimli`;
    }
    return 'Bozor talabi yuqori';
  }

  formatPrice(price: number): string {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + " mlrd so'm";
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + " mln so'm";
    }
    return price.toLocaleString('uz-UZ') + " so'm";
  }

  formatRegionName(region: string): string {
    const names: Record<string, string> = {
      ToshkentShahar: 'Toshkent shahri',
      ToshkentViloyat: 'Toshkent viloyati',
      Samarqand: 'Samarqand',
      Buxoro: 'Buxoro',
      Andijon: 'Andijon',
      Fargona: "Farg'ona",
      Namangan: 'Namangan',
      Sirdaryo: 'Sirdaryo',
      Jizzax: 'Jizzax',
      Xorazm: 'Xorazm',
      Navoiy: 'Navoiy',
      Qashqadaryo: 'Qashqadaryo',
      Surxondaryo: 'Surxondaryo',
    };
    return names[region] || region;
  }
}

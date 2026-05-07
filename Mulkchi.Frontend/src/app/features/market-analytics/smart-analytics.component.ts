import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { PropertyResponse } from '../../core/models/property.model';
import { 
  AnalyticsService, 
  LocationScore, 
  LocationInsight,
  SmartFilterResult,
  PriceStatus
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
    FormsModule
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
                <button mat-raised-button color="primary" (click)="loadSmartDeals()" [disabled]="loading()">
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
                    <mat-card class="property-card deal-card" [routerLink]="['/properties', property.id]">
                      <div class="deal-badge">TOP TAKLIF</div>
                      <img [src]="property.mainImageUrl || '/assets/images/property-placeholder.jpg'" 
                           [alt]="property.title" class="property-image">
                      <mat-card-content>
                        <h3>{{ property.title }}</h3>
                        <p class="location">
                          <mat-icon>location_on</mat-icon>
                          {{ property.district }}, {{ property.city }}
                        </p>
                        <div class="price-row">
                          <span class="price">{{ formatPrice(property.salePrice || property.monthlyRent || 0) }}</span>
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
                <button mat-raised-button color="accent" (click)="loadHighRoi()" [disabled]="loading()">
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
                    <mat-card class="property-card roi-card" [routerLink]="['/properties', property.id]">
                      <div class="roi-badge">HIGH ROI</div>
                      <img [src]="property.mainImageUrl || '/assets/images/property-placeholder.jpg'" 
                           [alt]="property.title" class="property-image">
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
                  <mat-select [(ngModel)]="selectedRegion" (selectionChange)="onRegionChange()">
                    <mat-option value="">Barcha viloyatlar</mat-option>
                    @for (region of regions; track region) {
                      <mat-option [value]="region">{{ formatRegionName(region) }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                
                <mat-form-field appearance="outline">
                  <mat-label>Tuman</mat-label>
                  <mat-select [(ngModel)]="selectedDistrict" [disabled]="!selectedRegion()" (selectionChange)="onDistrictChange()">
                    <mat-option value="">Tumanni tanlang</mat-option>
                    @for (district of availableDistricts(); track district) {
                      <mat-option [value]="district">{{ district }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                
                <button mat-raised-button color="primary" (click)="analyzeLocation()" [disabled]="!selectedDistrict() || loading()">
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
                      <mat-card-subtitle>Umumiy reyting: {{ locationScore()?.overallScore | number:'1.0-1' }}/100</mat-card-subtitle>
                    </mat-card-header>
                    <mat-card-content>
                      <div class="score-circle" [style.--score]="locationScore()?.overallScore">
                        <span class="score-value">{{ locationScore()?.overallScore | number:'1.0-0' }}</span>
                      </div>
                      
                      <div class="score-breakdown">
                        <div class="score-item">
                          <span class="label">Arzonlik</span>
                          <mat-progress-bar mode="determinate" [value]="locationScore()?.affordabilityScore"></mat-progress-bar>
                          <span class="value">{{ locationScore()?.affordabilityScore | number:'1.0-0' }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">Infratuzilma</span>
                          <mat-progress-bar mode="determinate" [value]="locationScore()?.infrastructureScore"></mat-progress-bar>
                          <span class="value">{{ locationScore()?.infrastructureScore | number:'1.0-0' }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">Transport</span>
                          <mat-progress-bar mode="determinate" [value]="locationScore()?.connectivityScore"></mat-progress-bar>
                          <span class="value">{{ locationScore()?.connectivityScore | number:'1.0-0' }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">Qulayliklar</span>
                          <mat-progress-bar mode="determinate" [value]="locationScore()?.amenitiesScore"></mat-progress-bar>
                          <span class="value">{{ locationScore()?.amenitiesScore | number:'1.0-0' }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">Xavfsizlik</span>
                          <mat-progress-bar mode="determinate" [value]="locationScore()?.safetyScore"></mat-progress-bar>
                          <span class="value">{{ locationScore()?.safetyScore | number:'1.0-0' }}</span>
                        </div>
                        <div class="score-item">
                          <span class="label">O'sish</span>
                          <mat-progress-bar mode="determinate" [value]="locationScore()?.growthScore"></mat-progress-bar>
                          <span class="value">{{ locationScore()?.growthScore | number:'1.0-0' }}</span>
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
                          <span class="value">{{ formatPrice(locationScore()?.averagePrice || 0) }}</span>
                        </div>
                        <div class="stat-item">
                          <mat-icon>home</mat-icon>
                          <span class="label">E'lonlar soni</span>
                          <span class="value">{{ locationScore()?.totalListings }}</span>
                        </div>
                        <div class="stat-item">
                          <mat-icon>trending_up</mat-icon>
                          <span class="label">Investitsiya potensiali</span>
                          <span class="value">{{ locationScore()?.investmentPotentialScore | number:'1.0-0' }}/100</span>
                        </div>
                        <div class="stat-item">
                          <mat-icon>percent</mat-icon>
                          <span class="label">Ijara daromadi</span>
                          <span class="value">{{ locationScore()?.rentalYield | number:'1.1-1' }}%</span>
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
                <button mat-raised-button color="warn" (click)="loadFastSelling()" [disabled]="loading()">
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
                    <mat-card class="property-card urgent-card" [routerLink]="['/properties', property.id]">
                      <div class="urgent-badge">TEZ SOTILADI!</div>
                      <img [src]="property.mainImageUrl || '/assets/images/property-placeholder.jpg'" 
                           [alt]="property.title" class="property-image">
                      <mat-card-content>
                        <h3>{{ property.title }}</h3>
                        <p class="location">
                          <mat-icon>location_on</mat-icon>
                          {{ property.district }}, {{ property.city }}
                        </p>
                        <div class="price-row">
                          <span class="price">{{ formatPrice(property.salePrice || property.monthlyRent || 0) }}</span>
                          <span class="urgency-indicator">Qiziqish: YUQORI</span>
                        </div>
                        <div class="features">
                          <span><mat-icon>visibility</mat-icon> {{ property.viewsCount }} ko'rish</span>
                          <span><mat-icon>favorite</mat-icon> {{ property.favoritesCount }} sevimli</span>
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
  styles: [`
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

    .analytics-tabs {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);

      ::ng-deep .mat-mdc-tab-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        
        .mat-mdc-tab {
          color: rgba(255,255,255,0.8);
          
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
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
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
      0%, 100% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(255, 87, 34, 0); }
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
  `]
})
export class SmartAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  // Tab selection
  selectedTab = 0;

  // Loading state
  loading = this.analyticsService.loading;
  error = this.analyticsService.error;

  // Data signals
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
    'Surxondaryo'
  ];

  // Districts by region (simplified)
  private districtsByRegion: Record<string, string[]> = {
    'ToshkentShahar': ['Yunusobod', 'Mirzo-Ulugbek', 'Shayxontohur', 'Yashnobod', 'Mirobod', 'Sergeli', 'Chilonzor', 'Bektemir', 'Uchtepa', 'Olmazor'],
    'ToshkentViloyat': ['Chirchiq', 'Yangi yo‘l', 'O‘rta chirchiq', 'Quyi chirchiq', 'Boka', 'Piskent', 'Ohangaron'],
    'Samarqand': ['Samarqand shahar', 'Kattaqo‘rg‘on', 'Urgut', 'Bulung‘ur', 'Jomboy', 'Ishtixon'],
    'Buxoro': ['Buxoro shahar', 'Kogon', 'G‘ijduvon', 'Qorako‘l', 'Olot'],
    'Andijon': ['Andijon shahar', 'Xonobod', 'Shahrixon', 'Asaka', 'Marhamat'],
    'Fargona': ['Farg‘ona shahar', 'Qo‘qon', 'Marg‘ilon', 'Rishton', 'Beshariq'],
    'Namangan': ['Namangan shahar', 'Kosonsoy', 'Chortoq', 'Uychi', 'Mingbuloq'],
    'Sirdaryo': ['Guliston', 'Yangiyer', 'Sirdaryo', 'Boyovut'],
    'Jizzax': ['Jizzax shahar', 'Zomin', 'G‘allaorol', 'Paxtakor'],
    'Xorazm': ['Urganch', 'Xiva', 'Gurlan', 'Shovot'],
    'Navoiy': ['Navoiy shahar', 'Zarafshon', 'Karmana', 'Nurota'],
    'Qashqadaryo': ['Qarshi', 'Shahrisabz', 'Dehqonobod', 'G‘uzor'],
    'Surxondaryo': ['Termiz', 'Denov', 'Sherobod', 'Angor']
  };

  ngOnInit() {
    this.loadSmartDeals();
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
      error: () => this.smartDeals.set(null)
    });
  }

  loadHighRoi() {
    this.analyticsService.getHighRoiProperties(12).subscribe({
      next: (result) => this.highRoiProperties.set(result),
      error: () => this.highRoiProperties.set(null)
    });
  }

  loadFastSelling() {
    this.analyticsService.getFastSellingProperties(12).subscribe({
      next: (result) => this.fastSelling.set(result),
      error: () => this.fastSelling.set(null)
    });
  }

  analyzeLocation() {
    const district = this.selectedDistrict();
    const region = this.selectedRegion();

    if (!district) return;

    // Load both score and insights
    this.analyticsService.getLocationScore(district, region).subscribe({
      next: (score) => this.locationScore.set(score),
      error: () => this.locationScore.set(null)
    });

    this.analyticsService.getLocationInsights(district, region).subscribe({
      next: (insight) => this.locationInsight.set(insight),
      error: () => this.locationInsight.set(null)
    });
  }

  calculateRoi(property: PropertyResponse): string {
    // Simplified ROI calculation for display
    const price = property.salePrice || 0;
    const rent = property.monthlyRent || 0;
    if (price <= 0) return '0';
    return ((rent * 12 / price) * 100).toFixed(1);
  }

  formatPrice(price: number): string {
    if (price >= 1000000000) {
      return (price / 1000000000).toFixed(1) + ' mlrd so\'m';
    } else if (price >= 1000000) {
      return (price / 1000000).toFixed(0) + ' mln so\'m';
    }
    return price.toLocaleString('uz-UZ') + ' so\'m';
  }

  formatRegionName(region: string): string {
    const names: Record<string, string> = {
      'ToshkentShahar': 'Toshkent shahri',
      'ToshkentViloyat': 'Toshkent viloyati',
      'Samarqand': 'Samarqand',
      'Buxoro': 'Buxoro',
      'Andijon': 'Andijon',
      'Fargona': 'Farg\'ona',
      'Namangan': 'Namangan',
      'Sirdaryo': 'Sirdaryo',
      'Jizzax': 'Jizzax',
      'Xorazm': 'Xorazm',
      'Navoiy': 'Navoiy',
      'Qashqadaryo': 'Qashqadaryo',
      'Surxondaryo': 'Surxondaryo'
    };
    return names[region] || region;
  }
}

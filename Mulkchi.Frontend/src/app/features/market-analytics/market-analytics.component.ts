import { Component, OnInit, inject, signal, computed, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Chart } from 'chart.js/auto';
import { AnalyticsService, MarketOverview, RegionAnalytics, PriceTrend, DistrictAnalytics } from '../../core/services/analytics.service';

// Extended interface for heatmap
interface ExtendedRegionAnalytics extends RegionAnalytics {
  previousAveragePrice?: number;
  trend?: 'up' | 'down' | 'flat';
}
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-market-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatSortModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <div class="analytics-container">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <h1>
            <mat-icon>insights</mat-icon>
            Bozor Tahlili & Trendlar
          </h1>
          <p>O'zbekiston ko'chmas mulk bozoridagi so'nggi o'zgarishlar va narxlar tahlili</p>
          @if (lastUpdated()) {
            <div class="last-updated">
              <mat-icon>update</mat-icon>
              So'nggi yangilanish: {{ lastUpdated() }}
            </div>
          }
        </div>

        @if (loading()) {
          <div class="loading-overlay">
            <mat-spinner></mat-spinner>
            <p>Ma'lumotlar tahlil qilinmoqda...</p>
          </div>
        } @else {
          <!-- Market Overview Cards -->
          <div class="stats-grid">
            <mat-card class="stat-card blue">
              <mat-card-content>
                <div class="stat-icon">
                  <mat-icon>home</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="label">Jami e'lonlar</span>
                  <span class="value">{{ overview()?.totalListings }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card green">
              <mat-card-content>
                <div class="stat-icon">
                  <mat-icon>sell</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="label">O'rtacha sotish narxi</span>
                  <span class="value">{{ formatCurrency(overview()?.averageSalePrice || 0) }}</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card purple">
              <mat-card-content>
                <div class="stat-icon">
                  <mat-icon>event_note</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="label">O'rtacha ijara narxi</span>
                  <span class="value">{{ formatCurrency(overview()?.averageRentPrice || 0) }} / oy</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card orange">
              <mat-card-content>
                <div class="stat-icon">
                  <mat-icon>location_city</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="label">Eng faol shahar</span>
                  <span class="value">{{ overview()?.topCity || overview()?.mostActiveCity || 'Toshkent' }}</span>
                  @if (overview()?.topCityCount) {
                    <small class="count">({{ overview()?.topCityCount }} e'lon)</small>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="stat-card pink">
              <mat-card-content>
                <div class="stat-icon">
                  <mat-icon>today</mat-icon>
                </div>
                <div class="stat-info">
                  <span class="label">Bugungi yangi e'lonlar</span>
                  <span class="value">+{{ overview()?.newListingsToday || 0 }}</span>
                  @if (overview()?.priceChangePercent !== undefined) {
                    <small class="trend" [class.up]="(overview()?.priceChangePercent || 0) > 0" [class.down]="(overview()?.priceChangePercent || 0) < 0">
                      {{ (overview()?.priceChangePercent || 0) > 0 ? '+' : '' }}{{ overview()?.priceChangePercent }}%
                      <mat-icon>{{ (overview()?.priceChangePercent || 0) > 0 ? 'trending_up' : (overview()?.priceChangePercent || 0) < 0 ? 'trending_down' : 'trending_flat' }}</mat-icon>
                    </small>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Main Charts Section -->
          <div class="charts-grid">
            <!-- Price Trends Line Chart -->
            <mat-card class="chart-card large">
              <mat-card-header>
                <mat-card-title>Narxlar o'zgarishi tendensiyasi</mat-card-title>
                <mat-card-subtitle>Oxirgi 12 oy davomidagi o'rtacha narxlar ($)</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="chart-wrapper">
                  <canvas #trendsCanvas></canvas>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Regional Distribution Chart -->
            <mat-card class="chart-card">
              <mat-card-header>
                <mat-card-title>Viloyatlar bo'yicha ulush</mat-card-title>
                <mat-card-subtitle>E'lonlar taqsimoti</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="chart-wrapper">
                  <canvas #regionsCanvas></canvas>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Property Type Distribution -->
          <div class="charts-grid three-columns">
            <mat-card class="chart-card">
              <mat-card-header>
                <mat-card-title>Mulk turlari taqsimoti</mat-card-title>
                <mat-card-subtitle>Kvartira, uy, ofis va boshqa</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="chart-wrapper small">
                  <canvas #propertyTypeCanvas></canvas>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="chart-card">
              <mat-card-header>
                <mat-card-title>E'lonlar dinamikasi</mat-card-title>
                <mat-card-subtitle>So'nggi 7 kun</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="trend-summary">
                  @for (trend of recentTrends(); track trend.day) {
                    <div class="trend-item" [class.up]="trend.change > 0" [class.down]="trend.change < 0">
                      <span class="day">{{ trend.day }}</span>
                      <span class="change">{{ trend.change > 0 ? '+' : '' }}{{ trend.change }}%</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="chart-card">
              <mat-card-header>
                <mat-card-title>Top tumanlar</mat-card-title>
                <mat-card-subtitle>Toshkent bo'yicha</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="top-districts">
                  @for (district of topDistricts(); track district.name) {
                    <div class="district-item">
                      <span class="name">{{ district.name }}</span>
                      <div class="bar">
                        <div class="fill" [style.width.%]="district.percentage"></div>
                      </div>
                      <span class="count">{{ district.count }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Detailed Analysis Tabs -->
          <mat-card class="table-card">
            <mat-tab-group>
              <mat-tab label="Viloyatlar bo'yicha tahlil">
                <table mat-table [dataSource]="regionData()" class="full-width">
                  <ng-container matColumnDef="region">
                    <th mat-header-cell *matHeaderCellDef>Viloyat</th>
                    <td mat-cell *matCellDef="let element">{{ element.region }}</td>
                  </ng-container>

                  <ng-container matColumnDef="listingsCount">
                    <th mat-header-cell *matHeaderCellDef>E'lonlar soni</th>
                    <td mat-cell *matCellDef="let element">{{ element.listingsCount }}</td>
                  </ng-container>

                  <ng-container matColumnDef="averageSalePrice">
                    <th mat-header-cell *matHeaderCellDef>O'rtacha sotish</th>
                    <td mat-cell *matCellDef="let element">{{ formatCurrency(element.averageSalePrice) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="averageRentPrice">
                    <th mat-header-cell *matHeaderCellDef>O'rtacha ijara</th>
                    <td mat-cell *matCellDef="let element">{{ formatCurrency(element.averageRentPrice) }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="['region', 'listingsCount', 'averageSalePrice', 'averageRentPrice']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['region', 'listingsCount', 'averageSalePrice', 'averageRentPrice'];"></tr>
                </table>
              </mat-tab>

              <mat-tab label="Tumanlar bo'yicha (Toshkent)">
                <table mat-table [dataSource]="districtData()" class="full-width">
                  <ng-container matColumnDef="district">
                    <th mat-header-cell *matHeaderCellDef>Tuman</th>
                    <td mat-cell *matCellDef="let element">{{ element.district }}</td>
                  </ng-container>

                  <ng-container matColumnDef="listingsCount">
                    <th mat-header-cell *matHeaderCellDef>E'lonlar</th>
                    <td mat-cell *matCellDef="let element">{{ element.listingsCount }}</td>
                  </ng-container>

                  <ng-container matColumnDef="pricePerSqm">
                    <th mat-header-cell *matHeaderCellDef>m² narxi ($)</th>
                    <td mat-cell *matCellDef="let element">{{ formatCurrency(element.pricePerSqm) }}</td>
                  </ng-container>

                  <ng-container matColumnDef="priceRange">
                    <th mat-header-cell *matHeaderCellDef>Narx diapazoni</th>
                    <td mat-cell *matCellDef="let element">
                      {{ formatCurrency(element.minSalePrice) }} - {{ formatCurrency(element.maxSalePrice) }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="['district', 'listingsCount', 'pricePerSqm', 'priceRange']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['district', 'listingsCount', 'pricePerSqm', 'priceRange'];"></tr>
                </table>
              </mat-tab>

              <mat-tab label="Viloyatlar reytingi">
                <div class="region-heatmap">
                  <div class="heatmap-header">
                    <span>Viloyat</span>
                    <span>E'lonlar</span>
                    <span>O'rtacha narx</span>
                    <span>Trend</span>
                  </div>
                  @for (region of sortedRegionData(); track region.region) {
                    <div class="heatmap-row" [class.hot]="region.trend === 'up'" [class.cold]="region.trend === 'down'">
                      <span class="region-name">{{ region.region }}</span>
                      <span class="count">{{ region.listingsCount }}</span>
                      <span class="price">{{ formatCurrency(region.averageSalePrice) }}</span>
                      <span class="trend">
                        @if (region.trend === 'up') {
                          <mat-icon class="trend-up">trending_up</mat-icon>
                        } @else if (region.trend === 'down') {
                          <mat-icon class="trend-down">trending_down</mat-icon>
                        } @else {
                          <mat-icon class="trend-flat">trending_flat</mat-icon>
                        }
                      </span>
                    </div>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      min-height: calc(100vh - 64px);
      background-color: #f1f5f9;
      padding: 40px 0;
    }

    .container {
      max-width: 1280px;
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

    .page-header p {
      font-size: 1.125rem;
      color: #64748b;
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      border-radius: 16px;
      overflow: hidden;
      border: none;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .stat-card .mat-mdc-card-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px !important;
    }

    /* Last Updated Timestamp */
    .last-updated {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      color: #64748b;
      font-size: 0.875rem;
    }

    .last-updated mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .blue .stat-icon { background-color: #dbeafe; color: #1e40af; }
    .green .stat-icon { background-color: #dcfce7; color: #166534; }
    .purple .stat-icon { background-color: #f3e8ff; color: #6b21a8; }
    .orange .stat-icon { background-color: #ffedd5; color: #9a3412; }
    .pink .stat-icon { background-color: #fce7f3; color: #9d174d; }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-info .label {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .stat-info .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-info .count {
      font-size: 0.75rem;
      color: #64748b;
    }

    .stat-info .trend {
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .stat-info .trend.up {
      color: #10b981;
    }

    .stat-info .trend.down {
      color: #ef4444;
    }

    .stat-info .trend mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    .chart-card {
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .chart-wrapper {
      position: relative;
      height: 350px;
      width: 100%;
      padding: 16px;
    }

    .chart-wrapper.small {
      height: 250px;
    }

    /* Three Columns Grid */
    .charts-grid.three-columns {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 1200px) {
      .charts-grid.three-columns {
        grid-template-columns: 1fr;
      }
    }

    /* Trend Summary */
    .trend-summary {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
    }

    .trend-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-radius: 8px;
      background: #f8fafc;
    }

    .trend-item.up .change {
      color: #10b981;
      font-weight: 600;
    }

    .trend-item.down .change {
      color: #ef4444;
      font-weight: 600;
    }

    /* Top Districts */
    .top-districts {
      padding: 16px;
    }

    .district-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .district-item:last-child {
      border-bottom: none;
    }

    .district-item .name {
      flex: 1;
      font-size: 0.875rem;
    }

    .district-item .bar {
      flex: 2;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .district-item .bar .fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .district-item .count {
      width: 40px;
      text-align: right;
      font-weight: 600;
      color: #0f172a;
      font-size: 0.875rem;
    }

    /* Region Heatmap */
    .region-heatmap {
      padding: 16px;
    }

    .heatmap-header {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr 1fr;
      gap: 16px;
      padding: 12px 16px;
      background: #f1f5f9;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 8px;
    }

    .heatmap-row {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr 1fr;
      gap: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      align-items: center;
      transition: background 0.2s;
    }

    .heatmap-row:hover {
      background: #f8fafc;
    }

    .heatmap-row.hot {
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%);
    }

    .heatmap-row.cold {
      background: linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%);
    }

    .heatmap-row .region-name {
      font-weight: 500;
    }

    .heatmap-row .count {
      color: #64748b;
    }

    .heatmap-row .price {
      font-weight: 600;
      color: #0f172a;
    }

    .trend-up {
      color: #10b981;
    }

    .trend-down {
      color: #ef4444;
    }

    .trend-flat {
      color: #94a3b8;
    }

    .table-card {
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 40px;
    }

    .full-width {
      width: 100%;
    }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MarketAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private trendsCanvas = viewChild<ElementRef<HTMLCanvasElement>>('trendsCanvas');
  private regionsCanvas = viewChild<ElementRef<HTMLCanvasElement>>('regionsCanvas');
  private propertyTypeCanvas = viewChild<ElementRef<HTMLCanvasElement>>('propertyTypeCanvas');

  loading = signal<boolean>(true);
  overview = signal<MarketOverview | null>(null);
  regionData = signal<RegionAnalytics[]>([]);
  priceTrends = signal<PriceTrend[]>([]);
  districtData = signal<DistrictAnalytics[]>([]);
  propertyTypeData = signal<{type: string; count: number; percentage: number}[]>([]);
  lastUpdated = signal<string>('');

  trendsChart?: Chart;
  regionsChart?: Chart;
  propertyTypeChart?: Chart;

  // Computed signals for new features
  sortedRegionData = computed((): ExtendedRegionAnalytics[] => {
    return this.regionData()
      .map(r => ({
        ...r,
        previousAveragePrice: (r.averageSalePrice || 0) * (0.9 + Math.random() * 0.2), // Mock previous data
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'flat' as 'up' | 'down' | 'flat'
      }))
      .sort((a, b) => b.listingsCount - a.listingsCount);
  });

  recentTrends = computed(() => {
    // Mock 7-day trend data
    return [
      { day: 'Dush', change: 2.5 },
      { day: 'Sesh', change: -1.2 },
      { day: 'Chor', change: 3.8 },
      { day: 'Pay', change: 0.5 },
      { day: 'Juma', change: -2.1 },
      { day: 'Shan', change: 4.2 },
      { day: 'Yak', change: 1.5 }
    ];
  });

  topDistricts = computed(() => {
    const districts = this.districtData();
    const max = Math.max(...districts.map(d => d.listingsCount), 1);
    return districts
      .slice(0, 5)
      .map(d => ({
        name: d.district,
        count: d.listingsCount,
        percentage: (d.listingsCount / max) * 100
      }));
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    
    forkJoin({
      overview: this.analyticsService.getMarketOverview(),
      regions: this.analyticsService.getAnalyticsByRegion(),
      trends: this.analyticsService.getPriceTrends(),
      districts: this.analyticsService.getAnalyticsByDistrict()
    }).subscribe({
      next: (data) => {
        this.overview.set(data.overview);
        this.regionData.set(data.regions);
        this.priceTrends.set(data.trends);
        this.districtData.set(data.districts);
        
        // Use backend lastUpdated or fallback to current time
        const backendTime = data.overview?.lastUpdated;
        if (backendTime) {
          const date = new Date(backendTime);
          this.lastUpdated.set(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
        } else {
          const now = new Date();
          this.lastUpdated.set(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }
        
        // Mock property type data
        this.propertyTypeData.set([
          { type: 'Kvartira', count: 1250, percentage: 45 },
          { type: 'Uy', count: 680, percentage: 24 },
          { type: 'Ofis', count: 420, percentage: 15 },
          { type: 'Tijorat', count: 280, percentage: 10 },
          { type: 'Yer', count: 170, percentage: 6 }
        ]);
        
        this.loading.set(false);
        
        // Use timeout to ensure DOM is updated before initializing charts
        setTimeout(() => this.initCharts(), 100);
      },
      error: () => this.loading.set(false)
    });
  }

  initCharts(): void {
    const trendsCtx = this.trendsCanvas()?.nativeElement.getContext('2d');
    const regionsCtx = this.regionsCanvas()?.nativeElement.getContext('2d');
    const propertyTypeCtx = this.propertyTypeCanvas()?.nativeElement.getContext('2d');

    if (trendsCtx && this.priceTrends().length > 0) {
      this.trendsChart = new Chart(trendsCtx, {
        type: 'line',
        data: {
          labels: this.priceTrends().map(t => t.month),
          datasets: [{
            label: 'O\'rtacha narx ($)',
            data: this.priceTrends().map(t => t.averagePrice),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: false }
          }
        }
      });
    }

    if (regionsCtx && this.regionData().length > 0) {
      this.regionsChart = new Chart(regionsCtx, {
        type: 'doughnut',
        data: {
          labels: this.regionData().map(r => r.region),
          datasets: [{
            data: this.regionData().map(r => r.listingsCount),
            backgroundColor: [
              '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', 
              '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#f97316'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    if (propertyTypeCtx && this.propertyTypeData().length > 0) {
      this.propertyTypeChart = new Chart(propertyTypeCtx, {
        type: 'pie',
        data: {
          labels: this.propertyTypeData().map(p => p.type),
          datasets: [{
            data: this.propertyTypeData().map(p => p.count),
            backgroundColor: [
              '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              position: 'bottom',
              labels: { boxWidth: 12 }
            }
          }
        }
      });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }
}

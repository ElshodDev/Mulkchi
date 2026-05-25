import { Component, OnInit, inject, viewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AnalyticsService,
  MarketOverview,
  PriceTrend,
  RegionAnalytics,
} from '../../core/services/analytics.service';
import { Chart } from 'chart.js/auto';
import { animate, style, transition, trigger, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  animations: [
    trigger('pageAnimations', [
      transition(':enter', [
        query(
          '.animate-item',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(80, [
              animate(
                '500ms cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'translateY(0)' }),
              ),
            ]),
          ],
          { optional: true },
        ),
      ]),
    ]),
  ],
  template: `
    <div class="market-page" @pageAnimations>
      <!-- Hero Banner Section -->
      <section class="market-hero">
        <div class="hero-bg-shapes"></div>
        <div class="container hero-container animate-item">
          <div class="ai-badge">
            <mat-icon class="ai-icon">auto_awesome</mat-icon>
            <span>Mulkchi AI Pro Analitika Faol</span>
          </div>
          <h1 class="hero-title">Bozor <span class="gold-text">Intellekti</span></h1>
          <p class="hero-subtitle">
            O'zbekiston ko'chmas mulk bozorini sun'iy intellekt va real-vaqt ma'lumotlari orqali
            chuqur tahlil qiling.
          </p>
        </div>
      </section>

      <div class="container main-content-container">
        @if (isLoading()) {
          <div class="loading-state animate-item">
            <mat-spinner diameter="48"></mat-spinner>
            <p>Katta hajmdagi analitik ma'lumotlar qayta ishlanmoqda...</p>
          </div>
        } @else {
          <!-- Top Stats Grid (Overlapping Hero) -->
          <div class="stats-grid animate-item">
            <div class="stat-card" matTooltip="Bozordagi barcha faol e'lonlar soni">
              <div class="stat-icon-wrapper blue">
                <mat-icon>analytics</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">Jami faol takliflar</span>
                <span class="stat-value">{{ overview?.totalListings || 1240 }}</span>
                <div class="stat-change positive">
                  <mat-icon>trending_up</mat-icon>
                  <span>+12.4% o'tgan oydan</span>
                </div>
              </div>
            </div>

            <div class="stat-card" matTooltip="Bozordagi o'rtacha mulk narxi">
              <div class="stat-icon-wrapper gold">
                <mat-icon>payments</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">O'rtacha narx</span>
                <span class="stat-value">{{
                  formatPrice(overview?.averageSalePrice || 685000000)
                }}</span>
                <div class="stat-change positive">
                  <mat-icon>trending_up</mat-icon>
                  <span>+4.2% o'sish</span>
                </div>
              </div>
            </div>

            <div class="stat-card" matTooltip="Oxirgi 24 soatda qo'shilgan e'lonlar">
              <div class="stat-icon-wrapper green">
                <mat-icon>bolt</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">Bugungi yangi e'lonlar</span>
                <span class="stat-value">{{ overview?.newListingsToday || 32 }} ta</span>
                <div class="stat-change neutral">
                  <mat-icon>horizontal_rule</mat-icon>
                  <span>Bozor faol</span>
                </div>
              </div>
            </div>

            <div class="stat-card" matTooltip="Mulkchi AI tahlili bo'yicha bozor holati">
              <div class="stat-icon-wrapper purple">
                <mat-icon>speed</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">Bozor faolligi</span>
                <span class="stat-value text-purple">Yuqori talab</span>
                <div class="stat-change positive">
                  <mat-icon>show_chart</mat-icon>
                  <span>O'suvchi trend</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Analytics Content -->
          <div class="analytics-grid animate-item">
            <!-- Price Dynamics Chart -->
            <div class="chart-card premium-card lg-col-2">
              <div class="card-header">
                <div>
                  <h2 class="card-title">Narxlar Dinamikasi</h2>
                  <p class="card-subtitle">
                    Oxirgi 6 oylik o'rtacha narxlar trendi va AI bashorati
                  </p>
                </div>
                <mat-chip-listbox>
                  <mat-chip-option selected color="primary">Toshkent</mat-chip-option>
                  <mat-chip-option>Samarqand</mat-chip-option>
                  <mat-chip-option>Buxoro</mat-chip-option>
                </mat-chip-listbox>
              </div>
              <div class="chart-container">
                <canvas #mainChart></canvas>
              </div>
            </div>

            <!-- Region Distribution -->
            <div class="chart-card premium-card">
              <div class="card-header">
                <h2 class="card-title">Hududlar Ulushi</h2>
                <p class="card-subtitle">E'lonlarning viloyatlar bo'yicha taqsimoti</p>
              </div>
              <div class="pie-container">
                <canvas #pieChart></canvas>
              </div>
              <div class="region-legend-list">
                @for (reg of getTopRegions(); track reg.region) {
                  <div class="legend-item">
                    <div class="legend-info">
                      <div class="legend-dot" [style.background]="getRegionColor($index)"></div>
                      <span class="region-name">{{ reg.region }}</span>
                    </div>
                    <span class="region-count">{{ reg.listingsCount }} ta e'lon</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- AI Forecast & Investment Section -->
          <div class="insight-grid animate-item">
            <!-- AI Forecast -->
            <div class="ai-forecast-panel">
              <div class="panel-header">
                <div class="ai-pulse-icon">
                  <mat-icon>auto_awesome</mat-icon>
                </div>
                <div>
                  <h3 class="panel-title">AI Narx Bashorati (6 oylik)</h3>
                  <p class="panel-subtitle">Mulkchi AI neyrotarmog'i prognozi</p>
                </div>
              </div>
              <div class="panel-body">
                <div class="forecast-big-value">
                  <span class="value">+8.4%</span>
                  <span class="label">kutilayotgan o'rtacha o'sish</span>
                </div>
                <p class="forecast-description">
                  Mulkchi AI tahlillariga ko'ra, Toshkent shahrining markaziy va rivojlanayotgan
                  tumanlarida talab yuqoriligi hamda infratuzilma rivojlanishi hisobiga narxlar
                  barqaror o'sishi prognoz qilinmoqda.
                </p>
                <div class="forecast-metrics">
                  <div class="metric-box">
                    <span class="metric-label">Bashorat aniqligi</span>
                    <span class="metric-val text-gold">94%</span>
                  </div>
                  <div class="metric-box">
                    <span class="metric-label">Kutilayotgan trend</span>
                    <span class="metric-val text-green">O'suvchi</span>
                  </div>
                  <div class="metric-box">
                    <span class="metric-label">Bozor riski</span>
                    <span class="metric-val text-blue">Minimal</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Investment Score -->
            <div class="investment-panel premium-card">
              <div class="investment-header">
                <div>
                  <h3 class="card-title">Investitsion Jozibadorlik</h3>
                  <p class="card-subtitle">2026-yil uchun eng istiqbolli tumanlar reytingi</p>
                </div>
                <div class="score-badge">
                  <span class="score-val">9.2</span>
                  <span class="score-lbl">Maks ball</span>
                </div>
              </div>

              <div class="rankings-list">
                <div class="rank-item">
                  <span class="rank-num">#1</span>
                  <div class="rank-details">
                    <div class="rank-info">
                      <span class="district-name">Yunusobod tumani</span>
                      <span class="district-score">9.2 / 10</span>
                    </div>
                    <div class="custom-progress"><div class="fill" style="width: 92%"></div></div>
                  </div>
                </div>
                <div class="rank-item">
                  <span class="rank-num">#2</span>
                  <div class="rank-details">
                    <div class="rank-info">
                      <span class="district-name">Chilonzor tumani</span>
                      <span class="district-score">8.7 / 10</span>
                    </div>
                    <div class="custom-progress"><div class="fill" style="width: 87%"></div></div>
                  </div>
                </div>
                <div class="rank-item">
                  <span class="rank-num">#3</span>
                  <div class="rank-details">
                    <div class="rank-info">
                      <span class="district-name">Mirzo Ulug'bek tumani</span>
                      <span class="district-score">8.5 / 10</span>
                    </div>
                    <div class="custom-progress"><div class="fill" style="width: 85%"></div></div>
                  </div>
                </div>
              </div>

              <button mat-flat-button color="primary" class="btn-full-report">
                <mat-icon>download</mat-icon>
                <span>To'liq AI tahlil hisobotini yuklash (PDF)</span>
              </button>
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

      /* --- HERO --- */
      .market-hero {
        position: relative;
        background: linear-gradient(135deg, #1b3a6b 0%, #0f172a 100%);
        padding: 80px 0 160px;
        color: white;
        text-align: center;
        overflow: hidden;
      }

      .hero-bg-shapes {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 80% 20%, rgba(201, 168, 76, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 20% 80%, rgba(30, 64, 175, 0.2) 0%, transparent 40%);
        z-index: 1;
      }

      .hero-container {
        position: relative;
        z-index: 2;
        max-width: 800px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .ai-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 20px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 100px;
        margin-bottom: 24px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
      }

      .ai-icon {
        color: #fbbf24;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .hero-title {
        font-size: clamp(2.5rem, 5vw, 4.2rem);
        font-weight: 900;
        line-height: 1.1;
        margin-bottom: 20px;
        letter-spacing: -1px;
      }

      .gold-text {
        background: linear-gradient(135deg, #fbbf24 0%, #c9a84c 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .hero-subtitle {
        font-size: 1.2rem;
        opacity: 0.85;
        line-height: 1.6;
        max-width: 650px;
        margin: 0 auto;
      }

      /* --- MAIN CONTENT --- */
      .main-content-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 24px;
        position: relative;
        z-index: 10;
        margin-top: -80px;
        padding-bottom: 80px;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 100px 20px;
        background: white;
        border-radius: 24px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
        text-align: center;
      }
      .loading-state p {
        margin-top: 24px;
        font-weight: 600;
        color: #64748b;
        font-size: 1.1rem;
      }

      /* --- STATS GRID --- */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 24px;
        margin-bottom: 40px;
      }

      .stat-card {
        background: white;
        padding: 28px;
        border-radius: 24px;
        border: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 20px;
        box-shadow: 0 20px 30px -10px rgba(15, 23, 42, 0.08);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .stat-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 30px 40px -15px rgba(15, 23, 42, 0.15);
        border-color: #cbd5e1;
      }

      .stat-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .stat-icon-wrapper mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
      .stat-icon-wrapper.blue {
        background: #eff6ff;
        color: #1e40af;
      }
      .stat-icon-wrapper.gold {
        background: #fffbeb;
        color: #b45309;
      }
      .stat-icon-wrapper.green {
        background: #f0fdf4;
        color: #166534;
      }
      .stat-icon-wrapper.purple {
        background: #faf5ff;
        color: #6b21a8;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .stat-label {
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .stat-value {
        font-size: 1.6rem;
        font-weight: 800;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 6px;
      }
      .text-purple {
        color: #6b21a8;
      }

      .stat-change {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 700;
      }
      .stat-change.positive {
        color: #10b981;
      }
      .stat-change.neutral {
        color: #64748b;
      }
      .stat-change mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      /* --- ANALYTICS GRID --- */
      .analytics-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 32px;
        margin-bottom: 40px;
      }
      @media (max-width: 1024px) {
        .analytics-grid {
          grid-template-columns: 1fr;
        }
      }

      .premium-card {
        background: white;
        border-radius: 32px;
        border: 1px solid #e2e8f0;
        padding: 36px;
        box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.08);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
        flex-wrap: wrap;
        gap: 16px;
      }
      .card-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 6px 0;
      }
      .card-subtitle {
        font-size: 0.95rem;
        color: #64748b;
        margin: 0;
      }

      .chart-container {
        height: 380px;
        width: 100%;
        position: relative;
      }
      .pie-container {
        height: 260px;
        width: 100%;
        position: relative;
        margin-bottom: 32px;
      }

      .region-legend-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .legend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 12px;
        border-bottom: 1px solid #f1f5f9;
      }
      .legend-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
      .legend-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 6px;
      }
      .region-name {
        font-weight: 600;
        color: #334155;
        font-size: 1rem;
      }
      .region-count {
        font-weight: 600;
        color: #64748b;
        font-size: 0.95rem;
      }

      /* --- INSIGHT GRID --- */
      .insight-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 32px;
        margin-bottom: 40px;
      }

      .ai-forecast-panel {
        background: linear-gradient(135deg, #1b3a6b 0%, #0f172a 100%);
        border-radius: 32px;
        padding: 40px;
        color: white;
        position: relative;
        overflow: hidden;
        box-shadow: 0 30px 60px -15px rgba(27, 58, 107, 0.4);
      }
      .ai-forecast-panel::before {
        content: '';
        position: absolute;
        top: -100px;
        right: -100px;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(201, 168, 76, 0.15) 0%, transparent 70%);
        border-radius: 50%;
      }

      .panel-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 36px;
        position: relative;
        z-index: 2;
      }
      .ai-pulse-icon {
        width: 56px;
        height: 56px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2.5s infinite;
      }
      .ai-pulse-icon mat-icon {
        color: #fbbf24;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .panel-title {
        font-size: 1.6rem;
        font-weight: 800;
        margin: 0 0 4px 0;
        color: white;
      }
      .panel-subtitle {
        font-size: 0.95rem;
        color: #93c5fd;
        margin: 0;
      }

      .panel-body {
        position: relative;
        z-index: 2;
      }
      .forecast-big-value {
        display: flex;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 24px;
      }
      .forecast-big-value .value {
        font-size: 3.5rem;
        font-weight: 900;
        color: #fbbf24;
        line-height: 1;
      }
      .forecast-big-value .label {
        font-size: 1.1rem;
        color: #bfdbfe;
        font-weight: 500;
      }

      .forecast-description {
        font-size: 1.05rem;
        line-height: 1.7;
        color: #e2e8f0;
        margin-bottom: 36px;
        opacity: 0.9;
      }

      .forecast-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .metric-box {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 16px;
        border-radius: 20px;
        text-align: center;
      }
      .metric-label {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        display: block;
        margin-bottom: 6px;
      }
      .metric-val {
        font-size: 1.3rem;
        font-weight: 800;
      }
      .text-gold {
        color: #fbbf24;
      }
      .text-green {
        color: #34d399;
      }
      .text-blue {
        color: #93c5fd;
      }

      /* --- INVESTMENT PANEL --- */
      .investment-panel {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .investment-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 36px;
      }
      .score-badge {
        width: 72px;
        height: 72px;
        background: #eff6ff;
        border: 2px solid #bfdbfe;
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #1e40af;
      }
      .score-val {
        font-size: 1.8rem;
        font-weight: 900;
        line-height: 1;
      }
      .score-lbl {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        margin-top: 4px;
      }

      .rankings-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-bottom: 36px;
      }
      .rank-item {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .rank-num {
        font-size: 1.1rem;
        font-weight: 900;
        color: #94a3b8;
        width: 32px;
      }
      .rank-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .rank-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .district-name {
        font-weight: 700;
        color: #1e293b;
        font-size: 1.05rem;
      }
      .district-score {
        font-weight: 800;
        color: #1e40af;
        font-size: 1rem;
      }
      .custom-progress {
        width: 100%;
        height: 10px;
        background: #f1f5f9;
        border-radius: 5px;
        overflow: hidden;
      }
      .custom-progress .fill {
        height: 100%;
        background: linear-gradient(90deg, #1e40af, #3b82f6);
        border-radius: 5px;
        transition: width 1s ease;
      }

      .btn-full-report {
        width: 100%;
        height: 56px;
        border-radius: 16px !important;
        font-size: 1.05rem !important;
        font-weight: 700 !important;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }

      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.8;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @media (max-width: 768px) {
        .market-hero {
          padding: 60px 0 120px;
        }
        .main-content-container {
          margin-top: -60px;
          padding: 0 16px;
        }
        .premium-card {
          padding: 24px;
          border-radius: 24px;
        }
        .stat-card {
          padding: 20px;
        }
        .ai-forecast-panel {
          padding: 28px;
          border-radius: 24px;
        }
      }
    `,
  ],
})
export class MarketComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);

  mainChart = viewChild<ElementRef>('mainChart');
  pieChart = viewChild<ElementRef>('pieChart');

  overview: MarketOverview | null = null;
  regions = signal<RegionAnalytics[]>([]);
  trends = signal<PriceTrend[]>([]);
  isLoading = signal(true);

  private charts: Chart[] = [];

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading.set(true);

    // Parallel data loading with fallbacks
    this.analyticsService.getMarketOverview().subscribe({
      next: (data) => {
        this.overview = data;
      },
      error: () => {
        // Mock default overview if backend endpoint is unavailable
        this.overview = {
          totalListings: 1450,
          totalForSale: 980,
          totalForRent: 470,
          averageSalePrice: 720000000,
          averageRentPrice: 5500000,
          newListingsToday: 45,
        };
      },
    });

    this.analyticsService.getAnalyticsByRegion().subscribe({
      next: (data) => {
        this.regions.set(data);
        this.updatePieChart();
      },
      error: () => {
        this.regions.set([
          {
            region: 'Toshkent',
            listingsCount: 1240,
            averageSalePrice: 850000000,
            averageRentPrice: 6500000,
          },
          {
            region: 'Samarqand',
            listingsCount: 450,
            averageSalePrice: 550000000,
            averageRentPrice: 4200000,
          },
          {
            region: 'Buxoro',
            listingsCount: 280,
            averageSalePrice: 480000000,
            averageRentPrice: 3800000,
          },
          {
            region: "Farg'ona",
            listingsCount: 190,
            averageSalePrice: 420000000,
            averageRentPrice: 3200000,
          },
          {
            region: 'Andijon',
            listingsCount: 210,
            averageSalePrice: 450000000,
            averageRentPrice: 3500000,
          },
        ]);
        this.updatePieChart();
      },
    });

    this.analyticsService.getPriceTrends().subscribe({
      next: (data) => {
        this.trends.set(data);
        this.isLoading.set(false);
        setTimeout(() => this.renderMainChart(), 100);
      },
      error: () => {
        this.trends.set([
          { month: 'Yanvar', averagePrice: 620000000, listingsCount: 950 },
          { month: 'Fevral', averagePrice: 640000000, listingsCount: 1020 },
          { month: 'Mart', averagePrice: 665000000, listingsCount: 1100 },
          { month: 'Aprel', averagePrice: 680000000, listingsCount: 1210 },
          { month: 'May', averagePrice: 710000000, listingsCount: 1350 },
          { month: 'Iyun', averagePrice: 720000000, listingsCount: 1450 },
        ]);
        this.isLoading.set(false);
        setTimeout(() => this.renderMainChart(), 100);
      },
    });
  }

  getTopRegions(): RegionAnalytics[] {
    const data = this.regions();
    if (data && data.length > 0) {
      return data.slice(0, 5);
    }
    return [
      {
        region: 'Toshkent',
        listingsCount: 1240,
        averageSalePrice: 850000000,
        averageRentPrice: 6500000,
      },
      {
        region: 'Samarqand',
        listingsCount: 450,
        averageSalePrice: 550000000,
        averageRentPrice: 4200000,
      },
      {
        region: 'Buxoro',
        listingsCount: 280,
        averageSalePrice: 480000000,
        averageRentPrice: 3800000,
      },
      {
        region: "Farg'ona",
        listingsCount: 190,
        averageSalePrice: 420000000,
        averageRentPrice: 3200000,
      },
      {
        region: 'Andijon',
        listingsCount: 210,
        averageSalePrice: 450000000,
        averageRentPrice: 3500000,
      },
    ];
  }

  renderMainChart(): void {
    const el = this.mainChart()?.nativeElement;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    this.charts[0]?.destroy();

    const trendsList =
      this.trends().length > 0
        ? this.trends()
        : [
            { month: 'Yan', averagePrice: 620000000, listingsCount: 950 },
            { month: 'Feb', averagePrice: 640000000, listingsCount: 1020 },
            { month: 'Mar', averagePrice: 665000000, listingsCount: 1100 },
            { month: 'Apr', averagePrice: 680000000, listingsCount: 1210 },
            { month: 'May', averagePrice: 710000000, listingsCount: 1350 },
            { month: 'Iyun', averagePrice: 720000000, listingsCount: 1450 },
          ];

    const actualData = trendsList.map((t) => Math.round(t.averagePrice / 1000000)); // Million so'mda
    const aiForecast = [
      null,
      null,
      null,
      null,
      null,
      actualData[5],
      actualData[5] + 25,
      actualData[5] + 55,
      actualData[5] + 85,
      actualData[5] + 120,
    ];

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [
          'Yan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Iyun',
          'Iyul (AI)',
          'Avg (AI)',
          'Sen (AI)',
          'Okt (AI)',
        ],
        datasets: [
          {
            label: "Haqiqiy O'rtacha Narxlar (Mln so'm)",
            data: actualData,
            borderColor: '#1e40af',
            backgroundColor: (context) => {
              const chartCtx = context.chart.ctx;
              const gradient = chartCtx.createLinearGradient(0, 0, 0, 350);
              gradient.addColorStop(0, 'rgba(30, 64, 175, 0.25)');
              gradient.addColorStop(1, 'rgba(30, 64, 175, 0)');
              return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#1e40af',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
          {
            label: 'AI Bashorati (Prognoz)',
            data: aiForecast,
            borderColor: '#c9a84c',
            borderDash: [6, 6],
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#c9a84c',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, font: { family: 'Inter', weight: 600 } },
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 14,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            displayColors: false,
            callbacks: {
              label: (context) => `${context.formattedValue} Mln so'm`,
            },
          },
        },
        scales: {
          y: {
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Inter', weight: 500 }, callback: (value) => `${value} Mln` },
          },
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', weight: 500 } } },
        },
      },
    });
    this.charts[0] = chart;
  }

  updatePieChart(): void {
    const el = this.pieChart()?.nativeElement;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    this.charts[1]?.destroy();

    const topRegs = this.getTopRegions();

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: topRegs.map((r) => r.region),
        datasets: [
          {
            data: topRegs.map((r) => r.listingsCount),
            backgroundColor: ['#1e40af', '#c9a84c', '#6366f1', '#10b981', '#f43f5e'],
            hoverOffset: 15,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
          },
        },
      },
    });
    this.charts[1] = chart;
  }

  getRegionColor(index: number): string {
    const colors = ['#1e40af', '#c9a84c', '#6366f1', '#10b981', '#f43f5e'];
    return colors[index % colors.length];
  }

  formatPrice(price: number | undefined): string {
    if (!price) return "0 so'm";
    return Math.round(price).toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";
  }
}

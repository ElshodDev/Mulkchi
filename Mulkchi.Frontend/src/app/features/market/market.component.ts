import { Component, OnInit, inject, viewChild, ElementRef, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AnalyticsService, MarketOverview, PriceTrend, RegionAnalytics } from '../../core/services/analytics.service';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  animations: [
    trigger('staggerFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms {{delay}}ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { params: { delay: 0 } })
    ])
  ],
  template: `
    <div class="market-container">
      <div class="container">
        <!-- Header -->
        <div class="page-header" [@staggerFade]="{ value: '', params: { delay: 0 } }">
          <div class="header-content">
            <div class="badge-ai">
              <mat-icon>auto_awesome</mat-icon>
              <span>AI Analitika tizimi faol</span>
            </div>
            <h1>Bozor Tahlili</h1>
            <p>O'zbekiston ko'chmas mulk bozorining real vaqt rejimidagi ko'rsatkichlari</p>
          </div>
        </div>

        @if (isLoading()) {
          <div class="loading-overlay">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Ma'lumotlar tahlil qilinmoqda...</p>
          </div>
        } @else {
          <!-- Market Overview Cards -->
          <div class="market-overview">
            <mat-card class="overview-card" [@staggerFade]="{ value: '', params: { delay: 100 } }">
              <div class="card-glow"></div>
              <mat-card-header>
                <div class="icon-box blue">
                  <mat-icon>payments</mat-icon>
                </div>
                <div class="header-text">
                  <mat-card-subtitle>O'rtacha sotuv narxi</mat-card-subtitle>
                  <mat-card-title>{{ formatPrice(overview?.averageSalePrice) }} UZS</mat-card-title>
                </div>
              </mat-card-header>
              <mat-card-content>
                <div class="metric-footer">
                  <span class="change positive">
                    <mat-icon>trending_up</mat-icon>
                    +{{ overview?.priceChangePercent || 4.2 }}%
                  </span>
                  <span class="period">o'tgan oyga nisbatan</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="overview-card" [@staggerFade]="{ value: '', params: { delay: 200 } }">
              <mat-card-header>
                <div class="icon-box gold">
                  <mat-icon>calendar_month</mat-icon>
                </div>
                <div class="header-text">
                  <mat-card-subtitle>O'rtacha ijara narxi</mat-card-subtitle>
                  <mat-card-title>{{ formatPrice(overview?.averageRentPrice) }} UZS</mat-card-title>
                </div>
              </mat-card-header>
              <mat-card-content>
                <div class="metric-footer">
                  <span class="change positive">
                    <mat-icon>trending_up</mat-icon>
                    +2.8%
                  </span>
                  <span class="period">oylik ijara</span>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="overview-card" [@staggerFade]="{ value: '', params: { delay: 300 } }">
              <mat-card-header>
                <div class="icon-box green">
                  <mat-icon>add_business</mat-icon>
                </div>
                <div class="header-text">
                  <mat-card-subtitle>Bugungi yangi e'lonlar</mat-card-subtitle>
                  <mat-card-title>{{ overview?.newListingsToday || 0 }} ta</mat-card-title>
                </div>
              </mat-card-header>
              <mat-card-content>
                <div class="metric-footer">
                  <span class="change" [class.positive]="(overview?.newListingsToday || 0) > (overview?.newListingsYesterday || 0)">
                    <mat-icon>event_available</mat-icon>
                    Kecha: {{ overview?.newListingsYesterday || 0 }}
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Charts Section -->
          <div class="charts-grid">
            <mat-card class="chart-card large" [@staggerFade]="{ value: '', params: { delay: 400 } }">
              <mat-card-header>
                <mat-card-title>Narxlar dinamikasi (2024)</mat-card-title>
                <mat-card-subtitle>Sotuv va ijara narxlari o'zgarishi trendi</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="chart-container">
                  <canvas #trendChart></canvas>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="chart-card" [@staggerFade]="{ value: '', params: { delay: 500 } }">
              <mat-card-header>
                <mat-card-title>Hududlar bo'yicha ulush</mat-card-title>
                <mat-card-subtitle>E'lonlarning viloyatlar bo'yicha taqsimoti</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="chart-container-pie">
                  <canvas #regionChart></canvas>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Detailed Insights -->
          <div class="insights-section" [@staggerFade]="{ value: '', params: { delay: 600 } }">
            <div class="section-title">
              <h2><mat-icon>insights</mat-icon> Bozor bo'yicha xulosalar</h2>
              <button mat-button color="primary" routerLink="/smart-analytics">Hammasini ko'rish</button>
            </div>
            
            <div class="insights-grid">
              <div class="insight-item-premium">
                <div class="insight-icon pulse-blue">
                  <mat-icon>location_searching</mat-icon>
                </div>
                <div class="insight-body">
                  <h4>Eng faol hudud: {{ overview?.topCity || 'Toshkent' }}</h4>
                  <p>Hozirda ushbu hududda {{ overview?.topCityCount || 452 }} ta faol e'lon mavjud. Talab o'tgan haftaga nisbatan 12% ga oshgan.</p>
                </div>
              </div>

              <div class="insight-item-premium">
                <div class="insight-icon pulse-gold">
                  <mat-icon>stars</mat-icon>
                </div>
                <div class="insight-body">
                  <h4>Investitsiya uchun qulay</h4>
                  <p>Chilonzor va Yunusobod tumanlarida 1-2 xonali uylarning ROI ko'rsatkichi yiliga 8-10% ni tashkil etmoqda.</p>
                </div>
              </div>

              <div class="insight-item-premium">
                <div class="insight-icon pulse-green">
                  <mat-icon>update</mat-icon>
                </div>
                <div class="insight-body">
                  <h4>Yangi trendlar</h4>
                  <p>Yangi qurilgan binolardagi uylarga bo'lgan talab 2024-yilda 18% ga oshishi bashorat qilinmoqda.</p>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .market-container {
      padding: 40px 0 60px;
      min-height: 100vh;
      background: #f8fafc;
    }

    .page-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .badge-ai {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      background: rgba(27, 58, 107, 0.08);
      color: #1b3a6b;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
      border: 1px solid rgba(27, 58, 107, 0.1);
    }

    .badge-ai mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #c9a84c;
    }

    .page-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .page-header p {
      font-size: 1.125rem;
      color: #64748b;
    }

    .market-overview {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }

    .overview-card {
      position: relative;
      border: none;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .overview-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    }

    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .icon-box.blue { background: #eff6ff; color: #2563eb; }
    .icon-box.gold { background: #fefce8; color: #ca8a04; }
    .icon-box.green { background: #f0fdf4; color: #16a34a; }

    .header-text {
      display: flex;
      flex-direction: column;
    }

    .header-text mat-card-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .header-text mat-card-subtitle {
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
      margin-bottom: 4px;
    }

    .metric-footer {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
    }

    .change {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      font-size: 14px;
    }

    .change.positive { color: #16a34a; }
    .change mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .period { font-size: 12px; color: #94a3b8; }

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 48px;
    }

    .chart-card {
      border-radius: 16px;
      border: none;
      padding: 16px;
    }

    .chart-container { height: 350px; position: relative; margin-top: 24px; }
    .chart-container-pie { height: 300px; position: relative; margin-top: 24px; }

    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-title h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .insight-item-premium {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      transition: all 0.2s ease;
    }

    .insight-item-premium:hover {
      border-color: #cbd5e1;
      background: #fdfdfd;
    }

    .insight-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .pulse-blue { background: #dbeafe; color: #1d4ed8; }
    .pulse-gold { background: #fef9c3; color: #854d0e; }
    .pulse-green { background: #dcfce7; color: #15803d; }

    .insight-body h4 { font-size: 15px; font-weight: 600; margin: 0 0 6px; }
    .insight-body p { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0; }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
      gap: 20px;
    }

    @media (max-width: 1100px) {
      .charts-grid { grid-template-columns: 1fr; }
      .market-overview { grid-template-columns: 1fr 1fr; }
      .insights-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .market-overview { grid-template-columns: 1fr; }
      .page-header h1 { font-size: 1.8rem; }
    }
  `]
})
export class MarketComponent implements OnInit, AfterViewInit {
  private analyticsService = inject(AnalyticsService);
  
  trendChart = viewChild<ElementRef>('trendChart');
  regionChart = viewChild<ElementRef>('regionChart');
  
  overview: MarketOverview | null = null;
  isLoading = signal(true);
  
  private charts: Chart[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Charts will be rendered after data is loaded
  }

  loadData(): void {
    this.isLoading.set(true);
    this.analyticsService.getMarketOverview().subscribe(data => {
      this.overview = data;
      this.isLoading.set(false);
      setTimeout(() => this.renderCharts(), 100);
    });
  }

  renderCharts(): void {
    // Trend Chart
    const trendCtx = this.trendChart()?.nativeElement.getContext('2d');
    if (trendCtx) {
      const chart = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: ['Yan', 'Feb', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
          datasets: [
            {
              label: 'Sotuv ($)',
              data: [1150, 1180, 1220, 1250, 1240, 1280, 1310, 1350, 1340, 1380, 1420, 1450],
              borderColor: '#1b3a6b',
              backgroundColor: 'rgba(27, 58, 107, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Ijara ($)',
              data: [450, 460, 480, 490, 500, 520, 510, 530, 540, 550, 570, 580],
              borderColor: '#c9a84c',
              backgroundColor: 'rgba(201, 168, 76, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: { beginAtZero: false }
          }
        }
      });
      this.charts.push(chart);
    }

    // Region Chart
    const regionCtx = this.regionChart()?.nativeElement.getContext('2d');
    if (regionCtx) {
      const chart = new Chart(regionCtx, {
        type: 'doughnut',
        data: {
          labels: ['Toshkent', 'Samarqand', 'Buxoro', 'Namangan', 'Boshqa'],
          datasets: [{
            data: [45, 15, 12, 10, 18],
            backgroundColor: ['#1b3a6b', '#c9a84c', '#2a4f8f', '#d4b86a', '#e2e8f0'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          cutout: '70%'
        }
      });
      this.charts.push(chart);
    }
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '0';
    return price.toLocaleString('uz-UZ');
  }
}


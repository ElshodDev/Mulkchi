import { Component, OnInit, inject, viewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnalyticsService, MarketOverview, PriceTrend, RegionAnalytics, LocationScore } from '../../core/services/analytics.service';
import { Chart, ChartConfiguration } from 'chart.js/auto';
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
    MatTooltipModule
  ],
  animations: [
    trigger('pageAnimations', [
      transition(':enter', [
        query('.animate-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="market-page" @pageAnimations>
      <div class="glass-bg"></div>
      
      <div class="container py-8 relative z-10">
        <!-- Header Section -->
        <header class="mb-12 text-center animate-item">
          <div class="ai-badge mb-4">
            <mat-icon class="ai-icon">auto_awesome</mat-icon>
            <span>Mulkchi AI Pro Analitika Faol</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Bozor <span class="gradient-text">Intellekti</span>
          </h1>
          <p class="text-lg text-slate-600 max-w-2xl mx-auto">
            O'zbekiston ko'chmas mulk bozorini sun'iy intellekt va real-vaqt ma'lumotlari orqali tahlil qiling.
          </p>
        </header>

        @if (isLoading()) {
          <div class="flex flex-col items-center justify-center py-20">
            <mat-spinner diameter="48"></mat-spinner>
            <p class="mt-4 text-slate-500 font-medium animate-pulse">Katta hajmdagi ma'lumotlar qayta ishlanmoqda...</p>
          </div>
        } @else {
          <!-- Top Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div class="stat-card animate-item" matTooltip="Bozordagi barcha faol e'lonlar soni">
              <div class="stat-icon-wrapper blue">
                <mat-icon>analytics</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">Jami takliflar</span>
                <span class="stat-value">{{ overview?.totalListings || 0 }}</span>
                <div class="stat-change positive">
                  <mat-icon>trending_up</mat-icon>
                  <span>+12%</span>
                </div>
              </div>
            </div>

            <div class="stat-card animate-item" matTooltip="O'rtacha sotuv narxi (m²)">
              <div class="stat-icon-wrapper gold">
                <mat-icon>payments</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">O'rtacha narx ($)</span>
                <span class="stat-value">{{ formatPrice(overview?.averageSalePrice) }}</span>
                <div class="stat-change positive">
                  <mat-icon>trending_up</mat-icon>
                  <span>+4.2%</span>
                </div>
              </div>
            </div>

            <div class="stat-card animate-item" matTooltip="Yangi qo'shilgan e'lonlar (24s)">
              <div class="stat-icon-wrapper green">
                <mat-icon>bolt</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">Yangi e'lonlar</span>
                <span class="stat-value">{{ overview?.newListingsToday || 24 }}</span>
                <div class="stat-change neutral">
                  <span>Stabil</span>
                </div>
              </div>
            </div>

            <div class="stat-card animate-item" matTooltip="Bozor faolligi indeksi">
              <div class="stat-icon-wrapper purple">
                <mat-icon>speed</mat-icon>
              </div>
              <div class="stat-content">
                <span class="stat-label">Bozor kayfiyati</span>
                <span class="stat-value">Bullish</span>
                <div class="stat-change positive">
                  <span>Yuqori talab</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Analytics Content -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <!-- Price Dynamics Chart -->
            <mat-card class="lg:col-span-2 chart-card-premium animate-item">
              <mat-card-header class="mb-6">
                <div class="flex justify-between items-start w-full">
                  <div>
                    <mat-card-title class="!text-xl !font-bold">Narxlar Dinamikasi</mat-card-title>
                    <mat-card-subtitle>Oxirgi 12 oylik trend va AI bashorati</mat-card-subtitle>
                  </div>
                  <mat-chip-listbox>
                    <mat-chip-option selected color="primary">Toshkent</mat-chip-option>
                    <mat-chip-option>Samarqand</mat-chip-option>
                  </mat-chip-listbox>
                </div>
              </mat-card-header>
              <mat-card-content>
                <div class="h-[400px] relative">
                  <canvas #mainChart></canvas>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Region Distribution -->
            <mat-card class="chart-card-premium animate-item">
              <mat-card-header class="mb-6">
                <mat-card-title class="!text-xl !font-bold">Hududlar Ulushi</mat-card-title>
                <mat-card-subtitle>Bozordagi takliflar taqsimoti</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="h-[300px] relative">
                  <canvas #pieChart></canvas>
                </div>
                <div class="mt-6 space-y-3">
                  @for (reg of regions().slice(0, 4); track reg.region) {
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full" [style.background]="getRegionColor($index)"></div>
                        <span class="text-sm font-medium text-slate-700">{{ reg.region }}</span>
                      </div>
                      <span class="text-sm text-slate-500">{{ reg.listingsCount }} ta</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- AI Forecast & Investment Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <!-- AI Forecast -->
            <div class="ai-forecast-panel animate-item">
              <div class="panel-header">
                <div class="flex items-center gap-3">
                  <div class="ai-pulse-icon">
                    <mat-icon>auto_awesome</mat-icon>
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-white">AI Narx Bashorati</h3>
                    <p class="text-blue-100 text-sm">Kelgusi 6 oy uchun prognoz</p>
                  </div>
                </div>
              </div>
              <div class="panel-content">
                <div class="flex items-end gap-4 mb-6">
                  <span class="text-4xl font-black text-white">+8.4%</span>
                  <span class="text-blue-100 mb-1">kutilayotgan o'sish</span>
                </div>
                <p class="text-blue-50 text-sm leading-relaxed mb-6">
                  Mulkchi AI tahliliga ko'ra, Toshkent shahrining markaziy tumanlarida talab ortishi hisobiga narxlar ko'tarilishi kutilmoqda. 
                  Inflyatsiya va qurilish materiallari narxi asosiy omil sifatida ko'rilmoqda.
                </p>
                <div class="grid grid-cols-3 gap-4">
                  <div class="forecast-mini-card">
                    <span class="label">Ishonch</span>
                    <span class="value">92%</span>
                  </div>
                  <div class="forecast-mini-card">
                    <span class="label">Trend</span>
                    <span class="value">Rising</span>
                  </div>
                  <div class="forecast-mini-card">
                    <span class="label">Risk</span>
                    <span class="value text-green-300">Low</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Investment Score -->
            <div class="investment-panel animate-item">
              <div class="flex justify-between items-start mb-6">
                <div>
                  <h3 class="text-xl font-bold text-slate-900">Investitsiya Salohiyati</h3>
                  <p class="text-slate-500 text-sm">Eng istiqbolli tumanlar (2025)</p>
                </div>
                <div class="score-badge">
                  <span class="text-lg font-bold">8.8</span>
                  <span class="text-[10px] uppercase">Score</span>
                </div>
              </div>
              
              <div class="space-y-4">
                <div class="ranking-item">
                  <span class="rank">#1</span>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="font-bold text-slate-700">Yunusobod</span>
                      <span class="text-blue-600 font-bold">9.2</span>
                    </div>
                    <div class="progress-bar"><div class="fill" style="width: 92%"></div></div>
                  </div>
                </div>
                <div class="ranking-item">
                  <span class="rank">#2</span>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="font-bold text-slate-700">Chilonzor</span>
                      <span class="text-blue-600 font-bold">8.7</span>
                    </div>
                    <div class="progress-bar"><div class="fill" style="width: 87%"></div></div>
                  </div>
                </div>
                <div class="ranking-item">
                  <span class="rank">#3</span>
                  <div class="flex-1">
                    <div class="flex justify-between mb-1">
                      <span class="font-bold text-slate-700">Mirzo Ulug'bek</span>
                      <span class="text-blue-600 font-bold">8.5</span>
                    </div>
                    <div class="progress-bar"><div class="fill" style="width: 85%"></div></div>
                  </div>
                </div>
              </div>

              <button class="w-full mt-6 py-3 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                <mat-icon class="!text-lg">description</mat-icon>
                To'liq hisobotni yuklash (PDF)
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .market-page {
      min-height: 100vh;
      background-color: #f8fafc;
      position: relative;
      overflow: hidden;
    }

    .glass-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 400px;
      background: linear-gradient(135deg, #1b3a6b 0%, #2a4f8f 100%);
      clip-path: ellipse(100% 70% at 50% 0%);
      z-index: 1;
    }

    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 100px;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    .ai-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #fbbf24;
    }

    .gradient-text {
      background: linear-gradient(to right, #1b3a6b, #c9a84c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 24px;
      border: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    }

    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon-wrapper.blue { background: #eff6ff; color: #1e40af; }
    .stat-icon-wrapper.gold { background: #fffbeb; color: #92400e; }
    .stat-icon-wrapper.green { background: #f0fdf4; color: #166534; }
    .stat-icon-wrapper.purple { background: #faf5ff; color: #6b21a8; }

    .stat-label { font-size: 13px; font-weight: 500; color: #64748b; display: block; }
    .stat-value { font-size: 24px; font-weight: 800; color: #0f172a; display: block; }
    .stat-change { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; margin-top: 4px; }
    .stat-change.positive { color: #10b981; }
    .stat-change.neutral { color: #64748b; }
    .stat-change mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .chart-card-premium {
      border-radius: 32px;
      border: 1px solid #f1f5f9;
      padding: 24px;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05);
    }

    .ai-forecast-panel {
      background: linear-gradient(135deg, #1b3a6b 0%, #0f172a 100%);
      border-radius: 32px;
      padding: 32px;
      color: white;
      position: relative;
      overflow: hidden;
    }

    .ai-forecast-panel::after {
      content: '';
      position: absolute;
      top: -50px;
      right: -50px;
      width: 150px;
      height: 150px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 50%;
    }

    .ai-pulse-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    .forecast-mini-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px;
      border-radius: 16px;
      text-align: center;
    }

    .forecast-mini-card .label { font-size: 11px; color: #94a3b8; display: block; margin-bottom: 2px; }
    .forecast-mini-card .value { font-size: 15px; font-weight: 700; color: white; }

    .investment-panel {
      background: white;
      border-radius: 32px;
      padding: 32px;
      border: 1px solid #f1f5f9;
    }

    .score-badge {
      width: 64px;
      height: 64px;
      background: #eff6ff;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #1e40af;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .rank { font-size: 14px; font-weight: 800; color: #94a3b8; width: 24px; }
    .progress-bar { width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .progress-bar .fill { height: 100%; background: #1e40af; border-radius: 4px; }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }

    @media (max-width: 768px) {
      .stat-card { padding: 16px; }
      .stat-value { font-size: 20px; }
      .chart-card-premium { padding: 16px; }
    }
  `]
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
    
    // Parallel data loading
    this.analyticsService.getMarketOverview().subscribe(data => {
      this.overview = data;
    });

    this.analyticsService.getAnalyticsByRegion().subscribe(data => {
      this.regions.set(data);
      this.updatePieChart();
    });

    this.analyticsService.getPriceTrends().subscribe(data => {
      this.trends.set(data);
      this.isLoading.set(false);
      setTimeout(() => this.renderMainChart(), 100);
    });
  }

  renderMainChart(): void {
    const ctx = this.mainChart()?.nativeElement.getContext('2d');
    if (!ctx) return;

    // Destroy old chart if exists
    this.charts[0]?.destroy();

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.trends().map(t => t.month) || ['Yan', 'Feb', 'Mar', 'Apr', 'May', 'Iyun'],
        datasets: [
          {
            label: 'Haqiqiy Narxlar ($)',
            data: this.trends().map(t => t.averagePrice) || [1150, 1180, 1220, 1250, 1240, 1280],
            borderColor: '#1e40af',
            backgroundColor: (context) => {
              const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 400);
              gradient.addColorStop(0, 'rgba(30, 64, 175, 0.2)');
              gradient.addColorStop(1, 'rgba(30, 64, 175, 0)');
              return gradient;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointBackgroundColor: '#1e40af',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          {
            label: 'AI Bashorati',
            data: [null, null, null, null, null, 1280, 1320, 1350, 1390, 1420],
            borderColor: '#c9a84c',
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'top',
            labels: { usePointStyle: true, font: { family: 'Inter', weight: 600 } }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            displayColors: false
          }
        },
        scales: {
          y: { 
            grid: { color: '#f1f5f9' },
            ticks: { font: { family: 'Inter' }, callback: (value) => '$' + value }
          },
          x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
        }
      }
    });
    this.charts[0] = chart;
  }

  updatePieChart(): void {
    const ctx = this.pieChart()?.nativeElement.getContext('2d');
    if (!ctx) return;

    this.charts[1]?.destroy();

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.regions().map(r => r.region).slice(0, 5),
        datasets: [{
          data: this.regions().map(r => r.listingsCount).slice(0, 5),
          backgroundColor: ['#1e40af', '#c9a84c', '#6366f1', '#10b981', '#f43f5e'],
          hoverOffset: 20,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false }
        }
      }
    });
    this.charts[1] = chart;
  }

  getRegionColor(index: number): string {
    const colors = ['#1e40af', '#c9a84c', '#6366f1', '#10b981', '#f43f5e'];
    return colors[index % colors.length];
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '0';
    return price.toLocaleString('en-US'); // Use $ style formatting for analytics
  }
}

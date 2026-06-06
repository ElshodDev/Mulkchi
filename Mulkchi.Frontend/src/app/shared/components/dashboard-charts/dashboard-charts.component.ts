import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

export interface ChartDataSet {
  label: string;
  data: number[];
  color?: string;
}

export interface TimeSeriesData {
  labels: string[];
  datasets: ChartDataSet[];
}

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    BaseChartDirective,
  ],
  template: `
    <div class="charts-container">
      <div class="charts-header">
        <h2>{{ title }}</h2>
        <div class="time-range-selector">
          <mat-form-field appearance="outline">
            <mat-label>Vaqt davri</mat-label>
            <mat-select [(value)]="selectedPeriod" (selectionChange)="onPeriodChange($event)">
              <mat-option value="7">So'ngi 7 kun</mat-option>
              <mat-option value="30">So'ngi 30 kun</mat-option>
              <mat-option value="90">So'ngi 3 oy</mat-option>
              <mat-option value="365">So'ngi 1 yil</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <div class="charts-grid">
        <!-- Main Line Chart - Bookings/Revenue Trend -->
        <mat-card class="chart-card main-chart">
          <div class="chart-header">
            <div class="chart-title">
              <mat-icon>trending_up</mat-icon>
              <span>Bronlar dinamikasi</span>
            </div>
            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-color" style="background: var(--color-primary);"></span>
                <span>Yangi bronlar</span>
              </span>
              <span class="legend-item">
                <span class="legend-color" style="background: var(--color-success);"></span>
                <span>Tasdiqlangan</span>
              </span>
            </div>
          </div>
          <div class="chart-wrapper large">
            <canvas baseChart [data]="lineChartData" [options]="lineChartOptions" [type]="'line'">
            </canvas>
          </div>
        </mat-card>

        <!-- Doughnut Chart - Booking Status -->
        <mat-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">
              <mat-icon>donut_large</mat-icon>
              <span>Status taqsimoti</span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas
              baseChart
              [data]="doughnutChartData"
              [options]="doughnutChartOptions"
              [type]="'doughnut'"
            >
            </canvas>
          </div>
          <div class="chart-stats">
            <div class="stat-item">
              <span class="stat-value" style="color: var(--color-primary);">{{ pendingCount }}</span>
              <span class="stat-label">Kutilmoqda</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color: var(--color-success);">{{ confirmedCount }}</span>
              <span class="stat-label">Tasdiqlangan</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color: var(--color-warning);">{{ completedCount }}</span>
              <span class="stat-label">Yakunlangan</span>
            </div>
            <div class="stat-item">
              <span class="stat-value" style="color: var(--color-error);">{{ cancelledCount }}</span>
              <span class="stat-label">Bekor qilingan</span>
            </div>
          </div>
        </mat-card>

        <!-- Bar Chart - Revenue by Property -->
        <mat-card class="chart-card wide">
          <div class="chart-header">
            <div class="chart-title">
              <mat-icon>bar_chart</mat-icon>
              <span>Mulk bo'yicha daromad</span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas baseChart [data]="barChartData" [options]="barChartOptions" [type]="'bar'">
            </canvas>
          </div>
        </mat-card>

        <!-- Radar Chart - Property Ratings -->
        <mat-card class="chart-card">
          <div class="chart-header">
            <div class="chart-title">
              <mat-icon>radar</mat-icon>
              <span>Reyting tahlili</span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas
              baseChart
              [data]="radarChartData"
              [options]="radarChartOptions"
              [type]="'radar'"
            >
            </canvas>
          </div>
        </mat-card>

        <!-- Mini Stats Cards -->
        <div class="mini-stats-grid">
          <mat-card class="mini-stat">
            <div
              class="mini-stat-icon"
              style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));"
            >
              <mat-icon>calendar_today</mat-icon>
            </div>
            <div class="mini-stat-content">
              <span class="mini-stat-value">{{ totalBookings }}</span>
              <span class="mini-stat-label">Jami bronlar</span>
            </div>
            <div
              class="mini-stat-trend"
              [class.up]="bookingTrend > 0"
              [class.down]="bookingTrend < 0"
            >
              <mat-icon>{{ bookingTrend > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
              <span>{{ bookingTrend > 0 ? '+' : '' }}{{ bookingTrend }}%</span>
            </div>
          </mat-card>

          <mat-card class="mini-stat">
            <div
              class="mini-stat-icon"
              style="background: linear-gradient(135deg, var(--color-success), var(--color-success));"
            >
              <mat-icon>attach_money</mat-icon>
            </div>
            <div class="mini-stat-content">
              <span class="mini-stat-value">{{ totalRevenue | number: '1.0-0' }} UZS</span>
              <span class="mini-stat-label">Umumiy daromad</span>
            </div>
            <div
              class="mini-stat-trend"
              [class.up]="revenueTrend > 0"
              [class.down]="revenueTrend < 0"
            >
              <mat-icon>{{ revenueTrend > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
              <span>{{ revenueTrend > 0 ? '+' : '' }}{{ revenueTrend }}%</span>
            </div>
          </mat-card>

          <mat-card class="mini-stat">
            <div
              class="mini-stat-icon"
              style="background: linear-gradient(135deg, var(--color-warning), var(--color-warning));"
            >
              <mat-icon>visibility</mat-icon>
            </div>
            <div class="mini-stat-content">
              <span class="mini-stat-value">{{ totalViews | number: '1.0-0' }}</span>
              <span class="mini-stat-label">Ko'rishlar</span>
            </div>
            <div class="mini-stat-trend" [class.up]="viewsTrend > 0" [class.down]="viewsTrend < 0">
              <mat-icon>{{ viewsTrend > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
              <span>{{ viewsTrend > 0 ? '+' : '' }}{{ viewsTrend }}%</span>
            </div>
          </mat-card>

          <mat-card class="mini-stat">
            <div
              class="mini-stat-icon"
              style="background: linear-gradient(135deg, var(--color-info), var(--color-info));"
            >
              <mat-icon>people</mat-icon>
            </div>
            <div class="mini-stat-content">
              <span class="mini-stat-value">{{ conversionRate }}%</span>
              <span class="mini-stat-label">Konversiya</span>
            </div>
            <div
              class="mini-stat-trend"
              [class.up]="conversionTrend > 0"
              [class.down]="conversionTrend < 0"
            >
              <mat-icon>{{ conversionTrend > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
              <span>{{ conversionTrend > 0 ? '+' : '' }}{{ conversionTrend }}%</span>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .charts-container {
        padding: 24px;
      }

      .charts-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }

      .charts-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0;
      }

      .time-range-selector {
        width: 180px;
      }

      .charts-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }

      .chart-card {
        padding: 20px;
      }

      .chart-card.main-chart {
        grid-column: span 2;
        grid-row: span 2;
      }

      .chart-card.wide {
        grid-column: span 2;
      }

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .chart-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }

      .chart-title mat-icon {
        color: var(--color-primary);
      }

      .chart-legend {
        display: flex;
        gap: 16px;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: var(--color-text-secondary);
      }

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }

      .chart-wrapper {
        position: relative;
        height: 250px;
      }

      .chart-wrapper.large {
        height: 350px;
      }

      .chart-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--color-border);
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 600;
      }

      .stat-label {
        font-size: 0.85rem;
        color: var(--color-text-secondary);
      }

      .mini-stats-grid {
        grid-column: span 3;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      }

      .mini-stat {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }

      .mini-stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }

      .mini-stat-icon mat-icon {
        font-size: 24px;
      }

      .mini-stat-content {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .mini-stat-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .mini-stat-label {
        font-size: 0.85rem;
        color: var(--color-text-secondary);
      }

      .mini-stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
        font-weight: 500;
      }

      .mini-stat-trend.up {
        color: var(--color-success);
      }

      .mini-stat-trend.down {
        color: var(--color-error);
      }

      .mini-stat-trend mat-icon {
        font-size: 18px;
      }

      @media (max-width: 1200px) {
        .charts-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .chart-card.main-chart,
        .chart-card.wide {
          grid-column: span 2;
        }

        .mini-stats-grid {
          grid-column: span 2;
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .charts-grid {
          grid-template-columns: 1fr;
        }

        .chart-card.main-chart,
        .chart-card.wide {
          grid-column: span 1;
        }

        .mini-stats-grid {
          grid-column: span 1;
          grid-template-columns: 1fr;
        }

        .charts-header {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }

        .time-range-selector {
          width: 100%;
        }
      }
    `,
  ],
})
export class DashboardChartsComponent implements OnInit {
  @Input() title = 'Umumiy statistika';
  @Input() selectedPeriod = '30';

  totalBookings = 128;
  bookingTrend = 12.5;
  totalRevenue = 12500000;
  revenueTrend = 8.3;
  totalViews = 3240;
  viewsTrend = 15.2;
  conversionRate = 3.8;
  conversionTrend = -2.1;

  pendingCount = 24;
  confirmedCount = 85;
  completedCount = 42;
  cancelledCount = 8;

  lineChartData: ChartData<'line'> = {
    labels: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'],
    datasets: [
      {
        data: [12, 19, 15, 25, 22, 30, 28],
        label: 'Yangi bronlar',
        borderColor: 'var(--color-primary)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        data: [8, 15, 12, 20, 18, 25, 22],
        label: 'Tasdiqlangan',
        borderColor: 'var(--color-success)',
        backgroundColor: 'rgba(72, 187, 120, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'var(--color-surface-elevated)',
        },
      },
    },
  };

  doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Kutilmoqda', 'Tasdiqlangan', 'Yakunlangan', 'Bekor qilingan'],
    datasets: [
      {
        data: [24, 85, 42, 8],
        backgroundColor: ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-error)'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  barChartData: ChartData<'bar'> = {
    labels: ['Yunusobod', "Mirzo-Ulug'bek", 'Shayxontohur', 'Yakkasaroy', 'Chilonzor'],
    datasets: [
      {
        data: [4500000, 3200000, 2800000, 2100000, 1900000],
        label: 'Daromad (UZS)',
        backgroundColor: 'var(--color-primary)',
        borderRadius: 6,
        barThickness: 30,
      },
    ],
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'var(--color-surface-elevated)',
        },
      },
    },
  };

  radarChartData: ChartData<'radar'> = {
    labels: ['Tozalik', 'Joylashuv', 'Xizmat', 'Narx', 'Qulaylik', 'Xavfsizlik'],
    datasets: [
      {
        data: [4.5, 4.2, 4.8, 3.9, 4.6, 4.3],
        label: "O'rtacha reyting",
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: 'var(--color-primary)',
        pointBackgroundColor: 'var(--color-primary)',
        pointBorderColor: 'var(--color-surface)',
        pointHoverBackgroundColor: 'var(--color-surface)',
        pointHoverBorderColor: 'var(--color-primary)',
      },
    ],
  };

  radarChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  ngOnInit(): void {
    this.loadChartData();
  }

  loadChartData(): void {
  }

  onPeriodChange(period: any): void {
    this.selectedPeriod = period.value;
    this.loadChartData();
  }

  updateLineChartData(newData: number[][]): void {
    this.lineChartData.datasets[0].data = newData[0];
    this.lineChartData.datasets[1].data = newData[1];
  }

  updateDoughnutData(newData: number[]): void {
    this.doughnutChartData.datasets[0].data = newData;
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-host-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    BaseChartDirective,
  ],
  template: `
    <div class="dashboard-shell">
      <div class="dash-hero">
        <div class="container">
          <div class="dash-hero__inner">
            <div>
              <h1>Kengaytirilgan Analitika</h1>
              <p>Sizning mulklaringiz haqida batafsil statistika</p>
            </div>
            <div class="revenue-box">
              <span class="label">Oylik daromad</span>
              <span class="amount">12,450,000 UZS</span>
              <span class="growth"><mat-icon>trending_up</mat-icon> +15% o'tgan oydan</span>
            </div>
          </div>
        </div>
      </div>

      <div class="container content-area">
        <div class="charts-grid">
          <!-- Views Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <div mat-card-avatar class="icon-avatar views-avatar">
                <mat-icon>visibility</mat-icon>
              </div>
              <mat-card-title>Ko'rishlar dinamikasi</mat-card-title>
              <mat-card-subtitle>So'nggi 7 kun</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas baseChart
                  [data]="viewsChartData"
                  [options]="lineChartOptions"
                  [type]="'line'">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Conversion Chart -->
          <mat-card class="chart-card">
            <mat-card-header>
              <div mat-card-avatar class="icon-avatar conv-avatar">
                <mat-icon>insights</mat-icon>
              </div>
              <mat-card-title>Konversiya ko'rsatkichlari</mat-card-title>
              <mat-card-subtitle>Saqlangan va Bron qilinganlar</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="chart-wrapper">
                <canvas baseChart
                  [data]="conversionChartData"
                  [options]="barChartOptions"
                  [type]="'bar'">
                </canvas>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <div class="insights-panel mt-4">
          <mat-card class="insight-card">
            <div class="insight-content">
              <mat-icon class="ai-icon">auto_awesome</mat-icon>
              <div class="text">
                <h3>AI Tavsiyasi: "Toshkent City, 3-xona" e'loningizni TOPga ko'taring.</h3>
                <p>Ushbu e'longa qiziqish o'tgan haftaga nisbatan 20% ga oshdi. TOPga ko'tarish orqali ijaraga berish ehtimolini oshirasiz.</p>
              </div>
              <button mat-flat-button color="primary">TOPga ko'tarish</button>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        --navy: #0f172a;
        --gold: #c9a84c;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }
      .dash-hero {
        background: linear-gradient(135deg, var(--navy) 0%, #1e3a5f 100%);
        color: white;
        padding: 48px 0 100px;
      }
      .dash-hero__inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
      }
      .dash-hero h1 {
        font-size: 2.2rem;
        font-weight: 900;
        margin: 0;
      }
      .dash-hero p {
        opacity: 0.75;
        margin: 8px 0 0;
      }
      .revenue-box {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        padding: 16px 24px;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        backdrop-filter: blur(10px);
      }
      .revenue-box .label {
        font-size: 0.8rem;
        opacity: 0.8;
      }
      .revenue-box .amount {
        font-size: 1.8rem;
        font-weight: 800;
        color: var(--gold);
        margin: 4px 0;
      }
      .revenue-box .growth {
        font-size: 0.8rem;
        color: #4ade80;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .revenue-box .growth mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .content-area {
        margin-top: -60px;
        padding-bottom: 80px;
      }
      .charts-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
      }
      .chart-card {
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
      }
      .icon-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
      }
      .icon-avatar mat-icon {
        color: white;
      }
      .views-avatar {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
      }
      .conv-avatar {
        background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      }
      .chart-wrapper {
        height: 300px;
        width: 100%;
        margin-top: 16px;
      }
      .mt-4 {
        margin-top: 24px;
      }
      .insight-card {
        border-radius: 16px;
        background: linear-gradient(to right, #fef9c3, #fef08a);
        border: 1px solid #fde047;
      }
      .insight-content {
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .ai-icon {
        color: #ca8a04;
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
      .text h3 {
        margin: 0 0 4px;
        color: #854d0e;
        font-weight: 800;
        font-size: 1.1rem;
      }
      .text p {
        margin: 0;
        color: #a16207;
        font-size: 0.9rem;
      }
      @media (max-width: 768px) {
        .charts-grid {
          grid-template-columns: 1fr;
        }
        .insight-content {
          flex-direction: column;
          text-align: center;
        }
      }
    `
  ]
})
export class HostDashboardComponent implements OnInit {
  
  public viewsChartData: ChartData<'line'> = {
    labels: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
    datasets: [
      { data: [65, 59, 80, 81, 56, 55, 40], label: "Ko'rishlar", borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 }
    ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 }
    }
  };

  public conversionChartData: ChartData<'bar'> = {
    labels: ['Hovlilar', 'Kvartiralar', 'Ofislar'],
    datasets: [
      { data: [25, 40, 10], label: "Saqlangan", backgroundColor: '#8b5cf6' },
      { data: [5, 12, 2], label: "Bron qilingan", backgroundColor: '#10b981' }
    ]
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
  };

  ngOnInit() {
    import('chart.js').then((Chart) => {
      Chart.Chart.register(
        Chart.LineController, Chart.LineElement, Chart.PointElement, Chart.LinearScale, Chart.Title, Chart.CategoryScale, Chart.Filler, Chart.Tooltip, Chart.Legend,
        Chart.BarController, Chart.BarElement
      );
    });
  }
}

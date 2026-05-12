import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

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
  template: `
    <div class="market-container">
      <div class="container">
        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <h1>
              <mat-icon>trending_up</mat-icon>
              Bozor Tahlili
            </h1>
            <p>O'zbekiston ko'chmas mulk bozorini chuqur o'rganing</p>
          </div>
        </div>

        <!-- Market Overview Cards -->
        <div class="market-overview">
          <mat-card class="overview-card primary">
            <mat-card-header>
              <mat-icon mat-card-avatar>trending_up</mat-icon>
              <mat-card-title>O'rtacha Narx</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="metric-value">$45,000</div>
              <div class="metric-change positive">
                <mat-icon>arrow_upward</mat-icon>
                +5.2% oyiga
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="overview-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>home</mat-icon>
              <mat-card-title>Yangi E'lonlar</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="metric-value">1,234</div>
              <div class="metric-change positive">
                <mat-icon>arrow_upward</mat-icon>
                +12% haftaga
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="overview-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>location_city</mat-icon>
              <mat-card-title>Eng Faol Tumanlar</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="top-districts">
                <div class="district-item">
                  <span>Chilonzor</span>
                  <span class="badge">324</span>
                </div>
                <div class="district-item">
                  <span>Yunusobod</span>
                  <span class="badge">287</span>
                </div>
                <div class="district-item">
                  <span>Mirobod</span>
                  <span class="badge">256</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Quick Access -->
        <div class="quick-access-section">
          <h2>Tahlil Vositalari</h2>
          <div class="tools-grid">
            <mat-card class="tool-card" routerLink="/market-analytics">
              <mat-card-header>
                <mat-icon mat-card-avatar>analytics</mat-icon>
                <mat-card-title>Bozor Analitika</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Bozor trendlari va statistikasi</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">
                  O'qing
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>

            <mat-card class="tool-card" routerLink="/smart-analytics">
              <mat-card-header>
                <mat-icon mat-card-avatar>psychology</mat-icon>
                <mat-card-title>Aqlli Tahlil</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Investitsiya imkoniyatlari</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">
                  Boshlang
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>

            <mat-card class="tool-card" routerLink="/compare">
              <mat-card-header>
                <mat-icon mat-card-avatar>compare_arrows</mat-icon>
                <mat-card-title>Mulk Taqqoslash</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Bir nechta mulklarni solishtiring</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button color="primary">
                  Taqqoslang
                  <mat-icon>arrow_forward</mat-icon>
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>

        <!-- Market Insights -->
        <mat-card class="insights-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>lightbulb</mat-icon>
            <mat-card-title>Bozordan Fikrlar</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="insights-list">
              <div class="insight-item">
                <mat-icon>trending_up</mat-icon>
                <div class="insight-content">
                  <h4>Chilonzor narxlari o'smoqda</h4>
                  <p>Oxirgi 3 oyda 15% ga o'sdi, investitsiya uchun yaxshi vaqt</p>
                </div>
              </div>
              <div class="insight-item">
                <mat-icon>apartment</mat-icon>
                <div class="insight-content">
                  <h4>1-2 xonali kvartiralarga talab yuqori</h4>
                  <p>Ijaraga berish uchun eng daromadli variantlar</p>
                </div>
              </div>
              <div class="insight-item">
                <mat-icon>location_on</mat-icon>
                <div class="insight-content">
                  <h4>Yunusobodda yangi loyihalar</h4>
                  <p>5 ta yangi qurilish loyihasi e'lon qilindi</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .market-container {
      padding: var(--space-6) 0;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-elevated) 100%);
    }

    .page-header {
      text-align: center;
      margin-bottom: var(--space-8);
    }

    .page-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: var(--space-3);
      color: var(--color-text-primary);
    }

    .page-header h1 mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: var(--color-brand-600);
    }

    .page-header p {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      max-width: 600px;
      margin: 0 auto;
    }

    .market-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .overview-card {
      text-align: center;
      transition: transform 0.3s ease;
    }

    .overview-card:hover {
      transform: translateY(-2px);
    }

    .overview-card.primary {
      border: 2px solid var(--color-brand-200);
    }

    .overview-card mat-card-avatar {
      background: var(--color-brand-100);
      color: var(--color-brand-600);
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: var(--space-2);
    }

    .metric-change {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .metric-change.positive {
      color: var(--color-success-600);
    }

    .metric-change.negative {
      color: var(--color-error-600);
    }

    .top-districts {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .district-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2);
      background: var(--color-surface);
      border-radius: var(--radius-2);
    }

    .badge {
      background: var(--color-brand-600);
      color: white;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-1);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .quick-access-section {
      margin-bottom: var(--space-8);
    }

    .quick-access-section h2 {
      text-align: center;
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: var(--space-6);
      color: var(--color-text-primary);
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--space-4);
    }

    .tool-card {
      transition: all 0.3s ease;
      cursor: pointer;
      border: 2px solid transparent;
    }

    .tool-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-brand-200);
    }

    .tool-card mat-card-avatar {
      background: var(--color-brand-100);
      color: var(--color-brand-600);
    }

    .insights-card {
      max-width: 800px;
      margin: 0 auto;
    }

    .insights-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .insight-item {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--color-surface);
      border-radius: var(--radius-3);
      transition: transform 0.2s ease;
    }

    .insight-item:hover {
      transform: translateX(4px);
    }

    .insight-item mat-icon {
      color: var(--color-brand-600);
      background: var(--color-brand-100);
      padding: var(--space-2);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .insight-content h4 {
      margin: 0 0 var(--space-1) 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .insight-content p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .page-header h1 {
        font-size: 2rem;
      }

      .market-overview {
        grid-template-columns: 1fr;
      }

      .tools-grid {
        grid-template-columns: 1fr;
      }

      .insight-item {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class MarketComponent {}

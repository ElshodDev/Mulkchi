import { Component, inject, OnInit, signal, effect, SecurityContext, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import {
  ComparisonService,
  ComparisonResult,
  PropertyComparisonDetail,
} from '../../../core/services/comparison.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    RouterLink,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('500ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
  template: `
    <div class="compare-page">
      <div class="container py-12">
        <!-- Header -->
        <header class="compare-header">
          <div class="header-titles">
            <h1 class="page-title">Mulklar <span class="highlight-text">Dueli</span></h1>
            <p class="page-subtitle">Ikkita uyni barcha ko'rsatkichlar bo'yicha yonma-yon solishtiring</p>
          </div>
          @if (!comparisonService.isEmpty()) {
            <button mat-stroked-button color="warn" (click)="comparisonService.clear()" class="btn-clear-all">
              <mat-icon>delete_sweep</mat-icon>
              <span>Tozalash</span>
            </button>
          }
        </header>

        @if (comparisonService.isEmpty()) {
          <div class="empty-state" @fadeAnimation>
            <div class="icon-circle"><mat-icon>sports_kabaddi</mat-icon></div>
            <h2 class="empty-title">Duel uchun mulk tanlanmagan</h2>
            <p class="empty-desc">E'lonlar ro'yxatidan o'zingizga ma'qul uylarni Duelga qo'shing!</p>
            <button mat-flat-button color="primary" routerLink="/properties" class="btn-explore">
              <mat-icon>travel_explore</mat-icon>
              <span>Mulklarni qidirish</span>
            </button>
          </div>
        } @else {
          
          <!-- VS BATTLE ARENA -->
          <div class="vs-arena" @fadeAnimation>
            
            <!-- LEFT PROPERTY -->
            <div class="fighter-card left-fighter">
              @if (leftProperty(); as prop) {
                <button class="remove-fighter-btn" (click)="removeProperty(prop.id)" matTooltip="Olib tashlash">
                  <mat-icon>close</mat-icon>
                </button>
                <div class="fighter-img" (click)="viewProperty(prop.id)">
                  <img [src]="getImg(prop)" [alt]="prop.title" (error)="onImgError($event)" />
                  <div class="listing-badge" [class]="(prop.listingType || '').toLowerCase()">
                    {{ getListingLabel(prop.listingType) }}
                  </div>
                </div>
                <div class="fighter-info">
                  <h3 class="prop-title" [title]="prop.title" (click)="viewProperty(prop.id)">{{ prop.title }}</h3>
                  <div class="prop-location"><mat-icon>location_on</mat-icon> {{ prop.city || 'Toshkent' }}, {{ prop.district || 'Markaz' }}</div>
                  <div class="prop-price text-blue-600">{{ formatPrice(prop.salePrice || prop.monthlyRent || prop.pricePerNight, prop.currency) }}</div>
                  
                  <div class="fighter-stats">
                    <div class="stat"><mat-icon>square_foot</mat-icon> <span>{{ prop.area }} m²</span></div>
                    <div class="stat"><mat-icon>bed</mat-icon> <span>{{ prop.numberOfBedrooms || 1 }} xona</span></div>
                    <div class="stat"><mat-icon>shower</mat-icon> <span>{{ prop.numberOfBathrooms || 1 }} hammom</span></div>
                  </div>
                  
                  <button mat-flat-button color="primary" class="btn-view" (click)="viewProperty(prop.id)">Batafsil</button>
                </div>
              }
            </div>

            <!-- VS BADGE -->
            <div class="vs-divider">
              <div class="vs-badge" @scaleIn>VS</div>
            </div>

            <!-- RIGHT PROPERTY -->
            <div class="fighter-card right-fighter">
              @if (rightProperty(); as prop) {
                <button class="remove-fighter-btn" (click)="removeProperty(prop.id)" matTooltip="Olib tashlash">
                  <mat-icon>close</mat-icon>
                </button>
                <div class="fighter-img" (click)="viewProperty(prop.id)">
                  <img [src]="getImg(prop)" [alt]="prop.title" (error)="onImgError($event)" />
                  <div class="listing-badge" [class]="(prop.listingType || '').toLowerCase()">
                    {{ getListingLabel(prop.listingType) }}
                  </div>
                </div>
                <div class="fighter-info">
                  <h3 class="prop-title" [title]="prop.title" (click)="viewProperty(prop.id)">{{ prop.title }}</h3>
                  <div class="prop-location"><mat-icon>location_on</mat-icon> {{ prop.city || 'Toshkent' }}, {{ prop.district || 'Markaz' }}</div>
                  <div class="prop-price text-red-600">{{ formatPrice(prop.salePrice || prop.monthlyRent || prop.pricePerNight, prop.currency) }}</div>
                  
                  <div class="fighter-stats">
                    <div class="stat"><mat-icon>square_foot</mat-icon> <span>{{ prop.area }} m²</span></div>
                    <div class="stat"><mat-icon>bed</mat-icon> <span>{{ prop.numberOfBedrooms || 1 }} xona</span></div>
                    <div class="stat"><mat-icon>shower</mat-icon> <span>{{ prop.numberOfBathrooms || 1 }} hammom</span></div>
                  </div>
                  
                  <button mat-flat-button color="warn" class="btn-view" (click)="viewProperty(prop.id)">Batafsil</button>
                </div>
              } @else {
                <div class="waiting-fighter" routerLink="/properties">
                  <div class="add-circle"><mat-icon>person_add</mat-icon></div>
                  <h3>Ikkinchi uyni tanlang</h3>
                  <p>Duelni boshlash uchun yana bitta uy qo'shing</p>
                </div>
              }
            </div>
            
          </div>

          <!-- ANALYTICS SECTION (Requires 2 properties) -->
          @if (comparisonService.count() === 2) {
            
            @if (isLoading()) {
              <div class="ai-loading" @fadeAnimation>
                <mat-spinner diameter="32"></mat-spinner>
                <span>AI Hakam jang maydonini o'rganmoqda...</span>
              </div>
            } @else if (apiResult()) {
              <div class="duel-analytics" @fadeAnimation>
                
                <!-- RADAR CHART -->
                <div class="radar-box glass-panel">
                  <h3 class="box-title"><mat-icon>radar</mat-icon> O'rgimchak To'ri Tahlili</h3>
                  <div class="chart-container">
                    <canvas baseChart 
                      [data]="radarChartData" 
                      [options]="radarChartOptions" 
                      [type]="radarChartType">
                    </canvas>
                  </div>
                </div>

                <!-- AI ADVICE -->
                <div class="ai-advocate glass-panel">
                  <div class="ai-header">
                    <div class="ai-avatar"><mat-icon>smart_toy</mat-icon></div>
                    <h3>AI Hakamning Xulosasi</h3>
                  </div>
                  <div class="ai-chat-bubble">
                    <p [innerHTML]="formatSummary(apiResult()!.summary)"></p>
                    
                    <div class="verdict-banner">
                      <mat-icon>emoji_events</mat-icon>
                      <div class="verdict-text">
                        <strong>Tavsiya qilingan G'olib:</strong><br/>
                        <span>{{ apiResult()!.recommendation }}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            }
          }

        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: radial-gradient(circle at top, #f8fafc 0%, #e2e8f0 100%);
        font-family: 'Inter', sans-serif;
        color: #0f172a;
      }

      .container { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }

      .compare-header {
        display: flex; justify-content: space-between; align-items: flex-end;
        margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px dashed #cbd5e1;
      }
      .page-title { font-size: 3rem; font-weight: 900; letter-spacing: -1px; margin: 0 0 8px; }
      .highlight-text { background: linear-gradient(135deg, #ef4444, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .page-subtitle { font-size: 1.2rem; color: #64748b; margin: 0; }
      .btn-clear-all { border-radius: 16px !important; height: 48px !important; font-weight: 700; }

      .empty-state {
        background: white; border: 3px dashed #cbd5e1; border-radius: 32px; padding: 80px 32px;
        text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;
      }
      .icon-circle { width: 100px; height: 100px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
      .icon-circle mat-icon { font-size: 50px; width: 50px; height: 50px; color: #94a3b8; }
      .empty-title { font-size: 2rem; font-weight: 900; margin: 0 0 16px; }
      .empty-desc { font-size: 1.2rem; color: #64748b; margin: 0 0 32px; }
      .btn-explore { border-radius: 20px !important; height: 56px !important; padding: 0 40px !important; font-size: 1.1rem !important; font-weight: 800 !important; background: #0f172a !important; color: white !important; }

      /* VS ARENA */
      .vs-arena {
        display: flex; align-items: stretch; justify-content: space-between; position: relative; margin-bottom: 40px;
        background: white; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); padding: 32px;
        gap: 20px;
      }
      @media (max-width: 800px) {
        .vs-arena { flex-direction: column; }
        .vs-divider { transform: rotate(90deg); margin: 20px 0; }
      }

      .fighter-card {
        flex: 1; position: relative; display: flex; flex-direction: column;
        border-radius: 24px; transition: transform 0.3s ease;
      }
      .left-fighter { background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%); border: 2px solid #bae6fd; }
      .right-fighter { background: linear-gradient(180deg, #fef2f2 0%, #ffffff 100%); border: 2px solid #fecaca; }

      .remove-fighter-btn {
        position: absolute; top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 50%;
        background: rgba(0,0,0,0.5); color: white; border: none; z-index: 10; cursor: pointer; backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center; transition: all 0.2s;
      }
      .remove-fighter-btn:hover { background: #ef4444; transform: scale(1.1); }

      .fighter-img { height: 280px; width: 100%; border-radius: 22px 22px 0 0; overflow: hidden; position: relative; cursor: pointer; }
      .fighter-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
      .fighter-img:hover img { transform: scale(1.05); }
      
      .listing-badge { position: absolute; bottom: 16px; left: 16px; padding: 6px 16px; border-radius: 12px; font-weight: 800; color: white; font-size: 0.8rem; backdrop-filter: blur(8px); text-transform: uppercase; }
      .listing-badge.rent { background: rgba(16, 185, 129, 0.9); }
      .listing-badge.sale { background: rgba(239, 68, 68, 0.9); }
      .listing-badge.shorttermrent { background: rgba(59, 130, 246, 0.9); }

      .fighter-info { padding: 24px; flex: 1; display: flex; flex-direction: column; }
      .prop-title { font-size: 1.4rem; font-weight: 900; margin: 0 0 8px; cursor: pointer; }
      .prop-title:hover { text-decoration: underline; }
      .prop-location { display: flex; align-items: center; gap: 4px; color: #64748b; margin-bottom: 16px; font-weight: 500; }
      .prop-location mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .prop-price { font-size: 2rem; font-weight: 900; margin-bottom: 24px; }
      
      .fighter-stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 32px; }
      .stat { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.8); padding: 8px 16px; border-radius: 12px; font-weight: 700; color: #334155; border: 1px solid rgba(0,0,0,0.05); }
      .stat mat-icon { font-size: 20px; width: 20px; height: 20px; color: #64748b; }

      .btn-view { border-radius: 16px !important; height: 50px !important; font-size: 1.1rem !important; font-weight: 800 !important; margin-top: auto; }

      /* Waiting state */
      .waiting-fighter { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s; }
      .waiting-fighter:hover { background: rgba(254, 202, 202, 0.2); }
      .waiting-fighter .add-circle { width: 80px; height: 80px; background: #fee2e2; border-radius: 50%; color: #ef4444; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; transition: transform 0.3s; }
      .waiting-fighter .add-circle mat-icon { font-size: 40px; width: 40px; height: 40px; }
      .waiting-fighter:hover .add-circle { transform: scale(1.1); background: #ef4444; color: white; }
      .waiting-fighter h3 { font-size: 1.5rem; font-weight: 800; margin: 0 0 8px; color: #0f172a; }
      .waiting-fighter p { color: #64748b; font-size: 1.1rem; }

      /* VS DIVIDER */
      .vs-divider { display: flex; align-items: center; justify-content: center; width: 80px; flex-shrink: 0; z-index: 5; }
      .vs-badge { width: 70px; height: 70px; background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fbbf24; font-size: 1.8rem; font-weight: 900; font-style: italic; border: 4px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }

      /* ANALYTICS */
      .duel-analytics { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
      @media (max-width: 900px) { .duel-analytics { grid-template-columns: 1fr; } }
      
      .glass-panel { background: white; border-radius: 32px; padding: 32px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.08); border: 1px solid #f1f5f9; }
      .box-title { display: flex; align-items: center; gap: 12px; font-size: 1.4rem; font-weight: 900; margin: 0 0 24px; color: #0f172a; }
      .box-title mat-icon { color: #3b82f6; }

      .chart-container { position: relative; height: 350px; width: 100%; display: flex; justify-content: center; }

      .ai-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
      .ai-avatar { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); }
      .ai-avatar mat-icon { font-size: 32px; width: 32px; height: 32px; }
      .ai-header h3 { font-size: 1.6rem; font-weight: 900; margin: 0; background: linear-gradient(135deg, #6d28d9, #4c1d95); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      
      .ai-chat-bubble { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 24px 24px 24px 4px; padding: 24px; position: relative; font-size: 1.1rem; line-height: 1.7; color: #334155; }
      
      .verdict-banner { margin-top: 24px; background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 16px; color: white; box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3); }
      .verdict-banner mat-icon { font-size: 40px; width: 40px; height: 40px; }
      .verdict-text { flex: 1; }
      .verdict-text strong { font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; }
      .verdict-text span { display: block; font-size: 1.3rem; font-weight: 900; margin-top: 4px; }

      .ai-loading { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 60px; background: white; border-radius: 32px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.08); font-size: 1.2rem; font-weight: 800; color: #4f46e5; text-align: center; }
    `
  ],
})
export class ComparisonComponent implements OnInit {
  protected readonly comparisonService = inject(ComparisonService);
  protected readonly imageService = inject(ImageOptimizationService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly isLoading = signal(false);
  protected readonly apiResult = signal<ComparisonResult | null>(null);

  protected readonly leftProperty = computed(() => {
    const props = this.comparisonService.selectedProperties();
    return props.length > 0 ? props[0] : null;
  });

  protected readonly rightProperty = computed(() => {
    const props = this.comparisonService.selectedProperties();
    return props.length > 1 ? props[1] : null;
  });

  // RADAR CHART CONFIG
  public radarChartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { display: false },
        pointLabels: {
          font: { size: 13, family: 'Inter', weight: 'bold' },
          color: '#475569'
        },
        grid: { color: '#e2e8f0' },
        angleLines: { color: '#e2e8f0' }
      }
    },
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 13, weight: 'bold' } } },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: 'Inter', size: 14 },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 12,
        cornerRadius: 12
      }
    }
  };
  public radarChartType: 'radar' = 'radar';
  public radarChartData: ChartData<'radar'> = {
    labels: ['Maydon kattaligi', 'Xonalar soni', 'Qulayliklar (Score)', 'Narx qulayligi'],
    datasets: []
  };

  constructor() {
    effect(() => {
      if (this.comparisonService.count() === 2) {
        this.fetchSmartComparison();
      } else {
        this.apiResult.set(null);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    if (this.comparisonService.count() === 2) {
      this.fetchSmartComparison();
    }
  }

  fetchSmartComparison() {
    this.isLoading.set(true);
    this.comparisonService.getSmartComparison().subscribe({
      next: (res) => {
        this.apiResult.set(res);
        this.updateRadarChart(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching comparison', err);
        this.isLoading.set(false);
      }
    });
  }

  updateRadarChart(res: ComparisonResult) {
    if (!res || res.details.length < 2) return;

    const d1 = res.details[0];
    const d2 = res.details[1];

    // Normalize values to 0-100 scale for Radar
    const maxArea = Math.max(d1.area, d2.area, 1);
    const maxBed = Math.max(d1.bedrooms, d2.bedrooms, 1);
    
    // Lower price is better, so max score for lowest price
    const minPrice = Math.min(d1.price, d2.price);
    const maxPrice = Math.max(d1.price, d2.price, 1);
    const p1Score = d1.price === minPrice ? 100 : Math.max(20, (minPrice / maxPrice) * 100);
    const p2Score = d2.price === minPrice ? 100 : Math.max(20, (minPrice / maxPrice) * 100);

    this.radarChartData = {
      labels: ['Maydon kattaligi', 'Xonalar soni', 'Qulayliklar (Score)', 'Narx qulayligi'],
      datasets: [
        {
          label: d1.title,
          data: [
            (d1.area / maxArea) * 100,
            (d1.bedrooms / maxBed) * 100,
            d1.score, // AI Score is already 0-100
            p1Score
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          pointBackgroundColor: '#2563eb',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#2563eb',
          borderWidth: 3
        },
        {
          label: d2.title,
          data: [
            (d2.area / maxArea) * 100,
            (d2.bedrooms / maxBed) * 100,
            d2.score,
            p2Score
          ],
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: '#ef4444',
          pointBackgroundColor: '#dc2626',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#dc2626',
          borderWidth: 3
        }
      ]
    };
  }

  removeProperty(id: string) {
    this.comparisonService.removeFromCompare(id);
  }

  formatSummary(summary: string): SafeHtml {
    if (!summary) return '';
    const formatted = summary
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/- /g, '<br/>• ');
    
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, formatted) || '';
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  getImg(prop: any): string {
    const url = prop.images?.[0]?.url || prop.images?.[0]?.imageUrl || prop.imageUrl || '';
    return this.imageService.getOptimizedImage(url, 400, 300);
  }

  onImgError(e: any): void {
    e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
  }

  viewProperty(id: string): void {
    window.location.href = '/properties/' + id;
  }

  getListingLabel(listingType: string): string {
    switch (listingType) {
      case 'Rent': return 'Ijaraga';
      case 'Sale': return 'Sotuvda';
      case 'ShortTermRent': return 'Kunlik ijara';
      default: return 'Ijara / Sotuv';
    }
  }

  formatPrice(price: any, currency: string = 'UZS'): string {
    if (!price) return 'Narx kelishiladi';
    return Number(price).toLocaleString('ru-RU') + ' ' + (currency || 'UZS');
  }
}

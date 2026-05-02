import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AIService } from '../../../core/services/ai.service';
import { ComparisonService } from '../../../core/services/comparison.service';
import { Property } from '../../../core/models';

@Component({
  selector: 'app-ai-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="ai-recommendations-container">
      <div class="container">
        <!-- Header Section -->
        <div class="page-header">
          <div class="header-content">
            <h1>AI Tavsiyalar</h1>
            <p>Sizga mos keladigan mulklar</p>
          </div>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="refreshRecommendations()">
              <mat-icon>refresh</mat-icon>
              Yangilash
            </button>
          </div>
        </div>

        <!-- Loading State -->
        @if (aiService.loading()) {
          <div class="loading-container">
            <mat-progress-spinner diameter="60" mode="indeterminate"></mat-progress-spinner>
            <p>Tavsiyalar yuklanmoqda...</p>
          </div>
        }

        <!-- Error State -->
        @if (aiService.error() && !aiService.loading()) {
          <div class="error-container">
            <mat-icon>error_outline</mat-icon>
            <h3>Tavsiyalar yuklanmoqda...</h3>
            <p>{{ aiService.error() }}</p>
            <button mat-raised-button color="primary" (click)="refreshRecommendations()">
              <mat-icon>refresh</mat-icon>
              Qayta urinish
            </button>
          </div>
        }

        <!-- Empty State -->
        @if (!aiService.loading() && !aiService.error() && !aiService.hasRecommendations()) {
          <div class="empty-container">
            <mat-icon>psychology</mat-icon>
            <h3>Hozircha tavsiyalar mavjud emas</h3>
            <p>AI tizimini o'rgatish uchun mulklar qo'shing</p>
            <a mat-raised-button color="primary" routerLink="/properties">
              <mat-icon>search</mat-icon>
              Mulk qidirish
            </a>
          </div>
        }

        <!-- Recommendations Grid -->
        @if (!aiService.loading() && aiService.hasRecommendations()) {
          <div class="recommendations-section">
            <div class="section-header">
              <h2>Siz uchun maxsus tavsiyalar</h2>
              <span class="badge">{{ aiService.recommendations().length }} ta mulk</span>
            </div>

            <div class="properties-grid">
              @for (property of aiService.recommendations(); track property.id) {
                <mat-card class="property-card" [routerLink]="['/properties', property.id]">
                  <div class="property-image">
                    @if (property.images && property.images.length > 0) {
                      <img [src]="property.images[0].imageUrl" [alt]="property.title">
                    } @else {
                      <div class="no-image">
                        <mat-icon>home</mat-icon>
                      </div>
                    }
                    <div class="image-overlay">
                      <span class="property-type">{{ property.type }}</span>
                      @if (property.isFeatured) {
                        <span class="featured-badge">Tavsiya</span>
                      }
                    </div>
                  </div>

                  <mat-card-content>
                    <div class="property-header">
                      <h3 class="property-title">{{ property.title }}</h3>
                      <div class="property-location">
                        <mat-icon>location_on</mat-icon>
                        <span>{{ property.city }}, {{ property.district }}</span>
                      </div>
                    </div>

                    <div class="property-features">
                      @if (property.area) {
                        <span class="feature">
                          <mat-icon>square_foot</mat-icon>
                          {{ property.area }} m²
                        </span>
                      }
                      @if (property.numberOfBedrooms) {
                        <span class="feature">
                          <mat-icon>bed</mat-icon>
                          {{ property.numberOfBedrooms }} xona
                        </span>
                      }
                      @if (property.numberOfBathrooms) {
                        <span class="feature">
                          <mat-icon>bathtub</mat-icon>
                          {{ property.numberOfBathrooms }} dush
                        </span>
                      }
                    </div>

                    <div class="property-footer">
                      <div class="price">
                        @if (property.monthlyRent) {
                          <span class="amount">{{ property.monthlyRent | number }} {{ property.currency }}</span>
                          <span class="period">/ oy</span>
                        } @else if (property.salePrice) {
                          <span class="amount">{{ property.salePrice | number }} {{ property.currency }}</span>
                        } @else if (property.pricePerNight) {
                          <span class="amount">{{ property.pricePerNight | number }} {{ property.currency }}</span>
                          <span class="period">/ tun</span>
                        }
                      </div>
                      <div class="stats">
                        <span class="views">
                          <mat-icon>visibility</mat-icon>
                          {{ property.viewsCount }}
                        </span>
                        <span class="rating" *ngIf="property.averageRating">
                          <mat-icon>star</mat-icon>
                          {{ property.averageRating }}
                        </span>
                      </div>
                    </div>
                  </mat-card-content>
                  <div class="card-actions">
                    <button mat-stroked-button color="primary" (click)="addToCompare(property); $event.stopPropagation();">
                      <mat-icon>compare_arrows</mat-icon>
                      Solishtirish
                    </button>
                  </div>
                </mat-card>
              }
            </div>
          </div>
        }

        <!-- Why AI Section -->
        <div class="why-ai-section">
          <h2>AI tavsiyalari qanday ishlaydi?</h2>
          <div class="features-grid">
            <div class="feature-card">
              <mat-icon>analytics</mat-icon>
              <h3>Ma'lumotlar tahlili</h3>
              <p>AI tizimimiz barcha mulklarning xususiyatlarini tahlil qiladi</p>
            </div>
            <div class="feature-card">
              <mat-icon>trending_up</mat-icon>
              <h3>Mashhurlik baholash</h3>
              <p>Ko'rishlar, sevimlilar va reytinglar asosida mashhur mulklarni aniqlaydi</p>
            </div>
            <div class="feature-card">
              <mat-icon>psychology</mat-icon>
              <h3>Aqlli tavsiyalar</h3>
              <p>Har safar yangi ma'lumotlar bilan o'zini takomillashtiradi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== CSS Variables ===== */
    :host {
      --color-navy: #1B3A6B;
      --color-navy-light: #2a4a7c;
      --color-gold: #C9A84C;
      --color-gold-light: #d4b86a;
      --color-white: #ffffff;
      --color-gray-50: #f8fafc;
      --color-gray-100: #f1f5f9;
      --color-gray-200: #e2e8f0;
      --color-gray-500: #64748b;
      --color-gray-600: #475569;
      --color-gray-900: #0f172a;
      --radius: 8px;
      --radius-lg: 12px;
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    }

    .ai-recommendations-container {
      min-height: calc(100vh - 64px);
      background: var(--color-gray-50);
      padding: 40px 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ===== Page Header ===== */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content h1 {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--color-navy);
      margin: 0 0 8px 0;
    }

    .header-content p {
      color: var(--color-gray-500);
      font-size: 1.125rem;
      margin: 0;
    }

    .header-actions button {
      background: var(--color-navy) !important;
      color: var(--color-white) !important;
      height: 48px;
      padding: 0 24px;
      font-weight: 500;
      border-radius: var(--radius) !important;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .header-actions button:hover {
      background: var(--color-navy-light) !important;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    /* ===== Loading & Error States ===== */
    .loading-container,
    .error-container,
    .empty-container {
      text-align: center;
      padding: 80px 20px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      margin-bottom: 40px;
    }

    .loading-container mat-icon,
    .error-container mat-icon,
    .empty-container mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: var(--color-navy);
      margin-bottom: 24px;
    }

    .loading-container p {
      color: var(--color-gray-500);
      font-size: 1.125rem;
    }

    .error-container h3,
    .empty-container h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0 0 12px 0;
    }

    .error-container p,
    .empty-container p {
      color: var(--color-gray-500);
      margin: 0 0 24px 0;
    }

    .error-container button,
    .empty-container a {
      background: var(--color-navy) !important;
      color: var(--color-white) !important;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    /* ===== Recommendations Section ===== */
    .recommendations-section {
      margin-bottom: 60px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .section-header h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0;
    }

    .badge {
      background: rgba(27, 58, 107, 0.1);
      color: var(--color-navy);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* ===== Properties Grid ===== */
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .property-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .property-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow-lg);
    }

    .card-actions {
      padding: 16px;
      display: flex;
      justify-content: center;
      border-top: 1px solid var(--color-gray-200);
      background: var(--color-gray-50);
    }

    .card-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .property-image {
      position: relative;
      height: 220px;
      overflow: hidden;
    }

    .property-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .property-card:hover .property-image img {
      transform: scale(1.05);
    }

    .no-image {
      width: 100%;
      height: 100%;
      background: var(--color-gray-200);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .no-image mat-icon {
      font-size: 48px;
      color: var(--color-gray-400);
    }

    .image-overlay {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .property-type {
      background: rgba(255, 255, 255, 0.95);
      color: var(--color-navy);
      padding: 6px 12px;
      border-radius: var(--radius);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .featured-badge {
      background: var(--color-gold);
      color: var(--color-navy);
      padding: 6px 12px;
      border-radius: var(--radius);
      font-size: 0.75rem;
      font-weight: 600;
    }

    mat-card-content {
      padding: 20px;
    }

    .property-header {
      margin-bottom: 16px;
    }

    .property-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0 0 8px 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .property-location {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-gray-500);
      font-size: 0.9rem;
    }

    .property-location mat-icon {
      font-size: 16px;
      color: var(--color-navy);
    }

    .property-features {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-gray-600);
      font-size: 0.875rem;
    }

    .feature mat-icon {
      font-size: 18px;
      color: var(--color-gray-400);
    }

    .property-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid var(--color-gray-200);
    }

    .price {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-navy);
    }

    .period {
      color: var(--color-gray-500);
      font-size: 0.875rem;
    }

    .stats {
      display: flex;
      gap: 16px;
    }

    .stats span {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--color-gray-500);
      font-size: 0.875rem;
    }

    .stats mat-icon {
      font-size: 16px;
      color: var(--color-gray-400);
    }

    .stats .rating mat-icon {
      color: var(--color-gold);
    }

    /* ===== Why AI Section ===== */
    .why-ai-section {
      margin-top: 60px;
      padding: 40px 0;
    }

    .why-ai-section h2 {
      text-align: center;
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0 0 40px 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .feature-card {
      text-align: center;
      padding: 32px 24px;
      background: var(--color-white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .feature-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--color-navy);
      margin-bottom: 16px;
    }

    .feature-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0 0 12px 0;
    }

    .feature-card p {
      color: var(--color-gray-500);
      margin: 0;
      line-height: 1.6;
    }

    /* ===== Responsive Design ===== */
    @media (max-width: 1024px) {
      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }

      .header-content h1 {
        font-size: 1.75rem;
      }

      .properties-grid {
        grid-template-columns: 1fr;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .why-ai-section h2 {
        font-size: 1.5rem;
      }
    }

    @media (max-width: 480px) {
      .container {
        padding: 0 16px;
      }

      .ai-recommendations-container {
        padding: 24px 0;
      }

      .property-image {
        height: 180px;
      }
    }
  `]
})
export class AiRecommendationsComponent implements OnInit {
  private aiServicePrivate = inject(AIService);
  private snackBar = inject(MatSnackBar);
  private comparisonService = inject(ComparisonService);

  // Make service available to template
  get aiService() {
    return this.aiServicePrivate;
  }

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.aiServicePrivate.getRecommendations(5).subscribe({
      error: () => {
        // Error is handled by the service, showing empty state
      }
    });
  }

  refreshRecommendations(): void {
    this.aiServicePrivate.clearRecommendations();
    this.loadRecommendations();
    this.snackBar.open('Tavsiyalar yangilanmoqda...', 'Yopish', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  addToCompare(property: Property): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const added = this.comparisonService.addToCompare(property as any);
    if (added) {
      this.snackBar.open('Mulk solishtirish ro\'yxatiga qo\'shildi', 'Solishtirish', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      }).onAction().subscribe(() => {
        window.location.href = '/compare';
      });
    } else {
      this.snackBar.open('Bu mulk allaqachon ro\'yxatda yoki limit to\'lgan', 'OK', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }
}

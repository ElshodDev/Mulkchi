import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SubscriptionPlan, SubscriptionService } from '../../core/services/subscription.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="subs-page-container">
      <div class="container">
        <!-- HEADER -->
        <header class="subs-header animate-fade-in">
          <h1>Obuna paketlari</h1>
          <p>
            Mulkchi platformasida imkoniyatlaringizni kengaytiring va e'lonlaringizni birinchilardan
            bo'lib soting
          </p>
        </header>

        <!-- CURRENT SUB STATUS -->
        @if (mySub(); as sub) {
          <div class="active-sub-banner animate-slide-up">
            <div class="banner-content">
              <mat-icon class="gold-icon">verified</mat-icon>
              <div class="info">
                <h3>
                  Sizning joriy obunangiz:
                  <strong>{{ sub.plan?.nameUz || sub.plan?.name || 'Mavjud emas' }}</strong>
                </h3>
                <p>Amal qilish muddati: {{ sub.endDate | date: 'mediumDate' }} gacha</p>
              </div>
            </div>
            <div class="stats">
              <div class="stat-item">
                <span class="val">{{
                  sub.plan?.maxListings === -1 ? '∞' : sub.plan?.maxListings || 0
                }}</span>
                <span class="lab">Maksimal e'lonlar</span>
              </div>
              <div class="stat-item">
                <span class="val">{{ sub.remainingBoosts }}</span>
                <span class="lab">Qolgan Boost-lar</span>
              </div>
            </div>
          </div>
        }

        <!-- PLANS GRID -->
        <div class="plans-grid">
          @if (loading()) {
            <div class="loading-state">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Tariflar yuklanmoqda...</p>
            </div>
          } @else {
            @if (plans().length === 0) {
              <div class="empty-state">
                <mat-icon>info</mat-icon>
                <p>Hozircha tariflar mavjud emas. Admin orqali qo'shilishi kutilmoqda.</p>
              </div>
            }
            @for (plan of plans(); track plan.id) {
              <div
                class="plan-card"
                [class.featured]="plan.name === 'Premium' || plan.name === 'Agent'"
              >
                <div class="plan-badge" *ngIf="plan.name === 'Premium'">Eng mashhur</div>

                <div class="plan-icon">
                  <mat-icon>{{ getPlanIcon(plan.name) }}</mat-icon>
                </div>

                <h2 class="plan-name">{{ plan.nameUz || plan.name }}</h2>
                <div class="plan-price">
                  <span class="amount">{{ plan.monthlyPrice | number }}</span>
                  <span class="currency">UZS</span>
                  <span class="period">/ oy</span>
                </div>

                <div class="features-list">
                  <div class="feature-item">
                    <mat-icon>check_circle</mat-icon>
                    <span
                      >{{ plan.maxListings === -1 ? 'Cheksiz' : plan.maxListings + ' ta' }} e'lon
                      berish</span
                    >
                  </div>
                  <div class="feature-item">
                    <mat-icon>check_circle</mat-icon>
                    <span>{{ plan.monthlyBoosts }} ta bepul Boost</span>
                  </div>
                  @if (plan.hasAnalytics) {
                    <div class="feature-item">
                      <mat-icon>check_circle</mat-icon>
                      <span>Batafsil analitika</span>
                    </div>
                  }
                  @if (plan.hasPrioritySupport) {
                    <div class="feature-item">
                      <mat-icon>check_circle</mat-icon>
                      <span>24/7 Priority support</span>
                    </div>
                  }
                </div>

                <button
                  mat-flat-button
                  class="btn-subscribe"
                  [disabled]="isCurrentPlan(plan.id)"
                  (click)="onSubscribe(plan)"
                >
                  {{ isCurrentPlan(plan.id) ? 'Joriy obuna' : 'Tanlash' }}
                </button>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --navy: #0f172a;
        --gold: #c9a84c;
        --white: #ffffff;
        --border: #e2e8f0;
        --bg: #f8fafc;
        display: block;
      }

      .subs-page-container {
        min-height: 100vh;
        background: var(--bg);
        padding: 60px 0;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }

      .subs-header {
        text-align: center;
        margin-bottom: 60px;
      }
      .subs-header h1 {
        font-size: 3rem;
        font-weight: 900;
        color: var(--navy);
        margin-bottom: 16px;
      }
      .subs-header p {
        font-size: 1.2rem;
        color: #64748b;
        max-width: 700px;
        margin: 0 auto;
      }

      /* --- ACTIVE SUB BANNER --- */
      .active-sub-banner {
        background: var(--navy);
        color: white;
        border-radius: 24px;
        padding: 30px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 60px;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
        flex-wrap: wrap;
        gap: 30px;
      }
      .banner-content {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .gold-icon {
        color: var(--gold);
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
      .info h3 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 400;
      }
      .info h3 strong {
        color: var(--gold);
        font-weight: 800;
      }
      .info p {
        margin: 4px 0 0;
        opacity: 0.7;
        font-size: 0.9rem;
      }

      .stats {
        display: flex;
        gap: 40px;
      }
      .stat-item {
        text-align: center;
      }
      .stat-item .val {
        display: block;
        font-size: 2rem;
        font-weight: 900;
        color: var(--gold);
      }
      .stat-item .lab {
        font-size: 0.8rem;
        opacity: 0.6;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* --- PLANS GRID --- */
      .plans-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 32px;
      }

      .loading-state,
      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 100px 0;
      }
      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #94a3b8;
        margin-bottom: 16px;
      }
      .empty-state p {
        font-size: 1.1rem;
        color: #64748b;
      }

      .plan-card {
        background: var(--white);
        border-radius: 32px;
        padding: 50px 40px;
        border: 1px solid var(--border);
        position: relative;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .plan-card:hover {
        transform: translateY(-15px);
        box-shadow: 0 40px 80px rgba(0, 0, 0, 0.06);
        border-color: var(--gold);
      }

      .plan-card.featured {
        background: var(--navy);
        color: white;
        border-color: var(--navy);
        transform: scale(1.05);
        z-index: 2;
      }

      .plan-card.featured:hover {
        transform: translateY(-15px) scale(1.05);
      }

      .plan-badge {
        position: absolute;
        top: 24px;
        right: 24px;
        background: var(--gold);
        color: var(--navy);
        padding: 4px 12px;
        border-radius: 30px;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .plan-icon {
        width: 80px;
        height: 80px;
        background: #f1f5f9;
        color: var(--navy);
        border-radius: 24px;
        display: grid;
        place-items: center;
        margin-bottom: 30px;
      }
      .plan-card.featured .plan-icon {
        background: rgba(255, 255, 255, 0.1);
        color: var(--gold);
      }
      .plan-icon mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }

      .plan-name {
        font-size: 2rem;
        font-weight: 900;
        margin-bottom: 20px;
      }

      .plan-price {
        margin-bottom: 40px;
      }
      .plan-price .amount {
        font-size: 3rem;
        font-weight: 900;
      }
      .plan-price .currency {
        font-size: 1.2rem;
        font-weight: 700;
        margin-left: 4px;
      }
      .plan-price .period {
        display: block;
        font-size: 0.9rem;
        opacity: 0.6;
        margin-top: -4px;
      }

      .features-list {
        width: 100%;
        margin-bottom: 40px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
      }
      .feature-item mat-icon {
        color: #10b981;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .plan-card.featured .feature-item mat-icon {
        color: var(--gold);
      }
      .feature-item span {
        font-size: 0.95rem;
        font-weight: 500;
      }

      .btn-subscribe {
        width: 100%;
        height: 60px !important;
        border-radius: 18px !important;
        font-weight: 800 !important;
        font-size: 1.1rem !important;
        background: var(--navy) !important;
        color: white !important;
        transition: all 0.3s;
      }
      .plan-card.featured .btn-subscribe {
        background: var(--gold) !important;
        color: var(--navy) !important;
      }
      .btn-subscribe:hover:not([disabled]) {
        transform: scale(1.02);
        filter: brightness(1.1);
      }

      /* --- ANIMATIONS --- */
      .animate-fade-in {
        animation: fadeIn 0.8s ease-out;
      }
      .animate-slide-up {
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .active-sub-banner {
          justify-content: center;
          text-align: center;
        }
        .banner-content {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SubscriptionsComponent implements OnInit {
  private subService = inject(SubscriptionService);
  private snackBar = inject(MatSnackBar);

  plans = this.subService.plans;
  mySub = this.subService.mySubscription;
  loading = this.subService.loading;

  ngOnInit(): void {
    this.subService.getPlans().subscribe();
    this.subService.getMySubscription().subscribe({
      error: () => undefined,
    });
  }

  getPlanIcon(name: string): string {
    switch (name) {
      case 'Premium':
        return 'stars';
      case 'Agent':
        return 'business_center';
      case 'Free':
        return 'eco';
      case 'Standard':
        return 'card_membership';
      default:
        return 'card_membership';
    }
  }

  isCurrentPlan(planId: string): boolean {
    return this.mySub()?.planId === planId && this.mySub()?.status === 1; // 1 = Active
  }

  onSubscribe(plan: SubscriptionPlan): void {
    this.subService.subscribe(plan.id).subscribe({
      next: () => {
        this.snackBar.open(
          `${plan.nameUz || plan.name} paketiga muvaffaqiyatli obuna bo'ldingiz!`,
          'Yopish',
          {
            duration: 5000,
            panelClass: ['success-snackbar'],
          },
        );
      },
      error: () => {
        this.snackBar.open(
          "Xatolik yuz berdi. Iltimos, hisobingizda mablag' yetarli ekanligini tekshiring.",
          'Yopish',
          {
            duration: 5000,
          },
        );
      },
    });
  }
}

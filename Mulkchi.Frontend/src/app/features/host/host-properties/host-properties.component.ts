import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { PropertyService } from '../../../core/services/property.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ImageOptimizationService } from '../../../core/services/image-optimization.service';
import { Property, PropertyStatus } from '../../../core/models';

@Component({
  selector: 'app-host-properties',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatMenuModule, MatDividerModule
  ],
  template: `
    <div class="dashboard-shell">
      <!-- Hero Header -->
      <div class="dash-hero">
        <div class="container">
          <div class="dash-hero__inner">
            <div>
              <h1>Mening e'lonlarim</h1>
              <p>Barcha mulklaringizni boshqaring va daromad oling</p>
            </div>
            <a mat-flat-button class="btn-new" routerLink="/elon-berish/tur">
              <mat-icon>add_home</mat-icon>
              Yangi e'lon joylash
            </a>
          </div>

          <!-- KPI Cards -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon" style="background:#e0f2fe"><mat-icon style="color:#0284c7">home_work</mat-icon></div>
              <div>
                <div class="kpi-value">{{ properties().length }}</div>
                <div class="kpi-label">Jami e'lonlar</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon" style="background:#dcfce7"><mat-icon style="color:#16a34a">check_circle</mat-icon></div>
              <div>
                <div class="kpi-value">{{ activeCount() }}</div>
                <div class="kpi-label">Faol e'lonlar</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon" style="background:#fef9c3"><mat-icon style="color:#d97706">visibility</mat-icon></div>
              <div>
                <div class="kpi-value">{{ totalViews() }}</div>
                <div class="kpi-label">Jami ko'rishlar</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon" style="background:#fce7f3"><mat-icon style="color:#db2777">favorite</mat-icon></div>
              <div>
                <div class="kpi-value">{{ totalFavorites() }}</div>
                <div class="kpi-label">Sevimlilar</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container content-area">

        @if (loading()) {
          <div class="skeleton-grid">
            @for (i of [1,2,3]; track i) {
              <div class="skeleton-card">
                <div class="sk sk-image"></div>
                <div class="sk-body">
                  <div class="sk sk-title"></div>
                  <div class="sk sk-sub"></div>
                  <div class="sk sk-sub short"></div>
                </div>
              </div>
            }
          </div>
        } @else if (properties().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><mat-icon>add_business</mat-icon></div>
            <h2>Hali birorta e'lon yo'q</h2>
            <p>Mulkingizni e'lon qiling va potensial ijara yoki xaridorlarni toping</p>
            <a mat-flat-button class="btn-new" routerLink="/elon-berish/tur">
              <mat-icon>add</mat-icon> Birinchi e'loningizni joylashtiring
            </a>
          </div>
        } @else {
          <!-- Expiring Soon Alert -->
          @if (expiringSoon().length > 0) {
            <div class="alert-banner">
              <mat-icon>schedule</mat-icon>
              <span><strong>{{ expiringSoon().length }} ta e'lon</strong> tez orada muddati tugaydi. Ularni yangilang!</span>
              <button mat-button class="alert-btn" (click)="scrollToExpiring()">Ko'rish</button>
            </div>
          }

          <!-- Properties Grid -->
          <div class="listings-grid">
            @for (property of properties(); track property.id) {
              <div class="listing-card" [class.expiring]="isExpiringSoon(property)" [class.vip]="property.isFeatured" id="prop-{{ property.id }}">
                
                <!-- VIP Badge -->
                @if (property.isFeatured) {
                  <div class="vip-ribbon"><mat-icon>diamond</mat-icon> VIP</div>
                }

                <!-- Image -->
                <div class="card-image">
                  @if (property.images?.length) {
                    <img [src]="imageService.getOptimizedImage(property.images![0].url)" [alt]="property.title" />
                  } @else {
                    <div class="no-img">
                      <mat-icon>home</mat-icon>
                      <span>Rasm yo'q</span>
                    </div>
                  }
                  <div class="card-image__overlay">
                    <span class="status-pill" [class]="getStatusClass(property.status)">
                      <span class="dot"></span>
                      {{ getStatusLabel(property.status) }}
                    </span>
                  </div>
                </div>

                <!-- Body -->
                <div class="card-body">
                  <h3 class="card-title">{{ property.title }}</h3>
                  <div class="card-location">
                    <mat-icon>place</mat-icon>
                    {{ property.city }}{{ property.district ? ', ' + property.district : '' }}
                  </div>

                  <div class="card-price">
                    <span class="price-amount">{{ getPrice(property) | number:'1.0-0' }}</span>
                    <span class="price-currency">{{ property.currency || 'UZS' }}</span>
                    <span class="price-period">{{ getPricePeriod(property) }}</span>
                  </div>

                  <!-- Expiry Countdown -->
                  @if (getDaysLeft(property) !== null) {
                    <div class="expiry-bar" [class.danger]="getDaysLeft(property)! <= 2">
                      <mat-icon>{{ getDaysLeft(property)! <= 2 ? 'warning' : 'schedule' }}</mat-icon>
                      @if (getDaysLeft(property)! <= 0) {
                        <span>Muddati tugadi!</span>
                      } @else {
                        <span>{{ getDaysLeft(property) }} kun qoldi</span>
                      }
                    </div>
                  }

                  <!-- Stats -->
                  <div class="card-stats">
                    <span><mat-icon>visibility</mat-icon>{{ property.viewsCount || 0 }}</span>
                    <span><mat-icon>favorite_border</mat-icon>{{ property.favoritesCount || 0 }}</span>
                    <span><mat-icon>calendar_today</mat-icon>{{ getCreatedDate(property) }}</span>
                  </div>
                </div>

                <!-- Actions Footer -->
                <div class="card-footer">
                  <!-- BUMP button - Core Monetization Feature -->
                  <button class="btn-bump" (click)="bumpProperty(property)" [disabled]="bumpingId() === property.id" matTooltip="E'lonni tepaga ko'tarish">
                    @if (bumpingId() === property.id) {
                      <mat-icon class="spinning">refresh</mat-icon>
                    } @else {
                      <mat-icon>rocket_launch</mat-icon>
                    }
                    TOPga ko'tarish
                  </button>

                  <div class="action-btns">
                    <a mat-icon-button [routerLink]="['/properties', property.id]" matTooltip="Ko'rish">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                    <a mat-icon-button [routerLink]="['/host/properties/edit', property.id]" matTooltip="Tahrirlash">
                      <mat-icon>edit</mat-icon>
                    </a>
                    <button mat-icon-button class="btn-delete" (click)="deleteProperty(property.id)" matTooltip="O'chirish">
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalCount() > pageSize()) {
            <div class="pagination">
              <button mat-stroked-button [disabled]="currentPage() === 1" (click)="prevPage()">
                <mat-icon>chevron_left</mat-icon>
              </button>
              <span>{{ currentPage() }} / {{ totalPages() }}</span>
              <button mat-stroked-button [disabled]="currentPage() >= totalPages()" (click)="nextPage()">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      --navy: #0f172a;
      --gold: #c9a84c;
      --green: #16a34a;
      --red: #dc2626;
      --gray-50: #f8fafc;
      --gray-100: #f1f5f9;
      --gray-200: #e2e8f0;
      --gray-500: #64748b;
      --white: #ffffff;
      --radius: 20px;
      display: block;
    }

    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    /* Hero */
    .dash-hero {
      background: linear-gradient(135deg, var(--navy) 0%, #1e3a5f 100%);
      color: var(--white);
      padding: 48px 0 100px;
    }
    .dash-hero__inner { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; margin-bottom: 40px; }
    .dash-hero h1 { font-size: 2.2rem; font-weight: 900; margin: 0; }
    .dash-hero p { opacity: 0.75; margin: 8px 0 0; }

    .btn-new {
      background: var(--gold) !important;
      color: var(--navy) !important;
      font-weight: 800 !important;
      border-radius: 14px !important;
      height: 48px !important;
      padding: 0 24px !important;
      gap: 8px;
    }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .kpi-card {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s;
    }
    .kpi-card:hover { transform: translateY(-3px); }
    .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; }
    .kpi-value { font-size: 1.8rem; font-weight: 900; color: var(--white); }
    .kpi-label { font-size: 0.8rem; color: rgba(255,255,255,0.65); margin-top: 2px; }

    /* Content */
    .content-area { margin-top: -60px; padding-bottom: 80px; }

    /* Alert Banner */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 14px;
      padding: 14px 20px;
      margin-bottom: 24px;
      color: #9a3412;
    }
    .alert-banner mat-icon { color: #ea580c; }
    .alert-btn { margin-left: auto; color: #ea580c !important; font-weight: 700 !important; }

    /* Skeleton */
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }
    .skeleton-card { background: var(--white); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--gray-200); }
    .sk { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
    .sk-image { height: 200px; border-radius: 0; }
    .sk-body { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .sk-title { height: 20px; }
    .sk-sub { height: 14px; }
    .sk-sub.short { width: 60%; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Empty State */
    .empty-state { background: var(--white); border-radius: var(--radius); padding: 80px 40px; text-align: center; border: 1px solid var(--gray-200); }
    .empty-icon mat-icon { font-size: 72px; width: 72px; height: 72px; color: var(--gray-200); margin-bottom: 24px; }
    .empty-state h2 { font-size: 1.5rem; font-weight: 800; color: var(--navy); margin: 0 0 12px; }
    .empty-state p { color: var(--gray-500); margin: 0 0 32px; }

    /* Listings Grid */
    .listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 24px; }

    /* Listing Card */
    .listing-card {
      background: var(--white);
      border-radius: var(--radius);
      border: 1px solid var(--gray-200);
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      transition: all 0.3s;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .listing-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    .listing-card.expiring { border-color: #fed7aa; }
    .listing-card.vip { border-color: var(--gold); box-shadow: 0 4px 20px rgba(201,168,76,0.15); }

    /* VIP Ribbon */
    .vip-ribbon {
      position: absolute;
      top: 16px;
      right: -28px;
      background: linear-gradient(135deg, var(--gold), #e8c97a);
      color: var(--navy);
      padding: 6px 36px;
      font-size: 0.75rem;
      font-weight: 900;
      transform: rotate(45deg);
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .vip-ribbon mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Card Image */
    .card-image { position: relative; height: 200px; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .listing-card:hover .card-image img { transform: scale(1.05); }
    .no-img { width: 100%; height: 100%; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #94a3b8; }
    .no-img mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .no-img span { font-size: 0.8rem; font-weight: 600; }
    .card-image__overlay { position: absolute; bottom: 12px; left: 12px; }

    /* Status Pill */
    .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; backdrop-filter: blur(8px); }
    .status-pill.active { background: rgba(22,163,74,0.9); color: white; }
    .status-pill.draft { background: rgba(217,119,6,0.9); color: white; }
    .status-pill.expired, .status-pill.archived { background: rgba(100,116,139,0.9); color: white; }
    .status-pill.sold, .status-pill.rented { background: rgba(220,38,38,0.9); color: white; }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.8; }

    /* Card Body */
    .card-body { padding: 20px; flex: 1; }
    .card-title { font-size: 1rem; font-weight: 800; color: var(--navy); margin: 0 0 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-location { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; color: var(--gray-500); margin-bottom: 12px; }
    .card-location mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .card-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 12px; }
    .price-amount { font-size: 1.4rem; font-weight: 900; color: var(--navy); }
    .price-currency { font-size: 0.85rem; font-weight: 700; color: var(--gray-500); }
    .price-period { font-size: 0.8rem; color: var(--gray-500); }

    /* Expiry Bar */
    .expiry-bar { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-weight: 700; color: #d97706; background: #fff7ed; padding: 6px 10px; border-radius: 8px; margin-bottom: 12px; }
    .expiry-bar.danger { color: var(--red); background: #fef2f2; }
    .expiry-bar mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Card Stats */
    .card-stats { display: flex; gap: 16px; }
    .card-stats span { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: var(--gray-500); }
    .card-stats mat-icon { font-size: 15px; width: 15px; height: 15px; }

    /* Card Footer */
    .card-footer { padding: 16px 20px; border-top: 1px solid var(--gray-100); display: flex; align-items: center; justify-content: space-between; gap: 12px; }

    /* Bump Button */
    .btn-bump {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.3s;
      flex: 1;
      justify-content: center;
    }
    .btn-bump:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(124,58,237,0.35); }
    .btn-bump:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-bump mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }

    /* Action Buttons */
    .action-btns { display: flex; gap: 4px; }
    .action-btns a, .action-btns button { color: var(--gray-500) !important; }
    .action-btns a:hover, .action-btns button:hover { color: var(--navy) !important; }
    .btn-delete:hover { color: var(--red) !important; }

    /* Pagination */
    .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 48px; }
    .pagination span { font-weight: 700; color: var(--navy); }

    /* Responsive */
    @media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) {
      .dash-hero { padding: 32px 0 80px; }
      .dash-hero h1 { font-size: 1.6rem; }
      .dash-hero__inner { flex-direction: column; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .listings-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HostPropertiesComponent implements OnInit {
  private propertyService = inject(PropertyService);
  private snackBar = inject(MatSnackBar);
  private confirmationService = inject(ConfirmationService);
  public imageService = inject(ImageOptimizationService);

  properties = signal<Property[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  pageSize = signal(9);
  totalCount = signal(0);
  bumpingId = signal<string | null>(null);

  // Computed stats
  totalViews = computed(() => this.properties().reduce((s, p) => s + (p.viewsCount || 0), 0));
  totalFavorites = computed(() => this.properties().reduce((s, p) => s + (p.favoritesCount || 0), 0));
  activeCount = computed(() => this.properties().filter(p => p.status === 'Active').length);
  expiringSoon = computed(() => this.properties().filter(p => {
    const days = this.getDaysLeft(p);
    return days !== null && days <= 2 && days >= 0;
  }));
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  // Listing lifetime: 30 days from creation
  private readonly LISTING_DAYS = 30;

  ngOnInit(): void { this.loadProperties(); }

  loadProperties(): void {
    this.loading.set(true);
    this.propertyService.getHostProperties(this.currentPage(), this.pageSize()).subscribe({
      next: (result) => {
        this.properties.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open("E'lonlarni yuklashda xatolik", 'OK', { duration: 3000 });
      }
    });
  }

  getDaysLeft(property: Property): number | null {
    if (!property.createdDate) return null;
    const created = new Date(property.createdDate);
    const expiry = new Date(created.getTime() + this.LISTING_DAYS * 24 * 60 * 60 * 1000);
    const days = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(days, 0);
  }

  isExpiringSoon(property: Property): boolean {
    const days = this.getDaysLeft(property);
    return days !== null && days <= 2;
  }

  getCreatedDate(property: Property): string {
    if (!property.createdDate) return '';
    return new Date(property.createdDate).toLocaleDateString('uz-UZ');
  }

  bumpProperty(property: Property): void {
    this.bumpingId.set(property.id);
    this.propertyService.bumpProperty(property.id).subscribe({
      next: () => {
        this.bumpingId.set(null);
        this.snackBar.open(`"${property.title}" tepaga ko'tarildi! ✅`, 'OK', { duration: 4000 });
        this.loadProperties();
      },
      error: () => {
        this.bumpingId.set(null);
        this.snackBar.open("Ko'tarishda xatolik yuz berdi", 'OK', { duration: 3000 });
      }
    });
  }

  getStatusLabel(status: PropertyStatus | string): string {
    const map: Record<string, string> = {
      'Active': 'Faol', 'Draft': 'Qoralama',
      'Sold': 'Sotildi', 'Rented': 'Ijarada',
      'Archived': 'Arxivda', 'Expired': 'Muddati tugadi'
    };
    return map[status] || status;
  }

  getStatusClass(status: PropertyStatus | string): string {
    return status.toLowerCase();
  }

  getPrice(property: Property): number {
    return property.salePrice || property.monthlyRent || property.pricePerNight || 0;
  }

  getPricePeriod(property: Property): string {
    if (property.salePrice) return '';
    if (property.monthlyRent) return '/oy';
    if (property.pricePerNight) return '/tun';
    return '';
  }

  scrollToExpiring(): void {
    const first = this.expiringSoon()[0];
    if (first) {
      document.getElementById(`prop-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  prevPage(): void { this.currentPage.update(p => p - 1); this.loadProperties(); }
  nextPage(): void { this.currentPage.update(p => p + 1); this.loadProperties(); }

  deleteProperty(id: string): void {
    this.confirmationService.confirm({
      title: "E'lonni o'chirish",
      message: "Bu e'lonni rostdan ham o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
      confirmLabel: "O'chirish",
      cancelLabel: 'Bekor qilish',
      tone: 'danger',
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.propertyService.deleteProperty(id).subscribe({
        next: () => {
          this.snackBar.open("E'lon o'chirildi", 'OK', { duration: 3000 });
          this.loadProperties();
        },
        error: () => this.snackBar.open("O'chirishda xatolik", 'OK', { duration: 3000 })
      });
    });
  }
}

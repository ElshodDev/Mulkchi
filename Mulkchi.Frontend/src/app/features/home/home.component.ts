import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ListingType } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { PropertyService } from '../../core/services/property.service';
import { ReviewService } from '../../core/services/review.service';
import { AnnouncementsWidgetComponent } from './announcements-widget.component';
import { LocationPickerMapComponent } from './location-picker-map.component';
import { VoiceSearchService } from '../../core/services/voice-search.service';
import { UIStore } from '../../core/stores/ui.store';
import { ImageOptimizationService } from '../../core/services/image-optimization.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatDividerModule,
    MatAutocompleteModule,
    MatTooltipModule,
  ],
  template: `
    <div class="home-wrapper">
      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-bg">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920" alt="Premium House" />
        </div>

        <div class="container hero-container">
          <div class="hero-content">
            <div class="badge-premium animate-fade-in">
              <mat-icon>verified</mat-icon>
              <span>O'zbekistondagi №1 Premium Platforma</span>
            </div>

            <h1 class="hero-title animate-slide-up">
              Orzuyingizdagi uyni <br />
              <span class="text-gradient">biz bilan toping</span>
            </h1>

            <p class="hero-subtitle animate-slide-up-delay">
              Mulkchi — ko'chmas mulk bozorida sun'iy intellekt va innovatsion yondashuv uyg'unligi.
            </p>

            <!-- Search Panel -->
            <div class="search-panel-glass animate-slide-up-long">
              <div class="search-tabs">
                <button [class.active]="listingType === 'Sale'" (click)="listingType = 'Sale'">Sotib olish</button>
                <button [class.active]="listingType === 'Rent'" (click)="listingType = 'Rent'">Ijaraga</button>
                <button [class.active]="listingType === 'ShortTermRent'" (click)="listingType = 'ShortTermRent'">Kunlik</button>
              </div>

              <div class="search-main">
                <div class="input-group">
                  <mat-icon>location_on</mat-icon>
                  <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    [matAutocomplete]="auto"
                    (input)="onSearchInput($event)"
                    placeholder="Qayerdan qidiramiz?" 
                    (keyup.enter)="onSearch()"
                  />
                  <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onSearch()">
                    @for (loc of locationSuggestions(); track loc) {
                      <mat-option [value]="loc">
                        <mat-icon>place</mat-icon>
                        {{ loc }}
                      </mat-option>
                    }
                  </mat-autocomplete>
                  <button mat-icon-button (click)="toggleVoiceSearch()" [class.mic-active]="voiceService.isListening()" [matTooltip]="voiceService.isListening() ? 'Eshitilmoqda...' : 'Ovozli qidiruv'">
                    <mat-icon>{{ voiceService.isListening() ? 'mic' : 'mic_none' }}</mat-icon>
                  </button>
                </div>
                
                <div class="search-actions">
                  <button mat-icon-button class="map-trigger" (click)="openMapPicker()" title="Xarita orqali">
                    <mat-icon>map</mat-icon>
                  </button>
                  <button mat-flat-button class="btn-search" (click)="onSearch()">
                    <mat-icon>search</mat-icon>
                    <span>Qidirish</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="hero-stats animate-fade-in-long">
              <div class="stat-item">
                <span class="stat-val">{{ counts.listings }}+</span>
                <span class="stat-lab">E'lonlar</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-val">{{ counts.regions }}</span>
                <span class="stat-lab">Viloyat</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-val">{{ counts.users }}K+</span>
                <span class="stat-lab">Mijozlar</span>
              </div>
            </div>
          </div>
        </div>
      </section>



      <!-- TOP REGIONS -->
      <section class="regions-section">
        <div class="container">
          <div class="section-top">
            <div>
              <h2 class="section-title">Ommabop hududlar</h2>
              <p class="section-desc">O'zbekistonning barcha hududlaridan eng sara mulklarni toping</p>
            </div>
          </div>
          <div class="regions-grid">
            @for (region of topRegions; track region.id) {
              <div class="region-card animate-fade-in" [style.animation-delay]="region.delay" (click)="searchByRegion(region.enumValue)">
                <img [src]="region.img" [alt]="region.name" (error)="onRegionImgError($event)" />
                <div class="region-overlay">
                  <h3>{{ region.name }}</h3>
                  <span>{{ region.count }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- AI FEATURES -->
      <section class="ai-section">
        <div class="container">
          <div class="ai-grid">
            <div class="ai-text">
              <span class="ai-badge">AI Yordamchi</span>
              <h2 class="ai-title">Mulkni baholashda <br /><span>sun'iy intellekt</span> kuchi</h2>
              <p class="ai-desc">
                Mulkchi platformasi AI algoritmlari yordamida e'loningizni tahlil qiladi, 
                bozor narxini bashorat qiladi va sizga eng maqbul narxni taklif etadi.
              </p>
              <ul class="ai-list">
                <li><mat-icon>check_circle</mat-icon> Narxni 98% aniqlikda bashorat qilish</li>
                <li><mat-icon>check_circle</mat-icon> Aqlli tavsiflar yaratish</li>
                <li><mat-icon>check_circle</mat-icon> Rasm sifatini avtomatik yaxshilash</li>
              </ul>
              <button mat-flat-button class="btn-ai-action" routerLink="/ai-tools">
                AI imkoniyatlarini sinash
              </button>
            </div>
            <div class="ai-visual">
              <div class="ai-card-float animate-float">
                <div class="ai-card-header">
                  <mat-icon>psychology</mat-icon>
                  <span>AI Tahlil</span>
                </div>
                <div class="ai-chart-mock">
                  <div class="bar" style="height: 40%"></div>
                  <div class="bar" style="height: 70%"></div>
                  <div class="bar" style="height: 100%"></div>
                  <div class="bar" style="height: 60%"></div>
                </div>
                <div class="ai-result">
                  <small>Bashorat qilingan narx:</small>
                  <strong>1 245 000 000 UZS</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-banner">
        <div class="container">
          <div class="cta-box">
            <h2>O'z uyingizni sotmoqchimisiz?</h2>
            <p>Bepul e'lon joylashtiring va minglab mijozlarga yetib boring.</p>
            <div class="cta-btns">
              <button mat-flat-button class="btn-cta-primary" (click)="onFreeListingClick()">E'lon berish</button>
              <button mat-stroked-button class="btn-cta-secondary" routerLink="/properties">Uy qidirish</button>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="footer-premium">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-col brand-col">
              <div class="logo">
                <mat-icon>apartment</mat-icon>
                <span>Mulkchi</span>
              </div>
              <p>O'zbekistondagi eng innovatsion ko'chmas mulk portali.</p>
              <div class="socials">
                <a href="#"><mat-icon>facebook</mat-icon></a>
                <a href="#"><mat-icon>telegram</mat-icon></a>
                <a href="#"><mat-icon>camera_alt</mat-icon></a>
              </div>
            </div>
            <div class="footer-col">
              <h4>Platforma</h4>
              <a routerLink="/properties">Mulklar</a>
              <a routerLink="/ai-tools">AI Tools</a>
              <a routerLink="/market">Bozor tahlili</a>
            </div>
            <div class="footer-col">
              <h4>Yordam</h4>
              <a href="#">FAQ</a>
              <a href="#">Aloqa</a>
              <a href="#">Shartlar</a>
            </div>
          </div>
          <div class="footer-bottom">
            <p>© 2026 Mulkchi. Barcha huquqlar himoyalangan.</p>
            <p class="bmi-tag">Bitiruv malakaviy ishi — Elshod Ibadullayev</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      --primary: #0f172a;
      --accent: #c9a84c;
      --accent-light: #d4bc74;
      --text-muted: #64748b;
      --white: #ffffff;
      --glass: rgba(255, 255, 255, 0.1);
      --glass-dark: rgba(15, 23, 42, 0.8);
      --radius: 16px;
      --radius-lg: 24px;
      --shadow: 0 20px 40px rgba(0,0,0,0.1);
      display: block;
    }

    .home-wrapper { overflow-x: hidden; font-family: 'Inter', sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

    /* --- HERO --- */
    .hero-section {
      position: relative;
      height: 90vh;
      min-height: 700px;
      display: flex;
      align-items: center;
      color: var(--white);
      overflow: hidden;
      background: var(--primary);
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    .hero-bg img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: brightness(0.6) contrast(1.1);
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(15,23,42,0.4) 0%, var(--primary) 100%);
      z-index: 1;
    }
    .hero-container { position: relative; z-index: 2; }
    .hero-content { max-width: 800px; margin: 0 auto; text-align: center; }

    .badge-premium {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      background: var(--glass);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 40px;
      margin-bottom: 24px;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .badge-premium mat-icon { color: var(--accent); font-size: 18px; }

    .hero-title {
      font-size: clamp(3rem, 6vw, 5rem);
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 20px;
      letter-spacing: -2px;
    }
    .text-gradient {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-subtitle {
      font-size: 1.25rem;
      opacity: 0.8;
      max-width: 600px;
      margin: 0 auto 48px;
      line-height: 1.6;
    }

    /* --- SEARCH PANEL --- */
    .search-panel-glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(25px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      padding: 10px;
      box-shadow: 0 40px 100px rgba(0,0,0,0.3);
      max-width: 900px;
      margin: 0 auto 60px;
    }
    .search-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
      padding-left: 10px;
    }
    .search-tabs button {
      background: transparent;
      border: none;
      color: var(--white);
      padding: 8px 16px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      opacity: 0.6;
      transition: all 0.3s;
    }
    .search-tabs button.active { background: var(--glass); opacity: 1; color: var(--accent); }

    .search-main {
      display: flex;
      gap: 12px;
      background: var(--white);
      padding: 8px;
      border-radius: 18px;
      align-items: center;
    }
    .input-group {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 16px;
      color: var(--primary);
    }
    .input-group input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1.1rem;
      padding: 12px 0;
      color: var(--primary);
      width: 100%;
    }
    .input-group mat-icon { color: var(--accent); }
    
    .mic-active { color: #ef4444 !important; animation: pulse 1.5s infinite; }

    .search-actions { display: flex; gap: 8px; }
    .map-trigger { background: #f1f5f9; border-radius: 14px; color: var(--primary); }
    .btn-search {
      background: var(--primary) !important;
      color: var(--white) !important;
      padding: 0 32px !important;
      border-radius: 14px !important;
      font-weight: 700 !important;
      height: 54px !important;
    }

    /* --- STATS --- */
    .hero-stats {
      display: flex;
      justify-content: center;
      gap: 40px;
      margin-top: 20px;
    }
    .stat-item { display: flex; flex-direction: column; }
    .stat-val { font-size: 2rem; font-weight: 800; color: var(--accent); }
    .stat-lab { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; }
    .stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.1); align-self: center; }



    /* --- REGIONS --- */
    .regions-section { padding: 100px 0; background: #fff; }
    .regions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .region-card { position: relative; height: 320px; border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
    .region-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    .region-card:hover img { transform: scale(1.1); }
    .region-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; color: var(--white); }
    .region-overlay h3 { font-size: 1.5rem; font-weight: 800; margin: 0; }
    .region-overlay span { font-size: 0.9rem; opacity: 0.7; }

    /* --- AI SECTION --- */
    .ai-section { padding: 120px 0; background: var(--primary); color: var(--white); }
    .ai-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 80px; align-items: center; }
    .ai-badge { color: var(--accent); font-weight: 700; text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; display: block; margin-bottom: 16px; }
    .ai-title { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 24px; }
    .ai-title span { color: var(--accent); }
    .ai-desc { font-size: 1.2rem; opacity: 0.7; line-height: 1.6; margin-bottom: 32px; }
    .ai-list { list-style: none; padding: 0; margin-bottom: 40px; }
    .ai-list li { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 1.1rem; }
    .ai-list mat-icon { color: var(--accent); }
    .btn-ai-action { background: var(--accent) !important; color: var(--primary) !important; padding: 0 40px !important; border-radius: 14px !important; font-weight: 700 !important; height: 56px !important; }

    .ai-visual { position: relative; }
    .ai-card-float {
      background: var(--white);
      color: var(--primary);
      padding: 30px;
      border-radius: 24px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.5);
      max-width: 300px;
      margin-left: auto;
    }
    .ai-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; font-weight: 700; }
    .ai-chart-mock { display: flex; align-items: flex-end; gap: 10px; height: 100px; margin-bottom: 24px; }
    .ai-chart-mock .bar { flex: 1; background: #e2e8f0; border-radius: 4px; }
    .ai-chart-mock .bar:nth-child(3) { background: var(--accent); }
    .ai-result { text-align: center; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .ai-result small { display: block; color: var(--text-muted); }
    .ai-result strong { font-size: 1.8rem; color: var(--primary); }

    /* --- CTA --- */
    .cta-banner { padding: 80px 0; }
    .cta-box {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
      padding: 80px;
      border-radius: var(--radius-lg);
      text-align: center;
      color: var(--primary);
    }
    .cta-box h2 { font-size: 3rem; font-weight: 800; margin-bottom: 16px; }
    .cta-box p { font-size: 1.25rem; opacity: 0.8; margin-bottom: 40px; }
    .cta-btns { display: flex; justify-content: center; gap: 16px; }
    .btn-cta-primary { background: var(--primary) !important; color: var(--white) !important; padding: 0 40px !important; border-radius: 14px !important; height: 56px !important; font-weight: 700 !important; }
    .btn-cta-secondary { border-color: var(--primary) !important; color: var(--primary) !important; border-width: 2px !important; padding: 0 40px !important; border-radius: 14px !important; height: 56px !important; font-weight: 700 !important; }

    /* --- FOOTER --- */
    .footer-premium { background: #020617; padding: 100px 0 40px; color: var(--white); }
    .footer-grid { display: grid; grid-template-columns: 1.5fr 1fr 1.5fr; gap: 60px; margin-bottom: 80px; }
    .brand-col .logo { display: flex; align-items: center; gap: 10px; font-size: 1.8rem; font-weight: 800; margin-bottom: 24px; color: var(--white); }
    .brand-col p { opacity: 0.6; line-height: 1.6; max-width: 280px; }
    .socials { display: flex; gap: 16px; margin-top: 32px; }
    .socials a { color: var(--white); opacity: 0.6; transition: 0.3s; }
    .socials a:hover { opacity: 1; color: var(--accent); }
    
    .footer-col h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 24px; }
    .footer-col a { display: block; color: var(--white); opacity: 0.6; margin-bottom: 12px; transition: 0.3s; }
    .footer-col a:hover { opacity: 1; padding-left: 5px; color: var(--accent); }

    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 40px; display: flex; justify-content: space-between; opacity: 0.5; font-size: 0.9rem; }
    .bmi-tag { font-weight: 600; color: var(--accent); }

    /* --- ANIMATIONS --- */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0px); } }
    
    .animate-fade-in { animation: fadeIn 1s ease-out; }
    .animate-slide-up { animation: slideUp 0.8s ease-out; }
    .animate-slide-up-delay { animation: slideUp 0.8s ease-out 0.2s forwards; opacity: 0; }
    .animate-slide-up-long { animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards; opacity: 0; }
    .animate-fade-in-long { animation: fadeIn 1.5s ease-out 0.8s forwards; opacity: 0; }
    .animate-float { animation: float 4s ease-in-out infinite; }

    @media (max-width: 1024px) {
      .ai-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
      .ai-card-float { margin: 0 auto; }
      .footer-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 768px) {
      .hero-title { font-size: 2.8rem; }
      .search-main { flex-direction: column; padding: 12px; }
      .btn-search { width: 100% !important; }
      .grid-properties { grid-template-columns: 1fr; }
      .cta-box { padding: 40px 24px; }
      .cta-btns { flex-direction: column; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private propertyService = inject(PropertyService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  protected readonly voiceService = inject(VoiceSearchService);
  protected readonly uiStore = inject(UIStore);
  private snackBar = inject(MatSnackBar);
  private geolocationService = inject(GeolocationService);

  locationSuggestions = signal<string[]>([]);
  counts = { listings: 0, regions: 0, users: 0 };
  featuredProperties: any[] = [];
  loading = false;
  searchQuery = '';
  listingType: 'Sale' | 'Rent' | 'ShortTermRent' = 'Rent';
  listingTypeEnum = ListingType;

  topRegions = [
    { id: 1, name: 'Toshkent', enumValue: 'Toshkent', count: '1,200+ e\'lon', img: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop', delay: '0s' },
    { id: 2, name: 'Samarqand', enumValue: 'Samarqand', count: '450+ e\'lon', img: 'https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?q=80&w=800&auto=format&fit=crop', delay: '0.1s' },
    { id: 3, name: 'Buxoro', enumValue: 'Buxoro', count: '280+ e\'lon', img: 'https://images.unsplash.com/photo-1580191947416-62d35a55e71d?q=80&w=800&auto=format&fit=crop', delay: '0.2s' },
    { id: 4, name: 'Namangan', enumValue: 'Namangan', count: '150+ e\'lon', img: 'https://images.unsplash.com/photo-1493246507139-91e8bef99c02?q=80&w=800&auto=format&fit=crop', delay: '0.3s' },
    { id: 5, name: 'Andijon', enumValue: 'Andijon', count: '210+ e\'lon', img: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop', delay: '0.4s' },
    { id: 6, name: 'Farg\'ona', enumValue: 'Fargona', count: '190+ e\'lon', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop', delay: '0.5s' },
    { id: 7, name: 'Xorazm', enumValue: 'Xorazm', count: '120+ e\'lon', img: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80&w=800&auto=format&fit=crop', delay: '0.6s' },
    { id: 8, name: 'Navoiy', enumValue: 'Navoi', count: '90+ e\'lon', img: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800&auto=format&fit=crop', delay: '0.7s' },
    { id: 9, name: 'Qashqadaryo', enumValue: 'Qashqadaryo', count: '110+ e\'lon', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop', delay: '0.8s' },
    { id: 10, name: 'Surxondaryo', enumValue: 'Surxondaryo', count: '85+ e\'lon', img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', delay: '0.9s' },
    { id: 11, name: 'Jizzax', enumValue: 'Jizzax', count: '70+ e\'lon', img: 'https://images.unsplash.com/photo-1500382017468-9049fee74a62?q=80&w=800&auto=format&fit=crop', delay: '1.0s' },
    { id: 12, name: 'Sirdaryo', enumValue: 'Sirdaryo', count: '60+ e\'lon', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop', delay: '1.1s' },
    { id: 13, name: 'Qoraqalpog\'iston', enumValue: 'Nukus', count: '95+ e\'lon', img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800&auto=format&fit=crop', delay: '1.2s' },
  ];

  onRegionImgError(e: any) {
    e.target.src = 'https://placehold.co/800x600/0f172a/c9a84c?text=Mulkchi+Hudud';
  }

  ngOnInit(): void {
    this.voiceService.textResult$.subscribe(text => {
      this.searchQuery = text;
      this.onSearch();
    });
    this.loadFeaturedProperties();
    this.animateCounters();
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    if (query.length < 2) {
      this.locationSuggestions.set([]);
      return;
    }
    
    this.propertyService.autocompleteLocations(query).subscribe(res => {
      this.locationSuggestions.set(res);
    });
  }

  private animateCounters() {
    const targets = { listings: 200, regions: 14, users: 50 };
    const duration = 2000;
    const steps = 60;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      this.counts.listings = Math.round((targets.listings / steps) * current);
      this.counts.regions = Math.round((targets.regions / steps) * current);
      this.counts.users = Math.round((targets.users / steps) * current);
      if (current >= steps) clearInterval(timer);
    }, duration / steps);
  }

  loadFeaturedProperties() {
    this.loading = true;
    this.propertyService.getFeaturedProperties(6).subscribe({
      next: (res) => {
        this.featuredProperties = res;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  searchByRegion(region: string) {
    this.router.navigate(['/properties'], { queryParams: { region, listingType: this.listingType } });
  }

  onSearch() {
    this.router.navigate(['/properties'], {
      queryParams: { search: this.searchQuery.trim(), listingType: this.listingType }
    });
  }

  toggleVoiceSearch() {
    if (this.voiceService.isListening()) {
      this.voiceService.stop();
    } else {
      this.voiceService.setLanguage('uz-UZ');
      this.voiceService.start();
    }
  }

  openMapPicker() {
    this.dialog.open(LocationPickerMapComponent, {
      width: '90%', maxWidth: '600px'
    }).afterClosed().subscribe(res => {
      if (res) {
        this.router.navigate(['/properties'], {
          queryParams: { lat: res.coordinates.latitude, lng: res.coordinates.longitude, listingType: this.listingType }
        });
      }
    });
  }

  onFreeListingClick() {
    this.router.navigate([this.authService.isAuthenticated() ? '/elon-berish/tur' : '/auth/register']);
  }

  getListingTypeLabel(type: any) {
    if (type === 'Sale') return 'Sotuv';
    if (type === 'Rent') return 'Ijara';
    return 'Kunlik';
  }

  private imageOptimizationService = inject(ImageOptimizationService);

  getImageUrl(p: any) {
    const rawUrl = p.images?.[0]?.url || p.images?.[0]?.thumbnailUrl;
    if (rawUrl) {
      return this.imageOptimizationService.getOptimizedImage(rawUrl, 600, 400);
    }
    return `https://placehold.co/600x400/0f172a/c9a84c?text=Mulkchi`;
  }

  onImgError(e: any) {
    e.target.src = 'https://placehold.co/600x400/0f172a/c9a84c?text=Mulk';
  }

  navigateToProperty(id: string) {
    this.router.navigate(['/properties', id]);
  }
}

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
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ListingType } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { GeolocationService } from '../../core/services/geolocation.service';
import { PropertyService } from '../../core/services/property.service';
import { LocationPickerMapComponent } from './location-picker-map.component';
import { VoiceSearchService } from '../../core/services/voice-search.service';
import { UIStore } from '../../core/stores/ui.store';
import { ImageOptimizationService } from '../../core/services/image-optimization.service';
import { SeoService } from '../../core/services/seo.service';

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
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1920"
            alt="Premium House"
          />
        </div>

        <div class="container relative z-10 mx-auto px-6 pt-32 pb-20 text-center">
          <div class="max-w-4xl mx-auto">


            <h1 class="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6 animate-slide-up text-white" style="text-shadow: 0 4px 10px rgba(0,0,0,0.3);">
              Ma'lumotlar bazasiga asoslangan <br />
              <span class="text-gradient">uy joy savdosi va ijarasi</span>
            </h1>

            <p class="hero-subtitle animate-slide-up-delay">
              Zamonaviy texnologiyalar va sun'iy intellekt yordamida yaratilgan mukammal web platforma.
            </p>

            <!-- Search Panel -->
            <div class="search-panel-glass animate-slide-up-long">
              <div class="search-header">
                <div class="search-tabs">
                  <button [class.active]="listingType === 'Sale'" (click)="listingType = 'Sale'">
                    Sotib olish
                  </button>
                  <button [class.active]="listingType === 'Rent'" (click)="listingType = 'Rent'">
                    Ijaraga
                  </button>
                  <button
                    [class.active]="listingType === 'ShortTermRent'"
                    (click)="listingType = 'ShortTermRent'"
                  >
                    Kunlik
                  </button>
                </div>
                
                <button class="btn-ai-magic" (click)="onSmartSearch()">
                  <mat-icon>auto_awesome</mat-icon>
                  <span>AI Qidiruv</span>
                </button>
              </div>

              <div class="search-main">
                <div class="input-wrapper">
                  <mat-icon class="search-icon">search</mat-icon>
                  <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    [matAutocomplete]="auto"
                    (input)="onSearchInput($event)"
                    placeholder="Mulk turi, shahar yoki metro bekatini yozing..."
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
                </div>

                <div class="search-tools">
                  <button
                    (click)="toggleVoiceSearch()"
                    [class.mic-active]="voiceService.isListening()"
                    class="tool-btn-expanded"
                  >
                    <mat-icon>{{ voiceService.isListening() ? 'mic' : 'mic_none' }}</mat-icon>
                    <span class="tool-text">{{ voiceService.isListening() ? 'Eshitilmoqda...' : 'Gapiring' }}</span>
                  </button>
                  
                  <div class="divider"></div>
                  
                  <button 
                    (click)="openMapPicker()" 
                    class="tool-btn-expanded"
                  >
                    <mat-icon>map</mat-icon>
                    <span class="tool-text">Xarita</span>
                  </button>
                  
                  <button mat-flat-button class="btn-primary-search" (click)="onSearch()">
                    Qidirish
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    <!-- NEARBY PROPERTIES (GEOLOCATION) -->
    @if (nearbyProperties().length > 0 || loadingNearby()) {
      <section class="nearby-section">
        <div class="container">
          <div class="section-top">
            <div>
              <h2 class="section-title">
                <mat-icon color="primary" style="vertical-align: middle; margin-right: 8px;">{{ nearbyTitle() === 'Sizga yaqin mulklar' ? 'my_location' : 'recommend' }}</mat-icon>
                {{ nearbyTitle() }}
              </h2>
              <p class="section-desc">{{ nearbyTitle() === 'Sizga yaqin mulklar' ? "Joriy joylashuvingizga eng yaqin bo'lgan mulklar ro'yxati" : "O'zbekiston bo'ylab tavsiya etilgan eng yaxshi mulklar ro'yxati" }}</p>
            </div>
            <button mat-stroked-button (click)="loadNearbyProperties(true)" [disabled]="loadingNearby()">
              <mat-icon>refresh</mat-icon> Yangilash
            </button>
          </div>
          
          @if (loadingNearby()) {
            <div class="loading-nearby">
              <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
              <span>Joylashuvingiz bo'yicha qidirilmoqda...</span>
            </div>
          } @else {
            <div class="regions-grid">
              @for (prop of nearbyProperties(); track prop.id) {
                <mat-card class="property-card" (click)="navigateToProperty(prop.id)">
                  <img mat-card-image [src]="getImageUrl(prop)" [alt]="prop.title" (error)="onImgError($event)" style="height: 200px; object-fit: cover;">
                  <mat-card-content style="padding: 16px;">
                    <h3 style="margin: 0 0 8px; font-weight: 700; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ prop.title }}</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0 0 12px;">
                      <mat-icon style="font-size: 16px; width: 16px; height: 16px; vertical-align: middle;">location_on</mat-icon>
                      {{ prop.city }}, {{ prop.district }}
                    </p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                      <strong style="color: var(--primary); font-size: 1.2rem;">
                        {{ (prop.salePrice || prop.monthlyRent || prop.pricePerNight) | number }} {{ prop.currency || 'UZS' }}
                      </strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;" matTooltip="Qo'shilgan vaqti">
                        <mat-icon style="font-size: 14px; width: 14px; height: 14px;">schedule</mat-icon>
                        {{ getRelativeTime(prop.createdDate) }}
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          }
        </div>
      </section>
    }

    <!-- TOP REGIONS -->
      <section class="regions-section">
        <div class="container">
          <div class="section-top">
            <div>
              <h2 class="section-title">Ommabop hududlar</h2>
              <p class="section-desc">
                O'zbekistonning barcha hududlaridan eng sara mulklarni toping
              </p>
            </div>
          </div>
          <div class="regions-grid">
            @for (region of topRegions; track region.id) {
              <div
                class="region-card animate-fade-in"
                [style.animation-delay]="region.delay"
                (click)="searchByRegion(region.enumValue)"
              >
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
                Mulkchi platformasi AI algoritmlari yordamida e'loningizni tahlil qiladi, bozor
                narxini bashorat qiladi va sizga eng maqbul narxni taklif etadi.
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
              <button mat-flat-button class="btn-cta-primary" (click)="onFreeListingClick()">
                E'lon berish
              </button>
              <button mat-stroked-button class="btn-cta-secondary" routerLink="/properties">
                Uy qidirish
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  `,
  styles: [
    `
      :host {
        --primary: var(--color-text-primary);
        --accent: var(--color-gold, #c9a84c);
        --accent-light: var(--color-gold-light, #d4bc74);
        --text-muted: var(--color-text-muted);
        --white: var(--color-surface-elevated);
        --glass: rgba(255, 255, 255, 0.1);
        --glass-dark: rgba(15, 23, 42, 0.8);
        --radius: 16px;
        --radius-lg: 24px;
        --shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        display: block;
      }

      .home-wrapper {
        overflow-x: hidden;
        font-family: 'Inter', sans-serif;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
      }

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
      }
      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.85) 100%);
        z-index: 1;
      }
      .hero-container {
        position: relative;
        z-index: 2;
      }
      .hero-content {
        max-width: 800px;
        margin: 0 auto;
        text-align: center;
      }

      .badge-premium {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 20px;
        background: var(--glass);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 40px;
        margin-bottom: 24px;
        font-size: 0.9rem;
        font-weight: 500;
      }
      .badge-premium mat-icon {
        color: var(--accent);
        font-size: 18px;
      }

      .hero-title {
        font-size: clamp(3rem, 6vw, 5rem);
        font-weight: var(--font-weight-bold, 700);
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
        color: #ffffff;
        font-weight: 500;
        text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        max-width: 600px;
        margin: 0 auto 48px;
        line-height: 1.6;
      }

      .search-panel-glass {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(25px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: var(--radius-lg);
        padding: 10px;
        box-shadow: 0 40px 100px rgba(0, 0, 0, 0.3);
        max-width: 900px;
        margin: 0 auto 60px;
      }
      .search-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 0 10px;
      }
      .search-tabs {
        display: flex;
        gap: 8px;
      }
      .search-tabs button {
        background: transparent;
        border: none;
        color: var(--white);
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        opacity: 0.7;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .search-tabs button:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }
      .search-tabs button.active {
        background: rgba(255, 255, 255, 0.2);
        opacity: 1;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      }
      
      .btn-ai-magic {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, var(--color-primary, #1B3A6B) 0%, #2d5a9e 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
      }
      .btn-ai-magic:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
      }
      .btn-ai-magic mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .search-main {
        display: flex;
        gap: 8px;
        background: var(--white);
        padding: 10px;
        border-radius: 24px;
        align-items: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        transition: box-shadow 0.3s, transform 0.3s;
      }
      .search-main:focus-within {
        box-shadow: 0 15px 40px rgba(0,0,0,0.2);
        transform: translateY(-2px);
      }
      
      .input-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
      }
      .search-icon {
        color: var(--text-muted);
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
      .input-wrapper input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 1.15rem;
        padding: 16px 0;
        color: var(--primary);
        font-weight: 500;
      }
      .input-wrapper input::placeholder {
        color: var(--color-text-muted);
        font-weight: 400;
      }

      .search-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-right: 8px;
      }
      
      .tool-btn-expanded {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #f1f5f9;
        border: none;
        color: #475569;
        padding: 10px 16px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .tool-btn-expanded:hover {
        background: #e2e8f0;
        color: #0f172a;
      }
      .tool-btn-expanded mat-icon {
        color: #6366f1;
      }
      @media (max-width: 768px) {
        .tool-text { display: none; }
        .tool-btn-expanded { padding: 10px; border-radius: 50%; }
      }
      .mic-active {
        color: var(--color-error) !important;
        position: relative;
        z-index: 1;
      }
      .mic-active::before, .mic-active::after {
        content: '';
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 100%; height: 100%;
        border-radius: 50%;
        background: linear-gradient(45deg, var(--color-error), var(--color-primary), var(--color-gold), var(--color-primary-light));
        background-size: 300% 300%;
        z-index: -1;
        animation: siri-wave 1.5s infinite ease-out, siri-gradient 3s infinite linear;
      }
      .mic-active::after {
        animation-delay: 0.75s, 0s;
      }

      @keyframes siri-wave {
        0% { width: 100%; height: 100%; opacity: 0.8; }
        100% { width: 250%; height: 250%; opacity: 0; }
      }
      @keyframes siri-gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .divider {
        width: 1px;
        height: 32px;
        background: var(--color-border);
        margin: 0 8px;
      }

      .btn-primary-search {
        background: var(--primary) !important;
        color: var(--white) !important;
        padding: 0 32px !important;
        border-radius: 16px !important;
        font-weight: 700 !important;
        height: 56px !important;
        font-size: 1.05rem !important;
        letter-spacing: 0.5px;
        transition: background 0.3s !important;
      }
      .btn-primary-search:hover {
        background: #0f172a !important;
      }
      .btn-primary-search:disabled,
      .btn-primary-search[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
        background: var(--color-primary, #1B3A6B) !important;
        filter: grayscale(30%);
      }

      .hero-stats {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
        margin-top: 30px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(12px);
        padding: 16px 40px;
        border-radius: 40px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      }
      .stat-item {
        display: flex;
        flex-direction: column;
      }
      .stat-val {
        font-size: 2rem;
        font-weight: 800;
        color: var(--accent);
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      .stat-lab {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #e2e8f0;
        font-weight: 500;
      }
      .stat-divider {
        width: 1px;
        height: 40px;
        background: rgba(255, 255, 255, 0.1);
        align-self: center;
      }

      .regions-section, .nearby-section {
        padding: 80px 0;
        background: var(--color-surface-canvas, #fff);
      }
      .nearby-section {
        background: var(--color-surface, #f8fafc);
        border-bottom: 1px solid var(--color-surface-elevated, #e2e8f0);
      }
      .section-top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
      .section-title { font-size: 2.2rem; font-weight: var(--font-weight-bold, 700); color: var(--primary); margin: 0 0 8px; }
      .section-desc { font-size: 1.1rem; color: var(--text-muted); margin: 0; }
      
      .loading-nearby { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; gap: 16px; color: var(--text-muted); }
      .property-card { cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; border-radius: 16px; overflow: hidden; }
      .property-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
      .card-footer { padding: 16px; border-top: 1px solid var(--color-gray-100); display: flex; justify-content: space-between; align-items: center; }

      .regions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
      .region-card { position: relative; height: 320px; border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
      .region-card img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
      .region-card:hover img { transform: scale(1.1); }
      .region-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 80%); display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; color: #ffffff !important; }
      .region-overlay h3 { font-size: 1.8rem; font-weight: 800; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.8); color: #ffffff !important; }
      .region-overlay span { font-size: 1rem; opacity: 0.9; text-shadow: 0 1px 2px rgba(0,0,0,0.8); color: #e2e8f0 !important; font-weight: 500; }

      .ai-section {
        padding: 120px 0;
        background: var(--primary);
        color: var(--white);
      }
      .ai-grid {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 80px;
        align-items: center;
      }
      .ai-badge {
        color: var(--accent);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 0.8rem;
        display: block;
        margin-bottom: 16px;
      }
      .ai-title {
        font-size: 3.5rem;
        font-weight: var(--font-weight-bold, 700);
        line-height: 1.1;
        margin-bottom: 24px;
      }
      .ai-title span {
        color: var(--accent);
      }
      .ai-desc {
        font-size: 1.2rem;
        opacity: 0.7;
        line-height: 1.6;
        margin-bottom: 32px;
      }
      .ai-list {
        list-style: none;
        padding: 0;
        margin-bottom: 40px;
      }
      .ai-list li {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 1.1rem;
      }
      .ai-list mat-icon {
        color: var(--accent);
      }
      .btn-ai-action {
        background: var(--accent) !important;
        color: var(--primary) !important;
        padding: 0 40px !important;
        border-radius: 14px !important;
        font-weight: 700 !important;
        height: 56px !important;
      }

      .ai-visual {
        position: relative;
      }
      .ai-card-float {
        background: var(--white);
        color: var(--primary);
        padding: 30px;
        border-radius: 24px;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
        max-width: 300px;
        margin-left: auto;
      }
      .ai-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        font-weight: 700;
      }
      .ai-chart-mock {
        display: flex;
        align-items: flex-end;
        gap: 10px;
        height: 100px;
        margin-bottom: 24px;
      }
      .ai-chart-mock .bar {
        flex: 1;
        background: var(--color-border);
        border-radius: 4px;
      }
      .ai-chart-mock .bar:nth-child(3) {
        background: var(--accent);
      }
      .ai-result {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid var(--color-border);
      }
      .ai-result small {
        display: block;
        color: var(--text-muted);
      }
      .ai-result strong {
        font-size: 1.8rem;
        color: var(--primary);
      }

      .cta-banner {
        padding: 80px 0;
      }
      .cta-box {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%);
        padding: 80px;
        border-radius: var(--radius-lg);
        text-align: center;
        color: var(--primary);
      }
      .cta-box h2 {
        font-size: 3rem;
        font-weight: var(--font-weight-bold, 700);
        margin-bottom: 16px;
      }
      .cta-box p {
        font-size: 1.25rem;
        opacity: 0.8;
        margin-bottom: 40px;
      }
      .cta-btns {
        display: flex;
        justify-content: center;
        gap: 16px;
      }
      .btn-cta-primary {
        background: var(--primary) !important;
        color: var(--white) !important;
        padding: 0 40px !important;
        border-radius: 14px !important;
        height: 56px !important;
        font-weight: 700 !important;
      }
      .btn-cta-secondary {
        border-color: var(--primary) !important;
        color: var(--primary) !important;
        border-width: 2px !important;
        padding: 0 40px !important;
        border-radius: 14px !important;
        height: 56px !important;
        font-weight: 700 !important;
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
      @keyframes pulse {
        0% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
        100% {
          opacity: 1;
        }
      }
      @keyframes float {
        0% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-20px);
        }
        100% {
          transform: translateY(0px);
        }
      }

      .animate-fade-in {
        animation: fadeIn 1s ease-out;
      }
      .animate-slide-up {
        animation: slideUp 0.8s ease-out;
      }
      .animate-slide-up-delay {
        animation: slideUp 0.8s ease-out 0.2s forwards;
        opacity: 0;
      }
      .animate-slide-up-long {
        animation: slideUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        opacity: 0;
      }
      .animate-fade-in-long {
        animation: fadeIn 1.5s ease-out 0.8s forwards;
        opacity: 0;
      }
      .animate-float {
        animation: float 4s ease-in-out infinite;
      }

      @media (max-width: 1024px) {
        .ai-grid {
          grid-template-columns: 1fr;
          gap: 40px;
          text-align: center;
        }
        .ai-card-float {
          margin: 0 auto;
        }
        .footer-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 768px) {
        .hero-title {
          font-size: 2.8rem;
        }
        .search-main {
          flex-direction: column;
          padding: 12px;
        }
        .btn-search {
          width: 100% !important;
        }
        .grid-properties {
          grid-template-columns: 1fr;
        }
        .cta-box {
          padding: 40px 24px;
        }
        .cta-btns {
          flex-direction: column;
        }
      }
    `,
  ],
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
  private seoService = inject(SeoService);
  private imageOptimizationService = inject(ImageOptimizationService);

  locationSuggestions = signal<string[]>([]);
  counts = { listings: 0, regions: 0, users: 0 };
  featuredProperties: any[] = [];
  loading = false;
  searchQuery = '';
  listingType: 'Sale' | 'Rent' | 'ShortTermRent' = 'Rent';
  listingTypeEnum = ListingType;

  nearbyProperties = signal<any[]>([]);
  loadingNearby = signal(false);
  nearbyTitle = signal('Sizga yaqin mulklar');

  private searchSubject = new Subject<string>();

  topRegions = [
    {
      id: 1,
      name: 'Toshkent',
      enumValue: 'ToshkentShahar',
      count: "1,200+ e'lon",
      img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      delay: '0s',
    },
    {
      id: 2,
      name: 'Samarqand',
      enumValue: 'Samarqand',
      count: "450+ e'lon",
      img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      delay: '0.1s',
    },
    {
      id: 3,
      name: 'Buxoro',
      enumValue: 'Buxoro',
      count: "280+ e'lon",
      img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      delay: '0.2s',
    },
    {
      id: 4,
      name: 'Namangan',
      enumValue: 'Namangan',
      count: "150+ e'lon",
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      delay: '0.3s',
    },
    {
      id: 5,
      name: 'Andijon',
      enumValue: 'Andijon',
      count: "210+ e'lon",
      img: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=800&q=80',
      delay: '0.4s',
    },
    {
      id: 6,
      name: "Farg'ona",
      enumValue: 'Fargona',
      count: "190+ e'lon",
      img: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=800&q=80',
      delay: '0.5s',
    },
    {
      id: 7,
      name: 'Xorazm',
      enumValue: 'Xorazm',
      count: "120+ e'lon",
      img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80',
      delay: '0.6s',
    },
    {
      id: 8,
      name: 'Navoiy',
      enumValue: 'Navoiy',
      count: "90+ e'lon",
      img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
      delay: '0.7s',
    },
    {
      id: 9,
      name: 'Qashqadaryo',
      enumValue: 'Qashqadaryo',
      count: "110+ e'lon",
      img: 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=800&q=80',
      delay: '0.8s',
    },
    {
      id: 10,
      name: 'Surxondaryo',
      enumValue: 'Surxondaryo',
      count: "85+ e'lon",
      img: 'https://images.unsplash.com/photo-1560185016-3398910ebc25?auto=format&fit=crop&w=800&q=80',
      delay: '0.9s',
    },
    {
      id: 11,
      name: 'Jizzax',
      enumValue: 'Jizzax',
      count: "70+ e'lon",
      img: 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=800&q=80',
      delay: '1.0s',
    },
    {
      id: 12,
      name: 'Sirdaryo',
      enumValue: 'Sirdaryo',
      count: "60+ e'lon",
      img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      delay: '1.1s',
    },
    {
      id: 13,
      name: "Qoraqalpog'iston",
      enumValue: 'Qoraqalpogiston',
      count: "95+ e'lon",
      img: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80',
      delay: '1.2s',
    },
  ];

  onRegionImgError(e: any) {
    e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
  }

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Bosh Sahifa',
      description: "Mulkchi - O'zbekistondagi eng innovatsion ko'chmas mulk platformasi. Uy sotib olish, ijaraga olish yoki sotish uchun eng yaxshi tanlov.",
      keywords: "ko'chmas mulk, uy sotib olish, kvartira ijara, toshkent uylari, hovli, mulkchi",
    });
    this.seoService.setIndexable(true);

    this.voiceService.textResult$.subscribe((text) => {
      this.searchQuery = text;
      this.onSearch();
    });
    this.loadFeaturedProperties();
    this.loadNearbyProperties(false);
    this.animateCounters();
    
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.length < 2) {
        this.locationSuggestions.set([]);
        return;
      }
      this.propertyService.autocompleteLocations(query).subscribe((res) => {
        this.locationSuggestions.set(res);
      });
    });
  }

  loadNearbyProperties(forceUpdate: boolean = false) {
    this.loadingNearby.set(true);
    
    const fallbackLocation = { latitude: 41.2995, longitude: 69.2401 }; // Tashkent markazi

    const fetchProperties = (lat: number, lng: number, isFallback: boolean = false) => {
      this.propertyService.searchProperties({ latitude: lat, longitude: lng, radiusKm: 50, pageSize: 4 }).subscribe({
        next: (res: any) => {
          this.nearbyProperties.set(res.items || []);
          this.nearbyTitle.set(isFallback ? 'Tavsiya etilgan mulklar' : 'Sizga yaqin mulklar');
          this.loadingNearby.set(false);
        },
        error: () => {
          this.loadingNearby.set(false);
        }
      });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchProperties(position.coords.latitude, position.coords.longitude, false);
        },
        (error) => {
          console.warn("Geolocation denied or error. Using fallback location.", error);
          if (forceUpdate) {
            this.snackBar.open("Joylashuvni aniqlab bo'lmadi. Ommabop mulklar ko'rsatilmoqda", "Yopish", {duration: 3000});
          }
          // Agar joylashuv berilmasa, tavsiya etilganlarni yuklaymiz (isFallback = true)
          fetchProperties(fallbackLocation.latitude, fallbackLocation.longitude, true);
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    } else {
      fetchProperties(fallbackLocation.latitude, fallbackLocation.longitude, true);
    }
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    this.searchSubject.next(query);
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
      error: () => (this.loading = false),
    });
  }

  searchByRegion(region: string) {
    this.router.navigate(['/properties'], {
      queryParams: { region },
    });
  }

  onSearch() {
    const query = this.searchQuery.trim();
    const isMultiWord = query.split(' ').length > 1;
    
    if (isMultiWord) {
      this.router.navigate(['/properties'], {
        queryParams: { search: query, listingType: this.listingType, ai_search: 'true' },
      });
    } else {
      this.router.navigate(['/properties'], {
        queryParams: { search: query, listingType: this.listingType },
      });
    }
  }

  onSmartSearch() {
    const q = this.searchQuery.trim();
    if (!q) {
      this.snackBar.open("Iltimos, AI ga nimani izlayotganingizni yozing (Masalan: Chilonzorda 3 xonali uy)", "Yopish", { duration: 5000 });
      return;
    }
    this.router.navigate(['/properties'], {
      queryParams: { search: q, ai_search: 'true' },
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
    this.dialog
      .open(LocationPickerMapComponent, {
        width: '90%',
        maxWidth: '600px',
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.router.navigate(['/properties'], {
            queryParams: {
              lat: res.coordinates.latitude,
              lng: res.coordinates.longitude,
              listingType: this.listingType,
            },
          });
        }
      });
  }

  onFreeListingClick() {
    this.router.navigate([
      this.authService.isAuthenticated() ? '/elon-berish/tur' : '/auth/register',
    ]);
  }

  getListingTypeLabel(type: any) {
    if (type === 'Sale') return 'Sotuv';
    if (type === 'Rent') return 'Ijara';
    return 'Kunlik';
  }

  getFullImageUrl(url: string | undefined): string {
    if (!url) return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
    return this.imageOptimizationService.getOptimizedImage(url, 600, 400);
  }

  getImageUrl(p: any) {
    const rawUrl = p.images?.[0]?.url || p.images?.[0]?.thumbnailUrl;
    return this.getFullImageUrl(rawUrl);
  }

  onImgError(e: any) {
    e.target.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
  }

  getRelativeTime(dateString: any): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Hozirgina';
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    if (diffDays === 1) return 'Kecha';
    if (diffDays < 7) return `${diffDays} kun oldin`;
    
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  navigateToProperty(id: string) {
    this.router.navigate(['/properties', id]);
  }
}

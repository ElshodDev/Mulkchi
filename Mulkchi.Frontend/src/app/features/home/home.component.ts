import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { PropertyService } from '../../core/services/property.service';
import { AuthService } from '../../core/services/auth.service';
import { ListingType, UserRole } from '../../core/models';

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
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <mat-icon>verified</mat-icon>
            <span>O'zbekistondagi eng ishonchli platforma</span>
          </div>
          
          <h1 class="hero-title">
            Ko'chmas mulkning
            <span class="text-gold">yangi davri</span>
          </h1>
          
          <p class="hero-subtitle">
            Sotish, sotib olish, ijara va kunlik boshqaruv — barchasi bir platformada
          </p>

          <!-- Listing Type Toggle -->
          <div class="listing-type-toggle">
            <button 
              [class.active]="listingType === 'Sale'" 
              (click)="listingType = 'Sale'"
              class="toggle-btn">
              <mat-icon>home</mat-icon>
              Sotib olish
            </button>
            <button 
              [class.active]="listingType === 'Rent'" 
              (click)="listingType = 'Rent'"
              class="toggle-btn">
              <mat-icon>calendar_month</mat-icon>
              Ijaraga
            </button>
            <button 
              [class.active]="listingType === 'ShortTermRent'" 
              (click)="listingType = 'ShortTermRent'"
              class="toggle-btn">
              <mat-icon>hotel</mat-icon>
              Kunlik
            </button>
          </div>

          <!-- Search Bar -->
          <div class="search-bar">
            <div class="search-input-wrapper">
              <mat-icon class="search-icon">location_on</mat-icon>
              <input 
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Shahar, tuman yoki ko'cha nomi..."
                (keyup.enter)="onSearch()"
                class="search-input">
            </div>
            <button mat-raised-button class="search-btn" (click)="onSearch()">
              <mat-icon>search</mat-icon>
              Qidirish
            </button>
          </div>

          <!-- Quick Stats -->
          <div class="hero-stats">
            <div class="hero-stat">
              <span class="stat-number">20K+</span>
              <span class="stat-label">E'lonlar</span>
            </div>
            <mat-divider vertical class="stat-divider"></mat-divider>
            <div class="hero-stat">
              <span class="stat-number">14</span>
              <span class="stat-label">Viloyat</span>
            </div>
            <mat-divider vertical class="stat-divider"></mat-divider>
            <div class="hero-stat">
              <span class="stat-number">50K+</span>
              <span class="stat-label">Mijozlar</span>
            </div>
          </div>
        </div>

        <!-- Scroll indicator -->
        <div class="scroll-indicator">
          <mat-icon>keyboard_arrow_down</mat-icon>
        </div>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works">
        <div class="container">
          <div class="section-header">
            <span class="section-badge">Oddiy jarayon</span>
            <h2 class="section-title">Qanday ishlaydi?</h2>
            <p class="section-subtitle">3 oddiy qadamda orzuyingizdagi uyni toping</p>
          </div>

          <div class="steps-grid">
            <!-- Step 1 -->
            <div class="step-card">
              <div class="step-number">01</div>
              <div class="step-icon-wrapper">
                <mat-icon class="step-icon">search</mat-icon>
              </div>
              <h3 class="step-title">Qidiring</h3>
              <p class="step-description">
                Hudud, narx va qulayliklar bo'yicha filtrlash orqali o'zingizga mos uyni toping
              </p>
              <div class="step-features">
                <span class="feature-tag">Xarita</span>
                <span class="feature-tag">Filtrlar</span>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="step-card">
              <div class="step-number">02</div>
              <div class="step-icon-wrapper">
                <mat-icon class="step-icon">chat</mat-icon>
              </div>
              <h3 class="step-title">Aloqa</h3>
              <p class="step-description">
                E'lon egasi bilan to'g'ridan-to'g'ri chat orqali suhbatlashing
              </p>
              <div class="step-features">
                <span class="feature-tag">Real-time</span>
                <span class="feature-tag">Xavfsiz</span>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="step-card">
              <div class="step-number">03</div>
              <div class="step-icon-wrapper">
                <mat-icon class="step-icon">handshake</mat-icon>
              </div>
              <h3 class="step-title">Bitim</h3>
              <p class="step-description">
                Xavfsiz to'lov orqali shartnoma tuzing va yangi uyingizga ko'chib o'ting
              </p>
              <div class="step-features">
                <span class="feature-tag">Payme</span>
                <span class="feature-tag">Click</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Properties Section -->
      <section class="featured-section">
        <div class="container">
          <div class="section-header">
            <span class="section-badge">Tanlangan</span>
            <h2 class="section-title">Tavsiya etilgan mulklar</h2>
            <p class="section-subtitle">Eng mashhur va sifatli e'lonlar</p>
          </div>
          
          @if (loading()) {
            <div class="skeleton-grid">
              @for (item of [1,2,3]; track item) {
                <div class="skeleton-card">
                  <div class="skeleton-image"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (error()) {
            <div class="error-message">
              <mat-icon class="error-icon">error_outline</mat-icon>
              <p>{{ error() }}</p>
              <button mat-stroked-button (click)="loadFeaturedProperties()">
                <mat-icon>refresh</mat-icon>
                Qayta yuklash
              </button>
            </div>
          } @else if (featuredProperties().length === 0) {
            <div class="empty-state">
              <mat-icon class="empty-icon">home_work</mat-icon>
              <h3>Hozircha e'lonlar yo'q</h3>
              <p>Birinchi bo'lib e'lon joylashtiring</p>
              <button mat-raised-button color="primary" routerLink="/host/dashboard">
                E'lon berish
              </button>
            </div>
          } @else {
            <div class="properties-grid">
              @for (property of featuredProperties(); track property.id) {
                <mat-card class="property-card" (click)="navigateToProperty(property.id)">
                  <div class="property-image-wrapper">
                    @if (property.images && property.images.length > 0) {
                      <img [src]="getImageUrl(property)" 
                           [attr.data-property-type]="property.type"
                           [alt]="property.title" 
                           (error)="onImgError($event)"
                           class="property-image">
                    } @else {
                      <img [src]="getPlaceholderImage(property)" 
                           [alt]="property.title"
                           class="property-image">
                    }
                    
                    <!-- Badges -->
                    <div class="property-badges">
                      @if (property.isFeatured) {
                        <span class="badge featured">
                          <mat-icon>star</mat-icon>
                          Featured
                        </span>
                      }
                      @if (property.isInstantBook) {
                        <span class="badge instant">
                          <mat-icon>bolt</mat-icon>
                          Tezkor
                        </span>
                      }
                    </div>

                    <!-- Listing Type Badge -->
                    <div class="listing-badge" [class]="property.listingType.toLowerCase()">
                      {{ getListingTypeLabel(property.listingType) }}
                    </div>
                  </div>
                  
                  <mat-card-content class="property-content">
                    <div class="property-header">
                      <h3 class="property-title">{{ property.title }}</h3>
                      @if (property.averageRating && property.averageRating > 0) {
                        <div class="property-rating">
                          <mat-icon class="star-icon">star</mat-icon>
                          <span>{{ property.averageRating | number:'1.1-1' }}</span>
                        </div>
                      }
                    </div>
                    
                    <p class="property-location">
                      <mat-icon>location_on</mat-icon>
                      {{ property.city }}{{ property.district ? ', ' + property.district : '' }}
                    </p>
                    
                    <div class="property-amenities">
                      @if (property.numberOfBedrooms) {
                        <span class="amenity">
                          <mat-icon>bed</mat-icon>
                          {{ property.numberOfBedrooms }}
                        </span>
                      }
                      @if (property.numberOfBathrooms) {
                        <span class="amenity">
                          <mat-icon>bathtub</mat-icon>
                          {{ property.numberOfBathrooms }}
                        </span>
                      }
                      @if (property.area) {
                        <span class="amenity">
                          <mat-icon>square_foot</mat-icon>
                          {{ property.area }} m²
                        </span>
                      }
                    </div>
                    
                    <div class="property-footer">
                      <div class="property-price">
                        @if (property.listingType === ListingType.Sale && property.salePrice) {
                          <span class="price">{{ property.salePrice | number }} {{ property.currency }}</span>
                        } @else if (property.listingType === ListingType.Rent && property.monthlyRent) {
                          <span class="price">{{ property.monthlyRent | number }} {{ property.currency }}</span>
                          <span class="period">/oy</span>
                        } @else if (property.listingType === ListingType.ShortTermRent && property.pricePerNight) {
                          <span class="price">{{ property.pricePerNight | number }} {{ property.currency }}</span>
                          <span class="period">/tun</span>
                        }
                      </div>
                      <button mat-icon-button class="favorite-btn">
                        <mat-icon>favorite_border</mat-icon>
                      </button>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
            
            <div class="view-all-wrapper">
              <button mat-raised-button class="view-all-btn" routerLink="/properties">
                Barcha mulklarni ko'rish
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          }
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats-section">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-wrapper navy">
                <mat-icon>home_work</mat-icon>
              </div>
              <h3 class="stat-number">20,000+</h3>
              <p class="stat-label">Faol e'lonlar</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon-wrapper gold">
                <mat-icon>location_city</mat-icon>
              </div>
              <h3 class="stat-number">14</h3>
              <p class="stat-label">Viloyat</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon-wrapper navy">
                <mat-icon>people</mat-icon>
              </div>
              <h3 class="stat-number">50,000+</h3>
              <p class="stat-label">Foydalanuvchilar</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon-wrapper gold">
                <mat-icon>handshake</mat-icon>
              </div>
              <h3 class="stat-number">5,000+</h3>
              <p class="stat-label">Muvaffaqiyatli bitimlar</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Why Choose Us Section -->
      <section class="why-section">
        <div class="container">
          <div class="section-header light">
            <span class="section-badge gold">Afzalliklar</span>
            <h2 class="section-title">Nima uchun Mulkchi?</h2>
            <p class="section-subtitle">Bizning platformamizning asosiy afzalliklari</p>
          </div>

          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon-wrapper navy">
                <mat-icon>psychology</mat-icon>
              </div>
              <h3 class="feature-title">AI Narx Bashorati</h3>
              <p class="feature-description">
                Sun'iy intellekt yordamida mulk narxi tahlil qilinadi va eng yaxshi takliflar tanlanadi
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon-wrapper gold">
                <mat-icon>security</mat-icon>
              </div>
              <h3 class="feature-title">Xavfsiz To'lov</h3>
              <p class="feature-description">
                Payme va Click orqali xavfsiz to'lov. Mablag'lar bron tasdiqlangunicha himoyalangan
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon-wrapper navy">
                <mat-icon>chat_bubble</mat-icon>
              </div>
              <h3 class="feature-title">Real-time Chat</h3>
              <p class="feature-description">
                E'lon egasi bilan to'g'ridan-to'g'ri chat orqali suhbatlashing
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon-wrapper gold">
                <mat-icon>verified_user</mat-icon>
              </div>
              <h3 class="feature-title">Tekshirilgan E'lonlar</h3>
              <p class="feature-description">
                Barcha e'lonlar moderator tomonidan tekshiriladi va tasdiqlanadi
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon-wrapper navy">
                <mat-icon>map</mat-icon>
              </div>
              <h3 class="feature-title">Xarita Integratsiyasi</h3>
              <p class="feature-description">
                Leaflet xarita orqali mulklar joylashuvini ko'rish imkoniyati
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon-wrapper gold">
                <mat-icon>support_agent</mat-icon>
              </div>
              <h3 class="feature-title">24/7 Qo'llab-quvvatlash</h3>
              <p class="feature-description">
                Mutaxassislarimiz har qanday savolingizga yordam berishga tayyor
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-content">
            <h2 class="cta-title">
              O'z uyingizni sotmoqchimisiz?
            </h2>
            <p class="cta-subtitle">
              Bepul e'lon joylashtiring va minglab mijozlarga yetib boring
            </p>
            <div class="cta-buttons">
              <button mat-flat-button
                 class="btn-primary"
                 (click)="onFreeListingClick()">
                <mat-icon>add_home</mat-icon>
                Bepul e'lon berish
              </button>
              <button mat-stroked-button class="btn-secondary" routerLink="/properties">
                <mat-icon>search</mat-icon>
                Uy qidirish
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <!-- Brand -->
            <div class="footer-brand">
              <div class="footer-logo">
                <mat-icon>home_work</mat-icon>
                <span>Mulkchi</span>
              </div>
              <p class="footer-description">
                O'zbekistondagi eng qulay va ishonchli ko'chmas mulk platformasi
              </p>
              <div class="footer-social">
                <a href="#" class="social-link">
                  <mat-icon>facebook</mat-icon>
                </a>
                <a href="#" class="social-link">
                  <mat-icon>telegram</mat-icon>
                </a>
                <a href="#" class="social-link">
                  <mat-icon>instagram</mat-icon>
                </a>
              </div>
            </div>

            <!-- Links -->
            <div class="footer-links">
              <h4 class="footer-title">Platforma</h4>
              <ul>
                <li><a routerLink="/properties">Ko'chmas mulk</a></li>
                <li><a routerLink="/host/dashboard">E'lon berish</a></li>
                <li><a routerLink="/auth/login">Kirish</a></li>
                <li><a routerLink="/auth/register">Ro'yxatdan o'tish</a></li>
              </ul>
            </div>

            <div class="footer-links">
              <h4 class="footer-title">Kompaniya</h4>
              <ul>
                <li><a href="#">Biz haqimizda</a></li>
                <li><a href="#">Aloqa</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Karyera</a></li>
              </ul>
            </div>

            <div class="footer-links">
              <h4 class="footer-title">Yordam</h4>
              <ul>
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Xavfsizlik</a></li>
                <li><a href="#">Shartlar</a></li>
                <li><a href="#">Maxfiylik</a></li>
              </ul>
            </div>
          </div>

          <mat-divider class="footer-divider"></mat-divider>

          <div class="footer-bottom">
            <p class="copyright">
              © 2026 Mulkchi. Barcha huquqlar himoyalangan.
            </p>
            <div class="footer-payments">
              <span>To'lov tizimlari:</span>
              <div class="payment-icons">
                <span class="payment-badge">Payme</span>
                <span class="payment-badge">Click</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    /* ===== CSS Variables ===== */
    :host {
      --color-navy: #1B3A6B;
      --color-navy-light: #2a4a7c;
      --color-navy-dark: #122a4d;
      --color-gold: #C9A84C;
      --color-gold-light: #d4b86a;
      --color-gold-dark: #a88a3d;
      --color-white: #ffffff;
      --color-gray-50: #f8fafc;
      --color-gray-100: #f1f5f9;
      --color-gray-200: #e2e8f0;
      --color-gray-300: #cbd5e1;
      --color-gray-400: #94a3b8;
      --color-gray-500: #64748b;
      --color-gray-600: #475569;
      --color-gray-700: #334155;
      --color-gray-800: #1e293b;
      --color-gray-900: #0f172a;
      --radius: 8px;
      --radius-lg: 12px;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
    }

    /* ===== Typography ===== */
    .text-gold {
      color: var(--color-gold);
    }

    .text-navy {
      color: var(--color-navy);
    }

    /* ===== Layout ===== */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* ===== Section Header ===== */
    .section-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .section-header.light {
      color: var(--color-white);
    }

    .section-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      background: rgba(27, 58, 107, 0.1);
      color: var(--color-navy);
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 20px;
      margin-bottom: 16px;
    }

    .section-badge.gold {
      background: rgba(201, 168, 76, 0.15);
      color: var(--color-gold);
    }

    .section-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--color-gray-900);
      margin: 0 0 12px 0;
    }

    .section-header.light .section-title {
      color: var(--color-white);
    }

    .section-subtitle {
      font-size: 1.125rem;
      color: var(--color-gray-500);
      margin: 0;
    }

    .section-header.light .section-subtitle {
      color: rgba(255, 255, 255, 0.7);
    }

    /* ===== Hero Section ===== */
    .hero {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-dark) 100%);
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80');
      background-size: cover;
      background-position: center;
      opacity: 0.15;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(27, 58, 107, 0.95) 0%, rgba(18, 42, 77, 0.9) 100%);
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 800px;
      padding: 0 24px;
      color: var(--color-white);
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      background: rgba(201, 168, 76, 0.15);
      border: 1px solid rgba(201, 168, 76, 0.3);
      border-radius: 30px;
      margin-bottom: 24px;
    }

    .hero-badge mat-icon {
      color: var(--color-gold);
      font-size: 18px;
    }

    .hero-badge span {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 20px 0;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      opacity: 0.85;
      margin: 0 0 40px 0;
    }

    /* Listing Type Toggle */
    .listing-type-toggle {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: var(--radius);
      color: var(--color-white);
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .toggle-btn.active {
      background: var(--color-gold);
      border-color: var(--color-gold);
      color: var(--color-navy);
    }

    .toggle-btn mat-icon {
      font-size: 20px;
    }

    /* Search Bar */
    .search-bar {
      display: flex;
      gap: 12px;
      max-width: 600px;
      margin: 0 auto 40px;
    }

    .search-input-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      background: var(--color-white);
      border-radius: var(--radius);
      padding: 0 20px;
    }

    .search-icon {
      color: var(--color-gray-400);
      margin-right: 12px;
    }

    .search-input {
      flex: 1;
      border: none;
      outline: none;
      padding: 16px 0;
      font-size: 1rem;
      color: var(--color-gray-800);
      background: transparent;
    }

    .search-input::placeholder {
      color: var(--color-gray-400);
    }

    .search-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      background: var(--color-gold);
      color: var(--color-navy);
      border: none;
      border-radius: var(--radius);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .search-btn:hover {
      background: var(--color-gold-light);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    /* Hero Stats */
    .hero-stats {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 32px;
    }

    .hero-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .hero-stat .stat-number {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-gold);
    }

    .hero-stat .stat-label {
      font-size: 0.875rem;
      opacity: 0.8;
    }

    .stat-divider {
      background: rgba(255, 255, 255, 0.2);
      height: 40px;
    }

    /* Scroll Indicator */
    .scroll-indicator {
      position: absolute;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%);
      animation: bounce 2s infinite;
    }

    .scroll-indicator mat-icon {
      color: var(--color-white);
      opacity: 0.6;
      font-size: 32px;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
      40% { transform: translateX(-50%) translateY(-10px); }
      60% { transform: translateX(-50%) translateY(-5px); }
    }

    /* ===== How It Works Section ===== */
    .how-it-works {
      padding: 100px 0;
      background: var(--color-gray-50);
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }

    .step-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      padding: 40px 32px;
      text-align: center;
      box-shadow: var(--shadow);
      position: relative;
      transition: all 0.3s ease;
    }

    .step-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow-xl);
    }

    .step-number {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      background: var(--color-gold);
      color: var(--color-navy);
      font-size: 1.25rem;
      font-weight: 700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step-icon-wrapper {
      width: 80px;
      height: 80px;
      background: rgba(27, 58, 107, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    .step-icon {
      font-size: 36px;
      color: var(--color-navy);
    }

    .step-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0 0 12px 0;
    }

    .step-description {
      font-size: 1rem;
      color: var(--color-gray-500);
      line-height: 1.6;
      margin: 0 0 20px 0;
    }

    .step-features {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .feature-tag {
      padding: 4px 12px;
      background: var(--color-gray-100);
      color: var(--color-gray-600);
      font-size: 0.8rem;
      border-radius: 20px;
    }

    /* ===== Featured Properties Section ===== */
    .featured-section {
      padding: 100px 0;
      background: var(--color-white);
    }

    /* Skeleton Loading */
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .skeleton-card {
      background: var(--color-gray-100);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .skeleton-image {
      height: 220px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      padding: 20px;
    }

    .skeleton-title {
      height: 24px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    .skeleton-line.short {
      width: 60%;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* Error & Empty States */
    .error-message,
    .empty-state {
      text-align: center;
      padding: 80px 20px;
    }

    .error-icon,
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--color-gray-300);
      margin-bottom: 16px;
    }

    .error-message p {
      color: var(--color-gray-500);
      margin-bottom: 20px;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      color: var(--color-gray-700);
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: var(--color-gray-500);
      margin: 0 0 24px 0;
    }

    /* Properties Grid */
    .properties-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 40px;
    }

    .property-card {
      cursor: pointer;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
      background: var(--color-white);
    }

    .property-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow-xl);
    }

    .property-image-wrapper {
      position: relative;
      height: 220px;
      overflow: hidden;
    }

    .property-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .property-card:hover .property-image {
      transform: scale(1.05);
    }

    .property-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .badge.featured {
      background: var(--color-gold);
      color: var(--color-navy);
    }

    .badge.instant {
      background: var(--color-navy);
      color: var(--color-white);
    }

    .badge mat-icon {
      font-size: 14px;
    }

    .listing-badge {
      position: absolute;
      bottom: 12px;
      right: 12px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .listing-badge.sale {
      background: rgba(27, 58, 107, 0.9);
      color: var(--color-white);
    }

    .listing-badge.rent {
      background: rgba(16, 185, 129, 0.9);
      color: var(--color-white);
    }

    .listing-badge.shorttermrent {
      background: rgba(59, 130, 246, 0.9);
      color: var(--color-white);
    }

    .property-content {
      padding: 20px;
    }

    .property-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .property-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0;
      flex: 1;
      line-height: 1.4;
    }

    .property-rating {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #f59e0b;
    }

    .star-icon {
      font-size: 18px;
    }

    .property-location {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-gray-500);
      font-size: 0.9rem;
      margin-bottom: 12px;
    }

    .property-location mat-icon {
      font-size: 18px;
      color: var(--color-gray-400);
    }

    .property-amenities {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .amenity {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--color-gray-600);
      font-size: 0.875rem;
    }

    .amenity mat-icon {
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

    .property-price {
      display: flex;
      align-items: baseline;
    }

    .property-price .price {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-navy);
    }

    .property-price .period {
      font-size: 0.875rem;
      color: var(--color-gray-500);
      margin-left: 4px;
    }

    .favorite-btn {
      color: var(--color-gray-400);
    }

    .view-all-wrapper {
      text-align: center;
    }

    .view-all-btn {
      padding: 14px 32px;
      background: var(--color-navy);
      color: var(--color-white);
      font-size: 1rem;
      font-weight: 500;
      border-radius: var(--radius);
    }

    .view-all-btn:hover {
      background: var(--color-navy-light);
    }

    /* ===== Stats Section ===== */
    .stats-section {
      padding: 80px 0;
      background: var(--color-gray-100);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }

    .stat-card {
      background: var(--color-white);
      border-radius: var(--radius-lg);
      padding: 32px 24px;
      text-align: center;
      box-shadow: var(--shadow);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .stat-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .stat-icon-wrapper.navy {
      background: rgba(27, 58, 107, 0.1);
      color: var(--color-navy);
    }

    .stat-icon-wrapper.gold {
      background: rgba(201, 168, 76, 0.15);
      color: var(--color-gold);
    }

    .stat-icon-wrapper mat-icon {
      font-size: 32px;
    }

    .stat-card .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-gray-900);
      margin: 0 0 4px 0;
    }

    .stat-card .stat-label {
      font-size: 0.95rem;
      color: var(--color-gray-500);
      margin: 0;
    }

    /* ===== Why Choose Us Section ===== */
    .why-section {
      padding: 100px 0;
      background: linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-dark) 100%);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-lg);
      padding: 32px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-4px);
    }

    .feature-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .feature-icon-wrapper.navy {
      background: rgba(255, 255, 255, 0.1);
      color: var(--color-white);
    }

    .feature-icon-wrapper.gold {
      background: rgba(201, 168, 76, 0.2);
      color: var(--color-gold);
    }

    .feature-icon-wrapper mat-icon {
      font-size: 32px;
    }

    .feature-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-white);
      margin: 0 0 12px 0;
    }

    .feature-description {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      margin: 0;
    }

    /* ===== CTA Section ===== */
    .cta-section {
      padding: 80px 0;
      background: var(--color-gray-50);
    }

    .cta-content {
      text-align: center;
      max-width: 600px;
      margin: 0 auto;
    }

    .cta-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--color-gray-900);
      margin: 0 0 16px 0;
    }

    .cta-subtitle {
      font-size: 1.125rem;
      color: var(--color-gray-500);
      margin: 0 0 32px 0;
    }

    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      background: var(--color-gold);
      color: var(--color-navy);
      font-size: 1rem;
      font-weight: 600;
      border-radius: var(--radius);
      transition: all 0.3s ease;
    }

    .btn-primary:hover {
      background: var(--color-gold-light);
      transform: translateY(-2px);
    }

    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 32px;
      border: 2px solid var(--color-navy);
      color: var(--color-navy);
      font-size: 1rem;
      font-weight: 600;
      border-radius: var(--radius);
      transition: all 0.3s ease;
    }

    .btn-secondary:hover {
      background: var(--color-navy);
      color: var(--color-white);
    }

    /* ===== Footer ===== */
    .footer {
      background: var(--color-gray-900);
      color: var(--color-white);
      padding: 64px 0 24px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 48px;
      margin-bottom: 48px;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .footer-logo mat-icon {
      font-size: 32px;
      color: var(--color-gold);
    }

    .footer-logo span {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .footer-description {
      color: var(--color-gray-400);
      line-height: 1.6;
      margin: 0 0 24px 0;
    }

    .footer-social {
      display: flex;
      gap: 12px;
    }

    .social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      color: var(--color-white);
      transition: all 0.3s ease;
    }

    .social-link:hover {
      background: var(--color-gold);
      color: var(--color-navy);
    }

    .footer-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .footer-links ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links li {
      margin-bottom: 10px;
    }

    .footer-links a {
      color: var(--color-gray-400);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .footer-links a:hover {
      color: var(--color-gold);
    }

    .footer-divider {
      background: rgba(255, 255, 255, 0.1);
      margin-bottom: 24px;
    }

    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .copyright {
      color: var(--color-gray-500);
      margin: 0;
    }

    .footer-payments {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--color-gray-500);
    }

    .payment-icons {
      display: flex;
      gap: 8px;
    }

    .payment-badge {
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      font-size: 0.875rem;
    }

    /* ===== Responsive Design ===== */
    @media (max-width: 1024px) {
      .steps-grid,
      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .properties-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .footer-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2rem;
      }

      .section-title {
        font-size: 1.75rem;
      }

      .listing-type-toggle {
        flex-direction: column;
        align-items: center;
      }

      .toggle-btn {
        width: 100%;
        max-width: 280px;
        justify-content: center;
      }

      .search-bar {
        flex-direction: column;
      }

      .search-btn {
        width: 100%;
        justify-content: center;
      }

      .hero-stats {
        flex-direction: column;
        gap: 16px;
      }

      .stat-divider {
        display: none;
      }

      .steps-grid,
      .features-grid,
      .stats-grid,
      .properties-grid,
      .skeleton-grid {
        grid-template-columns: 1fr;
      }

      .footer-grid {
        grid-template-columns: 1fr;
        gap: 32px;
      }

      .footer-bottom {
        flex-direction: column;
        text-align: center;
      }

      .cta-title {
        font-size: 1.75rem;
      }

      .cta-buttons {
        flex-direction: column;
        align-items: center;
      }

      .btn-primary,
      .btn-secondary {
        width: 100%;
        max-width: 280px;
        justify-content: center;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private propertyService: PropertyService,
    private reviewService: ReviewService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  onFreeListingClick(): void {
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/host/properties/create']);
    } else {
      this.router.navigate(['/auth/register']);
    }
  }

  private propertyService = inject(PropertyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  featuredProperties = this.propertyService.featuredProperties;
  loading = this.propertyService.loading;
  error = signal<string | null>(null);
  ListingType = ListingType;

  searchQuery = '';
  listingType: 'Sale' | 'Rent' | 'ShortTermRent' = 'Rent';

  ngOnInit(): void {
    this.loadFeaturedProperties();
    this.checkModeSwitchRequired();
  }

  private checkModeSwitchRequired(): void {
    const modeSwitchRequired = this.route.snapshot.queryParams['modeSwitchRequired'];
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    
    if (modeSwitchRequired) {
      // Show snackbar with action to switch to Host mode
      const snackBarRef = this.snackBar.open(
        'E\'lon joylash uchun Host rejimga o\'tishingiz kerak',
        'Host rejimga o\'tish',
        { duration: 10000, horizontalPosition: 'center', verticalPosition: 'bottom' }
      );
      
      snackBarRef.onAction().subscribe(() => {
        // Switch to Host mode and navigate to the original URL
        this.authService.switchMode({ targetMode: UserRole.Host }).subscribe({
          next: () => {
            const targetUrl = returnUrl || '/host/dashboard';
            this.router.navigate([targetUrl]);
          },
          error: () => {
            this.snackBar.open('Rejim almashtirishda xatolik yuz berdi', 'Yopish', { duration: 3000 });
          }
        });
      });
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/properties'], {
        queryParams: { search: this.searchQuery.trim(), listingType: this.listingType }
      });
    } else {
      this.router.navigate(['/properties'], {
        queryParams: { listingType: this.listingType }
      });
    }
  }

  loadFeaturedProperties(): void {
    this.error.set(null);
    
    this.propertyService.getFeaturedProperties(6).subscribe({
      error: () => {
        this.error.set('Mulklarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      }
    });
  }

  getListingTypeLabel(type: ListingType | undefined): string {
    switch (type) {
      case ListingType.Sale:
        return 'Sotuv';
      case ListingType.Rent:
        return 'Ijara';
      case ListingType.ShortTermRent:
        return 'Kunlik';
      default:
        return '';
    }
  }

  // Get image URL from property (handles multiple image formats)
  getImageUrl(property: any): string {
    if (property.images?.length > 0) {
      return property.images[0].url || property.images[0].imageUrl || '';
    }
    if (property.imageUrl) return property.imageUrl;
    if (property.thumbnailUrl) return property.thumbnailUrl;
    return this.getPlaceholderImage(property);
  }

  // Handle image load error
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const propertyType = img.getAttribute('data-property-type') || 'Apartment';
    img.src = this.getPlaceholderImage({ type: propertyType });
  }

  // Get placeholder image based on property type
  getPlaceholderImage(property: any): string {
    const type = property.type || 'Apartment';
    const colors: Record<string, string> = {
      'Apartment': '1B3A6B/C9A84C',
      'House': '1B3A6B/ffffff',
      'Villa': 'C9A84C/1B3A6B',
      'Office': '2a4a7c/ffffff'
    };
    const color = colors[type] || '1B3A6B/C9A84C';
    return `https://placehold.co/400x220/${color}?text=${encodeURIComponent(type)}`;
  }

  navigateToProperty(id: string): void {
    this.router.navigate(['/properties', id]);
  }
}

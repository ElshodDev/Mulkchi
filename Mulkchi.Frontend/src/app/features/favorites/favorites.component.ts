import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="favorites-container">
      <div class="container">
        <div class="page-header">
          <h1>Sevimlilar</h1>
          <p>Saqlangan mulklaringiz</p>
        </div>

        @if (loading()) {
          <div class="loading-container">
            <mat-progress-spinner diameter="50"></mat-progress-spinner>
            <p>Yuklanmoqda...</p>
          </div>
        } @else if (favorites().length === 0) {
          <div class="empty-container">
            <mat-icon class="empty-icon">favorite_border</mat-icon>
            <h3>Hali sevimli yo'q</h3>
            <p>
              Siz hali hech qanday mulkni sevimlilarga qo'shmagansiz. Mulk qidiring va yoqqanlarini
              saqlang!
            </p>
            <button mat-raised-button color="primary" routerLink="/properties">
              <mat-icon>search</mat-icon>
              Mulk qidirish
            </button>
          </div>
        } @else {
          <div class="favorites-grid">
            @for (favoriteItem of favorites(); track favoriteItem.favorite.id) {
              <mat-card
                class="property-card"
                (click)="navigateToProperty(favoriteItem.property.id)"
              >
                <div class="property-image">
                  @if (favoriteItem.property.images && favoriteItem.property.images.length > 0) {
                    <img
                      [src]="getFullImageUrl(favoriteItem.property)"
                      [alt]="favoriteItem.property.title"
                      (error)="onImgError($event)"
                    />
                  } @else {
                    <div class="no-image">
                      <mat-icon>image_not_supported</mat-icon>
                    </div>
                  }
                  <button
                    mat-icon-button
                    class="favorite-btn active"
                    (click)="removeFavorite(favoriteItem.favorite.id); $event.stopPropagation()"
                    matTooltip="Sevimlilardan olib tashlash"
                  >
                    <mat-icon>favorite</mat-icon>
                  </button>
                </div>

                <mat-card-content>
                  <div class="property-header">
                    <h3 [routerLink]="['/properties', favoriteItem.property.id]">
                      {{ favoriteItem.property.title }}
                    </h3>
                    <div class="rating" *ngIf="favoriteItem.property.averageRating > 0">
                      <mat-icon>star</mat-icon>
                      <span>{{ favoriteItem.property.averageRating | number: '1.1-1' }}</span>
                    </div>
                  </div>

                  <p class="location">
                    <mat-icon>location_on</mat-icon>
                    {{ favoriteItem.property.city }}, {{ favoriteItem.property.district }}
                  </p>

                  <div class="property-details">
                    <span>
                      <mat-icon>bed</mat-icon>
                      {{ favoriteItem.property.numberOfBedrooms }} xona
                    </span>
                    <span>
                      <mat-icon>square_foot</mat-icon>
                      {{ favoriteItem.property.area }} m²
                    </span>
                  </div>

                  <div class="price-section">
                    <span class="price"
                      >{{
                        favoriteItem.property.salePrice ||
                          favoriteItem.property.monthlyRent ||
                          favoriteItem.property.pricePerNight | number
                      }}
                      {{ favoriteItem.property.currency }}</span
                    >
                    <span class="type">{{
                      getListingTypeLabel(favoriteItem.property.listingType)
                    }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .favorites-container {
        min-height: calc(100vh - 64px);
        background: #f5f5f5;
        padding: 40px 0;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }

      .page-header {
        margin-bottom: 32px;
      }

      .page-header h1 {
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 8px;
        color: #1a1a2e;
      }

      .page-header p {
        color: #444444;
      }

      .loading-container,
      .empty-container {
        text-align: center;
        padding: 60px 20px;
      }

      .empty-container .empty-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #cbd5e1;
        margin-bottom: 24px;
      }

      .empty-container h3 {
        color: #333;
        margin-bottom: 8px;
      }

      .empty-container p {
        color: #666;
        margin-bottom: 24px;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
      }

      .favorites-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 24px;
      }

      .property-card {
        overflow: hidden;
        cursor: pointer;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .property-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
      }

      .property-card:active {
        transform: translateY(0);
      }

      .property-image {
        position: relative;
        height: 200px;
        cursor: pointer;
      }

      .property-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e0e0e0;
      }

      .no-image mat-icon {
        font-size: 48px;
        color: #999;
      }

      .favorite-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: white !important;
        color: #f44336 !important;
      }

      .property-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
      }

      .property-header h3 {
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
        cursor: pointer;
      }

      .rating {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #ffa500;
      }

      .location {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #666;
        font-size: 0.9rem;
        margin-bottom: 12px;
      }

      .property-details {
        display: flex;
        gap: 16px;
        margin-bottom: 12px;
      }

      .property-details span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.85rem;
        color: #666;
      }

      .price-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        border-top: 1px solid #eee;
      }

      .price {
        font-size: 1.25rem;
        font-weight: 700;
        color: #667eea;
      }

      .type {
        font-size: 0.8rem;
        color: #666;
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
      }

      @media (max-width: 768px) {
        .favorites-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class FavoritesComponent implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly favoritesService = inject(FavoritesService);

  favorites = this.favoritesService.favoriteItems;
  loading = this.favoritesService.loading;

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.favoritesService.loadFavorites().subscribe({
      error: () => undefined,
    });
  }

  removeFavorite(favoriteId: string): void {
    this.favoritesService.removeFavoriteById(favoriteId).subscribe({
      next: () => {
        this.snackBar.open('Sevimlilardan olib tashlandi', 'Yopish', {
          duration: 3000,
          panelClass: 'success-snackbar',
        });
      },
      error: () => {
        this.snackBar.open('Sevimlilardan olib tashlab bo‘lmadi', 'Yopish', {
          duration: 3000,
          panelClass: 'error-snackbar',
        });
      },
    });
  }

  getListingTypeLabel(type: string): string {
    switch (type) {
      case 'Sale':
        return 'Sotuv';
      case 'Rent':
        return 'Ijaraga';
      case 'ShortTermRent':
        return 'Qisqa muddatli';
      default:
        return type;
    }
  }

  getFullImageUrl(property: unknown): string {
    const prop = property as {
      images?: { isPrimary?: boolean; thumbnailUrl?: string; url?: string; imageUrl?: string }[];
      thumbnailUrl?: string;
      imageUrl?: string;
    };

    let path = '';

    if (prop.images && Array.isArray(prop.images) && prop.images.length > 0) {
      const primaryImage = prop.images.find((img) => img.isPrimary) || prop.images[0];
      path = primaryImage.thumbnailUrl || primaryImage.url || primaryImage.imageUrl || '';
    } else if (prop.thumbnailUrl) {
      path = prop.thumbnailUrl;
    } else if (prop.imageUrl) {
      path = prop.imageUrl;
    }

    if (!path) return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';

    path = path.replace(/\\/g, '/');
    if (path.startsWith('/')) path = path.substring(1);

    if (path.startsWith('http')) return path;
    return environment.apiUrl.replace('/api', '') + '/' + path;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
  }

  navigateToProperty(id: string): void {
    this.router.navigate(['/properties', id]);
  }
}

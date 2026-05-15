import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ComparisonService } from '../../services/comparison.service';
import { AuthStore } from '../../stores/auth.store';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatBadgeModule,
    NavbarComponent,
  ],
  template: `
    <div class="layout-shell">
      <app-navbar />

      <main id="main-content" class="layout-main">
        <router-outlet />
      </main>

      <nav class="mobile-dock" aria-label="Mobil navigatsiya">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          <mat-icon>home</mat-icon>
          <span>Bosh sahifa</span>
        </a>
        <a routerLink="/properties" routerLinkActive="active">
          <mat-icon>search</mat-icon>
          <span>Mulklar</span>
        </a>
        <a routerLink="/ai-tools" routerLinkActive="active">
          <mat-icon>psychology</mat-icon>
          <span>AI</span>
        </a>
        <a routerLink="/compare" routerLinkActive="active">
          <mat-icon
            [matBadge]="comparisonService.count() || null"
            [matBadgeHidden]="comparisonService.isEmpty()"
            matBadgeColor="accent"
            matBadgeSize="small"
            aria-hidden="false"
          >
            compare_arrows
          </mat-icon>
          <span>Taqqosla</span>
        </a>
        @if (authStore.isLoggedIn()) {
          <a routerLink="/profile" routerLinkActive="active">
            <mat-icon>person</mat-icon>
            <span>Profil</span>
          </a>
        } @else {
          <a routerLink="/auth/login" routerLinkActive="active">
            <mat-icon>login</mat-icon>
            <span>Kirish</span>
          </a>
        }
      </nav>
    </div>
  `,
  styles: [
    `
      .layout-shell {
        min-height: 100dvh;
      }

      .layout-main {
        min-height: 100dvh;
        padding-top: 5.5rem;
        padding-bottom: 6rem;
      }

      .mobile-dock {
        position: fixed;
        inset: auto 0 0;
        z-index: calc(var(--z-navbar) - 1);
        display: none;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: var(--space-1);
        padding: var(--space-2);
        border-top: 1px solid var(--color-border-soft);
        background: color-mix(in srgb, var(--color-surface-elevated) 88%, transparent);
        backdrop-filter: blur(18px);
      }

      .mobile-dock a {
        display: grid;
        place-items: center;
        gap: 2px;
        min-height: 56px;
        padding: var(--space-2);
        border-radius: var(--radius-3);
        color: var(--color-text-muted);
        font-size: var(--font-size-1);
        transition:
          color var(--transition-fast),
          background-color var(--transition-fast);
      }

      .mobile-dock a.active {
        background: rgba(15, 118, 110, 0.1);
        color: var(--color-brand-600);
      }

      .mobile-dock mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }

      @media (max-width: 768px) {
        .layout-main {
          padding-top: 5rem;
        }

        .mobile-dock {
          display: grid;
        }
      }

      @media (min-width: 769px) {
        .layout-main {
          padding-bottom: 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly comparisonService = inject(ComparisonService);
}

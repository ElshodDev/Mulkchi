import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <section class="not-found-shell">
      <div class="not-found-card">
        <div class="map-pin">
          <mat-icon>map_search</mat-icon>
        </div>
        <span class="status">404</span>
        <h1>Qidirgan joyimiz topilmadi</h1>
        <p>
          Havola eskirgan bo‘lishi mumkin yoki sahifa boshqa manzilga ko‘chgan. Keling, asosiy
          yo‘lga qaytamiz.
        </p>

        <div class="actions">
          <a mat-flat-button routerLink="/">Bosh sahifaga qaytish</a>
          <a mat-stroked-button routerLink="/properties">Mulk qidirish</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .not-found-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: var(--space-8) var(--space-4);
        background:
          radial-gradient(circle at top, rgba(245, 158, 11, 0.12), transparent 30%),
          var(--color-surface-canvas);
      }

      .not-found-card {
        display: grid;
        justify-items: center;
        gap: var(--space-4);
        width: min(100%, 42rem);
        padding: clamp(var(--space-6), 5vw, var(--space-8));
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-4);
        background: var(--color-surface-elevated);
        box-shadow: var(--shadow-xl);
        text-align: center;
      }

      .map-pin {
        display: grid;
        place-items: center;
        inline-size: 5rem;
        aspect-ratio: 1;
        border-radius: 1.5rem;
        background: rgba(245, 158, 11, 0.14);
        color: var(--color-accent-600);
      }

      .map-pin mat-icon {
        font-size: 2rem;
        width: 2rem;
        height: 2rem;
      }

      .status {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.5rem;
        padding: 0 var(--space-4);
        border-radius: var(--radius-round);
        background: rgba(15, 118, 110, 0.08);
        color: var(--color-brand-600);
        font-weight: var(--font-weight-semibold);
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.25rem);
        line-height: var(--line-height-tight);
      }

      p {
        margin: 0;
        max-width: 34rem;
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--space-3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}

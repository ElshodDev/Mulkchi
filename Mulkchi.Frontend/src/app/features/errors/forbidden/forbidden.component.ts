import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <section class="error-shell">
      <div class="error-illustration">
        <div class="shield-orbit"></div>
        <div class="shield-core">
          <mat-icon>lock</mat-icon>
        </div>
      </div>

      <div class="error-copy">
        <span class="eyebrow">403</span>
        <h1>Bu sahifa siz uchun yopiq</h1>
        <p>
          Ruxsat yetarli emas. Avval mos rol bilan tizimga kirganingizni tekshirib ko‘raylik.
        </p>
      </div>

      <div class="error-actions">
        <a mat-flat-button routerLink="/">Bosh sahifa</a>
        <a mat-stroked-button routerLink="/auth/login">Qayta kirish</a>
      </div>
    </section>
  `,
  styles: [
    `
      .error-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        gap: var(--space-8);
        padding: var(--space-8);
        text-align: center;
        background:
          radial-gradient(circle at top, rgba(14, 116, 144, 0.16), transparent 38%),
          var(--color-surface-canvas);
      }

      .error-illustration {
        position: relative;
        display: grid;
        place-items: center;
        inline-size: clamp(12rem, 36vw, 18rem);
        aspect-ratio: 1;
      }

      .shield-orbit {
        position: absolute;
        inset: 0;
        border: 1px dashed rgba(14, 116, 144, 0.25);
        border-radius: var(--radius-round);
      }

      .shield-core {
        display: grid;
        place-items: center;
        inline-size: 8rem;
        aspect-ratio: 1;
        border-radius: 2rem;
        background: linear-gradient(180deg, var(--color-brand-500), var(--color-brand-700));
        box-shadow: var(--shadow-xl);
        color: white;
      }

      .shield-core mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
      }

      .eyebrow {
        display: inline-block;
        margin-bottom: var(--space-3);
        color: var(--color-brand-600);
        font-weight: var(--font-weight-semibold);
      }

      .error-copy h1 {
        margin: 0 0 var(--space-3);
        font-size: clamp(2rem, 4vw, 3.5rem);
      }

      .error-copy p {
        margin: 0 auto;
        max-width: 36rem;
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      }

      .error-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--space-3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {}

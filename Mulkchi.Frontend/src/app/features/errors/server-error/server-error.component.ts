import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <section class="error-shell">
      <div class="error-card">
        <div class="status-badge">
          <mat-icon>cloud_off</mat-icon>
          <span>500</span>
        </div>

        <h1>Bir oz uzilish bo‘ldi</h1>
        <p>
          Server tomonda kutilmagan xatolik yuz berdi. Sahifani yangilab ko‘ring yoki boshqa
          sahifaga o‘tib turing.
        </p>

        <div class="error-actions">
          <a mat-flat-button routerLink="/">Bosh sahifa</a>
          <a mat-stroked-button routerLink="/properties">Mulklarni ko‘rish</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .error-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: var(--space-8);
        background:
          linear-gradient(180deg, rgba(220, 38, 38, 0.08), transparent 28%),
          var(--color-surface-canvas);
      }

      .error-card {
        display: grid;
        gap: var(--space-5);
        width: min(100%, 42rem);
        padding: clamp(var(--space-6), 4vw, var(--space-8));
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-4);
        background: var(--color-surface-elevated);
        box-shadow: var(--shadow-xl);
        text-align: center;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        justify-self: center;
        padding: var(--space-2) var(--space-4);
        border-radius: var(--radius-round);
        background: rgba(220, 38, 38, 0.1);
        color: var(--color-danger-600);
        font-weight: var(--font-weight-semibold);
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3.25rem);
      }

      p {
        margin: 0;
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
export class ServerErrorComponent {}

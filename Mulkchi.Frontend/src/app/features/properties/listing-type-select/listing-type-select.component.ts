import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ListingType } from '../../../core/models';

interface ListingTypeOption {
  id: string;
  type: ListingType;
  emoji: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-listing-type-select',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="listing-type-container">
      <div class="container">
        <div class="page-header">
          <h1>Mulkingizni qanday ko'rinishda taklif qilmoqchisiz?</h1>
          <p>E'lon turini tanlang va mulkingizning tavsifini bering</p>
        </div>

        <div class="listing-types-grid">
          @for (option of listingTypes; track option.id) {
            <button class="listing-type-card" (click)="selectType(option.type)">
              <div class="card-emoji">{{ option.emoji }}</div>
              <h3>{{ option.title }}</h3>
              <p>{{ option.description }}</p>
              <div class="card-footer">
                <span class="cta">Davom etish</span>
                <mat-icon>arrow_forward</mat-icon>
              </div>
            </button>
          }
        </div>

        <div class="info-box">
          <mat-icon>info</mat-icon>
          <div>
            <strong>Maslahat:</strong>
            <p>
              Siz istalgan vaqtda e'lon turini o'zgartirishingiz mumkin. Barcha turlar uchun to'liq
              tasvir va rasmlar qo'shish tavsiya qilinadi.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .listing-type-container {
        min-height: calc(100dvh - 80px);
        padding: var(--space-8) var(--space-4);
        background: linear-gradient(
          135deg,
          var(--color-surface) 0%,
          color-mix(in srgb, var(--color-brand-500) 3%, var(--color-surface))
        );
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        text-align: center;
        margin-bottom: var(--space-8);
      }

      .page-header h1 {
        margin: 0 0 var(--space-2) 0;
        font-size: clamp(2rem, 5vw, 2.75rem);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .page-header p {
        margin: 0;
        font-size: var(--font-size-3);
        color: var(--color-text-secondary);
      }

      .listing-types-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: var(--space-6);
        margin-bottom: var(--space-8);
      }

      .listing-type-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--space-6);
        border: 2px solid var(--color-border-soft);
        border-radius: var(--radius-4);
        background: var(--color-surface-elevated);
        cursor: pointer;
        transition: all var(--transition-normal);
        font-family: inherit;
        color: inherit;
      }

      .listing-type-card:hover,
      .listing-type-card:focus-visible {
        border-color: var(--color-brand-500);
        background: color-mix(in srgb, var(--color-brand-500) 4%, var(--color-surface-elevated));
        box-shadow: 0 8px 24px rgba(15, 118, 110, 0.12);
        transform: translateY(-2px);
      }

      .card-emoji {
        font-size: 4rem;
        margin-bottom: var(--space-4);
        display: block;
      }

      .listing-type-card h3 {
        margin: 0 0 var(--space-2) 0;
        font-size: var(--font-size-5);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .listing-type-card p {
        margin: 0 0 var(--space-4) 0;
        font-size: var(--font-size-2);
        color: var(--color-text-secondary);
        flex-grow: 1;
      }

      .card-footer {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-brand-600);
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-size-2);
        margin-top: var(--space-4);
        padding-top: var(--space-4);
        border-top: 1px solid var(--color-border-soft);
        width: 100%;
      }

      .cta {
        flex-grow: 1;
        text-align: right;
      }

      .info-box {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-4) var(--space-6);
        border-radius: var(--radius-3);
        background: color-mix(in srgb, var(--color-brand-500) 6%, var(--color-surface-elevated));
        border: 1px solid color-mix(in srgb, var(--color-brand-500) 12%, transparent);
        color: var(--color-text-primary);
      }

      .info-box mat-icon {
        color: var(--color-brand-600);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .info-box strong {
        display: block;
        font-size: var(--font-size-3);
        margin-bottom: var(--space-1);
        color: var(--color-text-primary);
      }

      .info-box p {
        margin: 0;
        font-size: var(--font-size-2);
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      }

      @media (max-width: 768px) {
        .listing-type-container {
          padding: var(--space-6) var(--space-3);
        }

        .page-header {
          margin-bottom: var(--space-6);
        }

        .listing-types-grid {
          grid-template-columns: 1fr;
          gap: var(--space-4);
        }

        .card-emoji {
          font-size: 3rem;
        }

        .listing-type-card h3 {
          font-size: var(--font-size-4);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListingTypeSelectComponent {
  private readonly router = inject(Router);

  protected readonly listingTypes: ListingTypeOption[] = [
    {
      id: 'sotish',
      type: ListingType.Sale,
      emoji: '🏠',
      title: 'Sotish',
      description: "Mulkingizni sotish uchun e'lon bering",
    },
    {
      id: 'ijara',
      type: ListingType.Rent,
      emoji: '🔑',
      title: 'Uzoq muddatli ijara',
      description: "Oylik ijaraga berish uchun e'lon bering",
    },
    {
      id: 'kunlik',
      type: ListingType.ShortTermRent,
      emoji: '📅',
      title: 'Kunlik ijara',
      description: 'Kunlik yoki qisqa muddatli ijaraga berish',
    },
  ];

  selectType(type: ListingType): void {
    void this.router.navigate(['/elon-berish', type.toLowerCase()]);
  }
}

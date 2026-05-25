import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-property-list-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSelectModule],
  template: `
    <div class="premium-header-wrapper">
      <div class="stats-section">
        <div class="count-badge">
          <span class="count-number">{{ totalCount }}</span>
          <span class="count-label">ta mulk topildi</span>
        </div>
        <div class="active-filters-info" *ngIf="totalCount > 0">
          <mat-icon>verified</mat-icon>
          <span>Tasdiqlangan e'lonlar</span>
        </div>
      </div>

      <div class="controls-section">
        <!-- Segmented View Toggle -->
        <div class="segmented-control">
          <button
            class="segment-btn"
            [class.active]="currentView === 'grid'"
            (click)="viewChange.emit('grid')"
            matTooltip="Grid ko'rinishi"
          >
            <mat-icon>grid_view</mat-icon>
          </button>
          <button
            class="segment-btn"
            [class.active]="currentView === 'list'"
            (click)="viewChange.emit('list')"
            matTooltip="Ro'yxat ko'rinishi"
          >
            <mat-icon>view_list</mat-icon>
          </button>
          <button
            class="segment-btn"
            [class.active]="currentView === 'map'"
            (click)="viewChange.emit('map')"
            matTooltip="Xaritada ko'rish"
          >
            <mat-icon>map</mat-icon>
          </button>
          <div class="active-indicator" [class]="currentView"></div>
        </div>

        <div class="divider"></div>

        <!-- Premium Sort Select -->
        <div class="sort-wrapper">
          <mat-icon class="sort-icon">sort</mat-icon>
          <mat-select
            [value]="currentSort"
            (selectionChange)="sortChange.emit($event.value)"
            class="premium-select"
          >
            <mat-option value="newest">Yangi e'lonlar</mat-option>
            <mat-option value="price_asc">Arzonroq narxlar</mat-option>
            <mat-option value="price_desc">Yuqori narxlar</mat-option>
            <mat-option value="rating">Yuqori reyting</mat-option>
          </mat-select>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 32px;
        --navy: #0f172a;
        --gold: #c9a84c;
        --white: #ffffff;
        --gray-50: #f8fafc;
        --gray-200: #e2e8f0;
        --gray-500: #64748b;
      }

      .premium-header-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 32px 0 24px; /* Increased top padding for better breathing room */
        border-bottom: 1px solid var(--gray-200);
        margin-bottom: 24px;
      }

      /* Stats Section */
      .stats-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .count-badge {
        display: flex;
        align-items: baseline;
        gap: 8px;
      }

      .count-number {
        font-size: 1.75rem;
        font-weight: 900;
        color: var(--navy);
        line-height: 1;
      }

      .count-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--gray-500);
        text-transform: lowercase;
      }

      .active-filters-info {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        color: #10b981;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .active-filters-info mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      /* Controls Section */
      .controls-section {
        display: flex;
        align-items: center;
        gap: 20px;
      }

      /* Segmented Control */
      .segmented-control {
        position: relative;
        display: flex;
        background: var(--gray-50);
        padding: 4px;
        border-radius: 12px;
        border: 1px solid var(--gray-200);
      }

      .segment-btn {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 36px;
        background: transparent;
        border: none;
        color: var(--gray-500);
        cursor: pointer;
        transition: color 0.3s;
      }

      .segment-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .segment-btn.active {
        color: var(--navy);
      }

      .active-indicator {
        position: absolute;
        top: 4px;
        height: 36px;
        width: 44px;
        background: var(--white);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 1;
      }

      .active-indicator.grid {
        transform: translateX(0);
      }
      .active-indicator.list {
        transform: translateX(44px);
      }
      .active-indicator.map {
        transform: translateX(88px);
      }

      .divider {
        width: 1px;
        height: 24px;
        background: var(--gray-200);
      }

      /* Sort Wrapper */
      .sort-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--white);
        padding: 0 12px;
        border: 1px solid var(--gray-200);
        border-radius: 12px;
        height: 44px;
        transition: border-color 0.3s;
      }

      .sort-wrapper:hover {
        border-color: var(--gold);
      }

      .sort-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--gold);
      }

      .premium-select {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--navy);
        width: 150px;
      }

      @media (max-width: 768px) {
        .premium-header-wrapper {
          flex-direction: column;
          align-items: flex-start;
          gap: 20px;
        }
        .controls-section {
          width: 100%;
          justify-content: space-between;
        }
      }
    `,
  ],
})
export class PropertyListHeaderComponent {
  @Input() totalCount = 0;
  @Input() currentView = 'grid';
  @Input() currentSort = 'featured';

  @Output() viewChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
}

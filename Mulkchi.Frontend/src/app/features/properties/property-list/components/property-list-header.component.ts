import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-property-list-header',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="results-header">
      <div class="results-info">
        <h2 class="results-title">
          {{ totalCount }} ta mulk topildi
        </h2>
        <p class="results-count">
          <strong>{{ totalCount }}</strong> ta mulk
        </p>
      </div>
      <div class="view-toggle">
        <button 
          class="view-btn" 
          [class.active]="currentView === 'grid'"
          (click)="viewChange.emit('grid')"
          matTooltip="Grid ko'rinish">
          <mat-icon>grid_view</mat-icon>
        </button>
        <button 
          class="view-btn" 
          [class.active]="currentView === 'list'"
          (click)="viewChange.emit('list')"
          matTooltip="List ko'rinish">
          <mat-icon>list</mat-icon>
        </button>
        <button 
          class="view-btn" 
          [class.active]="currentView === 'map'"
          (click)="viewChange.emit('map')"
          matTooltip="Xarita ko'rinish">
          <mat-icon>map</mat-icon>
        </button>
      </div>
      <div class="sort-dropdown">
        <mat-select 
          [value]="currentSort" 
          (selectionChange)="sortChange.emit($event.value)"
          placeholder="Saralash">
          <mat-option value="featured">Tavsiya etilgan</mat-option>
          <mat-option value="newest">Eng yangi</mat-option>
          <mat-option value="price_asc">Narxi: Arzondan qimmatga</mat-option>
          <mat-option value="price_desc">Narxi: Qimmatdan arzonga</mat-option>
          <mat-option value="rating">Reyting</mat-option>
        </mat-select>
      </div>
    </div>
  `,
  styles: [`
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .results-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .results-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-gray-900);
      margin: 0;
    }

    .results-count {
      margin: 0;
      color: var(--color-gray-500);
      font-size: 0.9rem;
    }

    .results-count strong {
      color: var(--color-navy);
      font-weight: 600;
    }

    .view-toggle {
      display: flex;
      gap: 8px;
    }

    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: var(--color-gray-100);
      border: none;
      border-radius: var(--radius);
      color: var(--color-gray-500);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .view-btn:hover {
      background: var(--color-gray-200);
      color: var(--color-gray-700);
    }

    .view-btn.active {
      background: var(--color-navy);
      color: var(--color-white);
    }

    .sort-dropdown {
      min-width: 200px;
    }

    @media (max-width: 768px) {
      .results-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .view-toggle {
        width: 100%;
      }

      .sort-dropdown {
        width: 100%;
      }
    }
  `]
})
export class PropertyListHeaderComponent {
  @Input() totalCount: number = 0;
  @Input() currentView: string = 'grid';
  @Input() currentSort: string = 'featured';

  @Output() viewChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
}

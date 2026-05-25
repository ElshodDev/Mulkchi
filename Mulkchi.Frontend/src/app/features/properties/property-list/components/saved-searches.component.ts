import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface SavedSearch {
  id: string;
  name: string;
  query: Record<string, unknown>;
  icon: string;
  color: string;
  createdDate: Date;
  notificationCount?: number;
}

@Component({
  selector: 'app-saved-searches',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  template: `
    <div class="saved-searches" *ngIf="savedSearches().length > 0">
      <div class="searches-header">
        <h3>
          <mat-icon>bookmark</mat-icon>
          Saqlangan qidiruvlar
        </h3>
        <button mat-icon-button (click)="toggleExpanded()" [attr.aria-label]="'Toggle'">
          <mat-icon>{{ isExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
        </button>
      </div>

      <div class="searches-list" [class.expanded]="isExpanded()">
        <button
          *ngFor="let search of savedSearches()"
          mat-stroked-button
          class="search-chip"
          (click)="onSearchClick(search)"
          [matTooltip]="search.name"
        >
          <mat-icon>{{ search.icon }}</mat-icon>
          {{ search.name }}
          <span *ngIf="search.notificationCount" class="badge">{{ search.notificationCount }}</span>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .saved-searches {
        padding: 16px 0;
        border-bottom: 1px solid #e2e8f0;
      }

      .searches-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding: 0 12px;
      }

      .searches-header h3 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0;
      }

      .searches-header mat-icon {
        color: #c9a84c;
        font-size: 18px;
      }

      .searches-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 12px;
        max-height: 50px;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .searches-list.expanded {
        max-height: 500px;
      }

      .search-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        font-size: 0.85rem;
        border-radius: 20px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        position: relative;
        transition: all 0.2s ease;
      }

      .search-chip:hover {
        border-color: #c9a84c;
        background: #fef9f3;
        color: #1b3a6b;
      }

      .search-chip mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 4px;
        background: #ef4444;
        color: white;
        font-size: 0.7rem;
        font-weight: 600;
        border-radius: 9px;
        margin-left: 4px;
      }

      @media (max-width: 768px) {
        .searches-header {
          padding: 0 8px;
        }

        .searches-list {
          padding: 0 8px;
        }

        .search-chip {
          font-size: 0.8rem;
          padding: 4px 10px;
        }

        .search-chip mat-icon {
          font-size: 14px;
        }
      }
    `,
  ],
})
export class SavedSearchesComponent implements OnInit {
  @Output() searchSelected = new EventEmitter<SavedSearch>();
  @Output() searchDeleted = new EventEmitter<string>();

  savedSearches = signal<SavedSearch[]>([]);
  isExpanded = signal(false);

  ngOnInit(): void {
    this.loadSavedSearches();
  }

  private loadSavedSearches(): void {
    // Load from localStorage
    const stored = localStorage.getItem('mulkchi_saved_searches');
    if (stored) {
      try {
        this.savedSearches.set(JSON.parse(stored));
      } catch {
        console.warn('Failed to load saved searches');
      }
    }
  }

  onSearchClick(search: SavedSearch): void {
    this.searchSelected.emit(search);
  }

  editSearch(search: SavedSearch): void {
    // Trigger edit dialog/modal
  }

  deleteSearch(id: string): void {
    const updated = this.savedSearches().filter((s) => s.id !== id);
    this.savedSearches.set(updated);
    localStorage.setItem('mulkchi_saved_searches', JSON.stringify(updated));
    this.searchDeleted.emit(id);
  }

  toggleExpanded(): void {
    this.isExpanded.update((val) => !val);
  }

  addSearch(search: SavedSearch): void {
    const current = this.savedSearches();
    const existing = current.findIndex((s) => s.id === search.id);

    if (existing >= 0) {
      current[existing] = search;
    } else {
      current.push(search);
    }

    this.savedSearches.set([...current]);
    localStorage.setItem('mulkchi_saved_searches', JSON.stringify(current));
  }
}

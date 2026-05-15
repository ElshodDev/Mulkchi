import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-property-pagination',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatPaginatorModule],
  template: `
    <div class="pagination-container">
      <div class="pagination-info">
        <span>Sahifa {{ currentPage }} / {{ totalPages }}</span>
        <span>Jami: {{ pageSize }} ta/sahifa</span>
      </div>

      <div class="pagination-controls">
        <button
          mat-button
          [disabled]="currentPage === 1"
          (click)="onPreviousPage()"
          class="pagination-btn"
        >
          <mat-icon>chevron_left</mat-icon>
          Orqaga
        </button>

        <div class="page-numbers">
          <button
            *ngFor="let page of visiblePages"
            mat-button
            [class.active]="page === currentPage"
            [disabled]="page === currentPage"
            (click)="onPageChange(page)"
            class="page-number"
          >
            {{ page }}
          </button>
        </div>

        <button
          mat-button
          [disabled]="currentPage === totalPages"
          (click)="onNextPage()"
          class="pagination-btn"
        >
          Keyingi
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <div class="page-size-selector">
        <label for="pageSize">Sahifa o'lchami:</label>
        <select id="pageSize" [value]="pageSize" (change)="onPageSizeChange($event)">
          <option [value]="12">12</option>
          <option [value]="24">24</option>
          <option [value]="48">48</option>
          <option [value]="96">96</option>
        </select>
      </div>
    </div>
  `,
  styles: [
    `
      .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 0;
        flex-wrap: wrap;
        gap: 16px;
      }

      .pagination-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        color: var(--color-gray-600);
        font-size: 0.9rem;
      }

      .pagination-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pagination-btn {
        min-width: 100px;
      }

      .page-numbers {
        display: flex;
        gap: 4px;
      }

      .page-number {
        min-width: 40px;
        height: 40px;
        border-radius: 50%;
        font-weight: 500;
      }

      .page-number.active {
        background: var(--color-navy);
        color: var(--color-white);
      }

      .page-number:hover:not(.active) {
        background: var(--color-gray-100);
      }

      .page-size-selector {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--color-gray-600);
        font-size: 0.9rem;
      }

      .page-size-selector select {
        padding: 8px 12px;
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius);
        background: var(--color-white);
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .pagination-container {
          flex-direction: column;
          align-items: center;
        }

        .pagination-controls {
          flex-wrap: wrap;
          justify-content: center;
        }

        .pagination-btn {
          min-width: auto;
        }
      }
    `,
  ],
})
export class PropertyPaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() pageSize = 12;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);

    let startPage = Math.max(1, this.currentPage - halfVisible);
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  onPageChange(page: number): void {
    if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newSize = parseInt(select.value, 10);
    if (newSize !== this.pageSize) {
      this.pageSizeChange.emit(newSize);
    }
  }
}

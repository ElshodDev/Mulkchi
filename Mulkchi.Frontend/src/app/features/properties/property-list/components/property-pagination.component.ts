import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-property-pagination',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule],
  template: `
    <div class="pagination-wrapper-premium animate-fade-in">
      <div class="pagination-left">
        <span class="pagination-status">
          Sahifa <strong>{{ currentPage }}</strong> / {{ totalPages }}
        </span>
        <span class="divider"></span>
        <span class="total-meta">Jami {{ pageSize * totalPages }} ta mulk</span>
      </div>

      <div class="pagination-center">
        <button
          mat-icon-button
          [disabled]="currentPage === 1"
          (click)="onPreviousPage()"
          class="btn-nav"
          matTooltip="Oldingi"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>

        <div class="page-list">
          @for (page of visiblePages; track page) {
            <button
              class="page-circle"
              [class.active]="page === currentPage"
              (click)="onPageChange(page)"
            >
              {{ page }}
            </button>
          }
        </div>

        <button
          mat-icon-button
          [disabled]="currentPage === totalPages"
          (click)="onNextPage()"
          class="btn-nav"
          matTooltip="Keyingi"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <div class="pagination-right">
        <div class="size-picker-modern">
          <span>Har sahifada:</span>
          <select [value]="pageSize" (change)="onPageSizeChange($event)">
            <option [value]="12">12 ta</option>
            <option [value]="24">24 ta</option>
            <option [value]="48">48 ta</option>
          </select>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --navy: #0f172a;
        --gold: #c9a84c;
        --white: #ffffff;
        --border: #e2e8f0;
        --bg-soft: #f8fafc;
        display: block;
        margin-top: 40px;
      }

      .pagination-wrapper-premium {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 32px;
        background: var(--white);
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
        border: 1px solid var(--border);
        flex-wrap: wrap;
        gap: 20px;
      }

      /* --- LEFT SECTION --- */
      .pagination-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .pagination-status {
        font-size: 0.95rem;
        color: #475569;
      }
      .pagination-status strong {
        color: var(--navy);
        font-weight: 800;
      }
      .divider {
        width: 1px;
        height: 20px;
        background: var(--border);
      }
      .total-meta {
        font-size: 0.85rem;
        color: #64748b;
        font-weight: 500;
      }

      /* --- CENTER SECTION --- */
      .pagination-center {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .btn-nav {
        background: var(--bg-soft) !important;
        color: var(--navy) !important;
        border: 1px solid var(--border) !important;
        transition: all 0.3s;
      }
      .btn-nav:hover:not([disabled]) {
        background: var(--navy) !important;
        color: var(--white) !important;
        transform: scale(1.05);
      }

      .page-list {
        display: flex;
        gap: 8px;
      }
      .page-circle {
        width: 42px;
        height: 42px;
        border: 1px solid var(--border);
        background: var(--white);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: var(--navy);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-size: 0.9rem;
      }

      .page-circle:hover:not(.active) {
        border-color: var(--gold);
        color: var(--gold);
        transform: translateY(-3px);
        box-shadow: 0 8px 15px rgba(201, 168, 76, 0.1);
      }

      .page-circle.active {
        background: var(--navy);
        color: var(--white);
        border-color: var(--navy);
        box-shadow: 0 10px 20px rgba(15, 23, 42, 0.2);
      }

      /* --- RIGHT SECTION --- */
      .pagination-right {
        display: flex;
        align-items: center;
      }
      .size-picker-modern {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.9rem;
        color: #64748b;
        background: var(--bg-soft);
        padding: 6px 16px;
        border-radius: 12px;
        border: 1px solid var(--border);
      }
      .size-picker-modern select {
        background: transparent;
        border: none;
        font-weight: 700;
        color: var(--navy);
        cursor: pointer;
        outline: none;
      }

      /* --- ANIMATION --- */
      .animate-fade-in {
        animation: fadeIn 0.6s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 900px) {
        .pagination-wrapper-premium {
          justify-content: center;
          padding: 20px;
        }
        .pagination-left {
          width: 100%;
          justify-content: center;
        }
        .pagination-right {
          width: 100%;
          justify-content: center;
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

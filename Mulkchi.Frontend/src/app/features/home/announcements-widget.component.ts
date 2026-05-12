import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';

import { AnnouncementService } from '../../core/services';

@Component({
  selector: 'app-announcements-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="announcements-section" *ngIf="announcements().length > 0 || loading()">
      <div class="announcements-container">
        <div class="section-header">
          <h2>
            <mat-icon>notifications_active</mat-icon>
            Muhim e'lonlar
          </h2>
        </div>

        <div *ngIf="loading()" class="loading-spinner">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div class="announcements-grid" *ngIf="!loading() && announcements().length > 0">
          <mat-card
            class="announcement-card"
            *ngFor="let announcement of announcements().slice(0, 3)"
            [class.maintenance]="announcement.type === 'Maintenance'"
            [class.promotion]="announcement.type === 'Promotion'"
            [class.policy]="announcement.type === 'PolicyUpdate'"
          >
            <div class="announcement-header">
              <div class="type-badge" [class]="getTypeBadgeClass(announcement.type)">
                <mat-icon>{{ getTypeIcon(announcement.type) }}</mat-icon>
                {{ getTypeLabel(announcement.type) }}
              </div>
              <span class="date" *ngIf="announcement.publishedAt">
                {{ announcement.publishedAt | date: 'dd.MM.yyyy' }}
              </span>
            </div>

            <h3 class="announcement-title">{{ announcement.title }}</h3>

            <p class="announcement-content">{{ truncateContent(announcement.content) }}</p>

            <div class="announcement-footer">
              <button mat-stroked-button color="primary">
                <mat-icon>arrow_forward</mat-icon>
                Batafsilroq
              </button>
              <span *ngIf="announcement.isExpired" class="expired-badge">
                <mat-icon>schedule</mat-icon>
                Muddati o'tgan
              </span>
            </div>
          </mat-card>
        </div>

        <div class="view-all" *ngIf="announcements().length > 3">
          <button mat-button color="primary">
            <mat-icon>arrow_forward</mat-icon>
            Barcha e'lonlarni ko'rish
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .announcements-section {
        width: 100%;
        padding: 40px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin: 40px 0;
      }

      .announcements-container {
        max-width: 1400px;
        margin: 0 auto;
      }

      .section-header {
        margin-bottom: 30px;
      }

      .section-header h2 {
        color: white;
        font-size: 28px;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .section-header mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .announcements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }

      .announcement-card {
        background: white;
        border-radius: 8px;
        padding: 24px;
        transition: all 0.3s ease;
        border-left: 4px solid #667eea;

        &.maintenance {
          border-left-color: #ff9800;
        }

        &.promotion {
          border-left-color: #4caf50;
        }

        &.policy {
          border-left-color: #9c27b0;
        }

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
      }

      .announcement-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        gap: 12px;
      }

      .type-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 600;
        color: white;
        background: #667eea;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .type-badge.maintenance {
        background: #ff9800;
      }

      .type-badge.promotion {
        background: #4caf50;
      }

      .type-badge.policy {
        background: #9c27b0;
      }

      .date {
        font-size: 12px;
        color: #999;
      }

      .announcement-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0 0 12px 0;
        line-height: 1.4;
      }

      .announcement-content {
        font-size: 14px;
        color: #666;
        margin: 0 0 16px 0;
        line-height: 1.6;
      }

      .announcement-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .announcement-footer button {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .expired-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 12px;
        color: #999;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      .view-all {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.3);
      }

      .view-all button {
        color: white;
        font-weight: 600;
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        padding: 40px 20px;
      }

      @media (max-width: 768px) {
        .announcements-grid {
          grid-template-columns: 1fr;
        }

        .section-header h2 {
          font-size: 20px;
        }

        .announcement-card {
          padding: 16px;
        }

        .announcement-title {
          font-size: 16px;
        }
      }
    `,
  ],
})
export class AnnouncementsWidgetComponent implements OnInit, OnDestroy {
  private readonly announcementService = inject(AnnouncementService);
  private readonly destroy$ = new Subject<void>();

  announcements = this.announcementService.announcements;
  loading = signal(false);

  ngOnInit(): void {
    this.loading.set(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      General: 'Umumiy',
      Maintenance: 'Texnik ishlar',
      Promotion: 'Aksiya',
      PolicyUpdate: 'Siyosat',
    };
    return labels[type] || type;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      General: 'info',
      Maintenance: 'build',
      Promotion: 'local_offer',
      PolicyUpdate: 'policy',
    };
    return icons[type] || 'notifications';
  }

  getTypeBadgeClass(type: string): string {
    const typeMap: Record<string, string> = {
      Maintenance: 'maintenance',
      Promotion: 'promotion',
      PolicyUpdate: 'policy',
    };
    return typeMap[type] || '';
  }

  truncateContent(content: string, maxLength: number = 100): string {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  }
}

import { Component, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-progressive-disclosure',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule
  ],
  template: `
    <div class="progressive-disclosure">
      <!-- Main Content (Always Visible) -->
      <div class="main-content">
        <ng-content select="[slot='main']"></ng-content>
      </div>

      <!-- Advanced Features Toggle -->
      @if (hasAdvanced()) {
        <div class="disclosure-toggle">
          <button 
            mat-button 
            (click)="toggleAdvanced()"
            class="toggle-button haptic-feedback"
            [attr.aria-expanded]="isExpanded()"
            [attr.aria-controls]="'advanced-content-' + uniqueId()">
            <mat-icon>{{ isExpanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
            <span>{{ isExpanded() ? "Kamroq" : "Ko'proq" }} imkoniyatlar</span>
            <span class="feature-count">({{ advancedCount() }})</span>
          </button>
        </div>

        <!-- Advanced Content (Hidden by Default) -->
        <div 
          [id]="'advanced-content-' + uniqueId()"
          class="advanced-content"
          [class.expanded]="isExpanded()"
          [attr.hidden]="!isExpanded()">
          <mat-card class="advanced-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>{{ advancedIcon() }}</mat-icon>
              <mat-card-title>{{ advancedTitle() }}</mat-card-title>
              <mat-card-subtitle>{{ advancedDescription() }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="advanced-features">
                <ng-content select="[slot='advanced']"></ng-content>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .progressive-disclosure {
      width: 100%;
    }

    .main-content {
      margin-bottom: var(--space-4);
    }

    .disclosure-toggle {
      display: flex;
      justify-content: center;
      margin: var(--space-4) 0;
    }

    .toggle-button {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-3);
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border-soft);
      transition: all 0.3s ease;
      min-height: var(--touch-target-min);
    }

    .toggle-button:hover {
      background: var(--color-surface-elevated);
      border-color: var(--color-brand-200);
      transform: translateY(-1px);
    }

    .feature-count {
      background: var(--color-brand-100);
      color: var(--color-brand-600);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-round);
      font-size: var(--font-size-1);
      font-weight: 600;
    }

    .advanced-content {
      overflow: hidden;
      max-height: 0;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .advanced-content.expanded {
      max-height: 2000px;
      opacity: 1;
      margin-top: var(--space-4);
    }

    .advanced-card {
      background: linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%);
      border: 1px solid var(--color-border-soft);
    }

    .advanced-card mat-card-avatar {
      background: var(--color-brand-100);
      color: var(--color-brand-600);
    }

    .advanced-features {
      display: grid;
      gap: var(--space-4);
    }

    /* Mobile Optimizations */
    @media (max-width: 768px) {
      .toggle-button {
        width: 100%;
        justify-content: center;
        font-size: var(--font-size-3);
      }

      .advanced-card {
        margin: 0;
      }

      .advanced-features {
        gap: var(--spacing-mobile);
      }
    }
  `]
})
export class ProgressiveDisclosureComponent {
  // Inputs
  title = input<string>('Ko\'proq imkoniyatlar');
  description = input<string>('Qo\'shimcha funksiyalar va sozlamalar');
  icon = input<string>('settings');
  initialExpanded = input<boolean>(false);
  advancedCount = input<number>(0);

  // Outputs
  toggleChange = output<boolean>();

  // Internal state
  isExpanded = signal(false);
  uniqueId = signal(Math.random().toString(36).substr(2, 9));

  // Computed properties
  hasAdvanced = computed(() => this.advancedCount() > 0);
  advancedTitle = computed(() => this.title());
  advancedDescription = computed(() => this.description());
  advancedIcon = computed(() => this.icon());

  constructor() {
    this.isExpanded.set(this.initialExpanded());
  }

  toggleAdvanced(): void {
    const newState = !this.isExpanded();
    this.isExpanded.set(newState);
    this.toggleChange.emit(newState);
  }
}

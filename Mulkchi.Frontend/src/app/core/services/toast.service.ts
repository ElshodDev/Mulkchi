import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBar,
  MatSnackBarConfig,
} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastData {
  message: string;
  type: ToastType;
  action?: string;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="toast" [class]="'toast toast--' + data.type">
      <div class="toast__icon">
        <mat-icon>{{ icon() }}</mat-icon>
      </div>
      <div class="toast__copy">{{ data.message }}</div>
      @if (data.action) {
        <button mat-button type="button">{{ data.action }}</button>
      }
    </div>
  `,
  styles: [
    `
      .toast {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: var(--space-3);
        min-width: min(92vw, 26rem);
        padding: var(--space-3);
        border: 1px solid transparent;
        border-radius: var(--radius-4);
        background: var(--color-surface-elevated);
        box-shadow: var(--shadow-lg);
        color: var(--color-text-primary);
      }

      .toast__icon {
        display: grid;
        place-items: center;
        inline-size: 2.5rem;
        aspect-ratio: 1;
        border-radius: var(--radius-round);
      }

      .toast__copy {
        font-size: var(--font-size-2);
        line-height: var(--line-height-normal);
      }

      .toast--success {
        border-color: rgba(34, 197, 94, 0.2);
      }

      .toast--success .toast__icon {
        background: rgba(34, 197, 94, 0.12);
        color: var(--color-success-500);
      }

      .toast--error {
        border-color: rgba(220, 38, 38, 0.2);
      }

      .toast--error .toast__icon {
        background: rgba(220, 38, 38, 0.12);
        color: var(--color-danger-600);
      }

      .toast--warning {
        border-color: rgba(245, 158, 11, 0.22);
      }

      .toast--warning .toast__icon {
        background: rgba(245, 158, 11, 0.14);
        color: var(--color-warning-500);
      }

      .toast--info {
        border-color: rgba(59, 130, 246, 0.2);
      }

      .toast--info .toast__icon {
        background: rgba(59, 130, 246, 0.12);
        color: var(--color-info-500);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  protected readonly data = inject<ToastData>(MAT_SNACK_BAR_DATA);

  protected icon(): string {
    switch (this.data.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 4500,
    horizontalPosition: 'right',
    verticalPosition: 'top',
    panelClass: ['app-toast-panel'],
  };

  show(message: string, type: ToastType = 'info', action?: string): void {
    this.snackBar.openFromComponent(ToastComponent, {
      ...this.defaultConfig,
      data: { message, type, action } satisfies ToastData,
    });
  }

  success(message: string, action?: string): void {
    this.show(message, 'success', action);
  }

  error(message: string, action?: string): void {
    this.show(message, 'error', action);
  }

  warning(message: string, action?: string): void {
    this.show(message, 'warning', action);
  }

  info(message: string, action?: string): void {
    this.show(message, 'info', action);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <section class="dialog-shell">
      <div class="dialog-icon" [class.danger]="data.tone === 'danger'">
        <mat-icon>{{ data.tone === 'danger' ? 'warning' : 'help' }}</mat-icon>
      </div>

      <div class="dialog-copy">
        <h2>{{ data.title }}</h2>
        <p>{{ data.message }}</p>
      </div>

      <div class="dialog-actions">
        <button mat-button type="button" (click)="close(false)">
          {{ data.cancelLabel ?? 'Bekor qilish' }}
        </button>
        <button
          mat-flat-button
          type="button"
          [class.danger]="data.tone === 'danger'"
          (click)="close(true)"
        >
          {{ data.confirmLabel ?? 'Tasdiqlash' }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      .dialog-shell {
        display: grid;
        gap: var(--space-5);
        padding: var(--space-6);
        min-width: min(92vw, 420px);
      }

      .dialog-icon {
        display: grid;
        place-items: center;
        inline-size: 3.5rem;
        block-size: 3.5rem;
        border-radius: var(--radius-round);
        background: rgba(14, 116, 144, 0.12);
        color: var(--color-brand-600);
      }

      .dialog-icon.danger {
        background: rgba(220, 38, 38, 0.12);
        color: var(--color-danger-600);
      }

      .dialog-copy h2 {
        margin: 0 0 var(--space-2);
        font-size: var(--font-size-5);
      }

      .dialog-copy p {
        margin: 0;
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
      }

      .dialog-actions .danger {
        background: var(--color-danger-600);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  protected readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmationDialogComponent, boolean>);

  protected close(result: boolean): void {
    this.dialogRef.close(result);
  }
}

import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

export interface PendingChangesAware {
  hasUnsavedChanges?: () => boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<PendingChangesAware> = (component) => {
  if (!component.hasUnsavedChanges?.()) {
    return true;
  }

  const dialog = inject(MatDialog);
  const data: ConfirmationDialogData = {
    title: 'Saqlanmagan o‘zgarishlar',
    message:
      'Bu sahifada saqlanmagan o‘zgarishlar bor. Chiqsangiz, kiritilgan ma’lumotlar yo‘qoladi.',
    confirmLabel: 'Chiqish',
    cancelLabel: 'Qolish',
    tone: 'danger',
  };

  return dialog
    .open(ConfirmationDialogComponent, { data, autoFocus: false, restoreFocus: true })
    .afterClosed()
    .pipe(map((confirmed) => !!confirmed));
};

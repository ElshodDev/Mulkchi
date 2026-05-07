import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmationDialogData): Observable<boolean> {
    return this.dialog
      .open(ConfirmationDialogComponent, {
        data,
        autoFocus: false,
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(map((result) => !!result));
  }
}

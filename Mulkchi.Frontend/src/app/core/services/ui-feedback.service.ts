import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

@Injectable({
  providedIn: 'root',
})
export class UIFeedbackService {
  private snackBar = inject(MatSnackBar);

  private readonly defaultConfig: MatSnackBarConfig = {
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    duration: 4000,
    panelClass: ['custom-snackbar'],
  };

  success(message: string, action = 'OK', config?: MatSnackBarConfig): void {
    this.snackBar.open(`✅ ${message}`, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: [...(config?.panelClass || []), 'snackbar-success'],
      duration: config?.duration || 3000,
    });
  }

  error(message: string, action = 'Yopish', config?: MatSnackBarConfig): void {
    this.snackBar.open(`❌ ${message}`, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: [...(config?.panelClass || []), 'snackbar-error'],
      duration: config?.duration || 5000,
    });
  }

  info(message: string, action = 'OK', config?: MatSnackBarConfig): void {
    this.snackBar.open(`ℹ️ ${message}`, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: [...(config?.panelClass || []), 'snackbar-info'],
      duration: config?.duration || 4000,
    });
  }

  warning(message: string, action = 'OK', config?: MatSnackBarConfig): void {
    this.snackBar.open(`⚠️ ${message}`, action, {
      ...this.defaultConfig,
      ...config,
      panelClass: [...(config?.panelClass || []), 'snackbar-warning'],
      duration: config?.duration || 4000,
    });
  }

  notify(
    message: string,
    type: NotificationType = 'info',
    action = 'OK',
    config?: MatSnackBarConfig,
  ): void {
    switch (type) {
      case 'success':
        this.success(message, action, config);
        break;
      case 'error':
        this.error(message, action, config);
        break;
      case 'warning':
        this.warning(message, action, config);
        break;
      case 'info':
      default:
        this.info(message, action, config);
    }
  }

  loading(message = 'Yuklanmoqda...', config?: MatSnackBarConfig): void {
    this.snackBar.open(`⏳ ${message}`, 'Yopish', {
      ...this.defaultConfig,
      ...config,
      panelClass: [...(config?.panelClass || []), 'snackbar-loading'],
      duration: 0,
    });
  }

  confirm(message: string, action = 'Tasdiqlash'): Promise<boolean> {
    return new Promise((resolve) => {
      const snackRef = this.snackBar.open(message, action, {
        ...this.defaultConfig,
        duration: 0,
        panelClass: [...(this.defaultConfig.panelClass || []), 'snackbar-confirm'],
      });

      snackRef.onAction().subscribe(() => {
        resolve(true);
        snackRef.dismiss();
      });

      snackRef.afterDismissed().subscribe((result) => {
        if (!result.dismissedByAction) {
          resolve(false);
        }
      });
    });
  }

  clearAll(): void {
    this.snackBar.dismiss();
  }
}

import { Injectable, signal, Component, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ComponentType } from '@angular/cdk/overlay';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastData {
  message: string;
  type: ToastType;
  action?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="toast-container" [class]="'toast-' + data.type">
      <mat-icon class="toast-icon">{{ getIcon() }}</mat-icon>
      <span class="toast-message">{{ data.message }}</span>
      @if (data.action) {
        <button mat-button (click)="action()">{{ data.action }}</button>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 8px;
      min-width: 300px;
      max-width: 400px;
    }
    
    .toast-success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
    .toast-error { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
    .toast-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
    .toast-info { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
    
    .toast-icon { font-size: 20px; width: 20px; height: 20px; }
    .toast-message { flex: 1; font-size: 14px; font-weight: 500; }
  `]
})
export class ToastComponent {
  data: ToastData = inject(MAT_SNACK_BAR_DATA);
  
  action() {
    // Action handler
  }
  
  getIcon(): string {
    switch (this.data.type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }
}

// Import injection token
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private snackBar = inject(MatSnackBar);
  
  private defaultConfig: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'right',
    verticalPosition: 'top',
    panelClass: ['custom-toast']
  };
  
  show(message: string, type: ToastType = 'info', action?: string) {
    const panelClass = `toast-${type}`;
    
    this.snackBar.openFromComponent(ToastComponent, {
      ...this.defaultConfig,
      panelClass: [panelClass, 'custom-toast'],
      data: { message, type, action } as ToastData
    });
  }
  
  success(message: string, action?: string) {
    this.show(message, 'success', action);
  }
  
  error(message: string, action?: string) {
    this.show(message, 'error', action);
  }
  
  warning(message: string, action?: string) {
    this.show(message, 'warning', action);
  }
  
  info(message: string, action?: string) {
    this.show(message, 'info', action);
  }
  
  // Booking related toasts
  newBooking(propertyTitle: string) {
    this.success(`Yangi bron so'rovi: "${propertyTitle}"`, 'Ko\'rish');
  }
  
  bookingConfirmed() {
    this.success('Broningiz tasdiqlandi ✓', 'OK');
  }
  
  bookingCancelled() {
    this.warning('Bron bekor qilindi', 'Tushundim');
  }
  
  // Message related toasts
  newMessage(senderName: string, preview?: string) {
    const msg = preview ? `Yangi xabar: "${preview.substring(0, 30)}..."` : `Yangi xabar: ${senderName}`;
    this.info(msg, 'Ochish');
  }
}

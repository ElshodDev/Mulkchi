import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface SmartContractData {
  propertyName: string;
  price: number;
  currency: string;
  hostName: string;
}

@Component({
  selector: 'app-smart-contract-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="sc-modal-container">
      <!-- Header -->
      <div class="sc-header">
        <div class="sc-icon-wrapper">
          <mat-icon>currency_bitcoin</mat-icon>
        </div>
        <h2>Smart Contract orqali Ijaraga olish</h2>
        <p>Ma'lumotlar Blockchain tarmog'ida tasdiqlanmoqda</p>
      </div>

      <!-- Content -->
      <div class="sc-content">
        <div class="sc-details">
          <div class="detail-row">
            <span class="label">Mulk:</span>
            <span class="value">{{ data.propertyName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Mezbon:</span>
            <span class="value">{{ data.hostName }}</span>
          </div>
          <div class="detail-row">
            <span class="label">To'lov:</span>
            <span class="value amount">{{ data.price | number:'1.0-0' }} {{ data.currency }}</span>
          </div>
        </div>

        <div class="sc-status-box">
          <div class="status-step" [class.active]="step >= 1" [class.done]="step > 1">
            <mat-icon *ngIf="step > 1; else spinner1">check_circle</mat-icon>
            <ng-template #spinner1><mat-spinner *ngIf="step === 1" diameter="20"></mat-spinner><mat-icon *ngIf="step < 1">radio_button_unchecked</mat-icon></ng-template>
            <span>Web3 hamyoniga ulanish...</span>
          </div>
          <div class="status-step" [class.active]="step >= 2" [class.done]="step > 2">
            <mat-icon *ngIf="step > 2; else spinner2">check_circle</mat-icon>
            <ng-template #spinner2><mat-spinner *ngIf="step === 2" diameter="20"></mat-spinner><mat-icon *ngIf="step < 2">radio_button_unchecked</mat-icon></ng-template>
            <span>Shartnoma shartlarini tekshirish...</span>
          </div>
          <div class="status-step" [class.active]="step >= 3" [class.done]="step > 3">
            <mat-icon *ngIf="step > 3; else spinner3">check_circle</mat-icon>
            <ng-template #spinner3><mat-spinner *ngIf="step === 3" diameter="20"></mat-spinner><mat-icon *ngIf="step < 3">radio_button_unchecked</mat-icon></ng-template>
            <span>Blockchain tarmog'iga yozish...</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="sc-actions">
        <button mat-button (click)="cancel()" [disabled]="step > 0 && step < 4">Bekor qilish</button>
        <button mat-flat-button class="btn-confirm" (click)="signContract()" [disabled]="step > 0" *ngIf="step < 4">
          Shartnomani imzolash
        </button>
        <button mat-flat-button class="btn-success" (click)="closeSuccess()" *ngIf="step === 4">
          <mat-icon>task_alt</mat-icon> Tasdiqlandi
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sc-modal-container {
      background: #0f172a;
      color: white;
      padding: 32px 24px;
      border-radius: 24px;
      font-family: 'Inter', sans-serif;
      max-width: 450px;
      position: relative;
      overflow: hidden;
    }
    .sc-modal-container::before {
      content: '';
      position: absolute;
      top: -50px;
      right: -50px;
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(139,92,246,0.3) 0%, rgba(15,23,42,0) 70%);
      border-radius: 50%;
    }
    .sc-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .sc-icon-wrapper {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4);
    }
    .sc-icon-wrapper mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: white;
    }
    .sc-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0 0 8px;
    }
    .sc-header p {
      font-size: 0.9rem;
      color: #94a3b8;
      margin: 0;
    }
    .sc-details {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
      padding-top: 12px;
      border-top: 1px dashed rgba(255,255,255,0.1);
    }
    .label {
      color: #94a3b8;
      font-size: 0.9rem;
    }
    .value {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .amount {
      color: #10b981;
      font-size: 1.1rem;
      font-weight: 800;
    }
    .sc-status-box {
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .status-step {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #64748b;
      transition: all 0.3s;
    }
    .status-step mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .status-step.active {
      color: white;
    }
    .status-step.done {
      color: #10b981;
    }
    .sc-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .sc-actions button {
      flex: 1;
      border-radius: 12px;
      padding: 8px 0;
      font-weight: 700;
    }
    .btn-confirm {
      background: linear-gradient(135deg, #8b5cf6, #6d28d9) !important;
      color: white !important;
    }
    .btn-success {
      background: linear-gradient(135deg, #10b981, #059669) !important;
      color: white !important;
    }
  `]
})
export class SmartContractModalComponent implements OnInit {
  public data = inject<SmartContractData>(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<SmartContractModalComponent>);
  
  step = 0;

  ngOnInit() {}

  signContract() {
    this.step = 1;
    setTimeout(() => {
      this.step = 2;
      setTimeout(() => {
        this.step = 3;
        setTimeout(() => {
          this.step = 4;
        }, 1500);
      }, 1500);
    }, 1500);
  }

  cancel() {
    this.dialogRef.close(false);
  }

  closeSuccess() {
    this.dialogRef.close(true);
  }
}

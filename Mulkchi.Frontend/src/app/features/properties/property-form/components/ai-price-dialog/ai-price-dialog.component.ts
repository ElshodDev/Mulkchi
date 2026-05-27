import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AIService } from '../../../../../core/services/ai.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-ai-price-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="ai-icon-wrapper">
          <mat-icon>auto_awesome</mat-icon>
        </div>
        <h2>AI Narx Baholovchi</h2>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">
        <ng-container *ngIf="!priceResult(); else resultView">
          <p class="subtitle">Mulk haqida qisqacha ma'lumot bering, AI sizga optimal narxni hisoblab beradi.</p>

          <form [formGroup]="form" class="ai-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Viloyat</mat-label>
                <mat-select formControlName="region">
                  <mat-option value="Toshkent">Toshkent shahri</mat-option>
                  <mat-option value="ToshkentViloyati">Toshkent viloyati</mat-option>
                  <mat-option value="Samarqand">Samarqand</mat-option>
                  <mat-option value="Buxoro">Buxoro</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Mulk turi</mat-label>
                <mat-select formControlName="propertyType">
                  <mat-option value="Apartment">Kvartira</mat-option>
                  <mat-option value="House">Hovli</mat-option>
                  <mat-option value="Commercial">Tijorat</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Maydon (m²)</mat-label>
                <input matInput type="number" formControlName="area" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Xonalar soni</mat-label>
                <input matInput type="number" formControlName="rooms" />
              </mat-form-field>
            </div>

            <div class="checkbox-grid">
              <mat-checkbox formControlName="isRenovated">Ta'mirlangan</mat-checkbox>
              <mat-checkbox formControlName="hasFurniture">Mebel bor</mat-checkbox>
            </div>
          </form>

          <div class="actions">
            <button mat-button (click)="close()">Bekor qilish</button>
            <button 
              mat-flat-button 
              color="primary" 
              class="btn-predict"
              [disabled]="form.invalid || loading()" 
              (click)="predictPrice()">
              <mat-icon *ngIf="!loading()">calculate</mat-icon>
              <mat-spinner diameter="20" *ngIf="loading()"></mat-spinner>
              <span>{{ loading() ? 'Hisoblanmoqda...' : 'Narxni hisoblash' }}</span>
            </button>
          </div>
        </ng-container>

        <ng-template #resultView>
          <div class="result-container">
            <div class="price-circle">
              <span class="price-value">{{ priceResult()?.recommendedPrice | number:'1.0-0' }} $</span>
              <span class="price-label">Tavsiya etilgan narx</span>
            </div>
            
            <div class="price-details">
              <div class="detail-item">
                <span class="detail-label">Bozor o'rtachasi:</span>
                <span class="detail-value">{{ priceResult()?.marketAverage | number:'1.0-0' }} $</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Oraliq:</span>
                <span class="detail-value">{{ priceResult()?.minPrice | number:'1.0-0' }} - {{ priceResult()?.maxPrice | number:'1.0-0' }} $</span>
              </div>
            </div>

            <div class="ai-comment">
              <mat-icon>lightbulb</mat-icon>
              <p>{{ priceResult()?.comparisonMessage || "AI ushbu narxni bozor holatidan kelib chiqib tavsiya qildi." }}</p>
            </div>

            <div class="actions result-actions">
              <button mat-button (click)="reset()">Qayta hisoblash</button>
              <button mat-flat-button color="primary" class="btn-apply" (click)="applyPrice()">
                <mat-icon>check_circle</mat-icon>
                Formaga qo'shish
              </button>
            </div>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        padding: 24px;
        background: #ffffff;
        border-radius: 24px;
        position: relative;
        overflow: hidden;
      }

      .dialog-header {
        display: flex;
        align-items: center;
        margin-bottom: 24px;
        position: relative;
      }

      .ai-icon-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-right: 16px;
      }

      .dialog-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 800;
        color: #1e293b;
      }

      .close-btn {
        position: absolute;
        right: -8px;
        top: -8px;
        color: #94a3b8;
      }

      .subtitle {
        color: #64748b;
        margin-bottom: 24px;
        font-size: 0.95rem;
        line-height: 1.5;
      }

      .form-row {
        display: flex;
        gap: 16px;
        margin-bottom: 8px;
      }

      .full-width {
        width: 100%;
      }

      .checkbox-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 32px;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .btn-predict {
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        border-radius: 12px;
        padding: 0 24px;
        height: 44px;
        font-weight: 600;
      }

      .btn-predict mat-spinner {
        margin-right: 8px;
      }

      .result-container {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .price-circle {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: #f8fafc;
        border: 4px solid #6366f1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);
      }

      .price-value {
        font-size: 2.5rem;
        font-weight: 800;
        color: #1e293b;
      }

      .price-label {
        font-size: 0.9rem;
        color: #64748b;
        font-weight: 600;
        margin-top: 4px;
      }

      .price-details {
        width: 100%;
        background: #f1f5f9;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 24px;
      }

      .detail-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .detail-item:last-child {
        margin-bottom: 0;
      }

      .detail-label {
        color: #64748b;
        font-weight: 500;
      }

      .detail-value {
        color: #1e293b;
        font-weight: 700;
      }

      .ai-comment {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: rgba(99, 102, 241, 0.05);
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 32px;
        border-left: 4px solid #6366f1;
      }

      .ai-comment mat-icon {
        color: #f59e0b;
      }

      .ai-comment p {
        margin: 0;
        color: #334155;
        font-size: 0.95rem;
        line-height: 1.5;
      }

      .btn-apply {
        background: #10b981;
        border-radius: 12px;
        padding: 0 24px;
        height: 48px;
        font-weight: 600;
        width: 100%;
      }

      .result-actions {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
    `,
  ],
})
export class AiPriceDialogComponent {
  private dialogRef = inject(MatDialogRef<AiPriceDialogComponent>);
  private aiService = inject(AIService);
  private fb = inject(FormBuilder);
  
  private data = inject(MAT_DIALOG_DATA);

  loading = this.aiService.loading;
  priceResult = this.aiService.priceResult;

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      region: [this.data?.region || 'Toshkent', Validators.required],
      propertyType: [this.data?.propertyType || 'Apartment', Validators.required],
      area: [this.data?.area || 50, [Validators.required, Validators.min(10)]],
      rooms: [this.data?.rooms || 2, [Validators.required, Validators.min(1)]],
      isRenovated: [false],
      hasFurniture: [false]
    });
    
    this.aiService.clearResult();
  }

  predictPrice() {
    if (this.form.invalid) return;
    
    const request = {
      ...this.form.value,
      listingType: this.data?.listingType || 'Sale',
      floor: 1
    };
    
    this.aiService.predictPrice(request).subscribe();
  }

  reset() {
    this.aiService.clearResult();
  }

  applyPrice() {
    const result = this.priceResult();
    if (result) {
      this.dialogRef.close(result.recommendedPrice);
    }
  }

  close() {
    this.dialogRef.close();
  }
}

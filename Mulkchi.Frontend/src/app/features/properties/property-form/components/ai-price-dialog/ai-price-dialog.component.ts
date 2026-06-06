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
      <div class="dialog-bg-glow"></div>
      <div class="dialog-header">
        <div class="ai-icon-wrapper pulse-animation">
          <mat-icon>auto_awesome</mat-icon>
        </div>
        <div>
          <h2>AI Narx Baholovchi</h2>
          <p class="subtitle">Bozor tahlili asosida optimal narxni hisoblaymiz</p>
        </div>
        <button mat-icon-button (click)="close()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content">
        <ng-container *ngIf="!priceResult(); else resultView">
          <form [formGroup]="form" class="ai-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="premium-field full-width">
                <mat-label>Viloyat</mat-label>
                <mat-select formControlName="region">
                  <mat-option value="Toshkent">Toshkent shahri</mat-option>
                  <mat-option value="ToshkentViloyati">Toshkent viloyati</mat-option>
                  <mat-option value="Samarqand">Samarqand</mat-option>
                  <mat-option value="Buxoro">Buxoro</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="premium-field full-width">
                <mat-label>Mulk turi</mat-label>
                <mat-select formControlName="propertyType">
                  <mat-option value="Apartment">Kvartira</mat-option>
                  <mat-option value="House">Hovli</mat-option>
                  <mat-option value="Commercial">Tijorat</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="premium-field full-width">
                <mat-label>Maydon (m²)</mat-label>
                <input matInput type="number" formControlName="area" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="premium-field full-width">
                <mat-label>Xonalar soni</mat-label>
                <input matInput type="number" formControlName="rooms" />
              </mat-form-field>
            </div>

            <div class="checkbox-grid">
              <mat-checkbox formControlName="isRenovated" color="primary">Ta'mirlangan (Yevroremont)</mat-checkbox>
              <mat-checkbox formControlName="hasFurniture" color="primary">Mebel va jihozlar bilan</mat-checkbox>
            </div>
          </form>

          <div class="actions">
            <button mat-button class="btn-cancel" (click)="close()">Bekor qilish</button>
            <button 
              mat-flat-button 
              class="btn-predict"
              [disabled]="form.invalid || loading()" 
              (click)="predictPrice()">
              <mat-icon *ngIf="!loading()">insights</mat-icon>
              <mat-spinner diameter="20" *ngIf="loading()"></mat-spinner>
              <span>{{ loading() ? 'Tahlil qilinmoqda...' : 'Sun\\'iy intellekt orqali hisoblash' }}</span>
            </button>
          </div>
        </ng-container>

        <ng-template #resultView>
          <div class="result-container fade-in">
            <div class="price-circle glass-panel">
              <div class="price-glow"></div>
              <span class="price-label">Tavsiya etilgan narx</span>
              <span class="price-value">{{ priceResult()?.recommendedPrice | number:'1.0-0' }} $</span>
            </div>
            
            <div class="price-details glass-panel">
              <div class="detail-item">
                <div class="detail-icon"><mat-icon>trending_flat</mat-icon></div>
                <div class="detail-text">
                  <span class="detail-label">Bozor o'rtachasi</span>
                  <span class="detail-value">{{ priceResult()?.marketAverage | number:'1.0-0' }} $</span>
                </div>
              </div>
              <div class="detail-divider"></div>
              <div class="detail-item">
                <div class="detail-icon"><mat-icon>swap_horiz</mat-icon></div>
                <div class="detail-text">
                  <span class="detail-label">Narx oraliqi</span>
                  <span class="detail-value">{{ priceResult()?.minPrice | number:'1.0-0' }} - {{ priceResult()?.maxPrice | number:'1.0-0' }} $</span>
                </div>
              </div>
            </div>

            <div class="ai-comment glass-panel">
              <div class="comment-icon">
                <mat-icon>lightbulb</mat-icon>
              </div>
              <p>{{ priceResult()?.comparisonMessage || "AI ushbu narxni bozordagi o'xshash mulklar tahlili asosida tavsiya qildi." }}</p>
            </div>

            <div class="actions result-actions">
              <button mat-button class="btn-cancel" (click)="reset()">
                <mat-icon>refresh</mat-icon> Boshqatan
              </button>
              <button mat-flat-button class="btn-apply" (click)="applyPrice()">
                <mat-icon>check_circle</mat-icon>
                Formaga qo'llash
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
        margin-top: 16px;
      }

      .btn-cancel {
        color: #64748b;
        font-weight: 600;
        height: 48px;
        padding: 0 24px;
      }

      .btn-predict, .btn-apply {
        background: linear-gradient(135deg, #6366f1, #a855f7) !important;
        color: white !important;
        height: 48px;
        padding: 0 32px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 1rem;
        box-shadow: 0 8px 20px rgba(99,102,241,0.25);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
      }
      .btn-predict:hover:not(:disabled), .btn-apply:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(99,102,241,0.35);
      }

      .fade-in {
        animation: fadeIn 0.5s ease-out forwards;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .glass-panel {
        background: rgba(248, 250, 252, 0.8);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 20px;
        padding: 24px;
        margin-bottom: 16px;
      }

      .price-circle {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: linear-gradient(135deg, #f0fdfa, #ecfdf5);
        border: 1px solid #a7f3d0;
        position: relative;
        overflow: hidden;
      }

      .price-glow {
        position: absolute;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(255,255,255,0) 70%);
        border-radius: 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      .price-value {
        font-size: 2.5rem;
        font-weight: 800;
        color: #059669;
        line-height: 1.2;
        text-shadow: 0 2px 4px rgba(5,150,105,0.1);
        z-index: 1;
      }

      .price-label {
        font-size: 0.9rem;
        color: #047857;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
        z-index: 1;
      }

      .price-details {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 16px;
      }

      .detail-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .detail-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
      }

      .detail-text {
        display: flex;
        flex-direction: column;
      }

      .detail-divider {
        width: 1px;
        height: 40px;
        background: #e2e8f0;
      }

      .detail-label {
        font-size: 0.75rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 700;
      }

      .detail-value {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1e293b;
      }

      .ai-comment {
        display: flex;
        gap: 16px;
        align-items: flex-start;
        background: #eff6ff;
        border-color: #bfdbfe;
      }

      .comment-icon {
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .comment-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

      .ai-comment p {
        margin: 0;
        color: #1e3a8a;
        font-size: 0.95rem;
        line-height: 1.5;
        font-weight: 500;
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

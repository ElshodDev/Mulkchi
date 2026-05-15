import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-step-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <div class="step-wrapper">
      <div class="section-header">
        <h1>Texnik tafsilotlar</h1>
        <p>Mulkning holati va qo'shimcha parametrlarini ko'rsating</p>
      </div>

      <form [formGroup]="form" class="premium-form">
        <div class="row-grid">
          <!-- Floor -->
          <div class="form-section flex-1">
            <label class="section-label">Qavat</label>
            <mat-form-field appearance="outline" class="full-width premium-field">
              <input matInput type="number" formControlName="floor" />
              <mat-icon matPrefix>layers</mat-icon>
              <mat-error *ngIf="form.get('floor')?.invalid">Qavatni kiriting</mat-error>
            </mat-form-field>
          </div>

          <!-- Total Floors -->
          <div class="form-section flex-1">
            <label class="section-label">Umumiy qavatlar</label>
            <mat-form-field appearance="outline" class="full-width premium-field">
              <input matInput type="number" formControlName="totalFloors" />
              <mat-icon matPrefix>apartment</mat-icon>
              <mat-error *ngIf="form.get('totalFloors')?.invalid">Umumiy qavatlar sonini kiriting</mat-error>
            </mat-form-field>
          </div>
        </div>

        <div class="row-grid">
          <!-- Year Built -->
          <div class="form-section flex-1">
            <label class="section-label">Qurilgan yili</label>
            <mat-form-field appearance="outline" class="full-width premium-field">
              <input matInput type="number" formControlName="yearBuilt" />
              <mat-icon matPrefix>event</mat-icon>
            </mat-form-field>
          </div>

          <!-- Condition -->
          <div class="form-section flex-1">
            <label class="section-label">Holati (Remont)</label>
            <mat-form-field appearance="outline" class="full-width premium-field">
              <mat-select formControlName="condition">
                <mat-option value="Excellent">Evro remont</mat-option>
                <mat-option value="Good">Yaxshi</mat-option>
                <mat-option value="Average">O'rtacha</mat-option>
                <mat-option value="NeedsRenovation">Ta'mirga muhtoj</mat-option>
              </mat-select>
              <mat-icon matPrefix>handyman</mat-icon>
            </mat-form-field>
          </div>
        </div>

        <div class="info-card">
          <mat-icon>info</mat-icon>
          <div class="info-content">
            <h3>Nima uchun bu muhim?</h3>
            <p>Aniq texnik ma'lumotlar filtrlar orqali qidiruv natijalarida mulkingizni tezroq topishga yordam beradi.</p>
          </div>
        </div>

        <div class="form-footer">
          <button mat-button type="button" class="btn-cancel" (click)="onPrevious()">Orqaga</button>
          <button mat-flat-button class="btn-continue" (click)="onNext()">
            Davom etish
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .step-wrapper { max-width: 800px; margin: 0 auto; }
    .section-header { margin-bottom: 40px; }
    .section-header h1 { font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
    .section-header p { color: #64748b; font-size: 1.1rem; margin-top: 8px; }

    .premium-form { display: flex; flex-direction: column; gap: 32px; }
    .section-label { display: block; font-size: 0.95rem; font-weight: 700; color: #334155; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }

    .row-grid { display: flex; gap: 24px; }
    .flex-1 { flex: 1; }
    .full-width { width: 100%; }

    ::ng-deep .premium-field .mat-mdc-text-field-wrapper {
      background-color: white !important;
      border-radius: 16px !important;
    }

    .info-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 20px;
      padding: 24px;
      display: flex;
      gap: 20px;
      align-items: flex-start;
      margin-top: 10px;
    }

    .info-card mat-icon { color: #0284c7; font-size: 28px; width: 28px; height: 28px; }
    .info-content h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #0c4a6e; }
    .info-content p { margin: 4px 0 0; font-size: 0.9rem; color: #075985; line-height: 1.5; }

    .form-footer {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 32px;
      border-top: 1px solid #f1f5f9;
    }

    .btn-continue {
      height: 56px;
      padding: 0 40px;
      border-radius: 16px;
      font-weight: 700;
      font-size: 1.1rem;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2);
    }

    .btn-cancel { height: 56px; padding: 0 32px; color: #64748b; font-weight: 600; }

    @media (max-width: 640px) {
      .row-grid { flex-direction: column; }
    }
  `]
})
export class StepDetailsComponent {
  @Input() form!: FormGroup;
  @Output() stepComplete = new EventEmitter<boolean>();
  @Output() previous = new EventEmitter<void>();

  onNext() {
    if (this.form.valid) {
      this.stepComplete.emit(true);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onPrevious() {
    this.previous.emit();
  }
}

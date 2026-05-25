import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UploadedImage } from '../../../../shared/components/image-upload/image-upload.component';
import { AIService, AIDescriptionRequest } from '../../../../core/services/ai.service';

@Component({
  selector: 'app-step-images',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="step-wrapper">
      <div class="section-header">
        <h1>Rasmlar va tavsif</h1>
        <p>Sifatli rasmlar va batafsil tavsif mulkingizni tezroq sotishga yordam beradi</p>
      </div>

      <form [formGroup]="form" class="premium-form">
        <!-- Media Upload Zone -->
        <div class="form-section">
          <label class="section-label">Rasmlar yuklash (Maksimal 10ta)</label>

          <input
            #fileInput
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            (change)="onFilesSelected($event)"
          />

          <div class="upload-zone" (click)="fileInput.click()">
            <div class="upload-content">
              <div class="icon-circle">
                <mat-icon>cloud_upload</mat-icon>
              </div>
              <h3>Rasmlarni yuklang</h3>
              <p>Fayllarni shu yerga tashlang yoki tanlash uchun bosing</p>
              <button mat-flat-button color="primary" type="button" class="btn-browse">
                Fayllarni tanlash
              </button>
            </div>
          </div>

          <!-- Preview Grid -->
          <div class="preview-grid" *ngIf="previews.length > 0">
            <div class="preview-card" *ngFor="let preview of previews; let i = index">
              <img [src]="preview.url" alt="Preview" />
              <button mat-icon-button class="remove-btn" (click)="removeImage(i, $event)">
                <mat-icon>close</mat-icon>
              </button>
              <div class="primary-badge" *ngIf="i === 0">Asosiy</div>
            </div>
          </div>
        </div>

        <!-- Description Section -->
        <div class="form-section">
          <div class="section-header-inline">
            <label class="section-label">Batafsil tavsif</label>
            <button
              mat-stroked-button
              color="primary"
              type="button"
              class="btn-ai"
              [disabled]="isGeneratingAI"
              (click)="generateAI()"
            >
              <mat-icon *ngIf="!isGeneratingAI">psychology</mat-icon>
              <mat-spinner diameter="18" *ngIf="isGeneratingAI"></mat-spinner>
              <span>{{ isGeneratingAI ? 'Yozilmoqda...' : 'AI bilan yozish' }}</span>
            </button>
          </div>

          <mat-form-field appearance="outline" class="full-width premium-field">
            <textarea
              matInput
              formControlName="description"
              rows="6"
              placeholder="Mulkning barcha ustunliklari haqida yozing..."
            ></textarea>
            <mat-hint align="end"
              >{{ form.get('description')?.value?.length || 0 }} / 2000</mat-hint
            >
            <mat-error *ngIf="form.get('description')?.invalid"
              >Tavsif kamida 20 belgidan iborat bo'lishi kerak</mat-error
            >
          </mat-form-field>
        </div>

        <div class="form-footer">
          <button mat-button type="button" class="btn-cancel" (click)="onPrevious()">Orqaga</button>
          <button
            mat-flat-button
            class="btn-submit"
            [disabled]="form.invalid || isSubmitting || previews.length === 0"
            (click)="onSubmit()"
          >
            <mat-spinner diameter="24" *ngIf="isSubmitting"></mat-spinner>
            <span *ngIf="!isSubmitting">E'lonni joylashtirish</span>
            <mat-icon *ngIf="!isSubmitting">rocket_launch</mat-icon>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .step-wrapper {
        max-width: 800px;
        margin: 0 auto;
      }
      .section-header {
        margin-bottom: 40px;
      }
      .section-header h1 {
        font-size: 2rem;
        font-weight: 800;
        color: #1e293b;
        margin: 0;
        letter-spacing: -0.5px;
      }
      .section-header p {
        color: #64748b;
        font-size: 1.1rem;
        margin-top: 8px;
      }

      .premium-form {
        display: flex;
        flex-direction: column;
        gap: 32px;
      }
      .section-label {
        display: block;
        font-size: 0.95rem;
        font-weight: 700;
        color: #334155;
        margin-bottom: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .section-header-inline {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .btn-ai {
        border-radius: 12px;
        height: 38px;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-color: #6366f1 !important;
        color: #6366f1 !important;
        font-weight: 600;
        transition: all 0.2s ease;
      }

      .btn-ai:hover:not(:disabled) {
        background: rgba(99, 102, 241, 0.05);
        transform: translateY(-1px);
      }

      .btn-ai mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .hidden {
        display: none;
      }

      .upload-zone {
        width: 100%;
        height: 200px;
        border: 2px dashed #e2e8f0;
        border-radius: 24px;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        cursor: pointer;
        margin-bottom: 24px;
      }

      .upload-zone:hover {
        border-color: #6366f1;
        background: #f1f5ff;
      }

      .upload-content {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .icon-circle {
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6366f1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      .preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 16px;
        margin-top: 24px;
      }

      .preview-card {
        aspect-ratio: 1;
        border-radius: 16px;
        overflow: hidden;
        position: relative;
        border: 1px solid #e2e8f0;
      }

      .preview-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(255, 255, 255, 0.9);
        width: 24px;
        height: 24px;
        line-height: 24px;
      }
      .remove-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #ef4444;
      }

      .primary-badge {
        position: absolute;
        bottom: 8px;
        left: 8px;
        background: #6366f1;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 700;
      }

      .btn-browse {
        border-radius: 12px;
        font-weight: 600;
        margin-top: 8px;
      }

      ::ng-deep .premium-field .mat-mdc-text-field-wrapper {
        background-color: white !important;
        border-radius: 16px !important;
      }

      .form-footer {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 32px;
        border-top: 1px solid #f1f5f9;
      }

      .btn-submit {
        height: 56px;
        padding: 0 40px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 1.1rem;
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        color: white;
        box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .btn-submit:disabled {
        background: #e2e8f0;
        box-shadow: none;
        color: #94a3b8;
      }
      .btn-cancel {
        height: 56px;
        padding: 0 32px;
        color: #64748b;
        font-weight: 600;
      }
    `,
  ],
})
export class StepImagesComponent {
  private aiService = inject(AIService);

  @Input() form!: FormGroup;
  @Input() basicInfoForm!: FormGroup;
  @Input() locationForm!: FormGroup;
  @Input() amenitiesForm!: FormGroup;
  @Input() isSubmitting = false;

  @Output() stepComplete = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();
  @Output() imageUpload = new EventEmitter<UploadedImage>();
  @Output() imagesChange = new EventEmitter<UploadedImage[]>();

  previews: { url: string; file: File }[] = [];
  isGeneratingAI = false;

  generateAI() {
    const basicInfo = this.basicInfoForm.value;
    const location = this.locationForm.value;
    const amenitiesValues = this.amenitiesForm.value;

    const amenities = Object.keys(amenitiesValues)
      .filter((key) => amenitiesValues[key] === true)
      .map((key) => this.formatAmenity(key));

    const request: AIDescriptionRequest = {
      region: location.region || 'Toshkent',
      propertyType: basicInfo.type || 'Kvartira',
      area: basicInfo.area || 0,
      rooms: basicInfo.numberOfBedrooms || 1,
      floor: 1,
      totalFloors: 1,
      amenities: amenities,
    };

    this.isGeneratingAI = true;
    this.aiService.generateDescription(request).subscribe({
      next: (res) => {
        this.form.patchValue({ description: res.description });
        this.isGeneratingAI = false;
      },
      error: () => {
        this.isGeneratingAI = false;
      },
    });
  }

  private formatAmenity(key: string): string {
    const labels: Record<string, string> = {
      hasWifi: 'WiFi',
      hasParking: 'Avtoturargoh',
      hasPool: 'Hovuz',
      hasAirConditioning: 'Konditsioner',
      hasHeating: 'Isitish tizimi',
      hasKitchen: 'Oshxona',
      hasTV: 'Televizor',
      hasWasher: 'Kir yuvish mashinasi',
      hasElevator: 'Lift',
      hasSecurity: "Qo'riqlash",
      hasFurniture: 'Mebel',
      isRenovated: "Ta'mirlangan",
      hasMetroNearby: 'Metro yaqin',
      hasBusStop: 'Bekat yaqin',
      hasMarketNearby: 'Bozor yaqin',
      hasSchoolNearby: 'Maktab yaqin',
      hasHospitalNearby: 'Kasalxona yaqin',
    };
    return labels[key] || key;
  }

  onFilesSelected(event: any) {
    const files = event.target.files as FileList;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const preview = { url: e.target.result, file };
        this.previews.push(preview);

        // Emit for the parent component to store
        const uploaded: UploadedImage = {
          file: file,
          previewUrl: e.target.result,
          isPrimary: this.previews.length === 1,
          isUploading: false,
        };
        this.imageUpload.emit(uploaded);
        this.emitChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number, event: Event) {
    event.stopPropagation();
    this.previews.splice(index, 1);
    this.emitChanges();
  }

  private emitChanges() {
    const images: UploadedImage[] = this.previews.map((p, index) => ({
      file: p.file,
      previewUrl: p.url,
      isPrimary: index === 0,
      isUploading: false,
    }));
    this.imagesChange.emit(images);
  }

  onSubmit() {
    if (this.form.valid) {
      this.stepComplete.emit();
    } else {
      this.form.markAllAsTouched();
    }
  }

  onPrevious() {
    this.previous.emit();
  }
}

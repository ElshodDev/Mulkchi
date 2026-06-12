import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AIDescriptionRequest, AIService } from '../../../../core/services/ai.service';
import { UploadedImage } from '../../../../shared/components/image-upload/image-upload.component';

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
        <h1>🖼️ Rasmlar va tavsif</h1>
        <p>Sifatli rasmlar va batafsil tavsif mulkingizni tezroq topilishiga yordam beradi</p>
      </div>

      <!-- SUMMARY CARD: shows what has been filled so far -->
      <div class="summary-card">
        <div class="summary-title">
          <mat-icon>checklist</mat-icon> Kiritilgan ma'lumotlar xulasasi
        </div>
        <div class="summary-grid">
          <div class="summary-item" *ngIf="basicInfoForm.get('type')?.value">
            <span class="s-label">Mulk turi</span>
            <span class="s-value">{{ typeLabel(basicInfoForm.get('type')?.value) }}</span>
          </div>
          <div class="summary-item" *ngIf="basicInfoForm.get('listingType')?.value">
            <span class="s-label">E'lon turi</span>
            <span class="s-value">{{ listingLabel(basicInfoForm.get('listingType')?.value) }}</span>
          </div>
          <div class="summary-item" *ngIf="basicInfoForm.get('area')?.value">
            <span class="s-label">Maydon</span>
            <span class="s-value">{{ basicInfoForm.get('area')?.value }} m²</span>
          </div>
          <div class="summary-item" *ngIf="basicInfoForm.get('numberOfBedrooms')?.value">
            <span class="s-label">Xonalar</span>
            <span class="s-value">{{ basicInfoForm.get('numberOfBedrooms')?.value }} ta</span>
          </div>
          <div class="summary-item" *ngIf="locationForm.get('city')?.value">
            <span class="s-label">Shahar</span>
            <span class="s-value">{{ locationForm.get('city')?.value }}</span>
          </div>
          <div class="summary-item" *ngIf="locationForm.get('address')?.value">
            <span class="s-label">Manzil</span>
            <span class="s-value">{{ locationForm.get('address')?.value }}</span>
          </div>
          <div class="summary-item" *ngIf="getPrice()">
            <span class="s-label">Narx</span>
            <span class="s-value price-highlight"
              >{{ getPrice() | number }} {{ basicInfoForm.get('currency')?.value }}</span
            >
          </div>
        </div>
      </div>

      <form [formGroup]="form" class="premium-form">
        <!-- AI DESCRIPTION HERO BLOCK -->
        <div class="ai-hero">
          <div class="ai-hero-left">
            <div class="ai-icon-wrap"><mat-icon>auto_awesome</mat-icon></div>
            <div>
              <h3>AI yordamida tavsif yarating</h3>
              <p>Yuqoridagi ma'lumotlar asosida professional tavsif avtomatik yoziladi</p>
            </div>
          </div>
          <button
            mat-flat-button
            class="btn-ai-hero"
            type="button"
            [disabled]="isGeneratingAI"
            (click)="generateAI()"
          >
            <mat-spinner diameter="20" *ngIf="isGeneratingAI"></mat-spinner>
            <mat-icon *ngIf="!isGeneratingAI">psychology</mat-icon>
            <span>{{ isGeneratingAI ? 'Yozilmoqda...' : 'AI tavsif yaratish' }}</span>
          </button>
        </div>

        <!-- Description textarea -->
        <div class="form-section">
          <mat-form-field appearance="outline" class="full-width premium-field">
            <mat-label>Batafsil tavsif</mat-label>
            <textarea
              matInput
              formControlName="description"
              rows="7"
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


        <!-- Media Upload Zone -->
        <div class="form-section">
          <label class="section-label"
            >📷 Rasmlar yuklash <span class="optional-tag">(ixtiyoriy, 10 tagacha)</span></label
          >

          <input
            #fileInput
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            (change)="onFilesSelected($event)"
          />
          <input
            #cameraInput
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            (change)="onFilesSelected($event)"
          />

          <div class="upload-zone" (click)="fileInput.click()">
            <div class="upload-content">
              <div class="icon-circle"><mat-icon>cloud_upload</mat-icon></div>
              <h3>Rasmlarni yuklang yoki shu yerga tashlang</h3>
              <p class="upload-subtitle">Maksimal 10 ta rasm. Birinchi rasm asosiy bo'ladi.</p>
              
              <div class="upload-hints">
                <div class="hint-chip"><mat-icon>living</mat-icon> Mehmonxona</div>
                <div class="hint-chip"><mat-icon>bed</mat-icon> Yotoqxona</div>
                <div class="hint-chip"><mat-icon>countertops</mat-icon> Oshxona</div>
                <div class="hint-chip"><mat-icon>bathtub</mat-icon> Vanna</div>
              </div>

              <div class="upload-buttons">
                <button mat-flat-button type="button" class="btn-browse" (click)="$event.stopPropagation(); fileInput.click()">
                  <mat-icon>photo_library</mat-icon> Galereya
                </button>
                <button mat-flat-button type="button" class="btn-camera" (click)="$event.stopPropagation(); cameraInput.click()">
                  <mat-icon>photo_camera</mat-icon> Rasmga olish
                </button>
              </div>
            </div>
          </div>

          <!-- Preview Grid -->
          <div class="preview-grid" *ngIf="previews.length > 0">
            <div class="preview-card" *ngFor="let preview of previews; let i = index">
              <img [src]="preview.url" alt="Preview" />
              <button mat-icon-button class="remove-btn" (click)="removeImage(i, $event)">
                <mat-icon>close</mat-icon>
              </button>
              <div class="primary-badge" *ngIf="i === 0"><mat-icon>star</mat-icon> Asosiy</div>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button mat-button type="button" class="btn-cancel" (click)="onPrevious()">
            <mat-icon>arrow_back</mat-icon> Orqaga
          </button>
          <button
            mat-flat-button
            class="btn-submit"
            [disabled]="form.invalid || isSubmitting"
            (click)="onSubmit()"
          >
            <mat-spinner diameter="24" *ngIf="isSubmitting"></mat-spinner>
            <span *ngIf="!isSubmitting">🚀 E'lonni joylashtirish</span>
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
        gap: 28px;
      }
      .section-label {
        display: block;
        font-size: 0.85rem;
        font-weight: 700;
        color: #334155;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .optional-tag {
        font-size: 0.75rem;
        color: #94a3b8;
        font-weight: 400;
        text-transform: none;
        letter-spacing: 0;
      }

      .summary-card {
        background: white;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        border: 1px solid #e2e8f0;
      }
      .summary-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 16px;
        font-size: 1rem;
      }
      .summary-title mat-icon {
        color: #6366f1;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
      }
      .summary-item {
        background: #f8fafc;
        border-radius: 12px;
        padding: 10px 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .s-label {
        font-size: 0.72rem;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .s-value {
        font-size: 0.95rem;
        font-weight: 700;
        color: #1e293b;
      }
      .price-highlight {
        color: #6366f1;
      }

      .ai-hero {
        background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
        border: 2px solid #c4b5fd;
        border-radius: 20px;
        padding: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .ai-hero-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .ai-icon-wrap {
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #6366f1, #a855f7);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .ai-icon-wrap mat-icon {
        color: white;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .ai-hero h3 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
        color: #4c1d95;
      }
      .ai-hero p {
        margin: 4px 0 0;
        font-size: 0.9rem;
        color: #7c3aed;
      }
      .btn-ai-hero {
        height: 48px;
        padding: 0 28px;
        border-radius: 14px;
        font-weight: 700;
        background: linear-gradient(135deg, #6366f1, #a855f7) !important;
        color: white !important;
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      }
      .btn-ai-hero mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
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
        min-height: 280px;
        border: 2px dashed #cbd5e1;
        border-radius: 24px;
        background: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
      }

      .upload-zone::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(168,85,247,0.05) 100%);
        opacity: 0;
        transition: opacity 0.3s;
      }

      .upload-zone:hover {
        border-color: #6366f1;
        transform: scale(1.01);
      }

      .upload-zone:hover::before {
        opacity: 1;
      }

      .upload-content {
        position: relative;
        z-index: 1;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 32px;
      }

      .upload-subtitle {
        color: #64748b;
        font-size: 0.95rem;
        margin-bottom: 16px;
      }

      .upload-hints {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: center;
        margin-bottom: 24px;
      }

      .hint-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 16px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        font-size: 0.85rem;
        color: #475569;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }

      .hint-chip mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #64748b;
      }

      .upload-buttons {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 8px;
      }

      .btn-browse {
        background: white !important;
        color: #6366f1 !important;
        border: 2px solid #6366f1 !important;
        border-radius: 12px !important;
        padding: 0 24px !important;
        height: 44px !important;
        font-weight: 600 !important;
      }

      .btn-camera {
        background: linear-gradient(135deg, #6366f1, #a855f7) !important;
        color: white !important;
        border-radius: 12px !important;
        padding: 0 24px !important;
        height: 44px !important;
        font-weight: 600 !important;
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
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .primary-badge mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
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

  getPrice(): number | null {
    const type = this.basicInfoForm.get('listingType')?.value;
    if (type === 'Sale') return this.basicInfoForm.get('salePrice')?.value;
    if (type === 'Rent') return this.basicInfoForm.get('monthlyRent')?.value;
    if (type === 'ShortTermRent') return this.basicInfoForm.get('pricePerNight')?.value;
    return null;
  }

  typeLabel(v: string): string {
    const m: Record<string, string> = {
      Apartment: 'Kvartira',
      House: 'Uy/Hovli',
      Villa: 'Villa',
      Office: 'Ofis',
      Commercial: 'Tijorat',
      Land: 'Yer',
    };
    return m[v] || v;
  }

  listingLabel(v: string): string {
    const m: Record<string, string> = {
      Sale: 'Sotish',
      Rent: 'Ijara (oylik)',
      ShortTermRent: 'Kunlik ijara',
    };
    return m[v] || v;
  }

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

    // Simulate network delay
    setTimeout(() => {
      const mockDescription = this.generateMockDescription(basicInfo, location, amenities);
      this.typeTextEffect(mockDescription);
    }, 1500);
  }

  private typeTextEffect(text: string) {
    let currentText = '';
    let i = 0;
    this.form.patchValue({ description: '' });

    const interval = setInterval(() => {
      currentText += text.charAt(i);
      this.form.patchValue({ description: currentText });
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        this.isGeneratingAI = false;
      }
    }, 15); // Speed of typing
  }

  private generateMockDescription(basicInfo: any, location: any, amenities: string[]): string {
    const typeLabel = this.typeLabel(basicInfo.type).toLowerCase();
    const region = location.region || 'Toshkent';
    const city = location.city || 'shahar markazida';
    
    let desc = `Sizning e'tiboringizga ${region}ning qulay hududida, xususan ${city}da joylashgan ajoyib ${typeLabel}ni taqdim etamiz. Ushbu muhtasham mulk ${basicInfo.area} kv.m maydonga ega bo'lib, o'zining keng va yorug' ${basicInfo.numberOfBedrooms || 1} ta xonasi bilan ajralib turadi.\n\n`;
    
    if (amenities.length > 0) {
      desc += `Mulkda yashash yoki ishlash uchun barcha zamonaviy sharoitlar yaratilgan. Xususan: ${amenities.join(', ')} kabi qulayliklar mavjud.\n\n`;
    }
    
    desc += `Ajoyib infratuzilma, transport tugunlariga yaqinlik va xavfsiz muhit bu yerni ideal tanlovga aylantiradi. O'z orzuingizdagi makonni bugunoq kashf eting!`;
    
    return desc;
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

  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to WebP format with 80% quality
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          }, 'image/webp', 0.8);
        };
      };
    });
  }

  async onFilesSelected(event: any) {
    const files = event.target.files as FileList;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const originalFile = files[i];
      if (!originalFile.type.startsWith('image/')) continue;

      // Katta hajmli rasmni client-side (brauzer) o'zida WebP formatiga siqish!
      const file = await this.compressImage(originalFile);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const preview = { url: e.target.result, file };
        this.previews.push(preview);

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

import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ConfirmationService } from '../../../core/services/confirmation.service';

export interface UploadedImage {
  id?: string;
  file: File;
  previewUrl: string;
  caption?: string;
  isPrimary: boolean;
  uploadProgress?: number;
  isUploading: boolean;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    DragDropModule
  ],
  template: `
    <div class="image-upload-container">
      <!-- Upload Area -->
      <div 
        class="upload-area"
        [class.dragging]="isDragging()"
        [class.has-images]="images().length > 0"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()">
        
        <input 
          #fileInput
          type="file"
          multiple
          accept="image/*"
          (change)="onFileSelect($event)"
          hidden>
        
        <div class="upload-content">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <h3>Rasmlarni yuklang</h3>
          <p>Fayllarni shu yerga olib keling yoki bosing</p>
          <span class="file-types">JPEG, PNG, WEBP (maks. 10MB)</span>
          <button mat-raised-button color="primary" type="button" class="select-btn">
            <mat-icon>add_photo_alternate</mat-icon>
            Fayl tanlash
          </button>
        </div>
      </div>

      <!-- Image Gallery -->
      @if (images().length > 0) {
        <div class="gallery-section">
          <div class="gallery-header">
            <span class="image-count">{{ images().length }} ta rasm</span>
            <button mat-button color="warn" (click)="clearAll()">
              <mat-icon>delete_sweep</mat-icon>
              Hammasini o'chirish
            </button>
          </div>
          
          <div class="image-grid" cdkDropList (cdkDropListDropped)="reorderImages($event)">
            @for (image of images(); track image.previewUrl; let i = $index) {
              <div class="image-card" cdkDrag [class.primary]="image.isPrimary">
                <!-- Drag Handle -->
                <div class="drag-handle" cdkDragHandle>
                  <mat-icon>drag_indicator</mat-icon>
                </div>
                
                <!-- Image Preview -->
                <div class="image-preview">
                  <img [src]="image.previewUrl" [alt]="image.caption || 'Rasm ' + (i + 1)">
                  
                  @if (image.isUploading) {
                    <div class="upload-overlay">
                      <mat-progress-bar mode="determinate" [value]="image.uploadProgress"></mat-progress-bar>
                      <span class="progress-text">{{ image.uploadProgress }}%</span>
                    </div>
                  }
                  
                  <!-- Primary Badge -->
                  @if (image.isPrimary) {
                    <div class="primary-badge">
                      <mat-icon>star</mat-icon>
                      Asosiy
                    </div>
                  }
                </div>
                
                <!-- Image Actions -->
                <div class="image-actions">
                  <button 
                    mat-icon-button 
                    [color]="image.isPrimary ? 'accent' : ''"
                    (click)="setPrimary(i)"
                    [matTooltip]="image.isPrimary ? 'Asosiy rasm' : 'Asosiy qilish'">
                    <mat-icon>{{ image.isPrimary ? 'star' : 'star_border' }}</mat-icon>
                  </button>
                  
                  <button 
                    mat-icon-button
                    (click)="openCaptionDialog(i)"
                    matTooltip="Tavsif qo'shish">
                    <mat-icon>edit</mat-icon>
                  </button>
                  
                  <button 
                    mat-icon-button 
                    color="warn"
                    (click)="removeImage(i)"
                    matTooltip="O'chirish">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                
                @if (image.caption) {
                  <div class="image-caption">{{ image.caption }}</div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Tips -->
      <div class="tips-section">
        <mat-icon>lightbulb</mat-icon>
        <div class="tips-content">
          <strong>Maslahatlar:</strong>
          <ul>
            <li>Eng yaxshi natija uchun 1920x1080 yoki undan yuqori ruxsatdagi rasmlar yuklang</li>
            <li>Birinchi rasm avtomatik ravishda asosiy rasm sifatida belgilanadi</li>
            <li>Rasmlarni tartiblash uchun sudrab ko'chiring</li>
            <li>Yulduzcha belgisini bosing va asosiy rasmni o'zgartiring</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image-upload-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .upload-area {
      border: 3px dashed #e0e0e0;
      border-radius: 16px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
    }
    
    .upload-area:hover {
      border-color: #667eea;
      background: #f0f4ff;
    }
    
    .upload-area.dragging {
      border-color: #667eea;
      background: #e8eeff;
      transform: scale(1.01);
    }
    
    .upload-area.has-images {
      padding: 24px;
    }
    
    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    
    .upload-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #667eea;
    }
    
    .upload-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
    
    .upload-content p {
      color: #666;
      margin: 0;
    }
    
    .file-types {
      font-size: 0.85rem;
      color: #999;
      background: #f0f0f0;
      padding: 4px 12px;
      border-radius: 16px;
    }
    
    .select-btn {
      margin-top: 8px;
    }
    
    .gallery-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .gallery-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px;
    }
    
    .image-count {
      font-weight: 500;
      color: #666;
    }
    
    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .image-card {
      position: relative;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.2s;
      cursor: move;
    }
    
    .image-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      transform: translateY(-2px);
    }
    
    .image-card.primary {
      border: 2px solid #667eea;
    }
    
    .drag-handle {
      position: absolute;
      top: 8px;
      left: 8px;
      width: 32px;
      height: 32px;
      background: rgba(255,255,255,0.9);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: move;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    .image-card:hover .drag-handle {
      opacity: 1;
    }
    
    .drag-handle mat-icon {
      font-size: 20px;
      color: #666;
    }
    
    .image-preview {
      position: relative;
      aspect-ratio: 4/3;
      overflow: hidden;
      background: #f0f0f0;
    }
    
    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    
    .image-card:hover .image-preview img {
      transform: scale(1.05);
    }
    
    .upload-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.7);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .progress-text {
      color: white;
      font-size: 0.85rem;
      text-align: center;
    }
    
    .primary-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 4px;
      z-index: 10;
    }
    
    .primary-badge mat-icon {
      font-size: 14px;
    }
    
    .image-actions {
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #eee;
    }
    
    .image-caption {
      padding: 8px 12px;
      font-size: 0.85rem;
      color: #666;
      background: #f8f9fa;
      border-top: 1px solid #eee;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .tips-section {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: #e3f2fd;
      border-radius: 12px;
      border-left: 4px solid #2196f3;
    }
    
    .tips-section mat-icon {
      color: #2196f3;
      flex-shrink: 0;
    }
    
    .tips-content {
      font-size: 0.9rem;
      color: #333;
    }
    
    .tips-content ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
      color: #555;
    }
    
    .tips-content li {
      margin-bottom: 4px;
    }
    
    // Drag and drop animations
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 12px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    }
    
    .cdk-drag-placeholder {
      opacity: 0.3;
    }
    
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .image-grid.cdk-drop-list-dragging .image-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    @media (max-width: 768px) {
      .image-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .upload-area {
        padding: 32px 16px;
      }
      
      .upload-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }
    }
    
    @media (max-width: 480px) {
      .image-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ImageUploadComponent {
  private snackBar = inject(MatSnackBar);
  private confirmationService = inject(ConfirmationService);
  
  @Input() maxFileSize = 10 * 1024 * 1024; // 10MB
  @Input() maxFiles = 20;
  @Input() acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  @Output() imagesChange = new EventEmitter<UploadedImage[]>();
  @Output() imageUpload = new EventEmitter<UploadedImage>();
  @Output() imageRemove = new EventEmitter<number>();
  @Output() primaryChange = new EventEmitter<number>();
  
  images = signal<UploadedImage[]>([]);
  isDragging = signal(false);
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }
  
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
  }
  
  private processFiles(files: File[]): void {
    // Check max files limit
    if (this.images().length + files.length > this.maxFiles) {
      this.snackBar.open(`Eng ko'pi bilan ${this.maxFiles} ta rasm yuklash mumkin`, 'Yopish', { duration: 3000 });
      return;
    }
    
    for (const file of files) {
      // Validate file type
      if (!this.acceptedTypes.includes(file.type)) {
        this.snackBar.open(`Faqat ${this.acceptedTypes.join(', ')} formatlari qo'llab-quvvatlanadi`, 'Yopish', { duration: 3000 });
        continue;
      }
      
      // Validate file size
      if (file.size > this.maxFileSize) {
        this.snackBar.open(`Har bir rasm hajmi ${this.maxFileSize / (1024 * 1024)}MB dan oshmasligi kerak`, 'Yopish', { duration: 3000 });
        continue;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: UploadedImage = {
          file,
          previewUrl: e.target?.result as string,
          isPrimary: this.images().length === 0, // First image is primary
          isUploading: false
        };
        
        this.images.update(imgs => [...imgs, newImage]);
        this.imagesChange.emit(this.images());
        this.imageUpload.emit(newImage);
      };
      reader.readAsDataURL(file);
    }
  }
  
  removeImage(index: number): void {
    const wasPrimary = this.images()[index].isPrimary;
    
    this.images.update(imgs => {
      const newImgs = [...imgs];
      newImgs.splice(index, 1);
      
      // If removed image was primary and there are other images, make first one primary
      if (wasPrimary && newImgs.length > 0) {
        newImgs[0].isPrimary = true;
      }
      
      return newImgs;
    });
    
    this.imagesChange.emit(this.images());
    this.imageRemove.emit(index);
  }
  
  setPrimary(index: number): void {
    this.images.update(imgs => {
      return imgs.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
    });
    
    this.primaryChange.emit(index);
  }
  
  reorderImages(event: CdkDragDrop<UploadedImage[]>): void {
    this.images.update(imgs => {
      const newImgs = [...imgs];
      moveItemInArray(newImgs, event.previousIndex, event.currentIndex);
      return newImgs;
    });
    
    this.imagesChange.emit(this.images());
  }
  
  clearAll(): void {
    this.confirmationService
      .confirm({
        title: 'Rasmlarni tozalash',
        message: 'Barcha tanlangan rasmlarni olib tashlamoqchimisiz?',
        confirmLabel: 'Tozalash',
        tone: 'danger',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.images.set([]);
          this.imagesChange.emit([]);
        }
      });
  }
  
  openCaptionDialog(index: number): void {
    const caption = prompt('Rasm tavsifini kiriting:', this.images()[index].caption || '');
    if (caption !== null) {
      this.images.update(imgs => {
        const newImgs = [...imgs];
        newImgs[index] = { ...newImgs[index], caption };
        return newImgs;
      });
      
      this.imagesChange.emit(this.images());
    }
  }
  
  // Get primary image
  getPrimaryImage(): UploadedImage | null {
    return this.images().find(img => img.isPrimary) || this.images()[0] || null;
  }
  
  // Get all images as files for upload
  getFiles(): File[] {
    return this.images().map(img => img.file);
  }
  
  // Set upload progress for a specific image
  setUploadProgress(index: number, progress: number): void {
    this.images.update(imgs => {
      const newImgs = [...imgs];
      newImgs[index] = { 
        ...newImgs[index], 
        uploadProgress: progress,
        isUploading: progress < 100
      };
      return newImgs;
    });
  }
}

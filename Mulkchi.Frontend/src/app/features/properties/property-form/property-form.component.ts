import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { Property, PropertyType, PropertyCategory, ListingType, UzbekistanRegion } from '../../../core/models';
import { ImageUploadComponent, UploadedImage } from '../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatStepperModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ImageUploadComponent
  ],
  template: `
    <div class="property-form-container">
      <div class="container">
        <div class="page-header">
          <h1>{{ isEditMode() ? 'Mulkni tahrirlash' : 'Yangi mulk qo'shish' }}</h1>
          <p>E'lon ma'lumotlarini to'ldiring</p>
        </div>

        @if (loading()) {
          <div class="loading-container">
            <mat-progress-spinner diameter="50"></mat-progress-spinner>
            <p>Yuklanmoqda...</p>
          </div>
        } @else {
          <mat-card>
            <mat-stepper linear #stepper>
              <!-- Step 1: Basic Info -->
              <mat-step [stepControl]="basicInfoForm" label="Asosiy ma'lumotlar">
                <form [formGroup]="basicInfoForm" class="step-form">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Sarlavha</mat-label>
                      <input matInput formControlName="title" placeholder="Masalan: 3 xonali kvartira">
                      @if (basicInfoForm.get('title')?.invalid && basicInfoForm.get('title')?.touched) {
                        <mat-error>Sarlavha kiritilishi shart</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  <div class="form-row two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>Mulk turi</mat-label>
                      <mat-select formControlName="type">
                        @for (type of propertyTypes; track type.value) {
                          <mat-option [value]="type.value">{{ type.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Kategoriya</mat-label>
                      <mat-select formControlName="category">
                        @for (cat of categories; track cat.value) {
                          <mat-option [value]="cat.value">{{ cat.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <div class="form-row two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>E'lon turi</mat-label>
                      <mat-select formControlName="listingType">
                        @for (type of listingTypes; track type.value) {
                          <mat-option [value]="type.value">{{ type.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    @if (basicInfoForm.get('listingType')?.value === 'Sale') {
                      <mat-form-field appearance="outline">
                        <mat-label>Sotuv narxi</mat-label>
                        <input matInput type="number" formControlName="salePrice">
                        <span matSuffix>UZS</span>
                      </mat-form-field>
                    }

                    @if (basicInfoForm.get('listingType')?.value === 'Rent') {
                      <mat-form-field appearance="outline">
                        <mat-label>Oylik ijara</mat-label>
                        <input matInput type="number" formControlName="monthlyRent">
                        <span matSuffix>UZS/oy</span>
                      </mat-form-field>
                    }

                    @if (basicInfoForm.get('listingType')?.value === 'ShortTermRent') {
                      <mat-form-field appearance="outline">
                        <mat-label>Kunlik ijara</mat-label>
                        <input matInput type="number" formControlName="pricePerNight">
                        <span matSuffix>UZS/tun</span>
                      </mat-form-field>
                    }
                  </div>

                  <div class="form-row three-col">
                    <mat-form-field appearance="outline">
                      <mat-label>Maydoni (m²)</mat-label>
                      <input matInput type="number" formControlName="area">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Xonalar</mat-label>
                      <input matInput type="number" formControlName="numberOfBedrooms">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Hammomlar</mat-label>
                      <input matInput type="number" formControlName="numberOfBathrooms">
                    </mat-form-field>
                  </div>

                  <div class="step-actions">
                    <button mat-button type="button" routerLink="/host/properties">Bekor qilish</button>
                    <button mat-raised-button color="primary" type="button" matStepperNext>Keyingisi</button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 2: Location -->
              <mat-step [stepControl]="locationForm" label="Joylashuv">
                <form [formGroup]="locationForm" class="step-form">
                  <div class="form-row two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>Viloyat</mat-label>
                      <mat-select formControlName="region">
                        @for (region of regions; track region.value) {
                          <mat-option [value]="region.value">{{ region.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Shahar/Tuman</mat-label>
                      <input matInput formControlName="city" placeholder="Masalan: Yunusobod">
                    </mat-form-field>
                  </div>

                  <div class="form-row two-col">
                    <mat-form-field appearance="outline">
                      <mat-label>Tuman</mat-label>
                      <input matInput formControlName="district" placeholder="Masalan: Yunusobod tumani">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Mahalla</mat-label>
                      <input matInput formControlName="mahalla" placeholder="Masalan: Chinobod">
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>To'liq manzil</mat-label>
                      <textarea matInput formControlName="address" rows="3" placeholder="Ko'cha, uy raqami..."></textarea>
                    </mat-form-field>
                  </div>

                  <div class="step-actions">
                    <button mat-button type="button" matStepperPrevious>Orqaga</button>
                    <button mat-raised-button color="primary" type="button" matStepperNext>Keyingisi</button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 3: Amenities -->
              <mat-step label="Qulayliklar">
                <form [formGroup]="amenitiesForm" class="step-form">
                  <div class="amenities-section">
                    <h3>Asosiy qulayliklar</h3>
                    <div class="checkbox-grid">
                      <mat-checkbox formControlName="hasWifi">Wi-Fi</mat-checkbox>
                      <mat-checkbox formControlName="hasParking">Avtoturargoh</mat-checkbox>
                      <mat-checkbox formControlName="hasPool">Hovuz</mat-checkbox>
                      <mat-checkbox formControlName="hasAirConditioning">Konditsioner</mat-checkbox>
                      <mat-checkbox formControlName="hasHeating">Isitish</mat-checkbox>
                      <mat-checkbox formControlName="hasKitchen">Oshxona</mat-checkbox>
                      <mat-checkbox formControlName="hasTV">Televizor</mat-checkbox>
                      <mat-checkbox formControlName="hasWasher">Kir yuvish mashinasi</mat-checkbox>
                    </div>
                  </div>

                  <div class="amenities-section">
                    <h3>Xavfsizlik va qulaylik</h3>
                    <div class="checkbox-grid">
                      <mat-checkbox formControlName="hasElevator">Lift</mat-checkbox>
                      <mat-checkbox formControlName="hasSecurity">Qo'riqlash</mat-checkbox>
                      <mat-checkbox formControlName="hasGenerator">Generator</mat-checkbox>
                      <mat-checkbox formControlName="hasGas">Gaz</mat-checkbox>
                      <mat-checkbox formControlName="hasFurniture">Mebel</mat-checkbox>
                      <mat-checkbox formControlName="isRenovated">Tamirlangan</mat-checkbox>
                      <mat-checkbox formControlName="isSelfCheckIn">O'z kabineti</mat-checkbox>
                      <mat-checkbox formControlName="petsAllowed">Uy hayvonlariga ruxsat</mat-checkbox>
                    </div>
                  </div>

                  <div class="amenities-section">
                    <h3>Infratuzilma</h3>
                    <div class="checkbox-grid">
                      <mat-checkbox formControlName="hasMetroNearby">Metro yaqinida</mat-checkbox>
                      <mat-checkbox formControlName="hasBusStop">Avtobus bekatlari</mat-checkbox>
                      <mat-checkbox formControlName="hasMarketNearby">Bozor yaqinida</mat-checkbox>
                      <mat-checkbox formControlName="hasSchoolNearby">Maktab yaqinida</mat-checkbox>
                      <mat-checkbox formControlName="hasHospitalNearby">Shifoxona yaqinida</mat-checkbox>
                    </div>
                  </div>

                  <div class="step-actions">
                    <button mat-button type="button" matStepperPrevious>Orqaga</button>
                    <button mat-raised-button color="primary" type="button" matStepperNext>Keyingisi</button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 4: Description & Photos -->
              <mat-step label="Tavsif va rasmlar">
                <form [formGroup]="descriptionForm" class="step-form">
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Batafsil tavsif</mat-label>
                      <textarea matInput formControlName="description" rows="8" placeholder="Mulk haqida batafsil ma'lumot..."></textarea>
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Maksimal mehmonlar</mat-label>
                      <input matInput type="number" formControlName="maxGuests">
                    </mat-form-field>

                    <mat-checkbox formControlName="isInstantBook">Tez bron yoqish</mat-checkbox>
                  </div>

                  <div class="photo-upload-section">
                    <app-image-upload 
                      (imagesChange)="onImagesChange($event)"
                      (imageUpload)="onImageUpload($event)">
                    </app-image-upload>
                  </div>

                  <div class="step-actions">
                    <button mat-button type="button" matStepperPrevious>Orqaga</button>
                    <button 
                      mat-raised-button 
                      color="primary" 
                      type="button"
                      (click)="submitForm()"
                      [disabled]="isSubmitting()">
                      @if (isSubmitting()) {
                        <mat-progress-spinner diameter="20" class="inline-spinner"></mat-progress-spinner>
                        <span>Saqlanmoqda...</span>
                      } @else {
                        <span>{{ isEditMode() ? 'Yangilash' : 'E'lon qilish' }}</span>
                      }
                    </button>
                  </div>
                </form>
              </mat-step>
            </mat-stepper>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .property-form-container {
      min-height: calc(100vh - 64px);
      background: #f5f5f5;
      padding: 40px 0;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .page-header p {
      color: #666;
    }

    .loading-container {
      text-align: center;
      padding: 60px;
    }

    .step-form {
      padding: 24px 0;
    }

    .form-row {
      margin-bottom: 16px;
    }

    .form-row.two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-row.three-col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }

    .amenities-section {
      margin-bottom: 32px;
    }

    .amenities-section h3 {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 16px;
      color: #333;
    }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .photo-upload-section {
      margin-top: 24px;
    }

    .photo-upload-section h3 {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 48px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .upload-area:hover {
      border-color: #667eea;
    }

    .upload-area mat-icon {
      font-size: 48px;
      color: #999;
      margin-bottom: 16px;
    }

    .upload-area p {
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }

    .upload-area span {
      font-size: 0.9rem;
      color: #666;
    }

    .inline-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .form-row.two-col,
      .form-row.three-col {
        grid-template-columns: 1fr;
      }

      .checkbox-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .step-actions {
        flex-direction: column;
      }

      .step-actions button {
        width: 100%;
      }
    }
  `]
})
export class PropertyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isEditMode = signal(false);
  propertyId = signal<string | null>(null);
  loading = signal(false);
  isSubmitting = signal(false);

  propertyTypes = [
    { value: 'Apartment', label: 'Kvartira' },
    { value: 'House', label: 'Uy' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Office', label: 'Ofis' },
    { value: 'Commercial', label: 'Tijorat' },
    { value: 'Land', label: 'Yer' }
  ];

  categories = [
    { value: 'Residential', label: 'Turar joy' },
    { value: 'Commercial', label: 'Tijorat' },
    { value: 'Industrial', label: 'Sanoat' }
  ];

  listingTypes = [
    { value: 'Sale', label: 'Sotish' },
    { value: 'Rent', label: 'Ijaraga' },
    { value: 'ShortTermRent', label: 'Qisqa muddatli' }
  ];

  regions = [
    { value: 'Toshkent', label: 'Toshkent' },
    { value: 'ToshkentViloyati', label: 'Toshkent viloyati' },
    { value: 'Samarqand', label: 'Samarqand' },
    { value: 'Buxoro', label: 'Buxoro' },
    { value: 'Andijon', label: 'Andijon' },
    { value: 'Fargona', label: "Farg'ona" },
    { value: 'Namangan', label: 'Namangan' },
    { value: 'Xiva', label: 'Xorazm' },
    { value: 'Navoi', label: 'Navoi' },
    { value: 'Jizzax', label: 'Jizzax' },
    { value: 'Sirdaryo', label: 'Sirdaryo' },
    { value: 'Surxondaryo', label: 'Surxondaryo' },
    { value: 'Qashqadaryo', label: "Qashqadaryo" },
    { value: 'Guliston', label: 'Sirdaryo' },
    { value: 'Nukus', label: "Qoraqalpog'iston" }
  ];

  basicInfoForm = this.fb.group({
    title: ['', Validators.required],
    type: ['Apartment' as PropertyType, Validators.required],
    category: ['Residential' as PropertyCategory, Validators.required],
    listingType: ['Sale' as ListingType, Validators.required],
    salePrice: [0],
    monthlyRent: [0],
    pricePerNight: [0],
    area: [0, [Validators.required, Validators.min(1)]],
    numberOfBedrooms: [1, [Validators.required, Validators.min(0)]],
    numberOfBathrooms: [1, [Validators.required, Validators.min(0)]]
  });

  locationForm = this.fb.group({
    region: ['Toshkent' as UzbekistanRegion, Validators.required],
    city: ['', Validators.required],
    district: ['', Validators.required],
    mahalla: [''],
    address: ['', Validators.required]
  });

  amenitiesForm = this.fb.group({
    hasWifi: [false],
    hasParking: [false],
    hasPool: [false],
    hasAirConditioning: [false],
    hasHeating: [false],
    hasKitchen: [false],
    hasTV: [false],
    hasWasher: [false],
    hasElevator: [false],
    hasSecurity: [false],
    hasGenerator: [false],
    hasGas: [false],
    hasFurniture: [false],
    isRenovated: [false],
    isSelfCheckIn: [false],
    petsAllowed: [false],
    hasMetroNearby: [false],
    hasBusStop: [false],
    hasMarketNearby: [false],
    hasSchoolNearby: [false],
    hasHospitalNearby: [false]
  });

  descriptionForm = this.fb.group({
    description: ['', Validators.required],
    maxGuests: [1, [Validators.required, Validators.min(1)]],
    isInstantBook: [false]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.propertyId.set(id);
      this.loadProperty(id);
    }
  }

  loadProperty(id: string): void {
    this.loading.set(true);
    this.propertyService.getPropertyById(id).subscribe({
      next: (property) => {
        this.populateForms(property);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Mulk yuklashda xatolik', 'Yopish', { duration: 3000 });
        this.router.navigate(['/host/properties']);
      }
    });
  }

  populateForms(property: Property): void {
    this.basicInfoForm.patchValue({
      title: property.title,
      type: property.type,
      category: property.category,
      listingType: property.listingType,
      salePrice: property.salePrice || 0,
      monthlyRent: property.monthlyRent || 0,
      pricePerNight: property.pricePerNight || 0,
      area: property.area,
      numberOfBedrooms: property.numberOfBedrooms,
      numberOfBathrooms: property.numberOfBathrooms
    });

    this.locationForm.patchValue({
      region: property.region,
      city: property.city,
      district: property.district,
      mahalla: property.mahalla || '',
      address: property.address
    });

    this.amenitiesForm.patchValue({
      hasWifi: property.hasWifi,
      hasParking: property.hasParking,
      hasPool: property.hasPool,
      hasAirConditioning: property.hasAirConditioning,
      hasHeating: property.hasHeating,
      hasKitchen: property.hasKitchen,
      hasTV: property.hasTV,
      hasWasher: property.hasWasher,
      hasElevator: property.hasElevator,
      hasSecurity: property.hasSecurity,
      hasGenerator: property.hasGenerator,
      hasGas: property.hasGas,
      hasFurniture: property.hasFurniture,
      isRenovated: property.isRenovated,
      isSelfCheckIn: property.isSelfCheckIn,
      petsAllowed: property.petsAllowed,
      hasMetroNearby: property.hasMetroNearby,
      hasBusStop: property.hasBusStop,
      hasMarketNearby: property.hasMarketNearby,
      hasSchoolNearby: property.hasSchoolNearby,
      hasHospitalNearby: property.hasHospitalNearby
    });

    this.descriptionForm.patchValue({
      description: property.description,
      maxGuests: property.maxGuests,
      isInstantBook: property.isInstantBook
    });
  }

  submitForm(): void {
    if (this.basicInfoForm.invalid || this.locationForm.invalid || this.descriptionForm.invalid) {
      this.snackBar.open('Iltimos, barcha majburiy maydonlarni to\'ldiring', 'Yopish', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);

    const a = this.amenitiesForm.value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formData: Record<string, any> = {
      title: this.basicInfoForm.value.title!,
      type: this.basicInfoForm.value.type!,
      category: this.basicInfoForm.value.category!,
      listingType: this.basicInfoForm.value.listingType!,
      salePrice: this.basicInfoForm.value.salePrice || undefined,
      monthlyRent: this.basicInfoForm.value.monthlyRent || undefined,
      pricePerNight: this.basicInfoForm.value.pricePerNight || undefined,
      area: this.basicInfoForm.value.area!,
      numberOfBedrooms: this.basicInfoForm.value.numberOfBedrooms!,
      numberOfBathrooms: this.basicInfoForm.value.numberOfBathrooms!,
      region: this.locationForm.value.region!,
      city: this.locationForm.value.city!,
      district: this.locationForm.value.district!,
      mahalla: this.locationForm.value.mahalla || undefined,
      address: this.locationForm.value.address!,
      description: this.descriptionForm.value.description!,
      maxGuests: this.descriptionForm.value.maxGuests!,
      isInstantBook: this.descriptionForm.value.isInstantBook || false,
      hasWifi: !!a.hasWifi,
      hasParking: !!a.hasParking,
      hasPool: !!a.hasPool,
      hasAirConditioning: !!a.hasAirConditioning,
      hasHeating: !!a.hasHeating,
      hasKitchen: !!a.hasKitchen,
      hasTV: !!a.hasTV,
      hasWasher: !!a.hasWasher,
      hasElevator: !!a.hasElevator,
      hasSecurity: !!a.hasSecurity,
      hasGenerator: !!a.hasGenerator,
      hasGas: !!a.hasGas,
      hasFurniture: !!a.hasFurniture,
      isRenovated: !!a.isRenovated,
      isSelfCheckIn: !!a.isSelfCheckIn,
      petsAllowed: !!a.petsAllowed,
      hasMetroNearby: !!a.hasMetroNearby,
      hasBusStop: !!a.hasBusStop,
      hasMarketNearby: !!a.hasMarketNearby,
      hasSchoolNearby: !!a.hasSchoolNearby,
      hasHospitalNearby: !!a.hasHospitalNearby
    };

    if (this.isEditMode() && this.propertyId()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.propertyService.updateProperty(this.propertyId()!, formData as any).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Mulk yangilandi', 'Yopish', { duration: 3000 });
          this.router.navigate(['/host/properties']);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Yangilashda xatolik', 'Yopish', { duration: 3000 });
        }
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.propertyService.createProperty(formData as any).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('Mulk e\'lon qilindi', 'Yopish', { duration: 3000 });
          // Refresh user data to get updated Host role from backend
          this.authService.getCurrentUser().subscribe({
            next: () => {
              // Navigate to host properties after user data is refreshed
              this.router.navigate(['/host/properties']);
            },
            error: () => {
              // Even if refresh fails, navigate to host properties
              this.router.navigate(['/host/properties']);
            }
          });
        },
        error: () => {
          this.isSubmitting.set(false);
          this.snackBar.open('E\'lon qilishda xatolik', 'Yopish', { duration: 3000 });
        }
      });
    }
  }

  // Image handling
  selectedImages = signal<UploadedImage[]>([]);

  onImagesChange(images: UploadedImage[]): void {
    this.selectedImages.set(images);
  }

  onImageUpload(image: UploadedImage): void {
    // Image is ready for upload when form is submitted
    console.log('Image selected:', image.file.name);
  }

  uploadPhotos(): void {
    // This method is now handled by the image upload component
    console.log('Using image upload component instead');
  }
}

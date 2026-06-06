import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Currency,
  ListingType,
  Property,
  PropertyCategory,
  PropertyType,
  UzbekistanRegion,
} from '../../../core/models/property.model';
import { AuthService } from '../../../core/services/auth.service';
import { PropertyService } from '../../../core/services/property.service';
import { UploadedImage } from '../../../shared/components/image-upload/image-upload.component';

import { StepAmenitiesComponent } from './steps/step-amenities.component';
import { StepBasicInfoComponent } from './steps/step-basic-info.component';
import { StepDetailsComponent } from './steps/step-details.component';
import { StepImagesComponent } from './steps/step-images.component';
import { StepLocationComponent } from './steps/step-location.component';

@Component({
  selector: 'app-property-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    StepBasicInfoComponent,
    StepLocationComponent,
    StepDetailsComponent,
    StepAmenitiesComponent,
    StepImagesComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  animations: [],
  template: `
    <div class="wizard-wrapper">
      <!-- Top Navigation Stepper -->
      <header class="wizard-header">
        <div class="logo-box" routerLink="/">
          <mat-icon>home_work</mat-icon> <span>Mulkchi</span>
        </div>

        <div class="stepper-progress">
          <div class="progress-labels">
            <span class="step-label">{{ steps[currentStep()].label }}</span>
            <span class="step-count">Qadam {{ currentStep() + 1 }} / {{ steps.length }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="(currentStep() / (steps.length - 1)) * 100"
            ></div>
          </div>
        </div>

        <button mat-button class="btn-exit" routerLink="/host/properties">Chiqish</button>
      </header>

      <!-- Content Area -->
      <main class="wizard-content">
        <div class="step-container">
          <div class="loading-overlay" *ngIf="loading()">
            <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
          </div>

          <div [ngSwitch]="currentStep()">
            <app-step-basic-info
              *ngSwitchCase="0"
              [form]="basicInfoForm"
              (stepComplete)="nextStep()"
              (cancel)="onCancel()"
            ></app-step-basic-info>

            <app-step-location
              *ngSwitchCase="1"
              [form]="locationForm"
              (stepComplete)="nextStep()"
              (previous)="prevStep()"
            ></app-step-location>

            <app-step-details
              *ngSwitchCase="2"
              [form]="detailsForm"
              (stepComplete)="nextStep()"
              (previous)="prevStep()"
            ></app-step-details>

            <app-step-amenities
              *ngSwitchCase="3"
              [form]="amenitiesForm"
              (stepComplete)="nextStep()"
              (previous)="prevStep()"
            ></app-step-amenities>

            <app-step-images
              *ngSwitchCase="4"
              [form]="descriptionForm"
              [basicInfoForm]="basicInfoForm"
              [locationForm]="locationForm"
              [amenitiesForm]="amenitiesForm"
              [isSubmitting]="isSubmitting()"
              (stepComplete)="onFinalStep()"
              (previous)="prevStep()"
              (imagesChange)="handleImagesChange($event)"
              (imageUpload)="onImageUpload($event)"
            ></app-step-images>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        --primary: #6366f1;
        --slate-900: #0f172a;
        --glass: rgba(255, 255, 255, 0.8);
      }

      .wizard-wrapper {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: #f8fafc;
      }

      .wizard-header {
        height: 80px;
        background: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 40px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        position: sticky;
        top: 0;
        z-index: 50;
      }

      .logo-box {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--primary);
        cursor: pointer;
      }

      .logo-box mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .stepper-progress {
        flex: 1;
        max-width: 600px;
        margin: 0 40px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .progress-labels {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
      }

      .step-label {
        color: var(--slate-900);
      }
      .step-count {
        color: #64748b;
        font-size: 0.9rem;
      }

      .progress-bar {
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #6366f1, #a855f7);
        border-radius: 4px;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .btn-exit {
        color: #64748b;
        font-weight: 600;
      }

      .wizard-content {
        flex: 1;
        padding: 60px 24px;
        max-width: 800px;
        margin: 0 auto;
        width: 100%;
        position: relative;
      }

      .step-container {
        animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      @media (max-width: 1024px) {
        .wizard-sidebar {
          display: none;
        }
        .wizard-content {
          padding: 40px 24px;
        }
      }
    `,
  ],
})
export class PropertyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  currentStep = signal(0);
  isEditMode = signal(false);
  propertyId = signal<string | null>(null);
  loading = signal(false);
  isSubmitting = signal(false);

  steps = [
    { label: 'Asosiy', desc: 'Tur va narx', fullDesc: 'Mulkning asosiy parametrlarini kiriting' },
    {
      label: 'Joylashuv',
      desc: 'Manzil va xarita',
      fullDesc: "Mulk qayerda joylashganini ko'rsating",
    },
    {
      label: 'Tafsilotlar',
      desc: 'Xonalar va maydon',
      fullDesc: "Mulkning o'lchamlari va xonalari haqida",
    },
    {
      label: 'Qulayliklar',
      desc: 'Sharoitlar',
      fullDesc: 'Mulkdagi mavjud qulayliklarni belgilang',
    },
    {
      label: 'Rasmlar',
      desc: "Vizual ma'lumot",
      fullDesc: 'Mulkning rasmlari va tavsifini yuklang',
    },
  ];

  nextStep(): void {
    if (this.currentStep() < this.steps.length - 1) {
      this.currentStep.set(this.currentStep() + 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const element = document.querySelector('.wizard-content');
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const element = document.querySelector('.wizard-content');
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }

  goToStep(index: number): void {
    if (index < this.currentStep()) {
      this.currentStep.set(index);
    }
  }

  propertyTypes = [
    { value: 'Apartment', label: 'Kvartira' },
    { value: 'House', label: 'Uy' },
    { value: 'Villa', label: 'Villa' },
    { value: 'Office', label: 'Ofis' },
    { value: 'Commercial', label: 'Tijorat' },
    { value: 'Land', label: 'Yer' },
  ];

  categories = [
    { value: 'Residential', label: 'Turar joy' },
    { value: 'Commercial', label: 'Tijorat' },
    { value: 'Industrial', label: 'Sanoat' },
  ];

  listingTypes = [
    { value: 'Sale', label: 'Sotish' },
    { value: 'Rent', label: 'Ijaraga' },
    { value: 'ShortTermRent', label: 'Qisqa muddatli' },
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
    { value: 'Qashqadaryo', label: 'Qashqadaryo' },
    { value: 'Guliston', label: 'Sirdaryo' },
    { value: 'Nukus', label: "Qoraqalpog'iston" },
  ];

  basicInfoForm = this.fb.group({
    title: ['', Validators.required],
    type: ['Apartment' as PropertyType, Validators.required],
    category: ['Residential' as PropertyCategory, Validators.required],
    listingType: ['Sale' as ListingType, Validators.required],
    currency: ['UZS' as Currency, Validators.required],
    salePrice: [null as number | null],
    monthlyRent: [null as number | null],
    pricePerNight: [null as number | null],
    area: [null as number | null, [Validators.required, Validators.min(1)]],
    numberOfBedrooms: [1, [Validators.required, Validators.min(0)]],
    numberOfBathrooms: [1, [Validators.required, Validators.min(0)]],
  });

  detailsForm = this.fb.group({
    floor: [0, [Validators.required, Validators.min(0)]],
    totalFloors: [0, [Validators.required, Validators.min(1)]],
    yearBuilt: [new Date().getFullYear()],
    condition: ['Good'],
  });

  locationForm = this.fb.group({
    region: ['Toshkent' as UzbekistanRegion, Validators.required],
    city: ['', Validators.required],
    district: ['', Validators.required],
    mahalla: [''],
    address: ['', Validators.required],
    latitude: [41.2995],
    longitude: [69.2401],
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
    isChildFriendly: [false],
    isAccessible: [false],
    hasWorkspace: [false],
    petsAllowed: [false],
    hasMetroNearby: [false],
    hasBusStop: [false],
    hasMarketNearby: [false],
    hasSchoolNearby: [false],
    hasHospitalNearby: [false],
  });

  descriptionForm = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(20)]],
    virtualTourUrl: [''],
    maxGuests: [1, [Validators.required, Validators.min(1)]],
    isInstantBook: [false],
  });

  private updatePriceValidators(type: ListingType | string): void {
    const salePrice = this.basicInfoForm.get('salePrice');
    const monthlyRent = this.basicInfoForm.get('monthlyRent');
    const pricePerNight = this.basicInfoForm.get('pricePerNight');

    salePrice?.clearValidators();
    monthlyRent?.clearValidators();
    pricePerNight?.clearValidators();

    if (type === 'Sale' || type === ListingType.Sale) {
      salePrice?.setValidators([Validators.required, Validators.min(1)]);
    } else if (type === 'Rent' || type === ListingType.Rent) {
      monthlyRent?.setValidators([Validators.required, Validators.min(1)]);
    } else if (type === 'ShortTermRent' || type === ListingType.ShortTermRent) {
      pricePerNight?.setValidators([Validators.required, Validators.min(1)]);
    }

    salePrice?.updateValueAndValidity({ emitEvent: false });
    monthlyRent?.updateValueAndValidity({ emitEvent: false });
    pricePerNight?.updateValueAndValidity({ emitEvent: false });
  }

  ngOnInit(): void {
    this.updatePriceValidators(this.basicInfoForm.get('listingType')?.value || 'Sale');

    this.basicInfoForm.get('listingType')?.valueChanges.subscribe((type) => {
      if (type) this.updatePriceValidators(type);
    });

    const id = this.route.snapshot.paramMap.get('id');
    const typeParam = this.route.snapshot.paramMap.get('type');

    if (typeParam) {
      const typeMap: Record<string, ListingType> = {
        sale: ListingType.Sale,
        sotish: ListingType.Sale,
        rent: ListingType.Rent,
        ijara: ListingType.Rent,
        shorttermrent: ListingType.ShortTermRent,
        kunlik: ListingType.ShortTermRent,
      };
      const selectedType = typeMap[typeParam.toLowerCase()];
      if (selectedType) {
        this.basicInfoForm.patchValue({ listingType: selectedType });
      }
    }

    if (id) {
      this.isEditMode.set(true);
      this.propertyId.set(id);
      this.loadProperty(id);
    }
  }

  loadProperty(id: string): void {
    this.loading.set(true);
    this.propertyService.getPropertyById(id).subscribe({
      next: (property: Property) => {
        this.populateForms(property);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Mulk yuklashda xatolik', 'Yopish', { duration: 3000 });
        this.router.navigate(['/host/properties']);
      },
    });
  }

  populateForms(property: Property): void {
    this.basicInfoForm.patchValue({
      title: property.title,
      type: property.type,
      category: property.category,
      listingType: property.listingType,
      currency: property.currency,
      salePrice: property.salePrice ?? null,
      monthlyRent: property.monthlyRent ?? null,
      pricePerNight: property.pricePerNight ?? null,
      area: property.area ?? null,
      numberOfBedrooms: property.numberOfBedrooms || 0,
      numberOfBathrooms: property.numberOfBathrooms || 0,
    });

    this.detailsForm.patchValue({
      floor: (property as any).floor ?? 0,
      totalFloors: (property as any).totalFloors ?? 1,
      yearBuilt: (property as any).yearBuilt ?? new Date().getFullYear(),
      condition: (property as any).condition ?? 'Good',
    });

    this.locationForm.patchValue({
      region: property.region,
      city: property.city,
      district: property.district,
      mahalla: property.mahalla || '',
      address: property.address,
      latitude: property.latitude ?? 41.2995,
      longitude: property.longitude ?? 69.2401,
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
      hasHospitalNearby: property.hasHospitalNearby,
    });

    this.descriptionForm.patchValue({
      description: property.description,
      virtualTourUrl: (property as any).virtualTourUrl || '',
      maxGuests: property.maxGuests,
      isInstantBook: property.isInstantBook,
    });

    this.markFormsPristine();
  }

  submitForm(): void {
    if (this.basicInfoForm.invalid || this.locationForm.invalid || this.descriptionForm.invalid) {
      this.snackBar.open("Iltimos, barcha majburiy maydonlarni to'ldiring", 'Yopish', {
        duration: 3000,
      });
      return;
    }

    const listingType = this.basicInfoForm.value.listingType;
    if (listingType === 'Sale') {
      const salePrice = this.basicInfoForm.value.salePrice;
      if (salePrice == null || salePrice <= 0) {
        this.snackBar.open('Sotish narxi kiritilishi shart', 'Yopish', { duration: 3000 });
        return;
      }
    }

    if (listingType === 'Rent') {
      const monthlyRent = this.basicInfoForm.value.monthlyRent;
      if (monthlyRent == null || monthlyRent <= 0) {
        this.snackBar.open('Oylik ijara narxi kiritilishi shart', 'Yopish', { duration: 3000 });
        return;
      }
    }

    if (listingType === 'ShortTermRent') {
      const pricePerNight = this.basicInfoForm.value.pricePerNight;
      if (pricePerNight == null || pricePerNight <= 0) {
        this.snackBar.open('Kunlik ijara narxi kiritilishi shart', 'Yopish', { duration: 3000 });
        return;
      }
    }

    this.isSubmitting.set(true);

    const selectedRegion: string = this.locationForm.value.region ?? '';
    const regionMap: Record<string, number> = {
      Toshkent: 0,
      ToshkentViloyati: 1,
      Samarqand: 2,
      Buxoro: 3,
      Andijon: 4,
      Fargona: 5,
      Namangan: 6,
      Qashqadaryo: 7,
      Surxondaryo: 8,
      Xiva: 9,
      Navoi: 10,
      Jizzax: 11,
      Sirdaryo: 12,
      Guliston: 12,
      Nukus: 13,
      Qoraqalpogiston: 13,
    };

    const amenities = this.amenitiesForm.value;
    const propertyTypeMap: Record<string, number> = {
      Apartment: 0,
      House: 1,
      Villa: 2,
      Room: 3,
      Office: 4,
      Land: 5,
      Commercial: 6,
      Shop: 6,
      Other: 6,
    };
    const categoryMap: Record<string, number> = {
      Residential: 0,
      Commercial: 1,
      Industrial: 2,
      Agricultural: 3,
    };
    const listingTypeMap: Record<string, number> = {
      Rent: 0,
      Sale: 1,
      ShortTermRent: 2,
    };
    const currencyMap: Record<string, number> = {
      UZS: 0,
      USD: 1,
    };

    const formData: Record<string, any> = {
      title: this.basicInfoForm.value.title!,
      description: this.descriptionForm.value.description!,
      type: propertyTypeMap[this.basicInfoForm.value.type!] ?? 0,
      category: categoryMap[this.basicInfoForm.value.category!] ?? 0,
      listingType: listingTypeMap[this.basicInfoForm.value.listingType!] ?? 0,
      status: 0,
      monthlyRent: this.basicInfoForm.value.monthlyRent ?? null,
      salePrice: this.basicInfoForm.value.salePrice ?? null,
      pricePerNight: this.basicInfoForm.value.pricePerNight ?? null,
      area: this.basicInfoForm.value.area ?? 0,
      numberOfBedrooms: this.basicInfoForm.value.numberOfBedrooms ?? 0,
      numberOfBathrooms: this.basicInfoForm.value.numberOfBathrooms ?? 0,
      floor: this.detailsForm.value.floor ?? 0,
      totalFloors: this.detailsForm.value.totalFloors ?? 1,
      yearBuilt: this.detailsForm.value.yearBuilt ?? new Date().getFullYear(),
      condition: this.detailsForm.value.condition ?? 'Good',
      maxGuests: this.descriptionForm.value.maxGuests ?? 0,
      region: selectedRegion ? (regionMap[selectedRegion] ?? 0) : 0,
      city: this.locationForm.value.city!,
      district: this.locationForm.value.district || '',
      address: this.locationForm.value.address!,
      mahalla: this.locationForm.value.mahalla || '',
      latitude: Number(this.locationForm.value.latitude) || 41.2995,
      longitude: Number(this.locationForm.value.longitude) || 69.2401,
      currency: currencyMap[this.basicInfoForm.value.currency!] ?? 0,
      exchangeRate: 1.0,
      isInstantBook: !!this.descriptionForm.value.isInstantBook,
      isVacant: true,
      distanceToCityCenter: 0,

      hasWifi: !!amenities.hasWifi,
      hasParking: !!amenities.hasParking,
      hasPool: !!amenities.hasPool,
      petsAllowed: !!amenities.petsAllowed,
      hasAirConditioning: !!amenities.hasAirConditioning,
      hasHeating: !!amenities.hasHeating,
      hasWasher: !!amenities.hasWasher,
      hasKitchen: !!amenities.hasKitchen,
      hasTV: !!amenities.hasTV,
      hasWorkspace: !!amenities.hasWorkspace,
      isSelfCheckIn: !!amenities.isSelfCheckIn,
      isChildFriendly: !!amenities.isChildFriendly,
      isAccessible: !!amenities.isAccessible,

      hasMetroNearby: !!amenities.hasMetroNearby,
      hasBusStop: !!amenities.hasBusStop,
      hasMarketNearby: !!amenities.hasMarketNearby,
      hasSchoolNearby: !!amenities.hasSchoolNearby,
      hasHospitalNearby: !!amenities.hasHospitalNearby,

      hasElevator: !!amenities.hasElevator,
      hasSecurity: !!amenities.hasSecurity,
      hasGenerator: !!amenities.hasGenerator,
      hasGas: !!amenities.hasGas,
      hasFurniture: !!amenities.hasFurniture,
      isRenovated: !!amenities.isRenovated,
    };

    // attach virtual tour url if provided
    formData['virtualTourUrl'] = this.descriptionForm.value.virtualTourUrl || null;

    if (this.isEditMode() && this.propertyId()) {
      this.propertyService.updateProperty(this.propertyId()!, formData as any).subscribe({
        next: () => {
          this.uploadImages(this.propertyId()!);
        },
        error: (error: any) => {
          this.isSubmitting.set(false);
          const errorMsg = error?.error?.message || "Yangilashda noma'lum xatolik yuz berdi";
          this.snackBar.open(`❌ ${errorMsg}`, 'Yopish', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    } else {
      this.propertyService.createProperty(formData as any).subscribe({
        next: (property) => {
          this.uploadImages(property.id);
        },
        error: (error: any) => {
          this.isSubmitting.set(false);
          const errorMsg = error?.error?.message || "E'lon qilishda noma'lum xatolik yuz berdi";
          this.snackBar.open(`❌ ${errorMsg}`, 'Yopish', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    }
  }

  selectedFiles: File[] = [];
  selectedImages = signal<UploadedImage[]>([]);

  onImageUpload(image: UploadedImage): void {
    if (image.file) {
      this.selectedFiles.push(image.file);
    }
  }

  handleImagesChange(images: UploadedImage[]): void {
    this.selectedImages.set(images);
    this.selectedFiles = images.filter((i) => i.file).map((i) => i.file as File);
  }

  onFinalStep(): void {
    this.submitForm();
  }

  onLocationChange(location: { lat: number; lng: number }): void {
    this.locationForm.patchValue({
      latitude: location.lat,
      longitude: location.lng,
    });
  }

  get existingImageUrls(): string[] {
    return this.selectedImages().map((i: any) => i.previewUrl);
  }

  private uploadImages(propertyId: string): void {
    if (this.selectedFiles.length === 0) {
      this.finishSubmission();
      return;
    }

    const uploadObservables = this.selectedFiles.map((file) =>
      this.propertyService.uploadPropertyImage(file, propertyId),
    );

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(uploadObservables).subscribe({
        next: () => {
          this.finishSubmission();
        },
        error: (error) => {
          console.error('Image upload failed', error);
          const errorMessage =
            error instanceof Error && error.message
              ? error.message
              : "Mulk yaratildi, lekin ba'zi rasmlarni yuklashda xatolik yuz berdi.";

          this.finishSubmission(errorMessage);
        },
      });
    });
  }

  private finishSubmission(message?: string): void {
    this.isSubmitting.set(false);
    this.markFormsPristine();
    this.snackBar.open(message || '✅ Mulk muvaffaqiyatli yaratildi', 'Yopish', {
      duration: 5000,
      panelClass: ['success-snackbar'],
    });

    this.authService.getCurrentUser().subscribe({
      next: () => this.router.navigate(['/host/properties']),
      error: () => this.router.navigate(['/host/properties']),
    });
  }

  onCancel(): void {
    this.router.navigate(['/host/properties']);
  }

  hasUnsavedChanges(): boolean {
    return (
      this.basicInfoForm.dirty ||
      this.locationForm.dirty ||
      this.amenitiesForm.dirty ||
      this.descriptionForm.dirty
    );
  }

  private markFormsPristine(): void {
    this.basicInfoForm.markAsPristine();
    this.locationForm.markAsPristine();
    this.amenitiesForm.markAsPristine();
    this.descriptionForm.markAsPristine();
  }
}

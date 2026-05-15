import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate, query, group } from '@angular/animations';

import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  Property, 
  PropertyType, 
  PropertyCategory, 
  ListingType, 
  Currency, 
  UzbekistanRegion 
} from '../../../core/models/property.model';
import { UploadedImage } from '../../../shared/components/image-upload/image-upload.component';

import { StepBasicInfoComponent } from './steps/step-basic-info.component';
import { StepLocationComponent } from './steps/step-location.component';
import { StepDetailsComponent } from './steps/step-details.component';
import { StepAmenitiesComponent } from './steps/step-amenities.component';
import { StepImagesComponent } from './steps/step-images.component';

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
      <!-- Progress Sidebar -->
      <aside class="wizard-sidebar">
        <div class="sidebar-header">
          <div class="logo-box">
            <mat-icon>home_work</mat-icon>
          </div>
          <div class="header-text">
            <h2>Mulkchi</h2>
            <p>E'lon yaratish</p>
          </div>
        </div>

        <nav class="step-nav">
          <div 
            *ngFor="let step of steps; let i = index" 
            class="step-item"
            [class.active]="currentStep() === i"
            [class.completed]="currentStep() > i"
            (click)="goToStep(i)"
          >
            <div class="step-indicator">
              <span *ngIf="currentStep() <= i">{{ i + 1 }}</span>
              <mat-icon *ngIf="currentStep() > i">check</mat-icon>
            </div>
            <div class="step-label">
              <span class="label-title">{{ step.label }}</span>
              <span class="label-desc">{{ step.desc }}</span>
            </div>
          </div>
        </nav>

        <div class="sidebar-footer">
          <p>Yordam kerakmi? <b>+998 90 123 45 67</b></p>
        </div>
      </aside>

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
        --sidebar-width: 340px;
        --primary: #6366f1;
        --slate-900: #0f172a;
        --glass: rgba(255, 255, 255, 0.03);
      }

      .wizard-wrapper {
        display: flex;
        min-height: 100vh;
        background: #f8fafc;
      }

      .wizard-sidebar {
        width: var(--sidebar-width);
        background: var(--slate-900);
        color: white;
        padding: 48px 0;
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 0;
        height: 100vh;
        box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2);
        z-index: 50;
      }

      .sidebar-header {
        padding: 0 40px;
        margin-bottom: 64px;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .logo-box {
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
      }

      .logo-box mat-icon { color: white; font-size: 30px; width: 30px; height: 30px; }

      .header-text h2 { font-size: 1.6rem; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
      .header-text p { font-size: 0.85rem; color: #94a3b8; margin: 4px 0 0; }

      .step-nav { flex: 1; padding: 0 20px; }

      .step-item {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        margin-bottom: 12px;
      }

      .step-item:hover { background: var(--glass); }
      .step-item.active { 
        background: rgba(99, 102, 241, 0.1); 
        border: 1px solid rgba(99, 102, 241, 0.2); 
      }

      .step-indicator {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: #334155;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1rem;
        transition: all 0.4s ease;
      }

      .active .step-indicator { 
        background: #6366f1; 
        color: white; 
        box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
        transform: scale(1.05);
      }

      .completed .step-indicator { background: #10b981; color: white; }

      .label-title { display: block; font-size: 1rem; font-weight: 600; color: #f8fafc; }
      .label-desc { display: block; font-size: 0.8rem; color: #94a3b8; margin-top: 2px; }

      .sidebar-footer { padding: 40px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
      .sidebar-footer p { font-size: 0.85rem; color: #64748b; margin: 0; line-height: 1.6; }

      .wizard-content {
        flex: 1;
        padding: 60px 80px;
        max-width: 1200px;
        margin: 0 auto;
        position: relative;
      }

      .step-container {
        animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
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
        .wizard-sidebar { display: none; }
        .wizard-content { padding: 40px 24px; }
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
    { label: 'Asosiy', desc: 'Tur va narx', fullDesc: "Mulkning asosiy parametrlarini kiriting" },
    { label: 'Joylashuv', desc: 'Manzil va xarita', fullDesc: "Mulk qayerda joylashganini ko'rsating" },
    { label: 'Tafsilotlar', desc: 'Xonalar va maydon', fullDesc: "Mulkning o'lchamlari va xonalari haqida" },
    { label: 'Qulayliklar', desc: 'Sharoitlar', fullDesc: "Mulkdagi mavjud qulayliklarni belgilang" },
    { label: 'Rasmlar', desc: 'Vizual ma\'lumot', fullDesc: "Mulkning rasmlari va tavsifini yuklang" }
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
    maxGuests: [1, [Validators.required, Validators.min(1)]],
    isInstantBook: [false],
  });

  private updatePriceValidators(type: ListingType | string): void {
    const salePrice = this.basicInfoForm.get('salePrice');
    const monthlyRent = this.basicInfoForm.get('monthlyRent');
    const pricePerNight = this.basicInfoForm.get('pricePerNight');

    // Clear all price validators first
    salePrice?.clearValidators();
    monthlyRent?.clearValidators();
    pricePerNight?.clearValidators();

    // Add validators based on listing type
    if (type === 'Sale' || type === ListingType.Sale) {
      salePrice?.setValidators([Validators.required, Validators.min(1)]);
    } else if (type === 'Rent' || type === ListingType.Rent) {
      monthlyRent?.setValidators([Validators.required, Validators.min(1)]);
    } else if (type === 'ShortTermRent' || type === ListingType.ShortTermRent) {
      pricePerNight?.setValidators([Validators.required, Validators.min(1)]);
    }

    // Force update status
    salePrice?.updateValueAndValidity({ emitEvent: false });
    monthlyRent?.updateValueAndValidity({ emitEvent: false });
    pricePerNight?.updateValueAndValidity({ emitEvent: false });
  }

  ngOnInit(): void {
    // Initial validator setup
    this.updatePriceValidators(this.basicInfoForm.get('listingType')?.value || 'Sale');

    // Listen for listingType changes
    this.basicInfoForm.get('listingType')?.valueChanges.subscribe(type => {
      if (type) this.updatePriceValidators(type);
    });

    const id = this.route.snapshot.paramMap.get('id');
    const typeParam = this.route.snapshot.paramMap.get('type');

    // Pre-select listing type from route parameter (/elon-berish/:type)
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

    // Ensure conditional price fields required by listing type are provided
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

    // Map frontend region string values to backend UzbekistanRegion enum integer values
    const selectedRegion: string = this.locationForm.value.region ?? '';
    const regionMap: Record<string, number> = {
      Toshkent: 0, // ToshkentShahar
      ToshkentViloyati: 1, // ToshkentViloyat
      Samarqand: 2,
      Buxoro: 3,
      Andijon: 4,
      Fargona: 5,
      Namangan: 6,
      Qashqadaryo: 7,
      Surxondaryo: 8,
      Xiva: 9, // maps to Xorazm
      Navoi: 10,
      Jizzax: 11,
      Sirdaryo: 12,
      Guliston: 12, // frontend uses Guliston for Sirdaryo
      Nukus: 13, // Qoraqalpogiston
      Qoraqalpogiston: 13,
    };

    const amenities = this.amenitiesForm.value;
    // Map frontend string enums to backend integer enums
    const propertyTypeMap: Record<string, number> = {
      'Apartment': 0, 'House': 1, 'Villa': 2, 'Room': 3, 'Office': 4, 'Land': 5, 'Commercial': 6
    };
    const categoryMap: Record<string, number> = {
      'Residential': 0, 'Commercial': 1, 'Industrial': 2, 'Agricultural': 3
    };
    const listingTypeMap: Record<string, number> = {
      'Rent': 0, 'Sale': 1, 'ShortTermRent': 2
    };
    const currencyMap: Record<string, number> = {
      'UZS': 0, 'USD': 1
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formData: Record<string, any> = {
      title: this.basicInfoForm.value.title!,
      description: this.descriptionForm.value.description!,
      type: propertyTypeMap[this.basicInfoForm.value.type!] ?? 0,
      category: categoryMap[this.basicInfoForm.value.category!] ?? 0,
      listingType: listingTypeMap[this.basicInfoForm.value.listingType!] ?? 0,
      status: 0, // Active
      monthlyRent: this.basicInfoForm.value.monthlyRent ?? null,
      salePrice: this.basicInfoForm.value.salePrice ?? null,
      pricePerNight: this.basicInfoForm.value.pricePerNight ?? null,
      area: this.basicInfoForm.value.area ?? 0,
      numberOfBedrooms: this.basicInfoForm.value.numberOfBedrooms ?? 0,
      numberOfBathrooms: this.basicInfoForm.value.numberOfBathrooms ?? 0,
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
      
      // Amenities
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

      // Infrastructure
      hasMetroNearby: !!amenities.hasMetroNearby,
      hasBusStop: !!amenities.hasBusStop,
      hasMarketNearby: !!amenities.hasMarketNearby,
      hasSchoolNearby: !!amenities.hasSchoolNearby,
      hasHospitalNearby: !!amenities.hasHospitalNearby,

      // Comfort
      hasElevator: !!amenities.hasElevator,
      hasSecurity: !!amenities.hasSecurity,
      hasGenerator: !!amenities.hasGenerator,
      hasGas: !!amenities.hasGas,
      hasFurniture: !!amenities.hasFurniture,
      isRenovated: !!amenities.isRenovated,
    };

    if (this.isEditMode() && this.propertyId()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Image handling
  selectedFiles: File[] = [];
  selectedImages = signal<UploadedImage[]>([]);

  onImageUpload(image: UploadedImage): void {
    // This is called from the step component when a new image is added
    if (image.file) {
      this.selectedFiles.push(image.file);
    }
  }

  handleImagesChange(images: UploadedImage[]): void {
    this.selectedImages.set(images);
    this.selectedFiles = images.filter(i => i.file).map(i => i.file as File);
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

    const uploadObservables = this.selectedFiles.map(file => 
      this.propertyService.uploadPropertyImage(file, propertyId)
    );

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(uploadObservables).subscribe({
        next: () => {
          this.finishSubmission();
        },
        error: (error) => {
          console.error('Image upload failed', error);
          this.finishSubmission("Mulk yaratildi, lekin ba'zi rasmlarni yuklashda xatolik yuz berdi.");
        }
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

    // Refresh user data to get updated Host role from backend
    this.authService.getCurrentUser().subscribe({
      next: () => this.router.navigate(['/host/properties']),
      error: () => this.router.navigate(['/host/properties'])
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

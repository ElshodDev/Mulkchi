import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, inject, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { UzbekistanRegion, Property } from '../../core/models';
import { AIPriceRequest, AIService } from '../../core/services/ai.service';
import { PropertyService } from '../../core/services/property.service';
import { ImageOptimizationService } from '../../core/services/image-optimization.service';
import { Router } from '@angular/router';
interface AiPricePredictionView {
  recommendedPrice: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  pricePerSqm?: number;
  marketAverage: number;
  comparisonPercentage: number;
  comparisonMessage: string;
  confidence: number;
  priceLevel?: string;
  similarCount?: number;
  factorBreakdown?: Record<string, number>;
  regionalData?: {
    region: string;
    averagePrice: number;
  }[];
  estimatedRent?: number;
  roi?: number | string;
  marketScore?: number;
}

@Component({
  selector: 'app-ai-price',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatCheckboxModule,
    MatDialogModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate(
          '500ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ transform: 'translateY(0)', opacity: 1 }),
        ),
      ]),
    ]),
  ],
  templateUrl: './ai-price.component.html',
  styleUrls: ['./ai-price.component.scss'],
})
export class AiPriceComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  aiService = inject(AIService);
  private propertyService = inject(PropertyService);
  protected imageOptimizationService = inject(ImageOptimizationService);
  private router = inject(Router);

  chartCanvas = viewChild<any>('chartCanvas');
  private chart: Chart | null = null;

  similarRealProperties: Property[] = [];
  isLoadingSimilar = false;

  regions = Object.values(UzbekistanRegion);

  propertyTypes = [
    { value: 'Apartment', label: 'Kvartira' },
    { value: 'House', label: 'Uy' },
    { value: 'Office', label: 'Ofis' },
    { value: 'Commercial', label: 'Tijorat' },
  ];

  roomOptions = Array.from({ length: 10 }, (_, i) => i + 1);

  priceForm = this.fb.group({
    region: ['', Validators.required],
    propertyType: ['', Validators.required],
    area: [null as any, [Validators.required, Validators.min(1)]],
    rooms: [null as any, [Validators.required, Validators.min(1)]],
    floor: [null as any, [Validators.required, Validators.min(1)]],
    totalFloors: [null as any, [Validators.required, Validators.min(1)]],
    buildingAge: [null as any, [Validators.required, Validators.min(0)]],
    isRenovated: [false],
    hasFurniture: [false],
    hasParking: [false],
    hasElevator: [false],
    hasAirConditioning: [false],
    hasWifi: [false],
    hasSecurity: [false],
    hasMetroNearby: [false],
    hasPool: [false],
    listingType: ['Sale' as 'Sale' | 'Rent' | 'ShortTermRent', Validators.required],
  });

  get isLoading(): boolean {
    return this.aiService.loading();
  }

  get prediction(): AiPricePredictionView | null {
    const result = this.aiService.priceResult();
    if (!result) return null;

    const viewModel = result as AiPricePredictionView;
    const area = Number(this.priceForm.value.area || 0) || 1;
    const price = viewModel.recommendedPrice || 0;

    const pricePerSqm = viewModel.pricePerSqm ?? Math.round(price / area);
    const estimatedRent =
      viewModel.estimatedRent ??
      (this.priceForm.value.listingType === 'Sale' ? Math.round(price * 0.007) : 0);
    const roi =
      viewModel.roi ??
      (this.priceForm.value.listingType === 'Sale'
        ? Number((((estimatedRent * 12) / Math.max(price, 1)) * 100).toFixed(1))
        : 0);
    const marketScore =
      viewModel.marketScore ?? Math.round(Math.min(95, 40 + (viewModel.confidence || 0) * 50));

    return {
      ...viewModel,
      pricePerSqm,
      estimatedRent,
      roi,
      marketScore,
    };
  }

  get confidencePercent(): number {
    return Math.round((this.prediction?.confidence || 0) * 100);
  }

  ngOnInit(): void {
    this.aiService.clearResult();
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  predict(): void {
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.priceForm.invalid) return;

    const request: AIPriceRequest = this.priceForm.value as AIPriceRequest;
    this.similarRealProperties = [];

    this.aiService.predictPrice(request).subscribe({
      next: () => {
        setTimeout(() => this.renderChart(), 100);
        this.fetchSimilarProperties(request);
      },
      error: () => {
      },
    });
  }

  fetchSimilarProperties(request: AIPriceRequest): void {
    this.isLoadingSimilar = true;
    this.propertyService
      .searchProperties({
        listingType: request.listingType as any,
        propertyType: request.propertyType as any,
        region: request.region as any,
        location: request.region,
        pageSize: 3,
      })
      .subscribe({
        next: (res: any) => {
          this.similarRealProperties = res.items || [];
          this.isLoadingSimilar = false;
        },
        error: () => {
          this.isLoadingSimilar = false;
        },
      });
  }

  navigateToProperty(id: string) {
    this.router.navigate(['/properties', id]);
  }

  getImageUrl(p: any) {
    const rawUrl = p.images?.[0]?.url || p.images?.[0]?.thumbnailUrl;
    if (rawUrl) {
      return this.imageOptimizationService.getOptimizedImage(rawUrl, 600, 400);
    }
    return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600&auto=format&fit=crop';
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) return '0';
    return price.toLocaleString('uz-UZ');
  }

  getGaugeColor(confidence: number): string {
    if (confidence >= 0.8) return 'var(--color-success)';
    if (confidence >= 0.6) return 'var(--color-gold)';
    return 'var(--color-error)';
  }

  getGaugeOffset(confidence: number): number {
    return 251.2 - 251.2 * confidence;
  }

  getMarketBadgeClass(): string {
    const score = this.prediction?.marketScore || 0;
    if (score >= 60) return 'high';
    if (score >= 35) return 'medium';
    return 'low';
  }

  getMarketLabel(): string {
    const score = this.prediction?.marketScore || 0;
    if (score >= 60) return 'Yuqori talab';
    if (score >= 35) return "O'rtacha";
    return 'Qulay narx';
  }

  getMarketHint(): string {
    const score = this.prediction?.marketScore || 0;
    if (score >= 60) return "Bozor o'rtachasidan yuqori narxda sotilishi mumkin";
    if (score >= 35) return "Bozor o'rtacha narxida";
    return "Bozor o'rtachasidan past narxda — juda qulay!";
  }

  getComparisonPercentage(): number {
    const result = this.prediction;
    if (!result) return 0;
    return Math.round(result.comparisonPercentage || 0);
  }

  getComparisonBarValue(): number {
    const percentage = this.getComparisonPercentage();
    return Math.max(0, Math.min(100, 50 + percentage));
  }

  getComparisonLabel(): string {
    return this.getComparisonPercentage() <= 0
      ? "✓ Bozor o'rtachasidan past narxdasiz"
      : "⚠ Bozor o'rtachasidan yuqori narxdasiz";
  }

  getPricePerSqm(): number {
    const result = this.prediction;
    const area = this.priceForm.value.area;
    if (!result || !area || area <= 0) return 0;
    return Math.round((result.recommendedPrice || 0) / area);
  }

  getFactorKeys(): string[] {
    const result = this.prediction;
    if (!result?.factorBreakdown) return [];
    return Object.keys(result.factorBreakdown);
  }

  getFactorEntries(): { key: string; value: number }[] {
    const result = this.prediction;
    if (!result?.factorBreakdown) return [];
    return Object.entries(result.factorBreakdown).map(([key, value]) => ({
      key,
      value: value as number,
    }));
  }

  private renderChart(): void {
    const canvas = this.chartCanvas()?.nativeElement;
    if (!canvas) return;

    const regionalData = this.aiService.priceResult()?.regionalData;
    if (!regionalData || regionalData.length === 0) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: regionalData.map((d) => d.region),
        datasets: [
          {
            label: "O'rtacha narx",
            data: regionalData.map((d) => d.averagePrice),
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return this.formatPrice(context.raw as number) + ' ' + (this.prediction?.currency || 'USD');
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => {
                const num = value as number;
                if (num >= 1000000) {
                  return (num / 1000000).toFixed(1) + 'M';
                }
                if (num >= 1000) {
                  return (num / 1000).toFixed(0) + 'K';
                }
                return num;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }
}

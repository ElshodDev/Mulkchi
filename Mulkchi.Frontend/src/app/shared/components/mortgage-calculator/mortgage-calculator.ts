import { Component, Input, computed, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

type MortgageType = 'davlat' | 'tijorat' | 'rassrochka';

@Component({
  selector: 'app-mortgage-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSliderModule],
  template: `
    <div class="mortgage-calc-glass">
      <div class="calc-header">
        <div class="icon-wrapper">
          <mat-icon>account_balance</mat-icon>
        </div>
        <div class="header-text">
          <h3>Haqiqiy Ipoteka Kalkulyatori</h3>
          <p>O'zbekiston banklari shartlari asosida</p>
        </div>
      </div>

      <!-- Mortgage Types -->
      <div class="mortgage-types">
        <button class="type-btn" [class.active]="activeType() === 'davlat'" (click)="setType('davlat')">
          <mat-icon>verified</mat-icon>
          <span>Davlat (17.5%)</span>
        </button>
        <button class="type-btn" [class.active]="activeType() === 'tijorat'" (click)="setType('tijorat')">
          <mat-icon>business_center</mat-icon>
          <span>Tijorat (24%)</span>
        </button>
        <button class="type-btn" [class.active]="activeType() === 'rassrochka'" (click)="setType('rassrochka')">
          <mat-icon>schedule</mat-icon>
          <span>Muddatli (0%)</span>
        </button>
      </div>

      <div class="calc-body">
        <!-- Loan Amount -->
        <div class="input-group">
          <div class="label-row">
            <label>Mulk Narxi</label>
            <span class="value">{{ price() | number }} {{ currency() }}</span>
          </div>
          <div class="slider-wrapper">
            <mat-slider class="custom-slider" min="100000000" [max]="price() * 2" step="10000000">
              <input matSliderThumb [(ngModel)]="priceValue" (ngModelChange)="updateSignals()">
            </mat-slider>
          </div>
        </div>

        <!-- Down Payment -->
        <div class="input-group">
          <div class="label-row">
            <label>Boshlang'ich to'lov ({{ downPaymentPercent() }}%)</label>
            <span class="value">{{ downPaymentAmount() | number }} {{ currency() }}</span>
          </div>
          <div class="slider-wrapper">
            <mat-slider class="custom-slider" [min]="minDownPercent()" max="90" step="1">
              <input matSliderThumb [(ngModel)]="downPaymentPercentValue" (ngModelChange)="updateSignals()">
            </mat-slider>
          </div>
        </div>

        <!-- Interest Rate -->
        <div class="input-group">
          <div class="label-row">
            <label>Yillik foiz stavkasi</label>
            <span class="value">{{ interestRate() }}%</span>
          </div>
          <div class="slider-wrapper">
            <mat-slider class="custom-slider" min="0" max="35" step="0.5">
              <input matSliderThumb [(ngModel)]="interestRateValue" (ngModelChange)="updateSignals()">
            </mat-slider>
          </div>
        </div>

        <!-- Loan Term -->
        <div class="input-group">
          <div class="label-row">
            <label>Kredit muddati</label>
            <span class="value">{{ loanTermYears() }} yil ({{ loanTermYears() * 12 }} oy)</span>
          </div>
          <div class="slider-wrapper">
            <mat-slider class="custom-slider" min="1" [max]="maxYears()" step="1">
              <input matSliderThumb [(ngModel)]="loanTermYearsValue" (ngModelChange)="updateSignals()">
            </mat-slider>
          </div>
        </div>
      </div>

      <!-- Detailed Result Breakdown -->
      <div class="calc-result">
        <div class="result-box primary-result">
          <div class="result-label">Oylik to'lov</div>
          <div class="result-value">
            {{ monthlyPayment() | number: '1.0-0' }} <span class="currency">{{ currency() }}</span>
          </div>
        </div>
        
        <div class="breakdown-grid">
          <div class="breakdown-item">
            <span class="dot blue"></span>
            <div class="bd-info">
              <span class="bd-label">Asosiy qarz</span>
              <span class="bd-val">{{ principal() | number: '1.0-0' }} {{ currency() }}</span>
            </div>
          </div>
          <div class="breakdown-item">
            <span class="dot red"></span>
            <div class="bd-info">
              <span class="bd-label">Bank ustamasi (Ortiqcha)</span>
              <span class="bd-val">{{ overpayment() | number: '1.0-0' }} {{ currency() }}</span>
            </div>
          </div>
          <div class="breakdown-item full-width">
            <span class="dot green"></span>
            <div class="bd-info">
              <span class="bd-label">Umumiy to'lanadigan summa</span>
              <span class="bd-val">{{ totalPayment() | number: '1.0-0' }} {{ currency() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mortgage-calc-glass {
      background: white;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      margin-bottom: 32px;
      font-family: 'Inter', sans-serif;
    }
    .calc-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .icon-wrapper {
      width: 48px;
      height: 48px;
      background: #eef2ff;
      color: #4338ca;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-text h3 {
      margin: 0 0 4px;
      font-size: 1.3rem;
      font-weight: 800;
      color: #0f172a;
    }
    .header-text p {
      margin: 0;
      font-size: 0.95rem;
      color: #64748b;
    }
    
    .mortgage-types {
      display: flex;
      gap: 12px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .type-btn {
      flex: 1;
      min-width: 140px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 1px solid #cbd5e1;
      background: white;
      border-radius: 14px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .type-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .type-btn:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .type-btn.active {
      background: #4f46e5;
      color: white;
      border-color: #4f46e5;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }

    .input-group {
      margin-bottom: 24px;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .label-row label {
      font-weight: 600;
      font-size: 0.95rem;
      color: #334155;
    }
    .label-row .value {
      font-weight: 800;
      color: #4338ca;
    }
    .slider-wrapper {
      margin: 0 -8px;
    }
    ::ng-deep .custom-slider .mdc-slider__track--active {
      background-color: #4338ca !important;
    }
    ::ng-deep .custom-slider .mdc-slider__thumb-knob {
      background-color: #4338ca !important;
      border-color: #4338ca !important;
    }
    
    .calc-result {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px dashed #cbd5e1;
    }
    .primary-result {
      text-align: center;
      margin-bottom: 24px;
      background: #f8fafc;
      padding: 24px;
      border-radius: 20px;
      border: 1px solid #e2e8f0;
    }
    .result-label {
      font-size: 1rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .result-value {
      font-size: 2.5rem;
      font-weight: 900;
      color: #0f172a;
    }
    .result-value .currency {
      font-size: 1.2rem;
      font-weight: 700;
      color: #4338ca;
    }
    
    .breakdown-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .breakdown-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #f1f5f9;
      padding: 16px;
      border-radius: 16px;
    }
    .breakdown-item.full-width {
      grid-column: 1 / -1;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-top: 4px;
      flex-shrink: 0;
    }
    .dot.blue { background: #3b82f6; }
    .dot.red { background: #ef4444; }
    .dot.green { background: #10b981; }
    
    .bd-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .bd-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
    }
    .bd-val {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
    }

    @media (max-width: 640px) {
      .breakdown-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MortgageCalculatorComponent implements OnInit {
  @Input() set propertyPrice(val: number) {
    if (val > 0) {
      this.priceValue = val;
      this.updateSignals();
    }
  }
  @Input() currencyType: string = 'UZS';

  activeType = signal<MortgageType>('tijorat');

  priceValue = 400000000;
  downPaymentPercentValue = 25;
  interestRateValue = 24;
  loanTermYearsValue = 15;

  minDownPercent = signal(25);
  maxYears = signal(15);

  price = signal(400000000);
  currency = signal('UZS');
  downPaymentPercent = signal(25);
  interestRate = signal(24);
  loanTermYears = signal(15);

  constructor() {}

  ngOnInit() {
    this.currency.set(this.currencyType);
    this.updateSignals();
  }

  setType(type: MortgageType) {
    this.activeType.set(type);
    
    switch(type) {
      case 'davlat':
        this.minDownPercent.set(15);
        this.maxYears.set(20);
        this.downPaymentPercentValue = Math.max(15, this.downPaymentPercentValue);
        this.interestRateValue = 17.5;
        this.loanTermYearsValue = Math.min(20, this.loanTermYearsValue);
        break;
      case 'tijorat':
        this.minDownPercent.set(25);
        this.maxYears.set(15);
        this.downPaymentPercentValue = Math.max(25, this.downPaymentPercentValue);
        this.interestRateValue = 24;
        this.loanTermYearsValue = Math.min(15, this.loanTermYearsValue);
        break;
      case 'rassrochka':
        this.minDownPercent.set(30);
        this.maxYears.set(3);
        this.downPaymentPercentValue = Math.max(30, this.downPaymentPercentValue);
        this.interestRateValue = 0;
        this.loanTermYearsValue = Math.min(3, this.loanTermYearsValue);
        break;
    }
    
    this.updateSignals();
  }

  updateSignals() {
    if (this.downPaymentPercentValue < this.minDownPercent()) {
      this.downPaymentPercentValue = this.minDownPercent();
    }
    if (this.loanTermYearsValue > this.maxYears()) {
      this.loanTermYearsValue = this.maxYears();
    }

    this.price.set(this.priceValue);
    this.downPaymentPercent.set(this.downPaymentPercentValue);
    this.interestRate.set(this.interestRateValue);
    this.loanTermYears.set(this.loanTermYearsValue);
  }

  downPaymentAmount = computed(() => {
    return (this.price() * this.downPaymentPercent()) / 100;
  });

  principal = computed(() => {
    return this.price() - this.downPaymentAmount();
  });

  monthlyPayment = computed(() => {
    const p = this.principal();
    const r = (this.interestRate() / 100) / 12;
    const n = this.loanTermYears() * 12;
    if (r === 0) return p / n;
    return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  });

  totalPayment = computed(() => {
    return this.monthlyPayment() * (this.loanTermYears() * 12);
  });

  overpayment = computed(() => {
    return this.totalPayment() - this.principal();
  });
}

import { Component, Input, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-mortgage-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatSliderModule],
  template: `
    <div class="mortgage-calc-glass">
      <div class="calc-header">
        <div class="icon-wrapper">
          <mat-icon>calculate</mat-icon>
        </div>
        <div class="header-text">
          <h3>Ipoteka Kalkulyatori</h3>
          <p>Oylik to'lovni hisoblang</p>
        </div>
      </div>

      <div class="calc-body">
        <!-- Loan Amount -->
        <div class="input-group">
          <div class="label-row">
            <label>Mulk Narxi</label>
            <span class="value">{{ price() | number }} {{ currency() }}</span>
          </div>
          <div class="slider-wrapper">
            <mat-slider class="custom-slider" min="10000" [max]="price() * 2" step="1000">
              <input matSliderThumb [(ngModel)]="priceValue">
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
            <mat-slider class="custom-slider" min="10" max="90" step="1">
              <input matSliderThumb [(ngModel)]="downPaymentPercentValue">
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
            <mat-slider class="custom-slider" min="1" max="30" step="0.5">
              <input matSliderThumb [(ngModel)]="interestRateValue">
            </mat-slider>
          </div>
        </div>

        <!-- Loan Term -->
        <div class="input-group">
          <div class="label-row">
            <label>Kredit muddati</label>
            <span class="value">{{ loanTermYears() }} yil</span>
          </div>
          <div class="slider-wrapper">
            <mat-slider class="custom-slider" min="1" max="30" step="1">
              <input matSliderThumb [(ngModel)]="loanTermYearsValue">
            </mat-slider>
          </div>
        </div>
      </div>

      <div class="calc-result">
        <div class="result-label">Taxminiy oylik to'lov</div>
        <div class="result-value">
          {{ monthlyPayment() | number: '1.0-0' }} <span class="currency">{{ currency() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mortgage-calc-glass {
      background: white;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.03);
      border: 1px solid #e2e8f0;
      margin-bottom: 32px;
    }
    .calc-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;
    }
    .icon-wrapper {
      width: 48px;
      height: 48px;
      background: #e0e7ff;
      color: #4338ca;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-text h3 {
      margin: 0 0 4px;
      font-size: 1.25rem;
      font-weight: 800;
      color: #0f172a;
    }
    .header-text p {
      margin: 0;
      font-size: 0.9rem;
      color: #64748b;
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
      font-weight: 700;
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
      text-align: center;
    }
    .result-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #64748b;
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
  `]
})
export class MortgageCalculatorComponent {
  @Input() set propertyPrice(val: number) {
    if (val > 0) this.priceValue = val;
  }
  @Input() currencyType: string = 'UZS';

  priceValue = 100000;
  downPaymentPercentValue = 20;
  interestRateValue = 18;
  loanTermYearsValue = 20;

  price = signal(0);
  currency = signal('UZS');
  downPaymentPercent = signal(0);
  interestRate = signal(0);
  loanTermYears = signal(0);

  constructor() {
    effect(() => {
      this.price.set(this.priceValue);
      this.downPaymentPercent.set(this.downPaymentPercentValue);
      this.interestRate.set(this.interestRateValue);
      this.loanTermYears.set(this.loanTermYearsValue);
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.currency.set(this.currencyType);
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
}

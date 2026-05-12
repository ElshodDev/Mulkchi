import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { TelegramAuthService } from '../../../core/services/telegram-auth.service';

@Component({
  selector: 'app-telegram-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="telegram-login">
      <!-- Holat: Boshlash -->
      @if (status() === 'idle') {
        <button class="btn-telegram" (click)="startLogin()" [disabled]="loading()">
          @if (loading()) {
            <span class="spinner"></span> Tayyorlanmoqda...
          } @else {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.927 13.78l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.83.779h-.01z"
              />
            </svg>
            Telegram orqali kirish
          }
        </button>
      }

      <!-- Holat: Kutish (foydalanuvchi bot ga o'tishi kerak) -->
      @if (status() === 'pending') {
        <div class="pending-card">
          <div class="pending-header">
            <div class="pulse-dot"></div>
            <span>Telegram bot kutilmoqda...</span>
          </div>

          <div class="steps">
            <div class="step" [class.done]="true">
              <span class="step-num">1</span>
              <span>Telegram bot ochildi</span>
            </div>
            <div class="step" [class.active]="true">
              <span class="step-num">2</span>
              <span>Bot dan <b>/start</b> bosing va kodni kiriting</span>
            </div>
            <div class="step">
              <span class="step-num">3</span>
              <span>Avtomatik kiriladi</span>
            </div>
          </div>

          <div class="deep-link-btns">
            <button class="btn-outline" (click)="openTelegram()">Telegram botni ochish</button>
            <button class="btn-cancel" (click)="cancel()">Bekor qilish</button>
          </div>

          <p class="hint">
            Telegram ochilmadimi?
            <a [href]="deepLink()" target="_blank">Bu havola orqali urinib ko'ring</a>
          </p>
        </div>
      }

      <!-- Holat: Muvaffaqiyatli -->
      @if (status() === 'verified') {
        <div class="success-card">
          <div class="success-icon">✓</div>
          <p>Muvaffaqiyatli kirdingiz!</p>
          <p class="sub">Yo'naltirilmoqda...</p>
        </div>
      }

      <!-- Holat: Eskirgan -->
      @if (status() === 'expired') {
        <div class="expired-card">
          <p>Havola muddati o'tdi.</p>
          <button class="btn-telegram" (click)="retry()">Qayta urinish</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .telegram-login {
        width: 100%;
      }

      .btn-telegram {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        justify-content: center;
        padding: 12px 20px;
        font-size: 15px;
        font-weight: 500;
        background: #229ed9;
        color: #fff;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-telegram:hover {
        background: #1a8dbf;
      }
      .btn-telegram:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .pending-card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 20px;
        background: #f8fafc;
      }
      .pending-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        margin-bottom: 16px;
      }
      .pulse-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #229ed9;
        animation: pulse 1.5s ease-in-out infinite;
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.3;
        }
      }

      .steps {
        margin-bottom: 16px;
      }
      .step {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
        font-size: 14px;
        color: #64748b;
        border-bottom: 1px solid #e2e8f0;
      }
      .step:last-child {
        border-bottom: none;
      }
      .step.active {
        color: #1e293b;
        font-weight: 500;
      }
      .step.done {
        color: #22c55e;
      }
      .step-num {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        flex-shrink: 0;
      }
      .step.active .step-num {
        background: #229ed9;
        color: #fff;
      }
      .step.done .step-num {
        background: #22c55e;
        color: #fff;
      }

      .deep-link-btns {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
      }
      .btn-outline {
        flex: 1;
        padding: 10px;
        font-size: 13px;
        border: 1px solid #229ed9;
        color: #229ed9;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
      }
      .btn-cancel {
        padding: 10px 16px;
        font-size: 13px;
        border: 1px solid #e2e8f0;
        color: #64748b;
        background: transparent;
        border-radius: 8px;
        cursor: pointer;
      }
      .hint {
        font-size: 12px;
        color: #94a3b8;
        text-align: center;
      }
      .hint a {
        color: #229ed9;
      }

      .success-card {
        text-align: center;
        padding: 24px;
        border: 1px solid #86efac;
        border-radius: 12px;
        background: #f0fdf4;
      }
      .success-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #22c55e;
        color: #fff;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
      }
      .sub {
        font-size: 12px;
        color: #64748b;
      }

      .expired-card {
        text-align: center;
        padding: 16px;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: inline-block;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class TelegramLoginComponent implements OnInit, OnDestroy {
  loading = signal(false);
  deepLink = signal<string | null>(null);

  get status() {
    return this.telegramAuth.pollingStatus;
  }

  constructor(private telegramAuth: TelegramAuthService) {}

  ngOnInit() {}

  async startLogin() {
    this.loading.set(true);
    try {
      const response = await this.telegramAuth.initLogin();
      this.deepLink.set(response.deepLink);
      // Telegram ni avtomatik ochish
      window.open(response.deepLink, '_blank');
    } catch (error) {
      console.error('Telegram login xatosi', error);
    } finally {
      this.loading.set(false);
    }
  }

  openTelegram() {
    if (this.deepLink()) {
      window.open(this.deepLink()!, '_blank');
    }
  }

  cancel() {
    this.telegramAuth.resetPolling();
  }

  retry() {
    this.telegramAuth.resetPolling();
  }

  ngOnDestroy() {
    this.telegramAuth.resetPolling();
  }
}

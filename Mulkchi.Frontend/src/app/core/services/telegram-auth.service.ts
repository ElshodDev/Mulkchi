import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface TelegramInitResponse {
  botUsername: string;
  deepLink: string;
  sessionId: string;
  expiresAt: string;
}

export interface TelegramSessionStatus {
  status: 'pending' | 'verified' | 'expired';
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    fullName: string;
    username: string;
    telegramId: number;
  };
}

@Injectable({ providedIn: 'root' })
export class TelegramAuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth/telegram`;

  // Polling holati
  isPolling = signal(false);
  pollingStatus = signal<'idle' | 'pending' | 'verified' | 'expired'>('idle');
  qrDeepLink = signal<string | null>(null);

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // 1-QADAM: Deep link olish va polling boshlash
  async initLogin(): Promise<TelegramInitResponse> {
    const response = await this.http
      .post<TelegramInitResponse>(`${this.baseUrl}/init`, {})
      .toPromise();

    this.qrDeepLink.set(response!.deepLink);
    this.startPolling(response!.sessionId);
    return response!;
  }

  // 2-QADAM: Har 2 soniyada status tekshirish
  private startPolling(sessionId: string): void {
    this.isPolling.set(true);
    this.pollingStatus.set('pending');

    // Maksimal 10 daqiqa polling
    let attempts = 0;
    const maxAttempts = 300; // 300 * 2 soniya = 10 daqiqa

    this.pollingInterval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        this.stopPolling();
        this.pollingStatus.set('expired');
        return;
      }

      try {
        const status = await this.http
          .get<TelegramSessionStatus>(`${this.baseUrl}/status/${sessionId}`)
          .toPromise();

        if (status!.status === 'verified') {
          this.stopPolling();
          this.pollingStatus.set('verified');
          this.handleSuccessfulLogin(status!);
        } else if (status!.status === 'expired') {
          this.stopPolling();
          this.pollingStatus.set('expired');
        }
      } catch (error) {
        console.error('Polling xatosi:', error);
      }
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling.set(false);
  }

  private handleSuccessfulLogin(status: TelegramSessionStatus): void {
    // Tokenlarni saqlash
    localStorage.setItem('accessToken', status.accessToken!);
    localStorage.setItem('refreshToken', status.refreshToken!);

    // Auth store yangilash (mavjud auth.store.ts)
    // this.authStore.setUser(status.user);

    // Bosh sahifaga yo'naltirish
    this.router.navigate(['/']);
  }

  // Telegramni yangi tabda ochish
  openTelegram(deepLink: string): void {
    window.open(deepLink, '_blank');
  }

  resetPolling(): void {
    this.stopPolling();
    this.pollingStatus.set('idle');
    this.qrDeepLink.set(null);
  }
}

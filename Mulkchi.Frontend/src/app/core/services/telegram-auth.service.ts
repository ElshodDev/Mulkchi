import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

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
  private readonly authService = inject(AuthService);

  isPolling = signal(false);
  pollingStatus = signal<'idle' | 'pending' | 'verified' | 'expired'>('idle');
  qrDeepLink = signal<string | null>(null);

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  async initLogin(): Promise<TelegramInitResponse> {
    const response = await this.http
      .post<TelegramInitResponse>(`${this.baseUrl}/init`, {})
      .toPromise();

    this.qrDeepLink.set(response!.deepLink);
    this.startPolling(response!.sessionId);
    return response!;
  }

  private startPolling(sessionId: string): void {
    this.isPolling.set(true);
    this.pollingStatus.set('pending');

    let attempts = 0;
    const maxAttempts = 150;

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
        console.error('Telegram polling xatosi', error);
      }
    }, 4000);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling.set(false);
  }

  private handleSuccessfulLogin(_status: TelegramSessionStatus): void {
    this.authService.bootstrapSession();
    this.router.navigate(['/']);
  }

  openTelegram(deepLink: string): void {
    window.open(deepLink, '_blank');
  }

  resetPolling(): void {
    this.stopPolling();
    this.pollingStatus.set('idle');
    this.qrDeepLink.set(null);
  }
}

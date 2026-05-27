import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { AuthResponse, LoginRequest, RegisterRequest, SwitchModeRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authService = inject(AuthService);

  readonly currentUser = computed(() => this.authService.currentUser());
  readonly isLoggedIn = computed(() => this.authService.isAuthenticated());
  readonly isHost = computed(() => this.authService.isHost());
  readonly isAdmin = computed(() => this.authService.isAdmin());
  readonly currentMode = computed(() => this.authService.currentMode());

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.authService.login(request);
  }

  sendEmailCode(email: string): Observable<{ sessionId: string; devCode?: string }> {
    return this.authService.sendEmailCode(email);
  }

  verifyEmailCode(email: string, sessionId: string, code: string): Observable<AuthResponse> {
    return this.authService.verifyEmailCode(email, sessionId, code);
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.authService.register(request);
  }

  logout(): void {
    this.authService.logout();
  }

  updateProfile(user: Partial<User>): Observable<User> {
    return this.authService.updateProfile(user);
  }

  switchMode(request: SwitchModeRequest): Observable<AuthResponse> {
    return this.authService.switchMode({ TargetMode: request.targetMode });
  }
}

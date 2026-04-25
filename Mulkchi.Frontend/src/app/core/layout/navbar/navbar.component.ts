import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { UserRole } from '../../models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatSidenavModule,
    MatListModule,
    MatSnackBarModule
  ],
  template: `
    <mat-toolbar class="navbar" color="primary">
      <div class="navbar-container">
        <!-- Logo -->
        <a class="logo" routerLink="/">
          <mat-icon>apartment</mat-icon>
          <span>Mulkchi</span>
        </a>

        <!-- Desktop Navigation -->
        @if (!isMobile()) {
          <nav class="nav-links">
            <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              Bosh sahifa
            </a>
            <a mat-button routerLink="/properties" routerLinkActive="active">
              Mulk qidirish
            </a>
            <a mat-button routerLink="/ai-recommendations" routerLinkActive="active">
              <mat-icon>recommend</mat-icon>
              AI Tavsiyalar
            </a>
            <a mat-button routerLink="/ai-price" routerLinkActive="active">
              <mat-icon>psychology</mat-icon>
              AI Narx
            </a>

            @if (isInHostMode()) {
              <a mat-button routerLink="/host/properties" routerLinkActive="active">
                <mat-icon>add_business</mat-icon>
                Mening mulklarim
              </a>
            }
            
            @if (isAdmin()) {
              <a mat-button routerLink="/admin" routerLinkActive="active">
                <mat-icon>admin_panel_settings</mat-icon>
                Admin
              </a>
            }
          </nav>
        }

        <!-- Right Side Actions -->
        <div class="nav-actions">
          @if (isAuthenticated()) {
            <!-- Favorites -->
            <button mat-icon-button routerLink="/favorites" matTooltip="Sevimlilar">
              <mat-icon>favorite</mat-icon>
            </button>

            <!-- Messages -->
            <button mat-icon-button routerLink="/messages" matTooltip="Xabarlar">
              <mat-icon [matBadge]="chatService.totalUnreadCount() || null" 
                        [matBadgeHidden]="chatService.totalUnreadCount() === 0"
                        matBadgeColor="warn"
                        aria-hidden="false">chat</mat-icon>
            </button>

            <!-- Notifications -->
            <button mat-icon-button matTooltip="Bildirishnomalar">
              <mat-icon>notifications</mat-icon>
            </button>

            <!-- User Menu -->
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-btn">
              @if (currentUser()?.avatarUrl) {
                <img [src]="currentUser()?.avatarUrl" alt="Avatar" class="user-avatar">
              } @else {
                <mat-icon>account_circle</mat-icon>
              }
              <span class="user-name">{{ currentUser()?.firstName }}</span>
              <mat-icon>expand_more</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu">
              <a mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>Profil</span>
              </a>
              <a mat-menu-item routerLink="/bookings">
                <mat-icon>calendar_today</mat-icon>
                <span>Bronlarim</span>
              </a>
              <a mat-menu-item routerLink="/favorites">
                <mat-icon>favorite</mat-icon>
                <span>Sevimlilar</span>
              </a>
              <!-- Single Identity: Mode Switcher -->
              @if (canBeHost()) {
                <mat-divider></mat-divider>
                <div class="mode-switcher">
                  <span class="mode-label">Rejim:</span>
                  <div class="mode-buttons">
                    <button 
                      mat-button 
                      [class.active-mode]="isInGuestMode()"
                      (click)="switchMode('Guest')"
                      [disabled]="isInGuestMode()">
                      <mat-icon>person</mat-icon>
                      Mehmon
                    </button>
                    <button 
                      mat-button 
                      [class.active-mode]="isInHostMode()"
                      (click)="switchMode('Host')"
                      [disabled]="isInHostMode()">
                      <mat-icon>real_estate_agent</mat-icon>
                      Host
                    </button>
                  </div>
                </div>
              }
              
              @if (isInHostMode()) {
                <mat-divider></mat-divider>
                <a mat-menu-item routerLink="/host/properties">
                  <mat-icon>business</mat-icon>
                  <span>Mening mulklarim</span>
                </a>
                <a mat-menu-item routerLink="/host/bookings">
                  <mat-icon>event_note</mat-icon>
                  <span>Host bronlari</span>
                </a>
              }
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Chiqish</span>
              </button>
            </mat-menu>
          } @else {
            <a mat-button routerLink="/auth/login">Kirish</a>
            <a mat-raised-button color="accent" routerLink="/auth/register">Ro'yxatdan o'tish</a>
          }

          <!-- Mobile Menu Toggle -->
          @if (isMobile()) {
            <button mat-icon-button (click)="toggleSidenav()">
              <mat-icon>menu</mat-icon>
            </button>
          }
        </div>
      </div>
    </mat-toolbar>

    <!-- Mobile Sidenav -->
    @if (isMobile()) {
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav 
          #sidenav 
          mode="over" 
          position="end"
          [(opened)]="sidenavOpened">
          <mat-nav-list>
            <a mat-list-item routerLink="/" (click)="sidenav.close()">
              <mat-icon matListItemIcon>home</mat-icon>
              <span matListItemTitle>Bosh sahifa</span>
            </a>
            <a mat-list-item routerLink="/properties" (click)="sidenav.close()">
              <mat-icon matListItemIcon>search</mat-icon>
              <span matListItemTitle>Mulk qidirish</span>
            </a>
            <a mat-list-item routerLink="/ai-price" (click)="sidenav.close()">
              <mat-icon matListItemIcon>psychology</mat-icon>
              <span matListItemTitle>AI Narx</span>
            </a>

            @if (isAuthenticated()) {
              <mat-divider></mat-divider>
              <a mat-list-item routerLink="/profile" (click)="sidenav.close()">
                <mat-icon matListItemIcon>person</mat-icon>
                <span matListItemTitle>Profil</span>
              </a>
              <a mat-list-item routerLink="/bookings" (click)="sidenav.close()">
                <mat-icon matListItemIcon>calendar_today</mat-icon>
                <span matListItemTitle>Bronlarim</span>
              </a>
              <a mat-list-item routerLink="/favorites" (click)="sidenav.close()">
                <mat-icon matListItemIcon>favorite</mat-icon>
                <span matListItemTitle>Sevimlilar</span>
              </a>
              
              <!-- Single Identity: Mobile Mode Switcher -->
              @if (canBeHost()) {
                <mat-divider></mat-divider>
                <div mat-subheader>Rejim o'zgartirish</div>
                <button 
                  mat-list-item 
                  (click)="switchMode('Guest'); sidenav.close()"
                  [class.active-mode]="isInGuestMode()">
                  <mat-icon matListItemIcon>person</mat-icon>
                  <span matListItemTitle>Mehmon rejimi</span>
                </button>
                <button 
                  mat-list-item 
                  (click)="switchMode('Host'); sidenav.close()"
                  [class.active-mode]="isInHostMode()">
                  <mat-icon matListItemIcon>real_estate_agent</mat-icon>
                  <span matListItemTitle>Host rejimi</span>
                </button>
              }
              
              @if (isInHostMode()) {
                <mat-divider></mat-divider>
                <a mat-list-item routerLink="/host/properties" (click)="sidenav.close()">
                  <mat-icon matListItemIcon>business</mat-icon>
                  <span matListItemTitle>Mening mulklarim</span>
                </a>
                <a mat-list-item routerLink="/host/bookings" (click)="sidenav.close()">
                  <mat-icon matListItemIcon>event_note</mat-icon>
                  <span matListItemTitle>Host bronlari</span>
                </a>
              }
              
              <mat-divider></mat-divider>
              <button mat-list-item (click)="logout(); sidenav.close()">
                <mat-icon matListItemIcon>logout</mat-icon>
                <span matListItemTitle>Chiqish</span>
              </button>
            } @else {
              <mat-divider></mat-divider>
              <a mat-list-item routerLink="/auth/login" (click)="sidenav.close()">
                <mat-icon matListItemIcon>login</mat-icon>
                <span matListItemTitle>Kirish</span>
              </a>
              <a mat-list-item routerLink="/auth/register" (click)="sidenav.close()">
                <mat-icon matListItemIcon>person_add</mat-icon>
                <span matListItemTitle>Ro'yxatdan o'tish</span>
              </a>
            }
          </mat-nav-list>
        </mat-sidenav>
      </mat-sidenav-container>
    }
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .navbar-container {
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .logo mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .nav-links {
      display: flex;
      gap: 8px;
    }

    .nav-links a {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .nav-links a.active {
      background: rgba(255,255,255,0.15);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-menu-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-name {
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidenav-container {
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      pointer-events: none;
    }

    mat-sidenav {
      pointer-events: auto;
      width: 280px;
    }

    /* Single Identity: Mode Switcher Styles */
    .mode-switcher {
      padding: 8px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mode-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mode-buttons {
      display: flex;
      gap: 8px;
    }

    .mode-buttons button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .mode-buttons button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .active-mode {
      background-color: rgba(103, 58, 183, 0.1) !important;
      color: #673ab7 !important;
      font-weight: 500;
    }

    .active-mode:hover {
      background-color: rgba(103, 58, 183, 0.2) !important;
    }

    button.mat-list-item.active-mode {
      background-color: rgba(103, 58, 183, 0.1);
      color: #673ab7;
    }

    @media (max-width: 768px) {
      .navbar-container {
        padding: 0 16px;
      }

      .logo span {
        display: none;
      }

      .user-name {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);
  chatService = inject(ChatService);
  private breakpointObserver = inject(BreakpointObserver);
  private snackBar = inject(MatSnackBar);

  isAuthenticated = this.authService.isAuthenticated;
  currentUser = this.authService.currentUser;
  currentMode = this.authService.currentMode;

  isMobile = toSignal(
    this.breakpointObserver.observe('(max-width: 768px)').pipe(map(result => result.matches)),
    { initialValue: false }
  );

  sidenavOpened = signal(false);

  // Single Identity: Check if user is in Host mode
  isInHostMode(): boolean {
    return this.authService.isInHostMode();
  }

  // Single Identity: Check if user is in Guest mode
  isInGuestMode(): boolean {
    return this.authService.isInGuestMode();
  }

  // Check if user can be a Host (has Host role or is verified)
  canBeHost(): boolean {
    return this.authService.isHost() || this.currentUser()?.isVerified || false;
  }

  isHost(): boolean {
    const user = this.currentUser();
    return user ? this.authService.isHost() : false;
  }

  isAdmin(): boolean {
    const user = this.currentUser();
    return user ? this.authService.isAdmin() : false;
  }

  // Single Identity: Switch between Guest and Host modes
  switchMode(mode: 'Guest' | 'Host'): void {
    const targetMode = mode === 'Host' ? UserRole.Host : UserRole.Guest;
    
    this.authService.switchMode({ targetMode }).subscribe({
      next: () => {
        this.snackBar.open(
          mode === 'Host' ? 'Host rejimiga o\'tdingiz' : 'Mehmon rejimiga o\'tdingiz',
          'Yopish',
          { duration: 2000 }
        );
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Rejim o\'zgartirishda xatolik',
          'Yopish',
          { duration: 5000 }
        );
      }
    });
  }

  toggleSidenav(): void {
    this.sidenavOpened.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}

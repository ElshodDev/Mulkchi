import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { fromEvent, map, startWith } from 'rxjs';

import { UserRole } from '../../models';
import { ChatService } from '../../services/chat.service';
import { ComparisonService } from '../../services/comparison.service';
import { AuthStore } from '../../stores/auth.store';
import { UIStore } from '../../stores/ui.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatBadgeModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <header class="navbar-shell" [class.scrolled]="isScrolled()">
      <div class="navbar container">
        <a class="brand" routerLink="/" (click)="uiStore.closeSidebar()">
          <span class="brand-mark">
            <mat-icon>apartment</mat-icon>
          </span>
          <span class="brand-copy">
            <strong>Mulkchi</strong>
            <small>{{ text().brandTagline }}</small>
          </span>
        </a>

        <nav class="desktop-nav" aria-label="Asosiy navigatsiya">
          @for (item of navItems(); track item.link) {
            <a
              [routerLink]="item.link"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.exact === true }"
            >
              {{ item.label }}
            </a>
          }
          @if (isInHostMode()) {
            <a routerLink="/host/properties" routerLinkActive="active">{{
              text().navHostProperties
            }}</a>
          }
          @if (authStore.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="active">{{ text().navAdmin }}</a>
          }
        </nav>

        <div class="navbar-actions">
          <div class="desktop-utilities">
            <button
              mat-icon-button
              type="button"
              [attr.aria-label]="uiStore.isDarkTheme() ? text().themeLight : text().themeDark"
              (click)="uiStore.toggleTheme()"
            >
              <mat-icon>{{ uiStore.isDarkTheme() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <button
              mat-icon-button
              type="button"
              [matMenuTriggerFor]="languageMenu"
              [attr.aria-label]="text().ariaLanguage"
            >
              <mat-icon>translate</mat-icon>
            </button>

            <mat-menu #languageMenu="matMenu">
              @for (language of languages; track language.code) {
                <button mat-menu-item type="button" (click)="uiStore.setLanguage(language.code)">
                  <span>{{ language.label }}</span>
                </button>
              }
            </mat-menu>
          </div>

          @if (authStore.isLoggedIn()) {
            <a mat-flat-button class="post-button" routerLink="/listings/create">
              <mat-icon>add_home</mat-icon>
              <span>{{ text().postListing }}</span>
            </a>

            <div class="quick-actions desktop-utilities">
              <a mat-icon-button routerLink="/favorites" aria-label="Sevimlilar">
                <mat-icon>favorite</mat-icon>
              </a>
              <a mat-icon-button routerLink="/compare" aria-label="Taqqoslash">
                <mat-icon
                  [matBadge]="comparisonService.count() || null"
                  [matBadgeHidden]="comparisonService.isEmpty()"
                  matBadgeColor="accent"
                >
                  compare_arrows
                </mat-icon>
              </a>
              <a mat-icon-button routerLink="/messages" aria-label="Xabarlar">
                <mat-icon
                  [matBadge]="chatService.totalUnreadCount() || null"
                  [matBadgeHidden]="chatService.totalUnreadCount() === 0"
                  matBadgeColor="warn"
                >
                  chat
                </mat-icon>
              </a>
            </div>

            <button type="button" class="profile-chip" [matMenuTriggerFor]="userMenu">
              <span class="avatar">
                @if (authStore.currentUser()?.avatarUrl) {
                  <img [src]="authStore.currentUser()?.avatarUrl" alt="Profil rasmi" />
                } @else {
                  <mat-icon>person</mat-icon>
                }
              </span>
              <span class="profile-copy desktop-utilities">
                <strong>{{ authStore.currentUser()?.firstName }}</strong>
                <small>{{ authStore.currentMode() }}</small>
              </span>
              <mat-icon class="desktop-utilities">expand_more</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu">
              <a mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>{{ text().profile }}</span>
              </a>
              <a mat-menu-item routerLink="/bookings">
                <mat-icon>calendar_month</mat-icon>
                <span>{{ text().bookings }}</span>
              </a>
              @if (isRoleSwitchVisible()) {
                <button mat-menu-item type="button" (click)="toggleRoleMode()">
                  <mat-icon>swap_horiz</mat-icon>
                  <span>{{ roleSwitchLabel() }}</span>
                </button>
              }
              <mat-divider></mat-divider>
              <button mat-menu-item type="button" (click)="authStore.logout()">
                <mat-icon>logout</mat-icon>
                <span>{{ text().logout }}</span>
              </button>
            </mat-menu>
          } @else {
            <div class="guest-actions desktop-utilities">
              <a mat-button routerLink="/auth/login">{{ text().login }}</a>
              <a mat-flat-button class="register-button" routerLink="/auth/register">
                {{ text().register }}
              </a>
            </div>
          }

          <button
            type="button"
            class="menu-toggle"
            [attr.aria-expanded]="uiStore.sidebarOpen()"
            [attr.aria-label]="text().ariaMenu"
            (click)="uiStore.toggleSidebar()"
          >
            <mat-icon>{{ uiStore.sidebarOpen() ? 'close' : 'menu' }}</mat-icon>
          </button>
        </div>
      </div>

      @if (uiStore.sidebarOpen()) {
        <div class="mobile-panel">
          <div class="mobile-panel__sheet">
            <nav class="mobile-nav">
              @for (item of mobileNavItems(); track item.link) {
                <a
                  [routerLink]="item.link"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.exact === true }"
                  (click)="uiStore.closeSidebar()"
                >
                  <mat-icon>{{ item.icon }}</mat-icon>
                  <span>{{ item.label }}</span>
                </a>
              }
            </nav>

            <div class="mobile-panel__footer">
              <button type="button" class="utility-button" (click)="uiStore.toggleTheme()">
                <mat-icon>{{ uiStore.isDarkTheme() ? 'light_mode' : 'dark_mode' }}</mat-icon>
                <span>{{ uiStore.isDarkTheme() ? text().themeLight : text().themeDark }}</span>
              </button>
              <button type="button" class="utility-button" [matMenuTriggerFor]="mobileLanguageMenu">
                <mat-icon>translate</mat-icon>
                <span>{{ text().languagePrefix }}{{ currentLanguageLabel() }}</span>
              </button>
              <mat-menu #mobileLanguageMenu="matMenu">
                @for (language of languages; track language.code) {
                  <button
                    mat-menu-item
                    type="button"
                    (click)="uiStore.setLanguage(language.code); uiStore.closeSidebar()"
                  >
                    {{ language.label }}
                  </button>
                }
              </mat-menu>
            </div>
          </div>
        </div>
      }
    </header>
  `,
  styles: [
    `
      .navbar-shell {
        position: fixed;
        inset: 0 0 auto;
        z-index: var(--z-navbar);
        padding: var(--space-3) 0;
        transition:
          background-color var(--transition-normal),
          box-shadow var(--transition-normal),
          border-color var(--transition-normal);
      }

      .navbar-shell.scrolled {
        backdrop-filter: blur(22px);
        background: color-mix(in srgb, var(--color-surface-elevated) 78%, transparent);
        border-bottom: 1px solid var(--color-border-soft);
        box-shadow: var(--shadow-sm);
      }

      .navbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4);
        min-height: 4.5rem;
        padding: 0 var(--space-4);
        border: 1px solid transparent;
        border-radius: var(--radius-round);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: var(--space-3);
        min-width: 0;
      }

      .brand-mark {
        display: grid;
        place-items: center;
        inline-size: 2.75rem;
        aspect-ratio: 1;
        border-radius: 1rem;
        background: linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700));
        color: white;
        box-shadow: var(--shadow-sm);
      }

      .brand-copy {
        display: grid;
        gap: 2px;
      }

      .brand-copy strong {
        font-size: var(--font-size-4);
      }

      .brand-copy small {
        color: var(--color-text-secondary);
      }

      .desktop-nav,
      .navbar-actions,
      .desktop-utilities,
      .quick-actions {
        display: flex;
        align-items: center;
      }

      .desktop-nav {
        gap: var(--space-2);
        padding: var(--space-1);
        border-radius: var(--radius-round);
        background: color-mix(in srgb, var(--color-surface-elevated) 72%, transparent);
      }

      .desktop-nav a {
        padding: 0.8rem 1rem;
        border-radius: var(--radius-round);
        color: var(--color-text-secondary);
        font-size: var(--font-size-2);
        font-weight: var(--font-weight-medium);
        transition:
          color var(--transition-fast),
          background-color var(--transition-fast),
          transform var(--transition-fast);
      }

      .desktop-nav a.active,
      .desktop-nav a:hover {
        background: rgba(15, 118, 110, 0.1);
        color: var(--color-brand-600);
        transform: translateY(-1px);
      }

      .navbar-actions {
        gap: var(--space-2);
      }

      .post-button,
      .register-button {
        background: linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700));
        color: white !important;
      }

      .guest-actions,
      .quick-actions {
        gap: var(--space-1);
      }

      .profile-chip {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        min-height: 44px;
        padding: 0 var(--space-2) 0 6px;
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-round);
        background: color-mix(in srgb, var(--color-surface-elevated) 90%, transparent);
        color: var(--color-text-primary);
      }

      .avatar {
        display: grid;
        place-items: center;
        inline-size: 2rem;
        aspect-ratio: 1;
        border-radius: var(--radius-round);
        overflow: hidden;
        background: var(--color-surface-subtle);
      }

      .avatar img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
      }

      .profile-copy {
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        min-width: 0;
      }

      .profile-copy small {
        color: var(--color-text-muted);
      }

      .menu-toggle {
        display: none;
        align-items: center;
        justify-content: center;
        inline-size: 44px;
        block-size: 44px;
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-round);
        background: color-mix(in srgb, var(--color-surface-elevated) 90%, transparent);
        color: var(--color-text-primary);
      }

      .mobile-panel {
        position: fixed;
        inset: 5.5rem 0 0;
        z-index: var(--z-drawer);
        display: grid;
        background: rgba(15, 23, 42, 0.36);
        backdrop-filter: blur(12px);
      }

      .mobile-panel__sheet {
        align-self: start;
        margin: 0 var(--space-4);
        padding: var(--space-4);
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-4);
        background: var(--color-surface-elevated);
        box-shadow: var(--shadow-lg);
      }

      .mobile-nav,
      .mobile-panel__footer {
        display: grid;
        gap: var(--space-2);
      }

      .mobile-nav a,
      .utility-button {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        min-height: 48px;
        padding: 0.9rem 1rem;
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-3);
        background: transparent;
        color: var(--color-text-primary);
      }

      .mobile-nav a.active {
        background: rgba(15, 118, 110, 0.08);
        border-color: rgba(15, 118, 110, 0.18);
        color: var(--color-brand-600);
      }

      .mobile-panel__footer {
        margin-top: var(--space-4);
      }

      @media (max-width: 1200px) {
        .desktop-nav {
          display: none;
        }
      }

      @media (max-width: 768px) {
        .navbar {
          min-height: 4rem;
          padding-inline: var(--space-3);
        }

        .brand-copy small,
        .desktop-utilities {
          display: none;
        }

        .post-button span {
          display: none;
        }

        .post-button {
          min-width: 44px;
          padding-inline: 0.85rem;
        }

        .menu-toggle {
          display: inline-flex;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly uiStore = inject(UIStore);
  protected readonly chatService = inject(ChatService);
  protected readonly comparisonService = inject(ComparisonService);

  protected readonly text = computed(() => {
    const language = this.uiStore.language();

    const labels = {
      uz: {
        brandTagline: 'Ijaraga yaqinroq yo‘l',
        navHome: 'Bosh sahifa',
        navProperties: 'Mulklar',
        navAiRecommend: 'AI tavsiya',
        navAnalytics: 'AQILLI tahlil',
        navMarket: 'Bozor',
        navHostProperties: 'Mening mulklarim',
        navAdmin: 'Admin',
        postListing: "E'lon berish",
        profile: 'Profil',
        bookings: 'Bronlar',
        logout: 'Chiqish',
        login: 'Kirish',
        register: "Ro'yxatdan o'tish",
        themeLight: 'Yorug‘ rejim',
        themeDark: 'Qorong‘i rejim',
        language: 'Til',
        languagePrefix: 'Til: ',
        roleSwitchToGuest: 'Guest rejimiga o‘tish',
        roleSwitchToHost: 'Host rejimiga o‘tish',
        ariaTheme: 'Mavzuni almashtirish',
        ariaLanguage: 'Til tanlash',
        ariaMenu: 'Menyuni ochish',
      },
      ru: {
        brandTagline: 'Ближе к аренде',
        navHome: 'Главная',
        navProperties: 'Недвижимость',
        navAiRecommend: 'AI рекомендации',
        navAnalytics: 'АНАЛИТИКА',
        navMarket: 'Рынок',
        navHostProperties: 'Моя недвижимость',
        navAdmin: 'Админ',
        postListing: 'Разместить',
        profile: 'Профиль',
        bookings: 'Бронирования',
        logout: 'Выйти',
        login: 'Войти',
        register: 'Регистрация',
        themeLight: 'Светлая тема',
        themeDark: 'Тёмная тема',
        language: 'Язык',
        languagePrefix: 'Язык: ',
        roleSwitchToGuest: 'Переключиться на Guest',
        roleSwitchToHost: 'Переключиться на Host',
        ariaTheme: 'Переключить тему',
        ariaLanguage: 'Выбор языка',
        ariaMenu: 'Открыть меню',
      },
      en: {
        brandTagline: 'Closer to rent',
        navHome: 'Home',
        navProperties: 'Properties',
        navAiRecommend: 'AI recommendations',
        navAnalytics: 'SMART analytics',
        navMarket: 'Market',
        navHostProperties: 'My properties',
        navAdmin: 'Admin',
        postListing: 'Post listing',
        profile: 'Profile',
        bookings: 'Bookings',
        logout: 'Log out',
        login: 'Sign in',
        register: 'Sign up',
        themeLight: 'Light mode',
        themeDark: 'Dark mode',
        language: 'Language',
        languagePrefix: 'Language: ',
        roleSwitchToGuest: 'Switch to Guest mode',
        roleSwitchToHost: 'Switch to Host mode',
        ariaTheme: 'Toggle theme',
        ariaLanguage: 'Select language',
        ariaMenu: 'Open menu',
      },
    } as const;

    return labels[language];
  });

  protected readonly navItems = computed<Array<{ label: string; link: string; exact?: boolean }>>(
    () => {
      const t = this.text();
      return [
        { label: t.navHome, link: '/', exact: true },
        { label: t.navProperties, link: '/properties' },
        { label: 'AI Yordamchi', link: '/ai-tools' }, // Combined AI features
        { label: 'Bozor', link: '/market' }, // Combined analytics
        { label: t.profile, link: '/profile' },
      ];
    },
  );

  protected readonly languages = [
    { code: 'uz' as const, label: "O'zbekcha" },
    { code: 'ru' as const, label: 'Russkiy' },
    { code: 'en' as const, label: 'English' },
  ];

  protected readonly isScrolled = toSignal(
    fromEvent(window, 'scroll').pipe(
      startWith(null),
      map(() => window.scrollY > 12),
    ),
    { initialValue: false },
  );

  protected readonly mobileNavItems = computed<
    Array<{ label: string; link: string; icon: string; exact?: boolean }>
  >(() => {
    const t = this.text();
    const baseItems = [
      { label: t.navHome, link: '/', icon: 'home', exact: true },
      { label: t.navProperties, link: '/properties', icon: 'search' },
      { label: 'AI Yordamchi', link: '/ai-tools', icon: 'psychology' },
      { label: 'Bozor', link: '/market', icon: 'trending_up' },
    ];

    if (!this.authStore.isLoggedIn()) {
      return [...baseItems, { label: t.login, link: '/auth/login', icon: 'login' }];
    }

    const authItems = [
      { label: t.profile, link: '/profile', icon: 'person' },
      { label: 'Xabarlar', link: '/messages', icon: 'chat' },
      { label: t.postListing, link: '/listings/create', icon: 'add_home' },
    ];

    if (this.isInHostMode()) {
      authItems.push({ label: 'Host panel', link: '/host/properties', icon: 'business' });
    }

    return [...baseItems, ...authItems];
  });

  protected readonly currentLanguageLabel = computed(() => {
    return (
      this.languages.find((language) => language.code === this.uiStore.language())?.label ??
      "O'zbekcha"
    );
  });

  protected readonly roleSwitchLabel = computed(() => {
    const t = this.text();
    return this.isInHostMode() ? t.roleSwitchToGuest : t.roleSwitchToHost;
  });

  protected isInHostMode(): boolean {
    const mode = this.authStore.currentMode();
    return mode === UserRole.Host || mode === UserRole.Admin || mode === UserRole.SuperAdmin;
  }

  protected isRoleSwitchVisible(): boolean {
    const role = this.authStore.currentUser()?.role;
    return role === UserRole.Host || role === UserRole.Admin || role === UserRole.SuperAdmin;
  }

  protected toggleRoleMode(): void {
    const nextMode = this.isInHostMode() ? UserRole.Guest : UserRole.Host;
    this.authStore.switchMode({ targetMode: nextMode }).subscribe();
  }
}

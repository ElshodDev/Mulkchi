import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { fromEvent, map, startWith } from 'rxjs';

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
    <header 
      class="navbar-shell fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out py-3"
      [class.scrolled]="isScrolled()" 
    >
      <div class="container mx-auto flex items-center justify-between px-6 h-16">
        <a class="flex items-center gap-3 no-underline group" routerLink="/" (click)="uiStore.closeSidebar()">
          <span class="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg transition-transform group-hover:scale-105">
            <mat-icon>apartment</mat-icon>
          </span>
          <span class="flex flex-col leading-tight">
            <strong class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Mulkchi</strong>
            <small class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ text().brandTagline }}</small>
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
            <a mat-flat-button class="post-button" routerLink="/elon-berish/tur">
              <mat-icon>add_home</mat-icon>
              <span>{{ text().postListing }}</span>
            </a>

            <div class="quick-actions desktop-utilities">
              <a mat-icon-button routerLink="/compare" matTooltip="Solishtirish">
                <mat-icon
                  aria-hidden="false"
                  [matBadge]="comparisonService.count() || null"
                  [matBadgeHidden]="comparisonService.count() === 0"
                  matBadgeColor="accent"
                >
                  compare
                </mat-icon>
              </a>
              <a mat-icon-button routerLink="/favorites">
                <mat-icon>favorite</mat-icon>
              </a>
              <a mat-icon-button routerLink="/messages">
                <mat-icon
                  aria-hidden="false"
                  aria-label="Xabarlar"
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
                  <img [src]="authStore.currentUser()?.avatarUrl" alt="Profil" />
                } @else {
                  <mat-icon>person</mat-icon>
                }
              </span>
              <span class="profile-copy">
                <strong>{{ authStore.currentUser()?.firstName }}</strong>
                <small>{{ text().profile }}</small>
              </span>
              <mat-icon class="expand-icon">expand_more</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu">
              <div class="user-menu-header">
                <div class="user-name">
                  {{ authStore.currentUser()?.firstName }} {{ authStore.currentUser()?.lastName }}
                </div>
                <div class="user-email">{{ authStore.currentUser()?.email }}</div>
              </div>
              <mat-divider></mat-divider>
              <a mat-menu-item routerLink="/profile">
                <mat-icon>person_outline</mat-icon>
                <span>{{ text().profile }}</span>
              </a>
              <a mat-menu-item routerLink="/host/properties">
                <mat-icon>business</mat-icon>
                <span>{{ text().myProperties }}</span>
              </a>
              <a mat-menu-item routerLink="/bookings">
                <mat-icon>calendar_today</mat-icon>
                <span>{{ text().bookings }}</span>
              </a>
              <a mat-menu-item routerLink="/favorites">
                <mat-icon>favorite_border</mat-icon>
                <span>{{ text().favorites }}</span>
              </a>
              <a mat-menu-item routerLink="/subscriptions">
                <mat-icon>card_membership</mat-icon>
                <span>{{ text().subscriptions }}</span>
              </a>
              @if (authStore.isAdmin()) {
                <mat-divider></mat-divider>
                <a mat-menu-item routerLink="/admin">
                  <mat-icon>admin_panel_settings</mat-icon>
                  <span>{{ text().navAdmin }}</span>
                </a>
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

          <button type="button" class="menu-toggle" (click)="uiStore.toggleSidebar()">
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
        transition: all var(--transition-normal);
      }

      .navbar-shell.scrolled {
        backdrop-filter: blur(22px);
        background: var(--color-surface-elevated);
        border-bottom: 1px solid var(--color-border);
        box-shadow: var(--shadow-sm);
      }

      .navbar {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        min-height: 4.5rem;
        padding: 0 var(--space-6);
        border-radius: var(--radius-round);
        width: 100%;
      }

      .brand {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        text-decoration: none;
        flex-shrink: 0;
      }

      .brand-mark {
        display: grid;
        place-items: center;
        inline-size: 2.75rem;
        aspect-ratio: 1;
        border-radius: 1rem;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
        color: var(--color-text-inverse);
        box-shadow: var(--shadow-sm);
        flex-shrink: 0;
      }

      .brand-copy {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .brand-copy strong {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--color-text-primary);
        letter-spacing: -0.02em;
      }

      .brand-copy small {
        color: var(--color-text-secondary);
        font-size: 0.75rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .nav-links a {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--color-text);
        border-radius: var(--radius-full);
        padding: 0 16px;
        height: 40px;
        line-height: 40px;
      }
      .nav-links .map-link {
        color: var(--color-primary);
        background: rgba(0, 106, 255, 0.05);
      }
      .nav-links .map-link mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .bmi-badge {
        font-size: 0.65rem;
        background: var(--color-surface);
        color: var(--color-primary);
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: 700;
        text-transform: uppercase;
        border: 1px solid var(--color-border);
        margin-left: 8px;
      }

      .desktop-nav {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-1);
        padding: var(--space-1);
        border-radius: var(--radius-round);
        background: color-mix(in srgb, var(--color-surface-elevated) 75%, transparent);
        backdrop-filter: blur(8px);
        border: 1px solid var(--color-border-soft);
        max-width: fit-content;
        margin: 0 auto;
      }

      .desktop-nav a {
        padding: 0.6rem 1rem;
        border-radius: var(--radius-round);
        color: var(--color-text-secondary);
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.25s ease;
        white-space: nowrap;
        text-decoration: none;
      }

      .desktop-nav a:hover,
      .desktop-nav a.active {
        color: var(--color-primary);
      }

      .navbar-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--space-3);
        flex-shrink: 0;
      }

      .desktop-utilities {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .guest-actions {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        flex-shrink: 0;
      }

      .post-button {
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
        color: var(--color-text-inverse) !important;
        border-radius: 24px !important;
        padding: 0 16px !important;
        font-weight: 600 !important;
        height: 40px !important;
        flex-shrink: 0;
      }

      .register-button {
        background: var(--color-primary) !important;
        color: var(--color-text-inverse) !important;
        border-radius: 24px !important;
        flex-shrink: 0;
      }

      .profile-chip {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: 4px 12px 4px 4px;
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-round);
        background: var(--color-surface-elevated);
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
        min-width: 120px;
      }

      .profile-chip:hover {
        background: var(--color-surface-subtle);
        border-color: var(--color-brand-400);
      }

      .avatar {
        inline-size: 32px;
        aspect-ratio: 1;
        border-radius: var(--radius-round);
        overflow: hidden;
        background: var(--color-surface-subtle);
        flex-shrink: 0;
        border: 1px solid var(--color-border-soft);
      }

      .avatar img {
        inline-size: 100%;
        block-size: 100%;
        object-fit: cover;
      }

      .profile-copy {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.1;
      }

      .profile-copy strong {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--color-text-primary);
        white-space: nowrap;
      }

      .profile-copy small {
        font-size: 0.7rem;
        color: var(--color-text-secondary);
        font-weight: 500;
        white-space: nowrap;
      }

      .expand-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--color-text-secondary);
      }

      .navbar-actions mat-icon {
        color: var(--color-text-primary);
      }

      .menu-toggle {
        display: none;
        inline-size: 44px;
        block-size: 44px;
        border: 1px solid var(--color-border-soft);
        border-radius: var(--radius-round);
        background: var(--color-surface-elevated);
        color: var(--color-text-primary);
        place-items: center;
      }

      :host-context(.theme-dark) {
        .profile-chip {
          background: var(--color-surface-elevated);
          border-color: var(--color-border);
        }
        .profile-chip:hover {
          background: var(--color-surface);
          border-color: var(--color-border-focus);
        }
        .profile-copy small,
        .expand-icon {
          color: var(--color-text-secondary);
        }
        .quick-actions mat-icon {
          color: var(--color-text-primary);
        }
      }

      @media (max-width: 1400px) {
        .brand-copy small {
          display: none;
        }
      }

      @media (max-width: 1250px) {
        .desktop-nav {
          display: none;
        }
        .menu-toggle {
          display: grid;
        }
      }

      @media (max-width: 768px) {
        .navbar {
          min-height: 4rem;
          padding: 0 var(--space-4);
        }
        .profile-copy,
        .desktop-utilities,
        .guest-actions {
          display: none;
        }
        .post-button {
          min-width: 40px;
          padding: 0 !important;
        }
        .post-button span {
          display: none;
        }
        .profile-chip {
          min-width: auto;
          padding: 4px;
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
        brandTagline: "Ko'chmas mulk olamidagi hamrohingiz",
        navHome: 'Bosh sahifa',
        navProperties: 'Mulklar',
        navAdmin: 'Admin panel',
        postListing: "E'lon joylash",
        profile: 'Shaxsiy profil',
        bookings: 'Mening bronlarim',
        favorites: 'Sevimlilar',
        logout: 'Tizimdan chiqish',
        login: 'Kirish',
        register: "Ro'yxatdan o'tish",
        themeLight: "Yorug' rejim",
        themeDark: 'Tungi rejim',
        ariaLanguage: 'Tilni tanlash',
        subscriptions: 'Obunalar',
        myProperties: 'Mening mulklarim',
        aiAssistant: 'AI Yordamchi',
        market: 'Bozor',
        compare: 'Taqqoslash',
      },
      ru: {
        brandTagline: 'Ваш спутник в мире недвижимости',
        navHome: 'Главная',
        navProperties: 'Недвижимость',
        navAdmin: 'Админ панель',
        postListing: 'Разместить',
        profile: 'Личный профиль',
        bookings: 'Мои бронирования',
        favorites: 'Избранное',
        logout: 'Выйти',
        login: 'Войти',
        register: 'Регистрация',
        themeLight: 'Светлая тема',
        themeDark: 'Тёмная тема',
        ariaLanguage: 'Выбор языка',
        subscriptions: 'Подписки',
        myProperties: 'Мои объекты',
        aiAssistant: 'AI Помощник',
        market: 'Рынок',
        compare: 'Сравнение',
      },
      en: {
        brandTagline: 'Your companion in real estate',
        navHome: 'Home',
        navProperties: 'Properties',
        navAdmin: 'Admin panel',
        postListing: 'Post listing',
        profile: 'Personal profile',
        bookings: 'My bookings',
        favorites: 'Favorites',
        logout: 'Log out',
        login: 'Sign in',
        register: 'Sign up',
        themeLight: 'Light mode',
        themeDark: 'Dark mode',
        ariaLanguage: 'Select language',
        subscriptions: 'Subscriptions',
        myProperties: 'My properties',
        aiAssistant: 'AI Assistant',
        market: 'Market',
        compare: 'Compare',
      },
    } as const;
    return labels[language as keyof typeof labels] || labels.uz;
  });

  protected readonly navItems = computed<{ label: string; link: string; exact?: boolean }[]>(() => {
    const t = this.text();
    return [
      { label: t.navHome, link: '/', exact: true },
      { label: t.navProperties, link: '/properties' },
      { label: 'Xarita', link: '/map' },
      { label: t.aiAssistant, link: '/ai-tools' },
      { label: t.market, link: '/market' },
    ];
  });

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
    { label: string; link: string; icon: string; exact?: boolean }[]
  >(() => {
    const t = this.text();
    const baseItems = [
      { label: t.navHome, link: '/', icon: 'home', exact: true },
      { label: t.navProperties, link: '/properties', icon: 'search' },
      { label: t.aiAssistant, link: '/ai-tools', icon: 'psychology' },
      { label: t.market, link: '/market', icon: 'trending_up' },
      { label: t.compare, link: '/compare', icon: 'compare' },
    ];
    if (!this.authStore.isLoggedIn())
      return [...baseItems, { label: t.login, link: '/auth/login', icon: 'login' }];
    return [...baseItems, { label: t.profile, link: '/profile', icon: 'person' }];
  });
}

import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

type ThemeMode = 'light' | 'dark';
type LanguageCode = 'uz' | 'ru' | 'en';

const THEME_KEY = 'mulkchi-theme';
const LANGUAGE_KEY = 'mulkchi-language';

@Injectable({ providedIn: 'root' })
export class UIStore {
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<ThemeMode>(this.readTheme());
  readonly language = signal<LanguageCode>(this.readLanguage());
  readonly sidebarOpen = signal(false);
  readonly isDarkTheme = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this.theme();
      const root = this.document.documentElement;

      root.classList.toggle('theme-dark', theme === 'dark');
      root.classList.toggle('theme-light', theme === 'light');
      localStorage.setItem(THEME_KEY, theme);
    });

    effect(() => {
      localStorage.setItem(LANGUAGE_KEY, this.language());
    });
  }

  toggleTheme(): void {
    this.theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  setLanguage(language: LanguageCode): void {
    this.language.set(language);
  }

  private readTheme(): ThemeMode {
    const storedTheme = localStorage.getItem(THEME_KEY);
    return storedTheme === 'dark' ? 'dark' : 'light';
  }

  private readLanguage(): LanguageCode {
    const storedLanguage = localStorage.getItem(LANGUAGE_KEY);

    if (storedLanguage === 'ru' || storedLanguage === 'en') {
      return storedLanguage;
    }

    return 'uz';
  }
}

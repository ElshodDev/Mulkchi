import { Injectable, inject, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  
  private readonly THEME_KEY = 'mulkchi-theme';
  private readonly THEME_CLASS_DARK = 'dark-theme';
  private readonly THEME_CLASS_LIGHT = 'light-theme';
  
  // Current theme signal
  currentTheme = signal<Theme>(this.getStoredTheme());
  
  // Is dark mode active (computed from theme)
  isDarkMode = signal<boolean>(false);
  
  constructor() {
    // Initialize theme
    this.applyTheme(this.currentTheme());
    
    // Listen for system theme changes
    this.listenToSystemTheme();
    
    // Setup effect to react to theme changes
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
    });
  }
  
  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }
  
  /**
   * Toggle between light and dark
   */
  toggleTheme(): void {
    const newTheme = this.isDarkMode() ? 'light' : 'dark';
    this.setTheme(newTheme);
  }
  
  /**
   * Get stored theme from localStorage
   */
  private getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system';
    
    const stored = localStorage.getItem(this.THEME_KEY) as Theme;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return 'system';
  }
  
  /**
   * Apply theme to document
   */
  private applyTheme(theme: Theme): void {
    const body = this.document.body;
    const html = this.document.documentElement;
    
    // Remove existing theme classes
    body.classList.remove(this.THEME_CLASS_DARK, this.THEME_CLASS_LIGHT);
    html.classList.remove(this.THEME_CLASS_DARK, this.THEME_CLASS_LIGHT);
    
    let isDark = false;
    
    switch (theme) {
      case 'dark':
        isDark = true;
        body.classList.add(this.THEME_CLASS_DARK);
        html.classList.add(this.THEME_CLASS_DARK);
        break;
      case 'light':
        isDark = false;
        body.classList.add(this.THEME_CLASS_LIGHT);
        html.classList.add(this.THEME_CLASS_LIGHT);
        break;
      case 'system':
        isDark = this.isSystemDark();
        if (isDark) {
          body.classList.add(this.THEME_CLASS_DARK);
          html.classList.add(this.THEME_CLASS_DARK);
        } else {
          body.classList.add(this.THEME_CLASS_LIGHT);
          html.classList.add(this.THEME_CLASS_LIGHT);
        }
        break;
    }
    
    this.isDarkMode.set(isDark);
    
    // Update meta theme-color
    this.updateMetaThemeColor(isDark);
  }
  
  /**
   * Check if system prefers dark mode
   */
  private isSystemDark(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  /**
   * Listen to system theme changes
   */
  private listenToSystemTheme(): void {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }
  
  /**
   * Update meta theme-color for browser UI
   */
  private updateMetaThemeColor(isDark: boolean): void {
    const color = isDark ? '#1a1a2e' : '#667eea';
    
    // Update or create theme-color meta tag
    let meta = this.document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!meta) {
      meta = this.document.createElement('meta');
      meta.name = 'theme-color';
      this.document.head.appendChild(meta);
    }
    meta.content = color;
  }
  
  /**
   * Get CSS variables for current theme
   */
  getThemeVariables(): Record<string, string> {
    const isDark = this.isDarkMode();
    
    return {
      // Background colors
      '--bg-primary': isDark ? '#1a1a2e' : '#ffffff',
      '--bg-secondary': isDark ? '#16213e' : '#f5f5f5',
      '--bg-tertiary': isDark ? '#0f3460' : '#e8e8e8',
      '--bg-card': isDark ? '#1e2a4a' : '#ffffff',
      
      // Text colors
      '--text-primary': isDark ? '#ffffff' : '#333333',
      '--text-secondary': isDark ? '#a0aec0' : '#666666',
      '--text-tertiary': isDark ? '#718096' : '#999999',
      '--text-muted': isDark ? '#4a5568' : '#cccccc',
      
      // Border colors
      '--border-color': isDark ? '#2d3748' : '#e0e0e0',
      '--border-color-light': isDark ? '#1a202c' : '#f0f0f0',
      
      // Primary accent
      '--primary-color': '#667eea',
      '--primary-light': isDark ? '#7c8ae8' : '#7c8ae8',
      '--primary-dark': '#5a67d8',
      
      // Shadows
      '--shadow-sm': isDark ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '--shadow-md': isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      '--shadow-lg': isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      
      // Overlay
      '--overlay-color': isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      
      // Status colors
      '--success-color': isDark ? '#48bb78' : '#38a169',
      '--warning-color': isDark ? '#ed8936' : '#d69e2e',
      '--error-color': isDark ? '#f56565' : '#e53e3e',
      '--info-color': isDark ? '#4299e1' : '#3182ce'
    };
  }
  
  /**
   * Apply CSS variables to element
   */
  applyThemeVariables(element: HTMLElement): void {
    const variables = this.getThemeVariables();
    Object.entries(variables).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }
}

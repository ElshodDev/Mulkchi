import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <footer class="modern-footer">
      <div class="footer-container container">
        <div class="footer-top">
          <div class="brand-section">
            <div class="footer-brand">
              <span class="logo-icon">🏢</span>
              <span class="logo-text">Mulkchi</span>
            </div>
          </div>
          
          <div class="links-section">
            <div class="link-column">
              <h4>Platforma</h4>
              <a routerLink="/properties">Mulklar</a>
              <a routerLink="/market">Bozor holati</a>
              <a routerLink="/ai-tools">AI Yordamchi</a>
            </div>
            <div class="link-column">
              <h4>Kompaniya</h4>
              <a routerLink="/about">Biz haqimizda</a>
              <a routerLink="/auth/login">Tizimga kirish</a>
              <a routerLink="/auth/register">Ro'yxatdan o'tish</a>
            </div>
            <div class="link-column">
              <h4>Qo'llab-quvvatlash</h4>
              <a routerLink="/support">Yordam markazi</a>
              <a routerLink="/terms">Foydalanish shartlari</a>
              <a routerLink="/privacy">Maxfiylik siyosati</a>
            </div>
            <div class="link-column app-downloads">
              <h4>Ilovani yuklab oling</h4>
              <a href="javascript:void(0)" class="app-badge">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store">
              </a>
              <a href="javascript:void(0)" class="app-badge mt-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play">
              </a>
            </div>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="copyright">
            &copy; {{ currentYear }} Mulkchi. Barcha huquqlar himoyalangan.
          </p>
          <div class="social-links">
            <a href="https://t.me/Elshod_Developer" target="_blank" rel="noopener noreferrer" matTooltip="Telegram" class="social-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.18-.08-.04-.19-.02-.27 0-.11.03-1.84 1.18-5.2 3.45-.49.34-.93.51-1.33.5-.42-.01-1.22-.24-1.82-.44-.73-.24-1.31-.37-1.27-.78.02-.22.32-.45.9-.69 3.53-1.54 5.88-2.55 7.05-3.04 3.35-1.4 4.05-1.64 4.5-1.64.1 0 .32.02.46.14.12.09.16.22.17.33-.02.04-.02.08-.03.18z"/></svg>
            </a>
            <a href="https://instagram.com/elshod_i" target="_blank" rel="noopener noreferrer" matTooltip="Instagram" class="social-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://www.linkedin.com/in/elshod-ibodullayev-338940379" target="_blank" rel="noopener noreferrer" matTooltip="LinkedIn" class="social-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
            </a>
            <a href="https://github.com/ElshodDev" target="_blank" rel="noopener noreferrer" matTooltip="GitHub" class="social-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .modern-footer {
      background: var(--color-background);
      border-top: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      padding: 60px 0 20px;
      margin-top: 40px;
      font-family: 'Inter', sans-serif;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    .footer-top {
      display: grid;
      grid-template-columns: 1.5fr 2fr;
      gap: 40px;
      margin-bottom: 40px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 40px;
    }
    .brand-section {
      max-width: 400px;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 16px;
      color: var(--color-text-primary);
    }
    .logo-icon {
      font-size: 2rem;
    }
    .thesis-title {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--color-text-secondary);
    }
    .thesis-title strong {
      color: var(--color-gold);
      font-size: 1.05rem;
    }
    .links-section {
      display: flex;
      gap: 60px;
      justify-content: flex-end;
    }
    .link-column {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .link-column h4 {
      color: var(--color-text-primary);
      font-size: 1.1rem;
      margin: 0 0 8px 0;
      font-weight: 600;
    }
    .link-column a {
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: color 0.3s, transform 0.3s;
      font-size: 0.95rem;
    }
    .link-column a:hover {
      color: var(--color-gold);
      transform: translateX(5px);
    }
    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--color-text-secondary);
      font-size: 0.85rem;
    }
    .social-links {
      display: flex;
      gap: 16px;
    }
    .social-icon {
      color: var(--color-text-secondary);
      background: rgba(15, 23, 42, 0.1);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }
    .social-icon:hover {
      background: var(--color-gold);
      color: var(--color-surface);
      transform: translateY(-3px);
    }
    
    .app-downloads .app-badge {
      display: block;
      margin-bottom: 12px;
      transition: transform 0.2s;
    }
    
    .app-downloads .app-badge img {
      height: 40px;
      width: auto;
    }
    
    .app-downloads .app-badge:hover {
      transform: translateY(-2px);
    }
    
    .mt-2 {
      margin-top: 8px;
    }

    @media (max-width: 768px) {
      .footer-top {
        grid-template-columns: 1fr;
        gap: 30px;
      }
      .links-section {
        justify-content: flex-start;
        gap: 40px;
      }
      .footer-bottom {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}

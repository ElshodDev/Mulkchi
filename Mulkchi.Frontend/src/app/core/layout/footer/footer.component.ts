import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="modern-footer">
      <div class="footer-container container">
        <div class="footer-top">
          <div class="brand-section">
            <div class="footer-brand">
              <span class="logo-icon">🏢</span>
              <span class="logo-text">Mulkchi</span>
            </div>
            <p class="thesis-title">
              <strong>Bitiruv Malakaviy Ishi (BMI)</strong><br>
              "Ma'lumotlar bazasiga asoslangan uy joy savdosi va ijarasi uchun web sayt ishlab chiqish"
            </p>
          </div>
          
          <div class="links-section">
            <div class="link-column">
              <h4>Platforma</h4>
              <a routerLink="/properties">Mulklar</a>
              <a routerLink="/market">Bozor holati</a>
              <a routerLink="/ai-tools">AI Yordamchi</a>
            </div>
            <div class="link-column">
              <h4>Foydalanuvchi</h4>
              <a routerLink="/auth/login">Tizimga kirish</a>
              <a routerLink="/auth/register">Ro'yxatdan o'tish</a>
              <a routerLink="/profile">Profil</a>
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
          <div class="badges">
            <span class="tech-badge">Angular 20</span>
            <span class="tech-badge">.NET 9</span>
            <span class="tech-badge">PostgreSQL</span>
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
    .badges {
      display: flex;
      gap: 10px;
    }
    .tech-badge {
      background: rgba(15, 23, 42, 0.05);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-primary);
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

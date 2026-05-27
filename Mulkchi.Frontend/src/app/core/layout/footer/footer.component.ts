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
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="copyright">
            &copy; {{ currentYear }} Mulkchi. Barcha huquqlar himoyalangan.
          </p>
          <div class="badges">
            <span class="tech-badge">Angular 18</span>
            <span class="tech-badge">.NET 8</span>
            <span class="tech-badge">PostgreSQL</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .modern-footer {
      background: #0f172a;
      color: #f8fafc;
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
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
      color: white;
    }
    .logo-icon {
      font-size: 2rem;
    }
    .thesis-title {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #94a3b8;
    }
    .thesis-title strong {
      color: #c084fc;
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
      color: white;
      font-size: 1.1rem;
      margin: 0 0 8px 0;
      font-weight: 600;
    }
    .link-column a {
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.3s, transform 0.3s;
      font-size: 0.95rem;
    }
    .link-column a:hover {
      color: #c084fc;
      transform: translateX(5px);
    }
    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #64748b;
      font-size: 0.85rem;
    }
    .badges {
      display: flex;
      gap: 10px;
    }
    .tech-badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
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

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="info-page-container">
      <div class="container modern-card fade-in">
        <h1 class="page-title">{{ title }}</h1>
        
        <div class="content" *ngIf="pageType === 'about'">
          <p><strong>Mulkchi</strong> - Bu O'zbekistondagi eng ilg'or va zamonaviy ko'chmas mulk platformasi. Bizning maqsadimiz ijarachilar va uy egalari o'rtasida ishonchli, tezkor va arzon ko'prik yaratish.</p>
          <p>Sun'iy intellekt va eng zamonaviy texnologiyalarga (AI Narx, 3D AR Mebel) tayangan holda sizga beminnat xizmat ko'rsatamiz.</p>
        </div>

        <div class="content" *ngIf="pageType === 'support'">
          <p>Yordam markaziga xush kelibsiz!</p>
          <ul>
            <li><strong>Qanday qilib e'lon beraman?</strong> Tizimga kiring va 'E'lon joylash' tugmasini bosing.</li>
            <li><strong>To'lovlar xavfsizmi?</strong> Ha, biz xavfsiz Stripe tranzaksiyalaridan foydalanamiz.</li>
            <li>Savollaringiz bo'lsa biz bilan bog'laning: support&#64;mulkchi.uz</li>
          </ul>
        </div>

        <div class="content" *ngIf="pageType === 'terms'">
          <p>Quyida foydalanish shartlari keltirilgan:</p>
          <ol>
            <li>Platformada faqat to'g'ri va ishonchli e'lonlar berilishi shart.</li>
            <li>Maklerlar o'z e'lonida makler ekanligini belgilashi shart.</li>
            <li>Spam va yolg'on ma'lumot kiritgan foydalanuvchilar tizimdan chetlashtiriladi.</li>
          </ol>
        </div>

        <div class="content" *ngIf="pageType === 'privacy'">
          <p>Biz sizning ma'lumotlaringizni xavfsiz saqlaymiz.</p>
          <p>Platforma foydalanuvchilarning shaxsiy ma'lumotlarini (ism, telefon raqam) uchinchi shaxslarga tijorat maqsadida sotmaydi. To'liq shifrlangan TLS/SSL xavfsizlik protokollari ishlatiladi.</p>
        </div>

        <div class="mt-8">
          <a routerLink="/" class="back-btn">
            &larr; Bosh sahifaga qaytish
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .info-page-container {
      padding: 60px 20px;
      min-height: 60vh;
      background: var(--color-background);
      display: flex;
      justify-content: center;
    }
    .modern-card {
      background: var(--color-surface);
      border-radius: 16px;
      padding: 40px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      border: 1px solid var(--color-border);
    }
    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-text-primary);
      margin-bottom: 24px;
      border-bottom: 2px solid var(--color-border);
      padding-bottom: 16px;
    }
    .content p, .content li {
      color: var(--color-text-secondary);
      line-height: 1.8;
      font-size: 1.05rem;
      margin-bottom: 16px;
    }
    .content ul, .content ol {
      margin-left: 20px;
      margin-bottom: 20px;
    }
    .back-btn {
      display: inline-block;
      color: var(--color-gold);
      text-decoration: none;
      font-weight: 600;
      transition: opacity 0.3s;
    }
    .back-btn:hover {
      opacity: 0.8;
    }
    .fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class InfoPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  pageType: string = '';
  title: string = '';

  ngOnInit() {
    this.route.url.subscribe(urlSegment => {
      const path = urlSegment[0].path;
      this.pageType = path;
      
      switch(path) {
        case 'about': this.title = "Biz haqimizda"; break;
        case 'support': this.title = "Yordam markazi"; break;
        case 'terms': this.title = "Foydalanish shartlari"; break;
        case 'privacy': this.title = "Maxfiylik siyosati"; break;
        default: this.title = "Ma'lumot";
      }
    });
  }
}

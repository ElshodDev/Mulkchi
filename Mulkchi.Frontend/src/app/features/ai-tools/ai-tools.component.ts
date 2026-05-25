import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';

import { AIService } from '../../core/services/ai.service';

@Component({
  selector: 'app-ai-tools',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="ai-universe-bg">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>

      <div class="container ai-content-wrapper">
        <!-- HEADER -->
        <header class="ai-header animate-slide-up">
          <div class="ai-badge">
            <mat-icon>psychology</mat-icon>
            <span>Powered by Mulkchi AI</span>
          </div>
          <h1>AI Yordamchi</h1>
          <p>
            Mulk bozorini tahlil qilish va eng yaxshi qarorlarni qabul qilishda sun'iy intellektga
            ishoning
          </p>
        </header>

        <!-- GRID CARDS -->
        <div class="ai-feature-grid">
          <!-- Personal Recommendations -->
          <div class="ai-glass-card animate-fade-in-delay-1" routerLink="/ai-recommendations">
            <div class="card-glow"></div>
            <div class="card-icon-box">
              <mat-icon>auto_awesome</mat-icon>
            </div>
            <h3>Shaxsiy Tavsiyalar</h3>
            <p>
              Sizning qiziqishlaringiz va o'tmishdagi qidiruvlaringiz asosida eng mos mulklarni AI
              topib beradi.
            </p>
            <div class="card-footer">
              <span>Batafsil</span>
              <mat-icon>east</mat-icon>
            </div>
          </div>

          <!-- Price Prediction -->
          <div class="ai-glass-card animate-fade-in-delay-2" routerLink="/ai-price">
            <div class="card-glow"></div>
            <div class="card-icon-box gold">
              <mat-icon>insights</mat-icon>
            </div>
            <h3>Narx Bashorati</h3>
            <p>
              Mulkning real bozor qiymatini va kelgusi 6 oylik narx o'zgarishini AI algoritmlari
              orqali aniqlang.
            </p>
            <div class="card-footer">
              <span>Batafsil</span>
              <mat-icon>east</mat-icon>
            </div>
          </div>

          <!-- Comparison -->
          <div class="ai-glass-card animate-fade-in-delay-3" routerLink="/compare">
            <div class="card-glow"></div>
            <div class="card-icon-box green">
              <mat-icon>compare_arrows</mat-icon>
            </div>
            <h3>Mulk Taqqoslash</h3>
            <p>
              Bir nechta tanlangan mulklarning barcha xususiyatlarini o'zaro solishtiring va eng
              yaxshisini tanlang.
            </p>
            <div class="card-footer">
              <span>Solishtirish</span>
              <mat-icon>east</mat-icon>
            </div>
          </div>
        </div>

        <!-- AI CHAT SECTION -->
        <div class="ai-chat-section animate-slide-up-long">
          <div class="chat-glass-container">
            <div class="chat-sidebar">
              <div class="ai-status">
                <div class="pulse-dot"></div>
                <span>AI Online</span>
              </div>
              <h4>AI Yordamchi</h4>
              <p>24/7 sizga maslahat berishga tayyor</p>

              <div class="suggested-prompts">
                <button (click)="onPromptClick('Chilonzordan arzon uylar top')">
                  Chilonzor uylari
                </button>
                <button (click)="onPromptClick('Narxlar qachon tushadi?')">Narx tahlili</button>
              </div>
            </div>

            <div class="chat-main">
              <div class="chat-messages">
                <div class="msg bot">
                  <div class="avatar"><mat-icon>smart_toy</mat-icon></div>
                  <div class="bubble">
                    Assalomu alaykum! Men Mulkchi AI yordamchisiman. Sizga qanday mulk kerak yoki
                    bozor bo'yicha qanday savolingiz bor?
                  </div>
                </div>
                <div class="msg user">
                  <div class="bubble">
                    Chilonzor tumanidan 3 xonali, yaxshi ta'mirlangan kvartira izlayapman.
                  </div>
                </div>
              </div>

              <div class="chat-input-box">
                <input
                  type="text"
                  placeholder="AI'dan so'rang... (masalan: Toshkentda uy narxlari o'zgarishi)"
                />
                <button class="btn-send" (click)="startChat()">
                  <mat-icon>send</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        --indigo: #4f46e5;
        --indigo-dark: #312e81;
        --violet: #8b5cf6;
        --gold: #c9a84c;
        --white: #ffffff;
        --glass-bg: rgba(255, 255, 255, 0.7);
        --glass-border: rgba(255, 255, 255, 0.4);
        display: block;
        overflow-x: hidden;
      }

      .ai-universe-bg {
        min-height: 100vh;
        background: #f8fafc;
        position: relative;
        padding: 60px 0;
        overflow: hidden;
      }

      /* --- ORBS --- */
      .glow-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(80px);
        z-index: 1;
        opacity: 0.4;
        animation: orbit 20s infinite alternate ease-in-out;
      }
      .orb-1 {
        width: 400px;
        height: 400px;
        background: var(--indigo);
        top: -100px;
        right: -100px;
      }
      .orb-2 {
        width: 350px;
        height: 350px;
        background: var(--violet);
        bottom: -100px;
        left: -100px;
        animation-delay: -5s;
      }
      .orb-3 {
        width: 300px;
        height: 300px;
        background: var(--gold);
        top: 50%;
        left: 30%;
        animation-delay: -10s;
        opacity: 0.2;
      }

      @keyframes orbit {
        0% {
          transform: translate(0, 0) scale(1);
        }
        100% {
          transform: translate(100px, 50px) scale(1.2);
        }
      }

      .ai-content-wrapper {
        position: relative;
        z-index: 10;
        max-width: 1200px;
      }

      /* --- HEADER --- */
      .ai-header {
        text-align: center;
        margin-bottom: 60px;
      }
      .ai-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        background: rgba(79, 70, 229, 0.1);
        color: var(--indigo);
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.85rem;
        margin-bottom: 24px;
        border: 1px solid rgba(79, 70, 229, 0.2);
      }
      .ai-header h1 {
        font-size: 3.5rem;
        font-weight: 900;
        color: #0f172a;
        margin-bottom: 16px;
        letter-spacing: -1px;
      }
      .ai-header p {
        font-size: 1.25rem;
        color: #475569;
        max-width: 700px;
        margin: 0 auto;
        line-height: 1.6;
      }

      /* --- GRID --- */
      .ai-feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 32px;
        margin-bottom: 80px;
      }

      .ai-glass-card {
        position: relative;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--glass-border);
        border-radius: 32px;
        padding: 40px;
        cursor: pointer;
        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }

      .ai-glass-card:hover {
        transform: translateY(-15px);
        background: var(--white);
        box-shadow: 0 40px 80px rgba(79, 70, 229, 0.1);
        border-color: var(--indigo);
      }

      .card-icon-box {
        width: 64px;
        height: 64px;
        background: var(--indigo);
        color: white;
        border-radius: 20px;
        display: grid;
        place-items: center;
        margin-bottom: 24px;
        box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
      }
      .card-icon-box.gold {
        background: var(--gold);
        box-shadow: 0 10px 20px rgba(201, 168, 76, 0.3);
      }
      .card-icon-box.green {
        background: #10b981;
        box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
      }
      .card-icon-box mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .ai-glass-card h3 {
        font-size: 1.5rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 16px;
      }
      .ai-glass-card p {
        color: #64748b;
        line-height: 1.7;
        font-size: 1rem;
        margin-bottom: 32px;
      }

      .card-footer {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        color: var(--indigo);
        transition: gap 0.3s;
      }
      .ai-glass-card:hover .card-footer {
        gap: 16px;
      }

      /* --- CHAT SECTION --- */
      .chat-glass-container {
        display: flex;
        background: var(--glass-bg);
        backdrop-filter: blur(30px);
        border: 1px solid var(--glass-border);
        border-radius: 40px;
        overflow: hidden;
        min-height: 500px;
        box-shadow: 0 30px 60px rgba(0, 0, 0, 0.05);
      }

      .chat-sidebar {
        width: 300px;
        background: rgba(79, 70, 229, 0.05);
        padding: 40px;
        border-right: 1px solid var(--glass-border);
      }
      .ai-status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        font-size: 0.85rem;
        font-weight: 700;
        color: #10b981;
      }
      .pulse-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        animation: pulse-green 2s infinite;
      }
      @keyframes pulse-green {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        70% {
          transform: scale(1.1);
          box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }

      .chat-sidebar h4 {
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 8px;
      }
      .chat-sidebar p {
        font-size: 0.9rem;
        color: #64748b;
        margin-bottom: 32px;
      }

      .suggested-prompts {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .suggested-prompts button {
        text-align: left;
        padding: 12px 16px;
        background: var(--white);
        border: 1px solid var(--border);
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--indigo);
        cursor: pointer;
        transition: all 0.2s;
      }
      .suggested-prompts button:hover {
        background: var(--indigo);
        color: white;
        transform: translateX(5px);
      }

      .chat-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 40px;
      }
      .chat-messages {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-bottom: 32px;
      }

      .msg {
        display: flex;
        gap: 16px;
        max-width: 80%;
      }
      .msg.bot {
        align-self: flex-start;
      }
      .msg.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      .avatar {
        width: 40px;
        height: 40px;
        background: var(--indigo);
        color: white;
        border-radius: 50%;
        display: grid;
        place-items: center;
      }
      .bubble {
        padding: 16px 20px;
        border-radius: 20px;
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .msg.bot .bubble {
        background: var(--white);
        color: #1e293b;
        border-bottom-left-radius: 4px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
      }
      .msg.user .bubble {
        background: var(--indigo);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .chat-input-box {
        display: flex;
        gap: 12px;
        background: var(--white);
        padding: 8px 8px 8px 24px;
        border-radius: 20px;
        border: 1px solid var(--border);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      }
      .chat-input-box input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 0.95rem;
        color: #1e293b;
      }
      .btn-send {
        width: 48px;
        height: 48px;
        background: var(--indigo);
        color: white;
        border: none;
        border-radius: 16px;
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: all 0.3s;
      }
      .btn-send:hover {
        transform: rotate(-10deg) scale(1.1);
        background: var(--indigo-dark);
      }

      /* --- ANIMATIONS --- */
      .animate-slide-up {
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .animate-slide-up-long {
        animation: slideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .animate-fade-in-delay-1 {
        animation: fadeIn 0.8s ease-out 0.2s both;
      }
      .animate-fade-in-delay-2 {
        animation: fadeIn 0.8s ease-out 0.4s both;
      }
      .animate-fade-in-delay-3 {
        animation: fadeIn 0.8s ease-out 0.6s both;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(40px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @media (max-width: 900px) {
        .chat-glass-container {
          flex-direction: column;
        }
        .chat-sidebar {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid var(--glass-border);
        }
        .ai-header h1 {
          font-size: 2.5rem;
        }
      }
    `,
  ],
})
export class AiToolsComponent implements OnInit {
  protected readonly aiService = inject(AIService);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {}

  onPromptClick(prompt: string): void {
    this.startChat();
  }

  startChat(): void {
    this.snackBar.open(
      "Ushbu funksiya hozirda test rejimida. Tez kunda to'liq ishga tushadi!",
      'Yopish',
      {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['info-snackbar'],
      },
    );
  }
}

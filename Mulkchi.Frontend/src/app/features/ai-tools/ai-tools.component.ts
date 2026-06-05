import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Property } from '../../core/models';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  properties?: Property[];
}
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AIService } from '../../core/services/ai.service';

@Component({
  selector: 'app-ai-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
              <div class="chat-messages" #scrollMe>
                @for (msg of messages; track msg.id) {
                  <div class="msg" [ngClass]="msg.role === 'user' ? 'user' : 'bot'">
                    @if (msg.role === 'assistant') {
                      <div class="avatar"><mat-icon>smart_toy</mat-icon></div>
                    }
                    <div class="bubble-container">
                      <div class="bubble">
                        {{ msg.content }}
                      </div>
                      
                      @if (msg.properties && msg.properties.length > 0) {
                        <div class="chat-properties">
                          @for (prop of msg.properties; track prop.id) {
                            <div class="chat-prop-card" [routerLink]="['/properties', prop.id]">
                              <div class="img-box">
                                <img [src]="prop.images && prop.images.length > 0 ? prop.images[0].url : 'assets/images/placeholder-property.jpg'" alt="Property" />
                              </div>
                              <div class="info">
                                <h5>{{ prop.title }}</h5>
                                <div class="price">
                                  @if (prop.listingType === 'Sale') {
                                    {{ prop.salePrice | number }} {{ prop.currency === 'UZS' ? 'UZS' : 'USD' }}
                                  } @else if (prop.listingType === 'Rent') {
                                    {{ prop.monthlyRent | number }} {{ prop.currency === 'UZS' ? 'UZS' : 'USD' }}/oy
                                  } @else {
                                    {{ prop.pricePerNight | number }} {{ prop.currency === 'UZS' ? 'UZS' : 'USD' }}/kun
                                  }
                                </div>
                                <span><mat-icon>location_on</mat-icon> {{ prop.city }}</span>
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }

                @if (isTyping) {
                  <div class="msg bot">
                    <div class="avatar"><mat-icon>smart_toy</mat-icon></div>
                    <div class="bubble typing-bubble">
                      <div class="dot-typing"></div>
                    </div>
                  </div>
                }
              </div>

              <div class="chat-input-box">
                <input
                  type="text"
                  [(ngModel)]="currentInput"
                  (keyup.enter)="sendMessage()"
                  placeholder="AI'dan so'rang... (masalan: Toshkentda uy narxlari o'zgarishi)"
                />
                <button class="btn-send" (click)="sendMessage()" [disabled]="!currentInput.trim() || isTyping">
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

      .typing-bubble {
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 20px !important;
      }
      
      .dot-typing {
        position: relative;
        left: -9999px;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: #cbd5e1;
        color: #cbd5e1;
        box-shadow: 9984px 0 0 0 #cbd5e1, 9999px 0 0 0 #cbd5e1, 10014px 0 0 0 #cbd5e1;
        animation: dot-typing 1.5s infinite linear;
      }

      @keyframes dot-typing {
        0% { box-shadow: 9984px 0 0 0 #cbd5e1, 9999px 0 0 0 #cbd5e1, 10014px 0 0 0 #cbd5e1; }
        16.667% { box-shadow: 9984px -6px 0 0 #cbd5e1, 9999px 0 0 0 #cbd5e1, 10014px 0 0 0 #cbd5e1; }
        33.333% { box-shadow: 9984px 0 0 0 #cbd5e1, 9999px -6px 0 0 #cbd5e1, 10014px 0 0 0 #cbd5e1; }
        50% { box-shadow: 9984px 0 0 0 #cbd5e1, 9999px 0 0 0 #cbd5e1, 10014px -6px 0 0 #cbd5e1; }
        66.667% { box-shadow: 9984px 0 0 0 #cbd5e1, 9999px 0 0 0 #cbd5e1, 10014px 0 0 0 #cbd5e1; }
        100% { box-shadow: 9984px 0 0 0 #cbd5e1, 9999px 0 0 0 #cbd5e1, 10014px 0 0 0 #cbd5e1; }
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

      .chat-properties {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 8px;
      }

      .chat-prop-card {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--white);
        border: 1px solid rgba(0,0,0,0.05);
        border-radius: 12px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.3s;
        color: #333;
        text-decoration: none;
      }

      .chat-prop-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        border-color: var(--violet);
      }

      .chat-prop-card .img-box {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
        flex-shrink: 0;
      }

      .chat-prop-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .chat-prop-card .info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .chat-prop-card .info h5 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }

      .chat-prop-card .info .price {
        font-size: 13px;
        color: var(--indigo);
        font-weight: 700;
      }

      .chat-prop-card .info span {
        font-size: 11px;
        color: #666;
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .chat-prop-card .info span mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .bubble-container {
        display: flex;
        flex-direction: column;
        max-width: 80%;
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
export class AiToolsComponent implements OnInit, AfterViewChecked {
  protected readonly aiService = inject(AIService);
  private readonly snackBar = inject(MatSnackBar);

  messages: ChatMessage[] = [
    {
      id: '1',
      role: 'assistant',
      content: "Assalomu alaykum! Men Mulkchi AI yordamchisiman. Sizga qanday mulk kerak yoki bozor bo'yicha qanday savolingiz bor?"
    }
  ];
  currentInput = '';
  isTyping = false;

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  ngOnInit(): void {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  onPromptClick(prompt: string): void {
    this.currentInput = prompt;
    this.sendMessage();
  }

  sendMessage(): void {
    const text = this.currentInput.trim();
    if (!text) return;

    this.messages.push({
      id: Date.now().toString(),
      role: 'user',
      content: text
    });
    
    this.currentInput = '';
    this.isTyping = true;

    const history = this.messages
      .filter(m => m.role === 'user' && m.content !== text)
      .map(m => m.content);

    this.aiService.chat(text, history).subscribe({
      next: (res: any) => {
        this.isTyping = false;
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: res.reply,
          properties: res.properties
        });
      },
      error: (err: any) => {
        this.isTyping = false;
        this.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          content: "Kechirasiz, javob olishda xatolik yuz berdi."
        });
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // Ignore scroll errors
    }
  }
}

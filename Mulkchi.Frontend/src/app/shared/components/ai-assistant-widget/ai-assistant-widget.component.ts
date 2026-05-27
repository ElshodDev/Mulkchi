import { Component, signal, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { AIService } from '../../../core/services/ai.service';

import { Property } from '../../../core/models';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  properties?: Property[];
}

@Component({
  selector: 'app-ai-assistant-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  template: `
    <!-- Floating Button -->
    <button 
      class="ai-fab" 
      [class.hidden]="isOpen()"
      (click)="toggleChat()"
      [@bounceIn]="!isOpen() ? 'in' : 'out'">
      <mat-icon>auto_awesome</mat-icon>
    </button>

    <!-- Chat Window -->
    <div class="ai-chat-window" *ngIf="isOpen()" [@slideUp]="isOpen() ? 'in' : 'out'">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-info">
          <div class="ai-avatar">
            <mat-icon>psychology</mat-icon>
          </div>
          <div>
            <h3>Mulkchi AI</h3>
            <span>Online yordamchi</span>
          </div>
        </div>
        <button mat-icon-button (click)="toggleChat()" class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Messages Area -->
      <div class="chat-messages" #scrollMe>
        <div class="welcome-message" *ngIf="messages().length === 0">
          <mat-icon>waving_hand</mat-icon>
          <p>Assalomu alaykum! Men Mulkchi AI yordamchisiman. Mulk qidirish yoki e'lon berish bo'yicha qanday yordam bera olaman?</p>
          <div class="suggestion-chips">
            <button (click)="sendSuggestion('Uyni qanday baholayman?')">Uyni qanday baholayman?</button>
            <button (click)="sendSuggestion('Ijara shartnomasi qanday tuziladi?')">Ijara shartnomasi qanday tuziladi?</button>
          </div>
        </div>

        @for (msg of messages(); track msg.id) {
          <div class="message-wrapper" [ngClass]="msg.role">
            <div class="message-bubble">
              <div class="bubble-content">{{ msg.content }}</div>
              <div class="bubble-time">{{ msg.timestamp | date:'HH:mm' }}</div>
            </div>
            
            @if (msg.properties && msg.properties.length > 0) {
              <div class="widget-properties">
                @for (prop of msg.properties; track prop.id) {
                  <a class="widget-prop-card" [href]="'/properties/' + prop.id" target="_blank">
                    <img [src]="prop.images && prop.images.length > 0 ? prop.images[0].url : 'assets/images/placeholder-property.jpg'" />
                    <div class="info">
                      <h6>{{ prop.title }}</h6>
                      <span>{{ prop.listingType === 'Sale' ? prop.salePrice : (prop.listingType === 'Rent' ? prop.monthlyRent : prop.pricePerNight) | number }} {{ prop.currency === 'UZS' ? 'UZS' : 'USD' }}</span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        }

        @if (isTyping()) {
          <div class="message-bubble assistant typing">
            <div class="dot-typing"></div>
          </div>
        }
      </div>

      <!-- Input Area -->
      <div class="chat-input-area">
        <input 
          type="text" 
          [(ngModel)]="currentInput" 
          (keyup.enter)="sendMessage()"
          placeholder="Xabaringizni yozing..." 
          class="chat-input"
        />
        <button mat-icon-button color="primary" (click)="sendMessage()" [disabled]="!currentInput.trim() || isTyping()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
    }

    .ai-fab {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .ai-fab:hover {
      transform: scale(1.1);
    }
    
    .ai-fab.hidden {
      display: none;
    }

    .ai-fab mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .ai-chat-window {
      width: 380px;
      height: 600px;
      max-height: 80vh;
      background: white;
      border-radius: 24px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
    }

    .chat-header {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .ai-avatar {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-info h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .header-info span {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    .close-btn {
      color: white;
    }

    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #f8fafc;
    }

    .welcome-message {
      text-align: center;
      color: #64748b;
      margin-bottom: 20px;
    }

    .welcome-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #cbd5e1;
      margin-bottom: 12px;
    }

    .suggestion-chips {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }

    .suggestion-chips button {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 10px 16px;
      border-radius: 20px;
      color: #6366f1;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .suggestion-chips button:hover {
      background: #f1f5ff;
      border-color: #6366f1;
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
    }
    
    .message-wrapper.user {
      align-items: flex-end;
    }
    
    .message-wrapper.assistant {
      align-items: flex-start;
    }

    .message-bubble {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      position: relative;
    }
    
    .message-wrapper.user .message-bubble {
      background: #6366f1;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-wrapper.assistant .message-bubble {
      background: #f1f5f9;
      color: #334155;
      border-bottom-left-radius: 4px;
    }

    .widget-properties {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 6px;
      max-width: 85%;
    }

    .widget-prop-card {
      display: flex;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }
    .widget-prop-card:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .widget-prop-card img {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: cover;
    }
    .widget-prop-card .info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
      overflow: hidden;
    }
    .widget-prop-card .info h6 {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .widget-prop-card .info span {
      font-size: 11px;
      color: #6366f1;
      font-weight: 700;
    }

    .bubble-time {
      font-size: 0.7rem;
      opacity: 0.7;
      margin-top: 4px;
      text-align: right;
    }

    .chat-input-area {
      padding: 16px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .chat-input {
      flex: 1;
      border: none;
      background: #f1f5f9;
      padding: 14px 20px;
      border-radius: 24px;
      font-size: 0.95rem;
      outline: none;
      transition: background 0.2s;
    }

    .chat-input:focus {
      background: #e2e8f0;
    }

    .typing {
      padding: 16px;
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

    @media (max-width: 480px) {
      .ai-chat-window {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
        position: fixed;
        bottom: 80px;
        right: 16px;
      }
      :host {
        bottom: 16px;
        right: 16px;
      }
    }
  `],
  animations: [
    trigger('slideUp', [
      state('void', style({ opacity: 0, transform: 'scale(0.8) translateY(20px)' })),
      state('in', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      transition('void => in', animate('300ms cubic-bezier(0.16, 1, 0.3, 1)')),
      transition('in => void', animate('200ms ease-out'))
    ]),
    trigger('bounceIn', [
      state('void', style({ transform: 'scale(0)' })),
      state('in', style({ transform: 'scale(1)' })),
      transition('void => in', animate('400ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'))
    ])
  ]
})
export class AiAssistantWidgetComponent implements AfterViewChecked {
  private aiService = inject(AIService);
  isOpen = signal(false);
  isTyping = signal(false);
  messages = signal<ChatMessage[]>([]);
  currentInput = '';

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen() && this.messages().length === 0) {
    }
  }

  sendSuggestion(text: string) {
    this.currentInput = text;
    this.sendMessage();
  }

  sendMessage() {
    const text = this.currentInput.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    this.messages.update(m => [...m, userMsg]);
    this.currentInput = '';
    this.isTyping.set(true);

    const history = this.messages()
      .filter(m => m.role === 'user' && m.id !== userMsg.id)
      .map(m => m.content);

    this.aiService.chat(text, history).subscribe({
      next: (res: any) => {
        this.isTyping.set(false);
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.reply,
          timestamp: new Date(),
          properties: res.properties
        };
        this.messages.update(m => [...m, aiMsg]);
      },
      error: (err: any) => {
        this.isTyping.set(false);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Kechirasiz, xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
          timestamp: new Date()
        };
        this.messages.update(m => [...m, errorMsg]);
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}

import { Component, signal, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  isVoice?: boolean;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="ai-fab-container" [class.open]="isOpen()">
      <!-- Chat Window -->
      <div class="chat-window" *ngIf="isOpen()">
        <div class="chat-header">
          <div class="header-info">
            <mat-icon>smart_toy</mat-icon>
            <span>Mulkchi AI</span>
          </div>
          <button mat-icon-button (click)="toggleChat()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <div class="chat-messages" #scrollMe>
          <div *ngFor="let msg of messages()" class="message-wrapper" [class.user]="msg.sender === 'user'">
            <div class="message-bubble">
              <mat-icon *ngIf="msg.isVoice" class="voice-icon">mic</mat-icon>
              {{ msg.text }}
            </div>
          </div>
          <div class="typing-indicator" *ngIf="isLoading()">AI yozmoqda...</div>
        </div>

        <div class="chat-input-area">
          <input 
            type="text" 
            [(ngModel)]="userInput" 
            (keyup.enter)="sendMessage()"
            placeholder="Chorvoqdan dacha qidiring..." />
          <button mat-icon-button color="primary" (click)="toggleVoice()" [class.recording]="isRecording()">
            <mat-icon>{{ isRecording() ? 'mic_off' : 'mic' }}</mat-icon>
          </button>
          <button mat-icon-button color="primary" (click)="sendMessage()" [disabled]="!userInput.trim()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>

      <!-- Floating Button -->
      <button class="fab-button" mat-fab color="primary" (click)="toggleChat()" *ngIf="!isOpen()">
        <mat-icon>smart_toy</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .ai-fab-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
    }
    .fab-button {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    .chat-window {
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .chat-header {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
      color: white;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-info { display: flex; align-items: center; gap: 8px; font-weight: 500; }
    .chat-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: var(--color-surface);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message-wrapper { display: flex; }
    .message-wrapper.user { justify-content: flex-end; }
    .message-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 14px;
      background: white;
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .message-wrapper.user .message-bubble {
      background: color-mix(in srgb, var(--color-info) 10%, transparent);
      border-color: color-mix(in srgb, var(--color-info) 20%, transparent);
      color: var(--color-info);
    }
    .voice-icon { font-size: 16px; height: 16px; width: 16px; color: var(--color-error); }
    .chat-input-area {
      padding: 12px;
      background: white;
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chat-input-area input {
      flex: 1;
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 10px 16px;
      outline: none;
    }
    .recording { color: var(--color-error) !important; animation: pulse 1.5s infinite; }
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    .typing-indicator { font-size: 12px; color: var(--color-text-secondary); padding-left: 10px; font-style: italic; }
  `]
})
export class AiAssistantComponent implements AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  private http = inject(HttpClient);

  isOpen = signal(false);
  isLoading = signal(false);
  isRecording = signal(false);
  messages = signal<ChatMessage[]>([
    { text: "Salom! Men Mulkchi AI yordamchisiman. Sizga qanday uy topishda yordam bera olaman? Masalan: 'Chorvoqdan basseynli dacha'", sender: 'bot' }
  ]);
  userInput = '';

  private recognition: any;

  constructor() {
    this.initSpeechRecognition();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen.set(!this.isOpen());
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'uz-UZ'; // Localized Voice support
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.isRecording.set(false);
        this.sendRequest(transcript, true);
      };

      this.recognition.onerror = () => {
        this.isRecording.set(false);
      };

      this.recognition.onend = () => {
        this.isRecording.set(false);
      };
    }
  }

  toggleVoice() {
    if (this.isRecording()) {
      this.recognition?.stop();
    } else {
      this.isRecording.set(true);
      this.recognition?.start();
    }
  }

  sendMessage() {
    if (!this.userInput.trim()) return;
    const text = this.userInput;
    this.userInput = '';
    this.sendRequest(text, false);
  }

  private sendRequest(text: string, isVoice: boolean) {
    this.messages.update(m => [...m, { text, sender: 'user', isVoice }]);
    this.isLoading.set(true);

    this.http.post<any>(`${environment.apiUrl}/AiAssistant/chat`, { message: text, isVoice }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.messages.update(m => [...m, { text: res.botResponse, sender: 'bot' }]);
        
        if (res.suggestedProperties?.length > 0) {
          const links = res.suggestedProperties.map((p: any) => `🏡 ${p.title} - ${p.price}$`).join('\\n');
          this.messages.update(m => [...m, { text: links, sender: 'bot' }]);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.messages.update(m => [...m, { text: "Kechirasiz, xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.", sender: 'bot' }]);
      }
    });
  }
}

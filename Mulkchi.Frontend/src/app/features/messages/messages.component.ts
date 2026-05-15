import { AfterViewChecked, Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild, computed } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { Conversation, Message } from '../../core/models';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('300ms ease-out', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)' }))
      ])
    ]),
    trigger('messageAppear', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ],
  template: `
    <div class="chat-wrapper">
      <!-- Connection Status Banner -->
      @if (!chatService.isConnected()) {
        <div class="connection-banner">
          <mat-icon>sync</mat-icon>
          <span>Tarmoqqa qayta ulanmoqda...</span>
        </div>
      }

      <div class="chat-container">
        <!-- Sidebar: Conversations List -->
        <aside class="sidebar" [class.hidden-mobile]="activeConversation()">
          <div class="sidebar-header">
            <div class="title-group">
              <h1>Suhbatlar</h1>
              <span class="badge" *ngIf="chatService.totalUnreadCount() > 0">
                {{ chatService.totalUnreadCount() }}
              </span>
            </div>
            <button mat-icon-button [matMenuTriggerFor]="menu" class="header-action">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="chatService.getConversations()">
                <mat-icon>refresh</mat-icon>
                <span>Yangilash</span>
              </button>
            </mat-menu>
          </div>
          
          <div class="search-box">
            <div class="search-input-wrapper">
              <mat-icon>search</mat-icon>
              <input type="text" placeholder="Ism yoki xabarni qidirish..." [(ngModel)]="searchQuery">
            </div>
          </div>

          <div class="conversations-scroll">
            @if (chatService.isLoading() && conversations().length === 0) {
              <!-- Skeleton Loaders -->
              <div class="skeleton-list">
                @for (i of [1,2,3,4,5]; track i) {
                  <div class="skeleton-card">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-info">
                      <div class="skeleton-line short"></div>
                      <div class="skeleton-line long"></div>
                    </div>
                  </div>
                }
              </div>
            } @else if (filteredConversations().length === 0) {
              <div class="empty-state">
                <div class="illustration-wrapper">
                  <div class="blob"></div>
                  <mat-icon class="main-icon">forum</mat-icon>
                </div>
                <h3>Hali suhbatlar yo'q</h3>
                <p>Mulk egalari bilan bog'laning va birinchi suhbatni boshlang</p>
                <button mat-flat-button color="primary" routerLink="/properties">
                  E'lonlarni ko'rish
                </button>
              </div>
            } @else {
              <div class="conversation-list">
                @for (conv of filteredConversations(); track conv.otherUserId) {
                  <div 
                    class="conversation-card" 
                    [class.active]="isActiveConversation(conv)"
                    [class.unread]="conv.unreadCount > 0"
                    (click)="selectConversation(conv)">
                    
                    <div class="avatar-wrapper">
                      @if (conv.otherUser.avatarUrl) {
                        <img [src]="conv.otherUser.avatarUrl" [alt]="conv.otherUser.firstName">
                      } @else {
                        <div class="avatar-placeholder" [style.background]="getAvatarColor(conv.otherUser.firstName)">
                          {{ conv.otherUser.firstName.charAt(0) }}
                        </div>
                      }
                      <span class="status-indicator" [class.online]="conv.otherUser.isOnline"></span>
                    </div>
                    
                    <div class="card-content">
                      <div class="card-header">
                        <span class="name">{{ conv.otherUser.firstName }} {{ conv.otherUser.lastName }}</span>
                        <span class="time">{{ formatTime(conv.lastMessageDate) }}</span>
                      </div>
                      <div class="card-footer">
                        <p class="preview" [class.typing]="conv.isTyping">
                          {{ conv.isTyping ? 'yozmoqda...' : (conv.lastMessage || 'Xabar yo\'q') }}
                        </p>
                        @if (conv.unreadCount > 0) {
                          <span class="unread-count">{{ conv.unreadCount }}</span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </aside>

        <!-- Main: Chat Window -->
        <main class="chat-window" [class.active-mobile]="activeConversation()">
          @if (activeConversation()) {
            <!-- Chat Header -->
            <header class="chat-header">
              <div class="header-left">
                <button mat-icon-button class="back-btn-mobile" (click)="closeConversation()">
                  <mat-icon>arrow_back</mat-icon>
                </button>
                
                <div class="user-meta" (click)="viewProfile()">
                  <div class="avatar-wrapper small">
                    @if (activeConversation()?.otherUser?.avatarUrl) {
                      <img [src]="activeConversation()?.otherUser?.avatarUrl" 
                           [alt]="activeConversation()?.otherUser?.firstName">
                    } @else {
                      <div class="avatar-placeholder small" [style.background]="getAvatarColor(activeConversation()?.otherUser?.firstName || '')">
                        {{ activeConversation()?.otherUser?.firstName?.charAt(0) }}
                      </div>
                    }
                    <span class="status-indicator" [class.online]="activeConversation()?.otherUser?.isOnline"></span>
                  </div>
                  <div class="meta-text">
                    <h3>{{ activeConversation()?.otherUser?.firstName }} {{ activeConversation()?.otherUser?.lastName }}</h3>
                    <span class="status" [class.online]="activeConversation()?.otherUser?.isOnline">
                      {{ activeConversation()?.otherUser?.isOnline ? 'Onlayn' : 'Oflayn' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="header-actions">
                <button mat-icon-button matTooltip="Mulkni ko'rish" *ngIf="activeConversation()?.propertyId" (click)="viewProperty()">
                  <mat-icon>home</mat-icon>
                </button>
                <button mat-icon-button [matMenuTriggerFor]="chatMenu">
                  <mat-icon>more_horiz</mat-icon>
                </button>
                <mat-menu #chatMenu="matMenu">
                  <button mat-menu-item (click)="viewProfile()">
                    <mat-icon>person</mat-icon>
                    <span>Profilni ko'rish</span>
                  </button>
                  <button mat-menu-item class="delete-action">
                    <mat-icon>delete_outline</mat-icon>
                    <span>Suhbatni o'chirish</span>
                  </button>
                </mat-menu>
              </div>
            </header>

            <!-- Messages List -->
            <div class="messages-area" #messagesContainer>
              <div class="messages-list">
                @for (msg of currentMessages(); track msg.id) {
                  <!-- Date Divider -->
                  @if (shouldShowDateDivider($index)) {
                    <div class="date-divider">
                      <span>{{ getDateLabel(msg.createdDate) }}</span>
                    </div>
                  }

                  <div class="message-row" [class.own]="isOwnMessage(msg)">
                    <div class="message-bubble" 
                         [class.first-in-group]="isFirstInGroup($index)"
                         [class.last-in-group]="isLastInGroup($index)">
                      <p class="text">{{ msg.content }}</p>
                      <div class="message-meta">
                        <span class="time">{{ formatTime(msg.createdDate) }}</span>
                        @if (isOwnMessage(msg)) {
                          <mat-icon class="status-icon" [class.read]="msg.isRead">
                            {{ msg.isRead ? 'done_all' : 'done' }}
                          </mat-icon>
                        }
                      </div>
                    </div>
                  </div>
                }
                
                @if (activeConversation()?.isTyping) {
                  <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                  </div>
                }
              </div>
            </div>

            <!-- Chat Footer -->
            <footer class="chat-footer">
              <div class="input-container">
                <button mat-icon-button class="attach-btn" (click)="attachFile()">
                  <mat-icon>add</mat-icon>
                </button>
                
                <div class="input-wrapper">
                  <textarea 
                    #messageInput
                    [(ngModel)]="newMessageText" 
                    placeholder="Xabar yozing..."
                    (keydown.enter)="handleEnter($event)"
                    (input)="onTyping(); adjustHeight($event)"
                    [attr.disabled]="isSending() ? true : null"
                    rows="1"></textarea>
                </div>

                <div class="action-group">
                  <button mat-icon-button class="emoji-btn">
                    <mat-icon>sentiment_satisfied</mat-icon>
                  </button>

                  <button 
                    class="send-btn" 
                    [class.active]="newMessageText.trim()"
                    [class.sending]="isSending()"
                    (click)="sendMessage()"
                    [disabled]="!newMessageText.trim() || isSending()">
                    @if (isSending()) {
                      <mat-progress-spinner diameter="24" mode="indeterminate" strokeWidth="3"></mat-progress-spinner>
                    } @else {
                      <mat-icon>send</mat-icon>
                    }
                  </button>
                </div>
              </div>
            </footer>
          } @else {
            <div class="welcome-screen">
              <div class="welcome-card">
                <div class="card-bg-decoration"></div>
                <div class="welcome-content">
                  <div class="app-logo">
                    <mat-icon>business</mat-icon>
                  </div>
                  <h2>Xush kelibsiz!</h2>
                  <p>Mulkchi chat orqali barcha savollaringizga javob oling va bitimlarni amalga oshiring.</p>
                  
                  <div class="welcome-stats">
                    <div class="stat-item">
                      <span class="val">100%</span>
                      <span class="lab">Xavfsiz</span>
                    </div>
                    <div class="stat-item">
                      <span class="val">24/7</span>
                      <span class="lab">Yordam</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #1e293b;
      --primary-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      --accent: #3b82f6;
      --accent-light: #eff6ff;
      --text: #0f172a;
      --text-muted: #64748b;
      --bg-sidebar: #ffffff;
      --bg-chat: #f8fafc;
      --bubble-own: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      --bubble-other: #ffffff;
      --border: #f1f5f9;
      --radius-sm: 8px;
      --radius-md: 16px;
      --radius-lg: 24px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    }

    .chat-wrapper {
      height: calc(100vh - 64px);
      padding: 0;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    .connection-banner {
      background: #fbbf24;
      color: #78350f;
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .connection-banner mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .chat-container {
      flex: 1;
      width: 100%;
      height: 100%;
      background: white;
      display: flex;
      overflow: hidden;
    }

    /* Sidebar */
    .sidebar {
      width: 400px;
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      background: var(--bg-sidebar);
      z-index: 20;
    }

    .sidebar-header {
      padding: 32px 24px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sidebar-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      margin: 0;
      color: var(--text);
      letter-spacing: -0.025em;
    }

    .badge {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4);
    }

    .search-box {
      padding: 0 24px 20px;
    }

    .search-input-wrapper {
      background: #f1f5f9;
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid transparent;
    }

    .search-input-wrapper:focus-within {
      background: white;
      border-color: var(--accent);
      box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);
    }

    .search-input-wrapper mat-icon {
      color: var(--text-muted);
      font-size: 20px;
    }

    .search-input-wrapper input {
      border: none;
      background: transparent;
      width: 100%;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text);
      outline: none;
    }

    /* Conversation Cards */
    .conversations-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 0 12px;
    }

    .conversation-card {
      margin: 4px 0;
      padding: 16px;
      border-radius: var(--radius-md);
      display: flex;
      gap: 16px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .conversation-card:hover {
      background: #f8fafc;
    }

    .conversation-card.active {
      background: var(--accent-light);
    }

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-wrapper img {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.5rem;
    }

    .status-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      background: #cbd5e1;
    }

    .status-indicator.online {
      background: #22c55e;
    }

    .card-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .card-header .name {
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text);
    }

    .card-header .time {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .preview {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview.typing {
      color: var(--accent);
      font-style: italic;
    }

    .unread-count {
      background: var(--accent);
      color: white;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 10px;
      margin-left: 8px;
    }

    /* Skeleton Loading */
    .skeleton-card {
      padding: 16px;
      display: flex;
      gap: 16px;
      opacity: 0.6;
    }

    .skeleton-avatar {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      background: #e2e8f0;
      animation: pulse 1.5s infinite;
    }

    .skeleton-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 10px;
    }

    .skeleton-line {
      height: 12px;
      background: #e2e8f0;
      border-radius: 6px;
      animation: pulse 1.5s infinite;
    }

    .skeleton-line.short { width: 40%; }
    .skeleton-line.long { width: 80%; }

    @keyframes pulse {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }

    /* Main Chat Window */
    .chat-window {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f8fafc;
      position: relative;
    }

    .chat-header {
      padding: 16px 32px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .user-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      transition: background 0.2s;
    }

    .user-meta:hover {
      background: #f1f5f9;
    }

    .avatar-wrapper.small img, 
    .avatar-placeholder.small {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      font-size: 1.1rem;
    }

    .meta-text h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
      color: var(--text);
    }

    .meta-text .status {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .meta-text .status.online {
      color: #22c55e;
    }

    /* Messages Area */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      background: radial-gradient(circle at top right, #f1f5f9 0%, #f8fafc 100%);
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 4px;
    }

    .message-bubble {
      max-width: 70%;
      padding: 12px 20px;
      border-radius: 20px;
      font-size: 1rem;
      line-height: 1.6;
      position: relative;
      box-shadow: var(--shadow-sm);
    }

    .message-row.own { align-items: flex-end; }

    .message-row.own .message-bubble {
      background: var(--bubble-own);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-row:not(.own) .message-bubble {
      background: white;
      color: var(--text);
      border-bottom-left-radius: 4px;
      border: 1px solid #f1f5f9;
    }

    .message-bubble.first-in-group.own { border-top-right-radius: 20px; }
    .message-bubble.last-in-group.own { border-bottom-right-radius: 4px; }

    .message-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
      margin-top: 4px;
      opacity: 0.8;
    }

    .message-meta .time {
      font-size: 0.7rem;
      font-weight: 600;
    }

    .status-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 20px;
      background: white;
      border-radius: 20px;
      width: fit-content;
      border: 1px solid #f1f5f9;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: #cbd5e1;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Chat Footer */
    .chat-footer {
      padding: 24px 32px;
      background: white;
      border-top: 1px solid #f1f5f9;
    }

    .input-container {
      background: #f8fafc;
      border-radius: 24px;
      padding: 8px 12px;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .input-container:focus-within {
      background: white;
      border-color: var(--accent);
      box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1);
    }

    .input-wrapper {
      flex: 1;
      padding: 10px 4px;
    }

    .input-wrapper textarea {
      width: 100%;
      border: none;
      background: transparent;
      outline: none;
      resize: none;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text);
      max-height: 120px;
      padding: 0;
    }

    .send-btn {
      width: 48px;
      height: 48px;
      border-radius: 16px;
      background: #cbd5e1;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .send-btn.active {
      background: var(--accent);
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
    }

    /* Welcome Screen */
    .welcome-screen {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .welcome-card {
      width: 100%;
      max-width: 480px;
      background: white;
      border-radius: 32px;
      padding: 48px;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
    }

    .card-bg-decoration {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 120px;
      height: 120px;
      background: var(--accent-light);
      border-radius: 50%;
      z-index: 0;
    }

    .welcome-content { position: relative; z-index: 1; }

    .app-logo {
      width: 80px;
      height: 80px;
      background: var(--primary-gradient);
      color: white;
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 32px;
    }

    .app-logo mat-icon { font-size: 40px; width: 40px; height: 40px; }

    .welcome-content h2 { font-size: 2rem; font-weight: 800; margin-bottom: 16px; }
    .welcome-content p { color: var(--text-muted); font-size: 1.1rem; line-height: 1.6; margin-bottom: 40px; }

    .welcome-stats {
      display: flex;
      justify-content: center;
      gap: 40px;
    }

    .stat-item { display: flex; flex-direction: column; }
    .stat-item .val { font-size: 1.5rem; font-weight: 800; color: var(--accent); }
    .stat-item .lab { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }

    /* Empty State Illustration */
    .empty-state {
      padding: 60px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .illustration-wrapper {
      position: relative;
      margin-bottom: 32px;
    }

    .blob {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      background: var(--accent-light);
      border-radius: 45% 55% 60% 40% / 40% 50% 60% 40%;
      animation: blob-float 10s infinite linear;
    }

    .main-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--accent);
      position: relative;
      z-index: 1;
    }

    @keyframes blob-float {
      0%, 100% { border-radius: 45% 55% 60% 40% / 40% 50% 60% 40%; }
      33% { border-radius: 55% 45% 40% 60% / 50% 40% 50% 60%; }
      66% { border-radius: 40% 60% 50% 50% / 60% 50% 40% 50%; }
    }

    @media (max-width: 768px) {
      .sidebar { width: 100%; border: none; }
      .sidebar.hidden-mobile { display: none; }
      .chat-window { display: none; }
      .chat-window.active-mobile { display: flex; }
      .chat-header { height: 72px; padding: 0 16px; }
      .back-btn-mobile { display: block !important; }
    }
  `]
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  chatService = inject(ChatService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  
  messagesContainer = viewChild<ElementRef>('messagesContainer');
  messageInput = viewChild<ElementRef>('messageInput');

  newMessageText = '';
  searchQuery = '';
  isSending = signal(false);
  shouldScroll = signal(false);

  conversations = this.chatService.conversations;
  activeConversation = this.chatService.activeConversation;
  currentMessages = this.chatService.currentMessages;

  filteredConversations = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.conversations();
    
    return this.conversations().filter(c => 
      c.otherUser.firstName.toLowerCase().includes(query) || 
      c.otherUser.lastName.toLowerCase().includes(query) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(query))
    );
  });

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.chatService.tryConnect();
    this.chatService.getConversations();

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const userId = params['userId'];
        const userName = params['userName'];
        const userAvatar = params['userAvatar'];
        
        if (userId) {
          this.startConversationWithUser(userId, userName, userAvatar);
        }
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll()) {
      this.scrollToBottom();
      this.shouldScroll.set(false);
    }
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  private startConversationWithUser(userId: string, userName?: string, userAvatar?: string): void {
    const existing = this.conversations().find(c => c.otherUserId === userId);
    if (existing) {
      this.selectConversation(existing);
    } else {
      const tempConv: Conversation = {
        otherUserId: userId,
        otherUser: {
          id: userId,
          firstName: userName?.split(' ')[0] || 'Uy egasi',
          lastName: userName?.split(' ').slice(1).join(' ') || '',
          avatarUrl: userAvatar,
          isOnline: false
        },
        lastMessage: '',
        lastMessageDate: new Date(),
        unreadCount: 0
      };
      
      this.chatService.setActiveConversation(tempConv);
    }
  }

  selectConversation(conversation: Conversation): void {
    this.chatService.setActiveConversation(conversation);
    this.shouldScroll.set(true);
    setTimeout(() => this.resetInputHeight(), 0);
  }

  isActiveConversation(conv: Conversation): boolean {
    return this.activeConversation()?.otherUserId === conv.otherUserId;
  }

  closeConversation(): void {
    this.chatService.setActiveConversation(null as any);
  }

  isOwnMessage(msg: Message): boolean {
    return msg.senderId === this.authService.currentUser()?.id;
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessageText.trim();
    if (!text || !this.activeConversation()) return;

    this.isSending.set(true);

    try {
      await this.chatService.sendMessage(
        this.activeConversation()!.otherUserId,
        text
      );
      
      this.newMessageText = '';
      this.resetInputHeight();
      this.shouldScroll.set(true);
    } catch (error: any) {
      this.snackBar.open('Xabar yuborishda xatolik yuz berdi. Iltimos qayta urinib ko\'ring.', 'Yopish', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isSending.set(false);
    }
  }

  handleEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.sendMessage();
    }
  }

  adjustHeight(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  private resetInputHeight(): void {
    const textarea = this.messageInput()?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }

  formatTime(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  }

  shouldShowDateDivider(index: number): boolean {
    if (index === 0) return true;
    
    const current = new Date(this.currentMessages()[index].createdDate).toDateString();
    const prev = new Date(this.currentMessages()[index - 1].createdDate).toDateString();
    
    return current !== prev;
  }

  getDateLabel(date: Date | string): string {
    const d = new Date(date);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (d.toDateString() === today) return 'Bugun';
    if (d.toDateString() === yesterday) return 'Kecha';
    
    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
  }

  isFirstInGroup(index: number): boolean {
    if (index === 0) return true;
    return this.currentMessages()[index].senderId !== this.currentMessages()[index - 1].senderId;
  }

  viewProfile(): void {
    const userId = this.activeConversation()?.otherUserId;
    if (userId) {
      this.router.navigate(['/profile', userId]);
    }
  }

  getAvatarColor(name: string): string {
    if (!name) return '#3b82f6';
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
      '#ec4899', '#06b6d4', '#84cc16', '#6366f1'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  onTyping(): void {
    // Kelgusida "yozmoqda..." holatini SignalR orqali yuborish uchun
  }

  attachFile(): void {
    this.snackBar.open('Fayl biriktirish funksiyasi tez kunda!', 'OK', { duration: 2000 });
  }

  viewProperty(): void {
    const propertyId = this.activeConversation()?.propertyId;
    if (propertyId) {
      this.router.navigate(['/properties', propertyId]);
    }
  }

  isLastInGroup(index: number): boolean {
    const messages = this.currentMessages();
    if (index === messages.length - 1) return true;
    return messages[index].senderId !== messages[index + 1].senderId;
  }
}

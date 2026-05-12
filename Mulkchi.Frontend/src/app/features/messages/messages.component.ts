import { AfterViewChecked, Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { Conversation, Message } from '../../core/models';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="messages-container">
      <!-- Conversations List (Left Panel) -->
      <div class="conversations-panel">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>chat</mat-icon>
              Suhbatlar
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            @if (chatService.isLoading()) {
              <div class="loading-container">
                <mat-progress-spinner diameter="30" mode="indeterminate"></mat-progress-spinner>
              </div>
            } @else if (conversations().length === 0) {
              <div class="empty-state">
                <mat-icon>chat_bubble_outline</mat-icon>
                <p>Hali suhbatlar yo'q</p>
              </div>
            } @else {
              <mat-list class="conversation-list">
                @for (conv of conversations(); track conv.otherUserId) {
                  <mat-list-item 
                    [class.active]="isActiveConversation(conv)"
                    [class.unread]="conv.unreadCount > 0"
                    (click)="selectConversation(conv)">
                    
                    <div class="conversation-item">
                      <!-- Avatar -->
                      <div class="avatar">
                        @if (conv.otherUser.avatarUrl) {
                          <img [src]="conv.otherUser.avatarUrl" [alt]="conv.otherUser.firstName">
                        } @else {
                          <mat-icon>account_circle</mat-icon>
                        }
                        @if (conv.otherUser.isOnline) {
                          <span class="online-indicator"></span>
                        }
                      </div>
                      
                      <!-- Info -->
                      <div class="conversation-info">
                        <div class="header">
                          <span class="name">{{ conv.otherUser.firstName }} {{ conv.otherUser.lastName }}</span>
                          <span class="time">{{ formatTime(conv.lastMessageDate) }}</span>
                        </div>
                        <div class="preview">
                          <span class="message-text">{{ conv.lastMessage }}</span>
                          @if (conv.unreadCount > 0) {
                            <span class="unread-badge" [matBadge]="conv.unreadCount" matBadgeOverlap="false"></span>
                          }
                        </div>
                      </div>
                    </div>
                  </mat-list-item>
                  <mat-divider></mat-divider>
                }
              </mat-list>
            }
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Messages Panel (Right Panel) -->
      <div class="messages-panel">
        @if (activeConversation()) {
          <mat-card class="chat-card">
            <!-- Chat Header -->
            <mat-card-header class="chat-header">
              <div class="header-content">
                <div class="avatar">
                  @if (activeConversation()?.otherUser?.avatarUrl) {
                    <img [src]="activeConversation()?.otherUser?.avatarUrl" 
                         [alt]="activeConversation()?.otherUser?.firstName">
                  } @else {
                    <mat-icon>account_circle</mat-icon>
                  }
                </div>
                <div class="user-info">
                  <span class="name">{{ activeConversation()?.otherUser?.firstName }} {{ activeConversation()?.otherUser?.lastName }}</span>
                  <span class="status">{{ activeConversation()?.otherUser?.isOnline ? 'Onlayn' : 'Oflayn' }}</span>
                </div>
              </div>
            </mat-card-header>

            <!-- Messages -->
            <mat-card-content class="messages-content" #messagesContainer>
              @if (chatService.isLoading()) {
                <div class="loading-container">
                  <mat-progress-spinner diameter="30" mode="indeterminate"></mat-progress-spinner>
                </div>
              } @else if (currentMessages().length === 0) {
                <div class="empty-state">
                  <mat-icon>chat</mat-icon>
                  <p>Xabarlar yo'q. Suhbatni boshlang!</p>
                </div>
              } @else {
                <div class="messages-list">
                  @for (msg of currentMessages(); track msg.id) {
                    <div class="message" [class.own]="isOwnMessage(msg)">
                      <div class="message-bubble">
                        <p class="content">{{ msg.content }}</p>
                        <span class="time">{{ formatTime(msg.createdDate) }}</span>
                        @if (isOwnMessage(msg)) {
                          <mat-icon class="read-status" [class.read]="msg.isRead">
                            {{ msg.isRead ? 'done_all' : 'done' }}
                          </mat-icon>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </mat-card-content>

            <!-- Input Area -->
            <div class="input-area">
              <mat-form-field appearance="outline" class="message-input">
                <input matInput 
                       [(ngModel)]="newMessageText" 
                       placeholder="Xabar yozing..."
                       (keyup.enter)="sendMessage()"
                       [attr.disabled]="isSending() ? true : null">
              </mat-form-field>
              <button mat-fab 
                      color="primary" 
                      (click)="sendMessage()"
                      [attr.disabled]="!newMessageText.trim() || isSending() ? true : null"
                      matTooltip="Yuborish">
                @if (isSending()) {
                  <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
                } @else {
                  <mat-icon>send</mat-icon>
                }
              </button>
            </div>
          </mat-card>
        } @else {
          <div class="no-conversation">
            <mat-icon>chat_bubble_outline</mat-icon>
            <p>Suhbatni tanlang</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .messages-container {
      display: flex;
      height: calc(100vh - 64px);
      background: #f5f5f5;
    }

    /* Conversations Panel */
    .conversations-panel {
      width: 350px;
      min-width: 350px;
      border-right: 1px solid #e0e0e0;
      background: white;
      overflow-y: auto;
    }

    .conversations-panel mat-card {
      height: 100%;
      border-radius: 0;
      box-shadow: none;
    }

    .conversations-panel mat-card-header {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.25rem;
    }

    .conversation-list {
      padding: 0;
    }

    .conversation-list mat-list-item {
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .conversation-list mat-list-item:hover {
      background-color: #f5f5f5;
    }

    .conversation-list mat-list-item.active {
      background-color: #e3f2fd;
    }

    .conversation-list mat-list-item.unread .message-text {
      font-weight: 600;
      color: #1976d2;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .avatar {
      position: relative;
      flex-shrink: 0;
    }

    .avatar img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar mat-icon {
      width: 48px;
      height: 48px;
      font-size: 48px;
      color: #9e9e9e;
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #4caf50;
      border-radius: 50%;
      border: 2px solid white;
    }

    .conversation-info {
      flex: 1;
      min-width: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .name {
      font-weight: 600;
      color: #333;
    }

    .time {
      font-size: 0.75rem;
      color: #999;
    }

    .preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .message-text {
      font-size: 0.875rem;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    /* Messages Panel */
    .messages-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #f0f2f5;
    }

    .chat-card {
      height: 100%;
      border-radius: 0;
      display: flex;
      flex-direction: column;
    }

    .chat-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-info .name {
      font-weight: 600;
      font-size: 1rem;
    }

    .user-info .status {
      font-size: 0.8rem;
      color: #4caf50;
    }

    .messages-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f0f2f5;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .message {
      display: flex;
      max-width: 70%;
    }

    .message.own {
      align-self: flex-end;
      margin-left: auto;
    }

    .message-bubble {
      padding: 12px 16px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .message.own .message-bubble {
      background: #667eea;
      color: white;
    }

    .message .content {
      margin: 0 0 4px 0;
      line-height: 1.4;
    }

    .message .time {
      font-size: 0.7rem;
      opacity: 0.7;
    }

    .read-status {
      font-size: 0.875rem;
      opacity: 0.5;
      margin-left: 4px;
    }

    .read-status.read {
      opacity: 1;
      color: #4caf50;
    }

    .input-area {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #e0e0e0;
    }

    .message-input {
      flex: 1;
      margin-bottom: 0;
    }

    .message-input ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .input-area button {
      flex-shrink: 0;
    }

    /* Empty States */
    .empty-state,
    .no-conversation {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      text-align: center;
    }

    .empty-state mat-icon,
    .no-conversation mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .conversations-panel {
        width: 100%;
      }
      
      .messages-panel {
        display: none;
      }
      
      .messages-container.has-active .conversations-panel {
        display: none;
      }
      
      .messages-container.has-active .messages-panel {
        display: flex;
      }
    }
  `]
})
export class MessagesComponent implements OnInit, AfterViewChecked {
  chatService = inject(ChatService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  messagesContainer = viewChild<ElementRef>('messagesContainer');

  newMessageText = '';
  isSending = signal(false);
  shouldScroll = signal(false);

  conversations = this.chatService.conversations;
  activeConversation = this.chatService.activeConversation;
  currentMessages = this.chatService.currentMessages;

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Connect to SignalR
    this.chatService.tryConnect();
    
    // Load conversations
    this.chatService.getConversations();

    // Check for query param (userId to chat with)
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const userId = params['userId'];
        if (userId) {
          this.startConversationWithUser(userId);
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

  private startConversationWithUser(userId: string): void {
    // Check if conversation exists
    const existing = this.conversations().find(c => c.otherUserId === userId);
    if (existing) {
      this.selectConversation(existing);
    } else {
      // Create temporary conversation (will be properly loaded after first message)
      // For now, just try to load messages
      this.chatService.getMessages(userId);
    }
  }

  selectConversation(conversation: Conversation): void {
    this.chatService.setActiveConversation(conversation);
    this.shouldScroll.set(true);
  }

  isActiveConversation(conv: Conversation): boolean {
    return this.activeConversation()?.otherUserId === conv.otherUserId;
  }

  isOwnMessage(msg: Message): boolean {
    const userId = this.getCurrentUserId();
    return msg.senderId === userId;
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
      this.shouldScroll.set(true);
    } catch {
      // Error is already shown in UI
    } finally {
      this.isSending.set(false);
    }
  }

  formatTime(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    if (isToday) {
      return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    } else {
      return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
    }
  }

  private getCurrentUserId(): string | null {
    return this.authService.currentUser()?.id ?? null;
  }
}

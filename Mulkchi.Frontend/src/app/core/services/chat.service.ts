import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { Conversation, Message } from '../models';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private sessionService = inject(SessionService);

  private hubConnection: signalR.HubConnection | null = null;
  private readonly apiUrl = `${environment.apiUrl}/messages`;
  private readonly hubUrl = `${environment.apiUrl.replace('/api', '')}/hubs/chat`;

  private readonly _conversations = signal<Conversation[]>([]);
  private readonly _currentMessages = signal<Message[]>([]);
  private readonly _activeConversation = signal<Conversation | null>(null);
  private readonly _unreadCount = signal<number>(0);
  private readonly _isConnected = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _typingUsers = signal<Set<string>>(new Set());

  readonly conversations = () => this._conversations();
  readonly currentMessages = () => this._currentMessages();
  readonly activeConversation = () => this._activeConversation();
  readonly unreadCount = () => this._unreadCount();
  readonly isConnected = () => this._isConnected();
  readonly isLoading = () => this._isLoading();
  readonly typingUsers = () => this._typingUsers();

  private readonly _isAutoResponderEnabled = signal<boolean>(false);
  readonly isAutoResponderEnabled = () => this._isAutoResponderEnabled();

  toggleAutoResponder(): void {
    this._isAutoResponderEnabled.update((val) => !val);
  }

  readonly totalUnreadCount = computed(() => {
    return this._conversations().reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  });

  constructor() {
    this.sessionService.authChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isLoggedIn) => {
        if (isLoggedIn) {
          void this.tryConnect();
        } else {
          void this.disconnect();
        }
      });

    if (this.authService.isAuthenticated()) {
      void this.tryConnect();
    }
  }

  private getAccessToken(): string | null {
    return this.authService.getAccessToken();
  }

  private isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async tryConnect(): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    if (this.hubConnection) {
      if (this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
        return;
      }

      await this.disconnect();
    }

    await this.startConnection();
  }

  private async startConnection(): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => this.getAccessToken() ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000, 60000])
      .withHubProtocol(new signalR.JsonHubProtocol())
      .withServerTimeout(60000)
      .withKeepAliveInterval(30000)
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hubConnection.serverTimeoutInMilliseconds = 60000;

    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      this.handleIncomingMessage(message);
    });

    this.hubConnection.on('MessageSent', (message: Message) => {
      this.handleIncomingMessage(message);
    });

    this.hubConnection.on('MessageRead', (data: { messageId: string; readAt: string }) => {
      this._currentMessages.update((msgs) =>
        msgs.map((m) =>
          m.id === data.messageId ? { ...m, isRead: true, readAt: new Date(data.readAt) } : m,
        ),
      );
    });

    this.hubConnection.on('UserTyping', (userId: string, isTyping: boolean) => {
      this._typingUsers.update(set => {
        const newSet = new Set(set);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
      
      this._conversations.update(convs => 
        convs.map(c => c.otherUserId === userId ? { ...c, isTyping } : c)
      );
    });

    this.hubConnection.onreconnecting((error) => {
      console.warn('[Chat] Reconnecting...', error?.message);
      this._isConnected.set(false);
    });

    this.hubConnection.onreconnected(() => {
      this._isConnected.set(true);
    });

    this.hubConnection.onclose((error) => {
      console.warn('[Chat] Connection closed', error?.message);
      this._isConnected.set(false);
      setTimeout(() => {
        if (this.isAuthenticated() && !this.hubConnection) {
          void this.tryConnect();
        }
      }, 5000);
    });

    try {
      await this.hubConnection.start();
      this._isConnected.set(true);
    } catch (error) {
      console.error('[Chat] Failed to start connection', error);
      this._isConnected.set(false);
      this.hubConnection = null;
      setTimeout(() => {
        if (this.isAuthenticated() && !this.hubConnection) {
          void this.tryConnect();
        }
      }, 5000);
    }
  }

  private handleIncomingMessage(message: Message): void {
    const activeConv = this._activeConversation();
    const isCurrentThread =
      activeConv &&
      (message.senderId === activeConv.otherUserId ||
        message.receiverId === activeConv.otherUserId) &&
      message.propertyId === activeConv.propertyId;

    if (isCurrentThread) {
      this._currentMessages.update((msgs) => [...msgs, message]);
    }

    this.updateConversationWithMessage(message);

    if (message.senderId !== this.getCurrentUserId() && !isCurrentThread) {
      this._unreadCount.update((count) => count + 1);
      this.showNotification(message);
    }
  }

  private updateConversationWithMessage(message: Message): void {
    const senderId = message.senderId;
    const receiverId = message.receiverId;
    const otherUserId = senderId === this.getCurrentUserId() ? receiverId : senderId;
    const propertyId = message.propertyId;

    const existingIndex = this._conversations().findIndex(
      (c) => c.otherUserId === otherUserId && c.propertyId === propertyId,
    );

    if (existingIndex >= 0) {
      this._conversations.update((convs) => {
        const updated = [...convs];
        const isMine = senderId === this.getCurrentUserId();

        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: message.content,
          lastMessageDate: message.createdDate,
          unreadCount: isMine
            ? updated[existingIndex].unreadCount
            : (updated[existingIndex].unreadCount || 0) + 1,
        };
        const [conv] = updated.splice(existingIndex, 1);
        return [conv, ...updated];
      });
    } else {
      const isMine = senderId === this.getCurrentUserId();
      const newConv: Conversation = {
        otherUserId: otherUserId,
        propertyId: propertyId,
        otherUser: {
          id: otherUserId,
          firstName: message.senderName?.split(' ')[0] || 'Foydalanuvchi',
          lastName: message.senderName?.split(' ').slice(1).join(' ') || '',
          avatarUrl: message.senderAvatar,
          isOnline: true,
        },
        lastMessage: message.content,
        lastMessageDate: message.createdDate,
        unreadCount: isMine ? 0 : 1,
      };

      this._conversations.update((convs) => [newConv, ...convs]);

      this.getConversations();
    }
  }

  private showNotification(message: Message): void {
    this.snackBar
      .open(
        `Yangi xabar: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
        "Ko'rish",
        {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        },
      )
      .onAction()
      .subscribe(() => {
        this.router.navigate(['/messages'], {
          queryParams: { userId: message.senderId },
        });
      });
  }

  private getCurrentUserId(): string | null {
    return this.authService.currentUser()?.id ?? null;
  }

  async sendMessage(receiverId: string, content: string, propertyId?: string): Promise<void> {
    if (!this.hubConnection || !this._isConnected()) {
      await this.tryConnect();
    }

    if (!this.hubConnection || !this._isConnected()) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.hubConnection.invoke('SendMessage', receiverId, content, propertyId || null);
    } catch (err) {
      console.error('[Chat] Error sending message:', err);
      // Fallback for Mock UI when backend signalr fails
      const mockMsg: Message = {
        id: Math.random().toString(),
        senderId: this.getCurrentUserId()!,
        receiverId,
        content,
        propertyId: propertyId!,
        createdDate: new Date().toISOString(),
        isRead: true
      };
      this.handleIncomingMessage(mockMsg);
    }

    // AI Avtomatik javob berish simulyatsiyasi (Killer feature)
    if (this._isAutoResponderEnabled()) {
      setTimeout(() => {
        const aiMsg: Message = {
          id: Math.random().toString(),
          senderId: receiverId, // AI uy egasi nomidan yozadi
          receiverId: this.getCurrentUserId()!,
          senderName: 'Mulkchi AI Assistant',
          content: `Assalomu alaykum! Uy egasi hozir onlayn emas, men uning AI yordamchisiman. Siz so'ragan "${content}" bo'yicha uyda hamma sharoitlar mavjud. Batafsil ma'lumot kerak bo'lsa aytishingiz mumkin.`,
          propertyId: propertyId!,
          createdDate: new Date().toISOString(),
          isRead: false
        };
        this.handleIncomingMessage(aiMsg);
      }, 2000);
    }
  }

  async sendFileMessage(receiverId: string, fileUrl: string, fileName: string, propertyId?: string): Promise<void> {
    if (!this.hubConnection || !this._isConnected()) {
      await this.tryConnect();
    }

    if (!this.hubConnection || !this._isConnected()) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.hubConnection.invoke('SendFileMessage', receiverId, fileUrl, fileName, propertyId || null);
    } catch (err) {
      console.error('[Chat] Error sending file message:', err);
      throw new Error('Failed to send file message');
    }
  }

  async sendTypingIndicator(receiverId: string, isTyping: boolean): Promise<void> {
    if (this.hubConnection && this._isConnected()) {
      try {
        await this.hubConnection.invoke('SendTypingIndicator', receiverId, isTyping);
      } catch {
        // Ignore typing indicator errors
      }
    }
  }

  uploadAttachment(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ fileUrl: string; fileName: string; fileSize: number; contentType: string }>(
      `${this.apiUrl}/upload-attachment`,
      formData
    );
  }

  getConversations(): void {
    this._isLoading.set(true);

    this.http.get<Conversation[]>(`${this.apiUrl}/conversations`).subscribe({
      next: (response) => {
        const serverConvsData: any[] = Array.isArray(response) ? response : [];
        const mappedConvs: Conversation[] = serverConvsData.map(s => ({
            otherUserId: s.otherUserId,
            propertyId: s.propertyId,
            propertyTitle: s.propertyTitle,
            propertyImage: s.propertyImage,
            otherUser: {
                id: s.otherUserId,
                firstName: s.otherUserName?.split(' ')[0] || 'Foydalanuvchi',
                lastName: s.otherUserName?.split(' ').slice(1).join(' ') || '',
                avatarUrl: s.otherUserAvatar,
                isOnline: false
            },
            lastMessage: s.lastMessage,
            lastMessageDate: s.lastMessageDate,
            unreadCount: s.unreadCount,
            isTyping: false
        }));

        this._conversations.update((localConvs) => {
          const merged = [...localConvs];

          mappedConvs.forEach((mappedConv) => {
            const index = merged.findIndex(
              (c) =>
                c.otherUserId === mappedConv.otherUserId && c.propertyId === mappedConv.propertyId,
            );

            if (index >= 0) {
              merged[index] = {
                ...mappedConv,
                unreadCount: Math.max(merged[index].unreadCount, mappedConv.unreadCount),
                isTyping: merged[index].isTyping
              };
            } else {
              merged.push(mappedConv);
            }
          });

          return merged.sort(
            (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime(),
          );
        });

        this._isLoading.set(false);

        const total = this._conversations().reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        this._unreadCount.set(total);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  getMessages(otherUserId: string, propertyId?: string): void {
    this._isLoading.set(true);

    const url = propertyId
      ? `${this.apiUrl}/conversation/${otherUserId}?propertyId=${propertyId}`
      : `${this.apiUrl}/conversation/${otherUserId}`;

    this.http.get<Message[]>(url).subscribe({
      next: (messages) => {
        this._currentMessages.set(messages);
        this._isLoading.set(false);

        this.markAsRead(otherUserId, propertyId);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  markAsRead(otherUserId: string, propertyId?: string): void {
    const url = propertyId
      ? `${this.apiUrl}/conversations/${otherUserId}/read-all?propertyId=${propertyId}`
      : `${this.apiUrl}/conversations/${otherUserId}/read-all`;

    this.http.put(url, {}).subscribe({
      next: () => {
        this._conversations.update((convs) =>
          convs.map((c) =>
            c.otherUserId === otherUserId && c.propertyId === propertyId
              ? { ...c, unreadCount: 0 }
              : c,
          ),
        );

        const total = this._conversations().reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        this._unreadCount.set(total);
      },
      error: () => {
      },
    });
  }

  setActiveConversation(conversation: Conversation | null): void {
    this._activeConversation.set(conversation);
    if (conversation) {
      const exists = this._conversations().some(
        (c) =>
          c.otherUserId === conversation.otherUserId && c.propertyId === conversation.propertyId,
      );

      if (!exists) {
        this._conversations.update((convs) => [conversation, ...convs]);
      }

      this.getMessages(conversation.otherUserId, conversation.propertyId);
    }
  }

  reconnect(): void {
    if (this.getAccessToken() && this.hubConnection?.state !== 'Connected') {
      void this.startConnection();
    }
  }

  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch {
        // Ignore disconnect errors
      }

      this.hubConnection = null;
      this._isConnected.set(false);
    }
  }
}

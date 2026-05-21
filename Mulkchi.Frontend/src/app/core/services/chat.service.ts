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

  // Signals for state management
  private readonly _conversations = signal<Conversation[]>([]);
  private readonly _currentMessages = signal<Message[]>([]);
  private readonly _activeConversation = signal<Conversation | null>(null);
  private readonly _unreadCount = signal<number>(0);
  private readonly _isConnected = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);

  // Public readonly signals
  readonly conversations = () => this._conversations();
  readonly currentMessages = () => this._currentMessages();
  readonly activeConversation = () => this._activeConversation();
  readonly unreadCount = () => this._unreadCount();
  readonly isConnected = () => this._isConnected();
  readonly isLoading = () => this._isLoading();

  // Get total unread count
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
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000, 60000]) // Progressive backoff: 0s, 2s, 5s, 10s, 30s, 60s
      .withHubProtocol(new signalR.JsonHubProtocol())
      .withServerTimeout(60000) // Keep alive timeout
      .withKeepAliveInterval(30000) // Send heartbeat every 30s
      .configureLogging(signalR.LogLevel.Warning) // Reduce noise (Information -> Warning)
      .build();

    // Set timeout to 60 seconds (default is 30)
    this.hubConnection.serverTimeoutInMilliseconds = 60000;

    // Handle incoming messages
    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      this.handleIncomingMessage(message);
    });

    // Handle message sent confirmation
    this.hubConnection.on('MessageSent', (message: Message) => {
      this.handleIncomingMessage(message);
    });

    // Handle message read status
    this.hubConnection.on('MessageRead', (data: { messageId: string, readAt: string }) => {
      this._currentMessages.update(msgs => 
        msgs.map(m => m.id === data.messageId ? { ...m, isRead: true, readAt: data.readAt } : m)
      );
    });

    // Handle typing indicator
    this.hubConnection.on('UserTyping', (userId: string, isTyping: boolean) => {
      // Logic for typing indicator can be added here
    });

    // Handle reconnecting
    this.hubConnection.onreconnecting((error) => {
      console.warn('[Chat] Reconnecting...', error?.message);
      this._isConnected.set(false);
    });

    // Handle reconnected
    this.hubConnection.onreconnected((connectionId) => {
      console.log('[Chat] Reconnected successfully', connectionId);
      this._isConnected.set(true);
    });

    // Handle close (final disconnection)
    this.hubConnection.onclose((error) => {
      console.warn('[Chat] Connection closed', error?.message);
      this._isConnected.set(false);
      // Try to reconnect after delay if we're still authenticated
      setTimeout(() => {
        if (this.isAuthenticated() && !this.hubConnection) {
          void this.tryConnect();
        }
      }, 5000);
    });

    try {
      await this.hubConnection.start();
      this._isConnected.set(true);
      console.log('[Chat] Connected successfully');
    } catch (error) {
      console.error('[Chat] Failed to start connection', error);
      this._isConnected.set(false);
      this.hubConnection = null;
      // Retry after delay
      setTimeout(() => {
        if (this.isAuthenticated() && !this.hubConnection) {
          void this.tryConnect();
        }
      }, 5000);
    }
  }

  private handleIncomingMessage(message: Message): void {
    // If we're in the active conversation, add the message
    const activeConv = this._activeConversation();
    const isCurrentThread = activeConv &&
      (message.senderId === activeConv.otherUserId || message.receiverId === activeConv.otherUserId) &&
      message.propertyId === activeConv.propertyId;

    if (isCurrentThread) {
      this._currentMessages.update((msgs) => [...msgs, message]);
    }

    // Update conversations list
    this.updateConversationWithMessage(message);

    // Show notification only if not from current user AND not in the current active thread
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
      (c) => c.otherUserId === otherUserId && c.propertyId === propertyId
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
        // Move to top
        const [conv] = updated.splice(existingIndex, 1);
        return [conv, ...updated];
      });
    } else {
      // New conversation - create a placeholder and also refresh from server
      const isMine = senderId === this.getCurrentUserId();
      const newConv: Conversation = {
        otherUserId: otherUserId,
        propertyId: propertyId,
        otherUser: {
          id: otherUserId,
          firstName: message.senderName?.split(' ')[0] || 'Foydalanuvchi',
          lastName: message.senderName?.split(' ').slice(1).join(' ') || '',
          avatarUrl: message.senderAvatar,
          isOnline: true
        },
        lastMessage: message.content,
        lastMessageDate: message.createdDate,
        unreadCount: isMine ? 0 : 1
      };
      
      this._conversations.update(convs => [newConv, ...convs]);
      
      // Still fetch to get full details (like property title/image)
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

  // Send message via SignalR
  async sendMessage(receiverId: string, content: string, propertyId?: string): Promise<void> {
    if (!this.hubConnection || !this._isConnected()) {
      await this.tryConnect();
    }

    if (!this.hubConnection || !this._isConnected()) {
      throw new Error('SignalR connection not established');
    }

    try {
      // Backend now expects 3 parameters: receiverId, content, propertyId
      await this.hubConnection.invoke('SendMessage', receiverId, content, propertyId || null);
    } catch (err) {
      console.error('[Chat] Error sending message:', err);
      throw new Error('Failed to send message');
    }
  }

  // Get all conversations
  getConversations(): void {
    this._isLoading.set(true);

    this.http.get<Conversation[]>(this.apiUrl).subscribe({
      next: (response) => {
        const serverConvs = Array.isArray(response) ? response : [];
        
        // Merge server data with local data
        this._conversations.update(localConvs => {
          const merged = [...localConvs];
          
          serverConvs.forEach(serverConv => {
            const index = merged.findIndex(c => 
              c.otherUserId === serverConv.otherUserId && c.propertyId === serverConv.propertyId
            );
            
            if (index >= 0) {
              // Preserve unread count if it's higher locally (real-time message arrived)
              merged[index] = {
                ...serverConv,
                unreadCount: Math.max(merged[index].unreadCount, serverConv.unreadCount)
              };
            } else {
              merged.push(serverConv);
            }
          });

          return merged.sort((a, b) => 
            new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
          );
        });

        this._isLoading.set(false);

        // Calculate total unread from the merged list
        const total = this._conversations().reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        this._unreadCount.set(total);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  // Get messages with specific user and property
  getMessages(otherUserId: string, propertyId?: string): void {
    this._isLoading.set(true);

    const url = propertyId 
      ? `${this.apiUrl}/conversation/${otherUserId}?propertyId=${propertyId}`
      : `${this.apiUrl}/conversation/${otherUserId}`;

    this.http.get<Message[]>(url).subscribe({
      next: (messages) => {
        this._currentMessages.set(messages);
        this._isLoading.set(false);

        // Mark conversation as read
        this.markAsRead(otherUserId, propertyId);
      },
      error: () => {
        this._isLoading.set(false);
      },
    });
  }

  // Mark messages as read for specific thread
  markAsRead(otherUserId: string, propertyId?: string): void {
    const url = propertyId
      ? `${this.apiUrl}/conversations/${otherUserId}/read-all?propertyId=${propertyId}`
      : `${this.apiUrl}/conversations/${otherUserId}/read-all`;

    this.http.put(url, {}).subscribe({
      next: () => {
        // Update unread count in specific conversation
        this._conversations.update((convs) =>
          convs.map((c) => (c.otherUserId === otherUserId && c.propertyId === propertyId ? { ...c, unreadCount: 0 } : c)),
        );

        // Recalculate total unread
        const total = this._conversations().reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        this._unreadCount.set(total);
      },
      error: () => {
        /* Silently handle error */
      },
    });
  }

  // Set active conversation
  setActiveConversation(conversation: Conversation | null): void {
    this._activeConversation.set(conversation);
    if (conversation) {
      // Ensure it's in the list (unique by user + property)
      const exists = this._conversations().some(
        c => c.otherUserId === conversation.otherUserId && c.propertyId === conversation.propertyId
      );
      
      if (!exists) {
        this._conversations.update(convs => [conversation, ...convs]);
      }
      
      this.getMessages(conversation.otherUserId, conversation.propertyId);
    }
  }

  // Reconnect - called after login
  reconnect(): void {
    if (this.getAccessToken() && this.hubConnection?.state !== 'Connected') {
      void this.startConnection();
    }
  }

  // Disconnect
  async disconnect(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
      } catch {
        /* Ignore shutdown errors */
      }

      this.hubConnection = null;
      this._isConnected.set(false);
    }
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Message, Conversation } from '../models';
import * as signalR from '@microsoft/signalr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

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
    // Try to connect on init if authenticated
    const token = localStorage.getItem('access_token')
               || localStorage.getItem('accessToken')
               || localStorage.getItem('token')
               || localStorage.getItem('jwt');
    if (token) {
      this.tryConnect();
    } else {
      console.warn('[ChatService] Token yo\'q, SignalR ulanmaydi');
    }
  }

  private getAccessToken(): string | null {
    return localStorage.getItem('access_token')
        || localStorage.getItem('accessToken')
        || localStorage.getItem('token')
        || localStorage.getItem('jwt');
  }

  private isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async tryConnect(): Promise<void> {
    if (!this.isAuthenticated()) {
      return;
    }

    if (this.hubConnection && this._isConnected()) {
      return;
    }

    await this.startConnection();
  }

  private async startConnection(): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      console.log('[SignalR] No token, skipping connection');
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => {
          const accessToken = localStorage.getItem('access_token')
              || localStorage.getItem('accessToken')
              || localStorage.getItem('token')
              || localStorage.getItem('jwt');
          // Return null instead of empty string to avoid sending "undefined"
          return accessToken && accessToken !== 'undefined' ? accessToken : null as any;
        }
      })
      .withAutomaticReconnect([0, 1000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Handle incoming messages
    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      this.handleIncomingMessage(message);
    });

    // Handle connection events
    this.hubConnection.onreconnecting(() => {
      this._isConnected.set(false);
    });

    this.hubConnection.onreconnected(() => {
      this._isConnected.set(true);
    });

    this.hubConnection.onclose(() => {
      this._isConnected.set(false);
    });

    try {
      await this.hubConnection.start();
      this._isConnected.set(true);
    } catch {
      this._isConnected.set(false);
    }
  }

  private handleIncomingMessage(message: Message): void {
    // If we're in the active conversation, add the message
    const activeConv = this._activeConversation();
    if (activeConv && 
        (message.senderId === activeConv.otherUserId || message.receiverId === activeConv.otherUserId)) {
      this._currentMessages.update(msgs => [...msgs, message]);
    }

    // Update conversations list
    this.updateConversationWithMessage(message);

    // Show notification if not from current user
    if (message.senderId !== this.getCurrentUserId()) {
      this._unreadCount.update(count => count + 1);
      this.showNotification(message);
    }
  }

  private updateConversationWithMessage(message: Message): void {
    this._conversations.update(convs => {
      const senderId = message.senderId;
      const receiverId = message.receiverId;
      const otherUserId = senderId === this.getCurrentUserId() ? receiverId : senderId;

      const existingIndex = convs.findIndex(c => c.otherUserId === otherUserId);

      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...convs];
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: message.content,
          lastMessageDate: message.createdDate,
          unreadCount: senderId === this.getCurrentUserId() 
            ? updated[existingIndex].unreadCount 
            : (updated[existingIndex].unreadCount || 0) + 1
        };
        // Move to top
        const [conv] = updated.splice(existingIndex, 1);
        return [conv, ...updated];
      } else {
        // Create new conversation (will be properly loaded on next getConversations call)
        return convs;
      }
    });
  }

  private showNotification(message: Message): void {
    this.snackBar.open(`Yangi xabar: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`, 'Ko\'rish', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.router.navigate(['/messages'], { 
        queryParams: { userId: message.senderId } 
      });
    });
  }

  private getCurrentUserId(): string | null {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as { id: string };
        return user.id;
      } catch {
        return null;
      }
    }
    return null;
  }

  // Send message via SignalR
  async sendMessage(receiverId: string, content: string): Promise<void> {
    if (!this.hubConnection || !this._isConnected()) {
      await this.tryConnect();
    }

    if (!this.hubConnection || !this._isConnected()) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.hubConnection.invoke('SendMessage', receiverId, content);
    } catch {
      throw new Error('Failed to send message');
    }
  }

  // Get all conversations
  getConversations(): void {
    this._isLoading.set(true);

    this.http.get<Conversation[]>(this.apiUrl).subscribe({
      next: (response) => {
        // Handle both array and object responses
        const conversations = Array.isArray(response) ? response : [];
        this._conversations.set(conversations);
        this._isLoading.set(false);

        // Calculate total unread
        const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        this._unreadCount.set(total);
      },
      error: () => {
        this._isLoading.set(false);
      }
    });
  }

  // Get messages with specific user
  getMessages(otherUserId: string): void {
    this._isLoading.set(true);
    
    this.http.get<Message[]>(`${this.apiUrl}/${otherUserId}`).subscribe({
      next: (messages) => {
        this._currentMessages.set(messages);
        this._isLoading.set(false);
        
        // Mark conversation as read
        this.markAsRead(otherUserId);
      },
      error: () => {
        this._isLoading.set(false);
      }
    });
  }

  // Mark messages as read
  markAsRead(otherUserId: string): void {
    this.http.post(`${this.apiUrl}/${otherUserId}/read`, {}).subscribe({
      next: () => {
        // Update unread count in conversations
        this._conversations.update(convs => 
          convs.map(c => 
            c.otherUserId === otherUserId ? { ...c, unreadCount: 0 } : c
          )
        );
        
        // Recalculate total unread
        const total = this._conversations().reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        this._unreadCount.set(total);
      },
      error: () => { /* Silently handle error */ }
    });
  }

  // Set active conversation
  setActiveConversation(conversation: Conversation): void {
    this._activeConversation.set(conversation);
    this.getMessages(conversation.otherUserId);
  }

  // Reconnect - called after login
  reconnect(): void {
    const token = localStorage.getItem('access_token')
               || localStorage.getItem('accessToken')
               || localStorage.getItem('token')
               || localStorage.getItem('jwt');
    if (token && this.hubConnection?.state !== 'Connected') {
      this.startConnection();
    }
  }

  // Disconnect
  disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this._isConnected.set(false);
    }
  }
}

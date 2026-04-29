import { Injectable, signal, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  
  // Connection state signals
  isConnected = signal(false);
  isReconnecting = signal(false);
  connectionError = signal<string | null>(null);
  
  // Message handlers
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();

  startConnection(): void {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('SignalR: No auth token, skipping connection');
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/chat`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 1s, 2s, 4s, 8s, then every 10s
          const delay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 10000);
          console.log(`SignalR: Reconnecting in ${delay}ms (attempt ${retryContext.previousRetryCount + 1})`);
          return delay;
        }
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Connection event handlers
    this.hubConnection.onreconnecting((error) => {
      console.log('SignalR: Connection lost, reconnecting...', error);
      this.isReconnecting.set(true);
      this.isConnected.set(false);
      this.snackBar.open('Ulanish tiklanyapti...', '', { duration: 3000 });
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR: Reconnected with ID:', connectionId);
      this.isReconnecting.set(false);
      this.isConnected.set(true);
      this.connectionError.set(null);
      this.snackBar.open('Ulanish tiklandi', '', { duration: 2000 });
    });

    this.hubConnection.onclose((error) => {
      console.log('SignalR: Connection closed', error);
      this.isConnected.set(false);
      this.isReconnecting.set(false);
      
      if (error) {
        this.connectionError.set(error.message);
        // Try to restart after 5 seconds if it wasn't intentional
        setTimeout(() => this.startConnection(), 5000);
      }
    });

    // Register message handlers
    this.registerMessageHandlers();

    // Start connection
    this.hubConnection
      .start()
      .then(() => {
        console.log('SignalR: Connected successfully');
        this.isConnected.set(true);
        this.connectionError.set(null);
      })
      .catch((err) => {
        console.error('SignalR: Connection failed:', err);
        this.connectionError.set(err.message);
        // Retry after 5 seconds
        setTimeout(() => this.startConnection(), 5000);
      });
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.isConnected.set(false);
    }
  }

  private registerMessageHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveMessage', (data) => {
      this.handleMessage('ReceiveMessage', data);
    });

    this.hubConnection.on('MessageSent', (data) => {
      this.handleMessage('MessageSent', data);
    });

    this.hubConnection.on('UserJoined', (data) => {
      this.handleMessage('UserJoined', data);
    });

    this.hubConnection.on('UserLeft', (data) => {
      this.handleMessage('UserLeft', data);
    });

    this.hubConnection.on('UserTyping', (data) => {
      this.handleMessage('UserTyping', data);
    });

    this.hubConnection.on('MessageRead', (data) => {
      this.handleMessage('MessageRead', data);
    });
  }

  private handleMessage(eventName: string, data: any): void {
    const handlers = this.messageHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  on(eventName: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(eventName)) {
      this.messageHandlers.set(eventName, []);
    }
    this.messageHandlers.get(eventName)?.push(handler);
  }

  off(eventName: string, handler?: (data: any) => void): void {
    if (handler) {
      const handlers = this.messageHandlers.get(eventName);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      this.messageHandlers.delete(eventName);
    }
  }

  // Hub method invokers
  async sendMessage(receiverId: string, content: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendMessage', receiverId, content);
    } else {
      throw new Error('SignalR not connected');
    }
  }

  async sendFileMessage(receiverId: string, fileUrl: string, fileName: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendFileMessage', receiverId, fileUrl, fileName);
    } else {
      throw new Error('SignalR not connected');
    }
  }

  async joinPropertyRoom(propertyId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('JoinPropertyRoom', propertyId);
    }
  }

  async leavePropertyRoom(propertyId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('LeavePropertyRoom', propertyId);
    }
  }

  async sendTypingIndicator(receiverId: string, isTyping: boolean): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendTypingIndicator', receiverId, isTyping);
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('MarkAsRead', messageId);
    }
  }
}

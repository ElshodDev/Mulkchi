import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export type NotificationType = 
  | 'info' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'booking' 
  | 'message' 
  | 'system';

export type NotificationCategory =
  | 'Booking'
  | 'Property'
  | 'Payment'
  | 'Review'
  | 'Message'
  | 'System'
  | 'Promotion';

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  bookingUpdates: boolean;
  messageNotifications: boolean;
  promotionalEmails: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService implements OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl = `${environment.apiUrl.replace('/api', '')}/hubs/notifications`;
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  
  // Signals for reactive state
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  isConnected = signal<boolean>(false);
  
  // Subjects for real-time events
  private notificationReceived = new Subject<Notification>();
  notificationReceived$ = this.notificationReceived.asObservable();
  
  private notificationRead = new Subject<string>();
  notificationRead$ = this.notificationRead.asObservable();
  
  constructor() {
    // Start SignalR connection when user is authenticated
    const user = this.authService.currentUser();
    if (user && this.authService.isAuthenticated()) {
      this.startConnection();
    }
    
    // Listen for auth changes
    // In a real implementation, you'd subscribe to auth state changes
  }
  
  ngOnDestroy(): void {
    this.stopConnection();
  }
  
  // ==========================================
  // SignalR Connection Management
  // ==========================================
  
  startConnection(): void {
    if (this.hubConnection) {
      return;
    }
 
    const token = this.authService.getAccessToken();
    
    if (!token) {
      return;
    }
    
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets | 
                   signalR.HttpTransportType.ServerSentEvents | 
                   signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
    
    this.registerEventHandlers();
    
    this.hubConnection
      .start()
      .then(() => {
        this.isConnected.set(true);
      })
      .catch(() => {
        this.isConnected.set(false);
      });
    
    // Handle reconnection events
    this.hubConnection.onreconnecting(() => {
      this.isConnected.set(false);
    });
    
    this.hubConnection.onreconnected(() => {
      this.isConnected.set(true);
      this.loadNotifications(); // Reload notifications after reconnection
    });
    
    this.hubConnection.onclose(() => {
      this.isConnected.set(false);
    });
  }
  
  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
      this.isConnected.set(false);
    }
  }
  
  private registerEventHandlers(): void {
    if (!this.hubConnection) return;
    
    // New notification received
    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      notification.createdAt = new Date(notification.createdAt);
      if (notification.readAt) {
        notification.readAt = new Date(notification.readAt);
      }
      
      this.notifications.update(notifs => [notification, ...notifs]);
      this.unreadCount.update(count => count + 1);
      this.notificationReceived.next(notification);
      
      // Show browser notification if allowed
      this.showBrowserNotification(notification);
    });
    
    // Notification marked as read (by another device/session)
    this.hubConnection.on('NotificationRead', (notificationId: string) => {
      this.notifications.update(notifs => 
        notifs.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      this.unreadCount.update(count => Math.max(0, count - 1));
      this.notificationRead.next(notificationId);
    });
    
    // All notifications marked as read
    this.hubConnection.on('AllNotificationsRead', () => {
      this.notifications.update(notifs => 
        notifs.map(n => ({ ...n, isRead: true, readAt: new Date() }))
      );
      this.unreadCount.set(0);
    });
    
    // Notification deleted
    this.hubConnection.on('NotificationDeleted', (notificationId: string) => {
      const notif = this.notifications().find(n => n.id === notificationId);
      this.notifications.update(notifs => notifs.filter(n => n.id !== notificationId));
      if (notif && !notif.isRead) {
        this.unreadCount.update(count => Math.max(0, count - 1));
      }
    });
  }
  
  // ==========================================
  // HTTP API Methods
  // ==========================================
  
  loadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}`).pipe(
      tap(notifications => {
        const parsedNotifications = notifications.map(n => ({
          ...n,
          createdAt: new Date(n.createdAt),
          readAt: n.readAt ? new Date(n.readAt) : undefined
        }));
        
        this.notifications.set(parsedNotifications);
        this.unreadCount.set(parsedNotifications.filter(n => !n.isRead).length);
      }),
      catchError(() => {
        return of([]);
      })
    );
  }
  
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`).pipe(
      tap(count => this.unreadCount.set(count))
    );
  }
  
  markAsRead(notificationId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(notifs => 
          notifs.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
        );
        this.unreadCount.update(count => Math.max(0, count - 1));
      })
    );
  }
  
  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-all-read`, {}).pipe(
      tap(() => {
        this.notifications.update(notifs => 
          notifs.map(n => ({ ...n, isRead: true, readAt: new Date() }))
        );
        this.unreadCount.set(0);
      })
    );
  }
  
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(() => {
        const notif = this.notifications().find(n => n.id === notificationId);
        this.notifications.update(notifs => notifs.filter(n => n.id !== notificationId));
        if (notif && !notif.isRead) {
          this.unreadCount.update(count => Math.max(0, count - 1));
        }
      })
    );
  }
  
  deleteAllRead(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/read`).pipe(
      tap(() => {
        this.notifications.update(notifs => notifs.filter(n => !n.isRead));
      })
    );
  }
  
  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.apiUrl}/preferences`);
  }
  
  updatePreferences(preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.apiUrl}/preferences`, preferences);
  }
  
  // ==========================================
  // Helper Methods
  // ==========================================
  
  getUnreadNotifications(): Notification[] {
    return this.notifications().filter(n => !n.isRead);
  }
  
  getNotificationsByCategory(category: NotificationCategory): Notification[] {
    return this.notifications().filter(n => n.category === category);
  }
  
  getNotificationsByType(type: NotificationType): Notification[] {
    return this.notifications().filter(n => n.type === type);
  }
  
  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case 'booking': return 'event';
      case 'message': return 'message';
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'system': return 'settings';
      case 'info':
      default: return 'info';
    }
  }
  
  getNotificationColor(type: NotificationType): string {
    switch (type) {
      case 'booking': return '#667eea';
      case 'message': return '#48bb78';
      case 'success': return '#48bb78';
      case 'warning': return '#ed8936';
      case 'error': return '#e53e3e';
      case 'system': return '#718096';
      case 'info':
      default: return '#4299e1';
    }
  }
  
  getCategoryLabel(category: NotificationCategory): string {
    switch (category) {
      case 'Booking': return 'Bron';
      case 'Property': return 'Mulk';
      case 'Payment': return "To'lov";
      case 'Review': return 'Sharh';
      case 'Message': return 'Xabar';
      case 'System': return 'Tizim';
      case 'Promotion': return 'Aksiya';
      default: return category;
    }
  }
  
  // ==========================================
  // Browser Notifications
  // ==========================================
  
  async requestBrowserNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  private showBrowserNotification(notification: Notification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    
    new Notification(notification.title, {
      body: notification.message,
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      tag: notification.id,
      requireInteraction: notification.type === 'error' || notification.type === 'warning',
      data: notification.data
    });
  }
  
  // ==========================================
  // Send Notification (Admin only)
  // ==========================================
  
  sendNotificationToUser(userId: string, notification: Partial<Notification>): Observable<Notification> {
    return this.http.post<Notification>(`${this.apiUrl}/send/${userId}`, notification);
  }
  
  sendNotificationToAll(notification: Partial<Notification>): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/send-all`, notification);
  }
  
  sendNotificationToHosts(notification: Partial<Notification>): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/send-hosts`, notification);
  }
}

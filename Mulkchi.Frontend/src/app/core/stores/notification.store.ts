import { computed, inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Notification, NotificationsService } from '../services/notifications.service';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly notificationsService = inject(NotificationsService);

  readonly notifications = computed(() => this.notificationsService.notifications());
  readonly unreadCount = computed(() => this.notificationsService.unreadCount());
  readonly isConnected = computed(() => this.notificationsService.isConnected());

  load(): Observable<Notification[]> {
    return this.notificationsService.loadNotifications();
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.notificationsService.markAsRead(notificationId);
  }

  clearAll(): Observable<void> {
    return this.notificationsService.markAllAsRead();
  }
}

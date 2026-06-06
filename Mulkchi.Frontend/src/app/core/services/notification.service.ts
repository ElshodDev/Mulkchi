import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);
  
  // VAPID Public Key needed for Push Notifications
  // In a real project, this comes from environment variables or backend
  readonly VAPID_PUBLIC_KEY = "BNvX-_fR0tH-xL7B_r89R-x_T5H-9yQ_zL-8H-zT_H-9x_L-B_8H-R_x-T_L-9x_B-8y_T-R_x-L_B-9y_T";

  constructor() {
    this.listenToMessages();
  }

  requestSubscription() {
    if (!this.swPush.isEnabled) {
      console.warn("Service Worker yoki Push Notifications yoqilmagan.");
      return;
    }

    this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
    })
    .then(sub => {
      // Send subscription object to backend to save in database
      // this.http.post(`${environment.apiUrl}/notifications/subscribe`, sub).subscribe();
      console.log("Push Obuna muvaffaqiyatli!", sub);
      alert("Xabarnomalarga ajoyib tarzda obuna bo'ldingiz!");
    })
    .catch(err => console.error("Obuna bo'lishda xatolik yuz berdi", err));
  }

  private listenToMessages() {
    if (this.swPush.isEnabled) {
      this.swPush.messages.subscribe(message => {
        console.log("Yangi Push Xabarnoma keldi!", message);
        // Here you can update a local notification center or store state
      });

      this.swPush.notificationClicks.subscribe(({ action, notification }) => {
        // Handle when user clicks the notification card
        console.log("Xabarnoma bosildi:", notification);
        if (notification.data && notification.data.url) {
          window.open(notification.data.url, '_blank');
        }
      });
    }
  }
}

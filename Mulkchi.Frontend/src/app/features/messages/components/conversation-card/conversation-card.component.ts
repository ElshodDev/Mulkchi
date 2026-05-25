import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Conversation } from '../../../../core/models';
import { ChatUtils } from '../../../../core/utils/chat.utils';

@Component({
  selector: 'app-conversation-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      class="conversation-card"
      [class.active]="isActive"
      [class.unread]="conversation.unreadCount > 0"
      (click)="select.emit(conversation)"
    >
      <div class="avatar-wrapper">
        <ng-container *ngIf="conversation.otherUser.avatarUrl; else noAvatar">
          <img
            [src]="conversation.otherUser.avatarUrl"
            (error)="onAvatarError($event)"
            [alt]="conversation.otherUser.firstName"
          />
        </ng-container>
        <ng-template #noAvatar>
          <div
            class="avatar-placeholder"
            [style.background]="getAvatarColor(conversation.otherUser.firstName)"
          >
            {{ conversation.otherUser.firstName.charAt(0) }}
          </div>
        </ng-template>
        <span class="status-indicator" [class.online]="conversation.otherUser.isOnline"></span>
      </div>

      <div class="card-content">
        <div class="card-header">
          <span class="name"
            >{{ conversation.otherUser.firstName }} {{ conversation.otherUser.lastName }}</span
          >
          <span class="time">{{ formatTime(conversation.lastMessageDate) }}</span>
        </div>

        <div class="property-tag" *ngIf="conversation.propertyTitle">
          <mat-icon>home</mat-icon>
          <span>{{ conversation.propertyTitle }}</span>
        </div>

        <div class="card-footer">
          <p class="preview" [class.typing]="conversation.isTyping">
            <ng-container *ngIf="conversation.isTyping; else lastMsg"> yozmoqda... </ng-container>
            <ng-template #lastMsg>
              {{ conversation.lastMessage || "Xabar yo'q" }}
            </ng-template>
          </p>
          <span class="unread-count" *ngIf="conversation.unreadCount > 0">
            {{ conversation.unreadCount }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .conversation-card {
        margin: 4px 0;
        padding: 16px;
        border-radius: 16px;
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
        background: #eff6ff;
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

      .name {
        font-weight: 700;
        font-size: 1.05rem;
        color: #0f172a;
      }

      .time {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
      }

      .preview {
        font-size: 0.9rem;
        font-weight: 500;
        color: #64748b;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .preview.typing {
        color: #3b82f6;
        font-style: italic;
      }

      .unread-count {
        background: #3b82f6;
        color: white;
        font-size: 0.7rem;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 10px;
        margin-left: 8px;
      }

      .property-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        color: #3b82f6;
        background: #eff6ff;
        padding: 2px 8px;
        border-radius: 6px;
        width: fit-content;
        margin: 4px 0;
        font-weight: 600;
      }

      .property-tag mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    `,
  ],
})
export class ConversationCardComponent {
  @Input({ required: true }) conversation!: Conversation;
  @Input() isActive = false;
  @Output() select = new EventEmitter<Conversation>();

  formatTime(date: Date | string): string {
    return ChatUtils.formatTime(date);
  }

  getAvatarColor(name: string): string {
    return ChatUtils.getAvatarColor(name);
  }

  onAvatarError(event: any): void {
    // Hide broken image and show fallback avatar
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const wrapper = img.parentElement;
    if (wrapper) {
      const placeholder = document.createElement('div');
      placeholder.className = 'avatar-placeholder';
      placeholder.style.background = this.getAvatarColor(this.conversation.otherUser.firstName);
      placeholder.textContent = this.conversation.otherUser.firstName.charAt(0);
      wrapper.appendChild(placeholder);
    }
  }
}

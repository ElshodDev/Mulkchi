import { AfterViewChecked, Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild, computed } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatMenuModule } from '@angular/material/menu';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { ChatUtils } from '../../core/utils/chat.utils';
import { ConversationCardComponent } from './components/conversation-card/conversation-card.component';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatMenuModule,
    ConversationCardComponent
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ]),
    trigger('messageAppear', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }),
        animate('250ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
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
  propertyContext = signal<{id: string, title: string, image: string} | null>(null);

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
        const propertyId = params['propertyId'];
        
        if (userId) {
          this.startConversationWithUser(userId, userName, userAvatar, propertyId, params['propertyTitle'], params['propertyImage']);
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

  private startConversationWithUser(userId: string, userName?: string, userAvatar?: string, propertyId?: string, propertyTitle?: string, propertyImage?: string): void {
    const existing = this.conversations().find(c => c.otherUserId === userId && c.propertyId === propertyId);
    
    if (existing) {
      this.selectConversation(existing);
    } else {
      const tempConv: Conversation = {
        otherUserId: userId,
        propertyId: propertyId,
        propertyTitle: propertyTitle,
        propertyImage: propertyImage,
        otherUser: {
          id: userId,
          firstName: userName?.split(' ')[0] || 'Foydalanuvchi',
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
    const active = this.activeConversation();
    return active?.otherUserId === conv.otherUserId && active?.propertyId === conv.propertyId;
  }

  closeConversation(): void {
    this.chatService.setActiveConversation(null);
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
        text,
        this.activeConversation()?.propertyId
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
    return ChatUtils.formatTime(date);
  }

  shouldShowDateDivider(index: number): boolean {
    if (index === 0) return true;
    
    const current = new Date(this.currentMessages()[index].createdDate).toDateString();
    const prev = new Date(this.currentMessages()[index - 1].createdDate).toDateString();
    
    return current !== prev;
  }

  getDateLabel(date: Date | string): string {
    return ChatUtils.getDateLabel(date);
  }

  isFirstInGroup(index: number): boolean {
    if (index === 0) return true;
    return this.currentMessages()[index].senderId !== this.currentMessages()[index - 1].senderId;
  }

  isLastInGroup(index: number): boolean {
    const messages = this.currentMessages();
    if (index === messages.length - 1) return true;
    return messages[index].senderId !== messages[index + 1].senderId;
  }

  viewProfile(): void {
    const userId = this.activeConversation()?.otherUserId;
    if (userId) {
      this.router.navigate(['/profile', userId]);
    }
  }

  getAvatarColor(name: string): string {
    return ChatUtils.getAvatarColor(name);
  }

  onTyping(): void {
    // typing logic
  }

  attachFile(): void {
    this.snackBar.open('Fayl biriktirish funksiyasi tez kunda!', 'OK', { duration: 2000 });
  }

  viewPropertyById(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/properties', id]);
    }
  }

  clearPropertyContext(): void {
    this.propertyContext.set(null);
  }

  viewProperty(): void {
    const propertyId = this.activeConversation()?.propertyId;
    if (propertyId) {
      this.router.navigate(['/properties', propertyId]);
    }
  }
}

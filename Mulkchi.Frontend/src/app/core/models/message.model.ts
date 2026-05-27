export enum MessageType {
  Text = 0,
  Image = 1,
  File = 2,
  System = 3
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  propertyId?: string;
  content: string;
  type?: MessageType;
  createdDate: Date;
  isRead: boolean;
  readAt?: Date;
  senderName?: string;
  senderAvatar?: string;
}

export interface Conversation {
  otherUserId: string;
  propertyId?: string;
  propertyTitle?: string;
  propertyImage?: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    isOnline?: boolean;
  };
  lastMessage: string;
  lastMessageDate: Date;
  unreadCount: number;
  isTyping?: boolean;
}

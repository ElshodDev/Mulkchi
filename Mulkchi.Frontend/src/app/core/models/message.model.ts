export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  propertyId?: string;
  content: string;
  createdDate: Date;
  isRead: boolean;
  readDate?: Date;
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

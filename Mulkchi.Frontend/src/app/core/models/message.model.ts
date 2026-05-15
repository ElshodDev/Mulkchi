export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdDate: Date;
  isRead: boolean;
  readDate?: Date;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface Conversation {
  otherUserId: string;
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
  propertyId?: string;
}

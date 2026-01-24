// Chat Types - Based on Flutter implementation

// Message types
export const ChatType = {
  text: 'text',
  image: 'image',
  video: 'video',
  document: 'document',
  audio: 'audio',
} as const;

export type ChatMessageType = typeof ChatType[keyof typeof ChatType];

// Message status
export const MessageStatus = {
  sending: 'sending',
  sent: 'sent',
  delivered: 'delivered',
  seen: 'seen',
} as const;

export type MessageStatusType = typeof MessageStatus[keyof typeof MessageStatus];

// Chat Message Model
export interface ChatModel {
  type?: ChatMessageType;
  timestamp?: Date; // Firestore Timestamp converted to Date
  senderId?: string;
  receiverId?: string;
  delivered: boolean;
  seen: boolean;
  mediaUrl?: string;
  thumbnailUrl?: string;
  chatID?: string;
  message?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

// Upload result for file uploads
export interface UploadResult {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  messageId: string;
}

// Group Chat Model
export interface GroupModel {
  groupId?: string;
  groupName?: string;
  groupDescription?: string;
  groupIcon?: string;
  createdBy?: string;
  createdAt?: Date;
  members?: string[];
  admins?: string[];
  isActive?: boolean;
  lastMessage?: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp?: Date;
  isUnread?: boolean; // Local property for UI state
}

// Inbox/Conversation preview model
export interface InboxModel {
  archive: boolean;
  lastMessage?: string;
  mediaUrl?: string;
  receiverId?: string;
  seen: boolean;
  senderId?: string;
  timestamp?: Date;
  type?: ChatMessageType;
  otherUserId?: string; // The ID of the other user in the conversation
  userName?: string; // The display name of the other user
}

// Chat conversation interface
export interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  isVerified?: boolean;
  roleBadge?: string;
  lastMessage: string;
  time: string;
  isNew?: boolean;
  otherUserId: string; // Added for navigation
}

// Chat UI message interface
export interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  day?: string;
  status?: MessageStatusType;
  isSending?: boolean;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  type?: ChatMessageType;
}

// Helper functions
export class ChatHelpers {
  static isTextMessage(type?: ChatMessageType): boolean {
    return type === ChatType.text;
  }

  static isImageMessage(type?: ChatMessageType): boolean {
    return type === ChatType.image;
  }

  static isVideoMessage(type?: ChatMessageType): boolean {
    return type === ChatType.video;
  }

  static isDocumentMessage(type?: ChatMessageType): boolean {
    return type === ChatType.document;
  }

  static isAudioMessage(type?: ChatMessageType): boolean {
    return type === ChatType.audio;
  }

  static hasMedia(mediaUrl?: string): boolean {
    return (mediaUrl ?? '').trim().length > 0;
  }

  static getFormattedFileSize(bytes?: number): string {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  static getInboxPreviewText(type: ChatMessageType, fileName?: string): string {
    switch (type) {
      case ChatType.image:
        return '📷 Photo';
      case ChatType.video:
        return '🎥 Video';
      case ChatType.document:
        return '📄 ' + (fileName ?? 'Document');
      case ChatType.audio:
        return '🎵 Audio';
      default:
        return '📎 Attachment';
    }
  }

  static getMessageStatusText(seen?: boolean, delivered?: boolean): string {
    if (seen) return 'Seen';
    if (delivered) return 'Delivered';
    return 'Sent';
  }

  static getConversationId(userId1: string, userId2: string): string {
    const ids = [userId1, userId2].sort();
    return `${ids[0]}_${ids[1]}`;
  }

  static compareMessagesByTime(a: ChatModel, b: ChatModel): number {
    const aTime = a.timestamp?.getTime() ?? 0;
    const bTime = b.timestamp?.getTime() ?? 0;
    if (aTime !== bTime) return aTime - bTime;
    return (a.chatID ?? '').localeCompare(b.chatID ?? '');
  }
}


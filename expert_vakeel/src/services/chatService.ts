// Chat Service - Firebase Implementation
import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import type {
  ChatModel,
  ChatMessageType,
  InboxModel,
  UploadResult,
} from '../types/chat';
import {
  ChatType,
  ChatHelpers,
} from '../types/chat';

// Constants
const CHAT_COLLECTION = 'chat';
const INBOX_COLLECTION = 'inbox';

// Utility function to generate UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Convert Firestore timestamp to Date
function timestampToDate(timestamp: any): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(timestamp);
}

// Chat Service Class
export class ChatService {
  private static instance: ChatService;
  private currentUserId: string | null = null;

  private constructor() {
    // User ID is now set manually via setCurrentUserId()
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Set current user ID (called when user logs in via API)
  setCurrentUserId(userId: string | null): void {
    this.currentUserId = userId;
  }

  // Get current user ID
  private getCurrentUserId(): string {
    if (!this.currentUserId) {
      throw new Error('User not authenticated');
    }
    return this.currentUserId;
  }


  // Convert ChatModel to Firestore format
  private chatModelToFirestore(chat: ChatModel): any {
    const data: any = {
      type: chat.type,
      timestamp: chat.timestamp ? Timestamp.fromDate(chat.timestamp) : serverTimestamp(),
      senderId: chat.senderId,
      receiverId: chat.receiverId,
      delivered: chat.delivered ?? false,
      seen: chat.seen ?? false,
      chatID: chat.chatID,
      message: chat.message,
    };

    // Only include optional fields if they have values
    if (chat.mediaUrl) data.mediaUrl = chat.mediaUrl;
    if (chat.thumbnailUrl) data.thumbnailUrl = chat.thumbnailUrl;
    if (chat.fileName) data.fileName = chat.fileName;
    if (chat.fileSize !== undefined) data.fileSize = chat.fileSize;
    if (chat.mimeType) data.mimeType = chat.mimeType;

    return data;
  }

  // Convert Firestore data to ChatModel
  private firestoreToChatModel(data: any): ChatModel {
    return {
      type: data.type,
      timestamp: timestampToDate(data.timestamp),
      senderId: data.senderId,
      receiverId: data.receiverId,
      delivered: data.delivered ?? false,
      seen: data.seen ?? false,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      chatID: data.chatID,
      message: data.message,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    };
  }

  // Convert InboxModel to Firestore format
  private inboxModelToFirestore(inbox: InboxModel): any {
    const data: any = {
      archive: inbox.archive ?? false,
      lastMessage: inbox.lastMessage,
      receiverId: inbox.receiverId,
      seen: inbox.seen ?? false,
      senderId: inbox.senderId,
      timestamp: inbox.timestamp ? Timestamp.fromDate(inbox.timestamp) : serverTimestamp(),
      type: inbox.type,
    };

    // Only include optional fields if they have values
    if (inbox.mediaUrl) data.mediaUrl = inbox.mediaUrl;
    if (inbox.userName) data.userName = inbox.userName;

    return data;
  }

  // Send text message
  async sendTextMessage(receiverId: string, message: string, senderName?: string, receiverName?: string): Promise<ChatModel> {
    const currentUserId = this.getCurrentUserId();
    const messageId = generateUUID();
    const now = new Date();

    const chatModel: ChatModel = {
      type: ChatType.text,
      timestamp: now,
      senderId: currentUserId,
      receiverId,
      delivered: false,
      seen: false,
      chatID: messageId,
      message,
    };

    await this.sendMessage(chatModel, senderName, receiverName);
    return chatModel;
  }

  // Send message with attachment
  async sendMessageWithAttachment(
    receiverId: string,
    attachmentUrl: string,
    fileName: string,
    fileType: ChatMessageType,
    fileSize: number,
    mimeType?: string,
    caption?: string,
    thumbnailUrl?: string,
    senderName?: string,
    receiverName?: string
  ): Promise<ChatModel> {
    const currentUserId = this.getCurrentUserId();
    const messageId = generateUUID();
    const now = new Date();

    const chatModel: ChatModel = {
      type: fileType,
      timestamp: now,
      senderId: currentUserId,
      receiverId,
      delivered: false,
      seen: false,
      mediaUrl: attachmentUrl,
      thumbnailUrl,
      chatID: messageId,
      message: caption || fileName,
      fileName,
      fileSize,
      mimeType,
    };

    await this.sendMessage(chatModel, senderName, receiverName);
    return chatModel;
  }

  // Core message sending logic
  private async sendMessage(chatModel: ChatModel, senderName?: string, receiverName?: string): Promise<void> {
    const currentUserId = chatModel.senderId!;
    const receiverId = chatModel.receiverId!;

    const batch = writeBatch(db);

    // Create mirrored message documents
    const senderMessageRef = doc(
      collection(db, CHAT_COLLECTION, currentUserId, receiverId),
      chatModel.chatID
    );

    const receiverMessageRef = doc(
      collection(db, CHAT_COLLECTION, receiverId, currentUserId),
      chatModel.chatID
    );

    const messageData = this.chatModelToFirestore(chatModel);
    batch.set(senderMessageRef, messageData);
    batch.set(receiverMessageRef, messageData);

    // Create inbox entries
    const previewText = chatModel.message ||
      ChatHelpers.getInboxPreviewText(chatModel.type || ChatType.text, chatModel.fileName);

    const senderInbox: InboxModel = {
      archive: false,
      lastMessage: previewText,
      ...(chatModel.mediaUrl && { mediaUrl: chatModel.mediaUrl }),
      receiverId,
      seen: true, // Sender has seen their own message
      senderId: currentUserId,
      timestamp: chatModel.timestamp,
      type: chatModel.type,
      userName: receiverName, // For sender's inbox, other user is the receiver
    };

    const receiverInbox: InboxModel = {
      archive: false,
      lastMessage: previewText,
      ...(chatModel.mediaUrl && { mediaUrl: chatModel.mediaUrl }),
      receiverId: receiverId, // The person receiving the message
      seen: false, // Receiver hasn't seen yet
      senderId: currentUserId, // The person who sent the message
      timestamp: chatModel.timestamp,
      type: chatModel.type,
      userName: senderName, // For receiver's inbox, other user is the sender
    };

    const senderInboxRef = doc(
      collection(db, CHAT_COLLECTION, currentUserId, INBOX_COLLECTION),
      receiverId
    );

    const receiverInboxRef = doc(
      collection(db, CHAT_COLLECTION, receiverId, INBOX_COLLECTION),
      currentUserId
    );

    batch.set(senderInboxRef, this.inboxModelToFirestore(senderInbox));
    batch.set(receiverInboxRef, this.inboxModelToFirestore(receiverInbox));

    await batch.commit();
  }

  // Listen to messages in real-time
  listenToMessages(
    otherUserId: string,
    onMessagesUpdate: (messages: ChatModel[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!this.currentUserId) {
      // Return a no-op unsubscribe function if not authenticated
      return () => {};
    }
    const currentUserId = this.getCurrentUserId();

    const messagesQuery = query(
      collection(db, CHAT_COLLECTION, currentUserId, otherUserId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messages: ChatModel[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push(this.firestoreToChatModel(data));
        });
        onMessagesUpdate(messages);
      },
      (error) => {
        console.error('Error listening to messages:', error);
        onError?.(error as Error);
      }
    );

    return unsubscribe;
  }

  // Mark messages as seen
  async markMessagesAsSeen(otherUserId: string): Promise<void> {
    const currentUserId = this.getCurrentUserId();

    // Get all unseen messages where I'm the receiver
    const messagesQuery = query(
      collection(db, CHAT_COLLECTION, currentUserId, otherUserId),
      where('seen', '==', false),
      where('receiverId', '==', currentUserId)
    );

    const snapshot = await getDocs(messagesQuery);

    if (snapshot.empty) return;

    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnapshot) => {
      const messageRef = docSnapshot.ref;
      batch.update(messageRef, { seen: true, delivered: true });

      // Also update the mirrored message
      const data = docSnapshot.data();
      if (data.senderId && data.chatID) {
        const mirroredRef = doc(
          collection(db, CHAT_COLLECTION, data.senderId, currentUserId),
          data.chatID
        );
        batch.update(mirroredRef, { seen: true, delivered: true });
      }
    });

    // Update inbox
    const inboxRef = doc(
      collection(db, CHAT_COLLECTION, currentUserId, INBOX_COLLECTION),
      otherUserId
    );
    batch.update(inboxRef, { seen: true });

    await batch.commit();
  }

  // Generate thumbnail for image files
  private async generateImageThumbnail(file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<File | null> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(thumbnailFile);
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload file to Firebase Storage
  async uploadFile(
    file: File,
    otherUserId: string,
    messageId: string
  ): Promise<UploadResult> {
    const currentUserId = this.getCurrentUserId();

    // Create storage reference
    const storageRef = ref(
      storage,
      `chat_uploads/${currentUserId}/${otherUserId}/${messageId}/${file.name}`
    );

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      messageId,
    };
  }

  // Upload file with thumbnail generation
  async uploadFileWithThumbnail(
    file: File,
    otherUserId: string,
    messageId: string
  ): Promise<UploadResult & { thumbnailUrl?: string }> {
    const currentUserId = this.getCurrentUserId();

    // Upload main file
    const result = await this.uploadFile(file, otherUserId, messageId);

    // Generate and upload thumbnail for images
    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      try {
        const thumbnailFile = await this.generateImageThumbnail(file);
        if (thumbnailFile) {
          const thumbnailRef = ref(
            storage,
            `chat_uploads/${currentUserId}/${otherUserId}/${messageId}/thumb_${file.name}`
          );
          const thumbnailSnapshot = await uploadBytes(thumbnailRef, thumbnailFile);
          thumbnailUrl = await getDownloadURL(thumbnailSnapshot.ref);
        }
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
      }
    }

    return {
      ...result,
      thumbnailUrl,
    };
  }

  // Delete message (only for me)
  async deleteMessageForMe(otherUserId: string, messageId: string): Promise<void> {
    const currentUserId = this.getCurrentUserId();

    const messageRef = doc(
      collection(db, CHAT_COLLECTION, currentUserId, otherUserId),
      messageId
    );

    await deleteDoc(messageRef);
  }

  // Delete message for everyone (only if sender)
  async deleteMessageForEveryone(otherUserId: string, messageId: string): Promise<void> {
    const currentUserId = this.getCurrentUserId();

    // Check if I'm the sender
    const messageRef = doc(
      collection(db, CHAT_COLLECTION, currentUserId, otherUserId),
      messageId
    );

    const messageSnap = await getDoc(messageRef);
    if (!messageSnap.exists()) return;

    const data = messageSnap.data();
    if (data?.senderId !== currentUserId) {
      throw new Error('Cannot delete message: not the sender');
    }

    const batch = writeBatch(db);

    // Delete from both collections
    batch.delete(messageRef);
    batch.delete(doc(
      collection(db, CHAT_COLLECTION, otherUserId, currentUserId),
      messageId
    ));

    await batch.commit();
  }

  // Get conversation list (inbox)
  // Create or update conversation inbox entry
  async createConversationInbox(currentUserId: string, otherUserId: string, otherUserName?: string): Promise<void> {
    const batch = writeBatch(db);

    // Create inbox entry for current user
    const currentUserInboxRef = doc(
      collection(db, CHAT_COLLECTION, currentUserId, INBOX_COLLECTION),
      otherUserId
    );

    const currentUserInbox = {
      archive: false,
      lastMessage: '',
      receiverId: otherUserId,
      seen: true,
      senderId: currentUserId,
      timestamp: serverTimestamp(),
      type: ChatType.text,
      userName: otherUserName,
    };

    // Create inbox entry for other user
    const otherUserInboxRef = doc(
      collection(db, CHAT_COLLECTION, otherUserId, INBOX_COLLECTION),
      currentUserId
    );

    const otherUserInbox = {
      archive: false,
      lastMessage: '',
      receiverId: currentUserId,
      seen: false,
      senderId: otherUserId,
      timestamp: serverTimestamp(),
      type: ChatType.text,
      userName: undefined, // Will be updated when the other user sends a message
    };

    batch.set(currentUserInboxRef, {
      archive: currentUserInbox.archive,
      lastMessage: currentUserInbox.lastMessage,
      receiverId: currentUserInbox.receiverId,
      seen: currentUserInbox.seen,
      senderId: currentUserInbox.senderId,
      timestamp: currentUserInbox.timestamp,
      type: currentUserInbox.type,
      userName: currentUserInbox.userName,
    });

    batch.set(otherUserInboxRef, {
      archive: otherUserInbox.archive,
      lastMessage: otherUserInbox.lastMessage,
      receiverId: otherUserInbox.receiverId,
      seen: otherUserInbox.seen,
      senderId: otherUserInbox.senderId,
      timestamp: otherUserInbox.timestamp,
      type: otherUserInbox.type,
      userName: otherUserInbox.userName,
    });

    await batch.commit();
  }

  async getConversations(): Promise<InboxModel[]> {
    if (!this.currentUserId) {
      return []; // Return empty array if not authenticated
    }
    const currentUserId = this.getCurrentUserId();

    const inboxQuery = query(
      collection(db, CHAT_COLLECTION, currentUserId, INBOX_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(inboxQuery);
    const conversations: InboxModel[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const otherUserId = doc.id; // The document ID is the other user's ID
      conversations.push({
        archive: data.archive ?? false,
        lastMessage: data.lastMessage,
        mediaUrl: data.mediaUrl,
        receiverId: data.receiverId,
        seen: data.seen ?? false,
        senderId: data.senderId,
        timestamp: timestampToDate(data.timestamp),
        type: data.type,
        otherUserId, // Add this to identify the conversation partner
        userName: data.userName, // Include the stored user name
      });
    });

    return conversations;
  }

  // Listen to conversations (inbox) in real-time
  listenToConversations(
    onConversationsUpdate: (conversations: InboxModel[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    if (!this.currentUserId) {
      // Return a no-op unsubscribe function if not authenticated
      return () => {};
    }
    const currentUserId = this.getCurrentUserId();

    const inboxQuery = query(
      collection(db, CHAT_COLLECTION, currentUserId, INBOX_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      inboxQuery,
      (snapshot) => {
        const conversations: InboxModel[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const otherUserId = doc.id; // The document ID is the other user's ID
          conversations.push({
            archive: data.archive ?? false,
            lastMessage: data.lastMessage,
            mediaUrl: data.mediaUrl,
            receiverId: data.receiverId,
            seen: data.seen ?? false,
            senderId: data.senderId,
            timestamp: timestampToDate(data.timestamp),
            type: data.type,
            otherUserId, // Add this to identify the conversation partner
            userName: data.userName, // Include the stored user name
          });
        });
        onConversationsUpdate(conversations);
      },
      (error) => {
        console.error('Error listening to conversations:', error);
        onError?.(error as Error);
      }
    );

    return unsubscribe;
  }
}

// Export singleton instance
export const chatService = ChatService.getInstance();


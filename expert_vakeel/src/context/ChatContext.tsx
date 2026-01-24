import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../services/chatService';
import type { ChatModel, InboxModel, ChatMessageType } from '../types/chat';
import { ChatType } from '../types/chat';
import { useUser } from './UserContext';
import { userAPI, clientContactAPI } from '../services/api';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ChatContextType {
  // State
  currentConversation: InboxModel | null;
  messages: ChatModel[];
  conversations: InboxModel[];
  isLoading: boolean;
  isOnline: boolean;
  sendingMessageIds: Set<string>;

  // Actions
  startConversation: (otherUserId: string, otherUserName?: string) => void;
  selectConversation: (conversation: InboxModel) => void;
  sendTextMessage: (message: string) => Promise<void>;
  sendFileMessage: (file: File, type: ChatMessageType, caption?: string, onProgress?: (progress: number) => void) => Promise<void>;
  markMessagesAsSeen: () => Promise<void>;
  deleteMessageForMe: (messageId: string) => Promise<void>;
  deleteMessageForEveryone: (messageId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  clearCurrentConversation: () => void;

  // User name utilities
  getUserName: (userId: string) => Promise<string>;
  userNameCache: Map<string, string>;

  // User profile picture utilities
  getUserProfilePic: (userId: string) => Promise<string | null>;
  userProfilePicCache: Map<string, string | null>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();

  // State
  const [currentConversation, setCurrentConversation] = useState<InboxModel | null>(null);
  const [messages, setMessages] = useState<ChatModel[]>([]);
  const [conversations, setConversations] = useState<InboxModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sendingMessageIds, setSendingMessageIds] = useState<Set<string>>(new Set());
  const [userNameCache, setUserNameCache] = useState<Map<string, string>>(new Map());
  const [userProfilePicCache, setUserProfilePicCache] = useState<Map<string, string | null>>(new Map());
  const [conversationStarted, setConversationStarted] = useState<number>(0); // Timestamp to trigger refresh

  // Message listener cleanup
  const [messageUnsubscribe, setMessageUnsubscribe] = useState<(() => void) | null>(null);
  const [conversationsUnsubscribe, setConversationsUnsubscribe] = useState<(() => void) | null>(null);

  // Sync client profile to Firebase (so mobile app can fetch it)
  const syncClientProfileToFirebase = useCallback(async (clientId: string, clientData: any) => {
    if (!clientId) {
      console.error('Cannot sync: clientId is empty');
      return;
    }

    try {
      console.log('🔄 Syncing client profile to Firebase...', {
        clientId,
        name: clientData.name,
        fullName: clientData.fullName,
        firstName: clientData.firstName,
        email: clientData.email,
        availableFields: Object.keys(clientData),
      });

      const clientRef = doc(db, 'clients', clientId);
      const clientProfile = {
        id: clientId,
        name: clientData.name || clientData.fullName || clientData.firstName || 'Client',
        email: clientData.email || '',
        phone: clientData.phone || clientData.phoneNumber || '',
        profilePic: clientData.profilePic || clientData.profilePicture || '',
        isActive: true,
        isOnline: true,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(clientRef, clientProfile, { merge: true });
      console.log('✅ Client profile synced to Firebase successfully!', clientProfile);
    } catch (error: any) {
      console.error('❌ Failed to sync client profile to Firebase:', {
        error: error.message,
        code: error.code,
        clientId,
      });
      // Show user-friendly error
      if (error.code === 'permission-denied') {
        console.error('Permission denied - check Firebase security rules');
      }
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const convs = await chatService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  // Load conversations when user is authenticated
  useEffect(() => {
    if (userLoading) return; // Wait for user loading to complete
    if (!user) return; // Don't initialize chat if no authenticated user

    // Sync client profile to Firebase when they log in
    const syncProfile = async () => {
      try {
        const clientData = localStorage.getItem("client");
        if (clientData && clientData !== "undefined") {
          const client = JSON.parse(clientData);
          const clientId = client.id || client._id;
          if (clientId) {
            await syncClientProfileToFirebase(clientId, client);
          }
        }
      } catch (error) {
        console.error('Error syncing client profile:', error);
      }
    };

    syncProfile();
    loadConversations();

    // Listen to conversations in real-time
    const unsubscribe = chatService.listenToConversations(
      (updatedConversations) => {
        setConversations(updatedConversations);
      },
      (error) => {
        console.error('Error listening to conversations:', error);
      }
    );

    setConversationsUnsubscribe(() => unsubscribe);

    return () => {
      unsubscribe();
    };
  }, [user, userLoading, syncClientProfileToFirebase]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      messageUnsubscribe?.();
      conversationsUnsubscribe?.();
    };
  }, [messageUnsubscribe, conversationsUnsubscribe]);

  // Refresh conversations when a new chat is started
  useEffect(() => {
    if (conversationStarted > 0) {
      // Small delay to allow Firebase write to complete
      const timeoutId = setTimeout(() => {
        loadConversations();
      }, 1500);

      return () => clearTimeout(timeoutId);
    }
  }, [conversationStarted, loadConversations]);

  const startConversation = useCallback(async (otherUserId: string, otherUserName?: string) => {
    try {
      // Get current user info
      const token = localStorage.getItem("token");
      const clientData = localStorage.getItem("client");

      let currentUserId = null;
      let client = null;

      if (token && clientData && clientData !== "undefined") {
        try {
          client = JSON.parse(clientData);
          currentUserId = client.id || client._id;
        } catch (err) {
          console.error("Error parsing client data:", err);
        }
      }

      // Cache the user name immediately if provided
      if (otherUserName && otherUserId) {
        setUserNameCache(prev => new Map(prev).set(otherUserId, otherUserName));
      }

      // Create client contact record and conversation inbox if we have both client and lawyer IDs
      if (currentUserId && otherUserId) {
        try {
          // Sync client profile to Firebase first (so mobile app can see it)
          if (client) {
            await syncClientProfileToFirebase(currentUserId, client);
          }

          // Create client contact record
          await clientContactAPI.create({
            clientId: currentUserId,
            lawyerId: otherUserId,
            contactType: 'chat',
          });
          console.log('Client contact record created for conversation');

          // Create conversation inbox entries in Firebase
          await chatService.createConversationInbox(currentUserId, otherUserId, otherUserName);
          console.log('Conversation inbox created in Firebase');
        } catch (contactError) {
          console.error('Failed to create client contact or conversation inbox:', contactError);
          // Don't fail the conversation start if contact creation fails
        }
      }

      // Find existing conversation or create new one
      const existingConversation = conversations.find(
        (conv) => conv.otherUserId === otherUserId || conv.senderId === otherUserId || conv.receiverId === otherUserId
      );

      if (existingConversation) {
        setCurrentConversation(existingConversation);
      } else {
        // Create local conversation object for immediate UI update
        // The real Firebase document will be picked up by the real-time listener
        const newConversation: InboxModel = {
          archive: false,
          seen: true,
          senderId: otherUserId,
          receiverId: currentUserId || '',
          otherUserId: otherUserId,
          lastMessage: '',
          timestamp: new Date(),
          userName: otherUserName,
        };
        setCurrentConversation(newConversation);

        // Trigger conversation refresh to show new chat in sidebar
        setConversationStarted(Date.now());
      }

      // Navigate to chat page
      navigate('/chat', {
        state: {
          otherUserId,
          otherUserName,
          conversation: existingConversation
        }
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Still navigate to chat even if contact creation fails
      navigate('/chat', {
        state: {
          otherUserId,
          otherUserName
        }
      });
    }
  }, [conversations, navigate, syncClientProfileToFirebase]);

  const getUserName = useCallback(async (userId: string): Promise<string> => {
    // Check cache first
    const cachedName = userNameCache.get(userId);
    if (cachedName) {
      return cachedName;
    }

    try {
      const response = await userAPI.getById(userId);

      // The API returns { data: { success: boolean; data: User } }
      // So response.data.data should contain the user object
      const userData = response.data?.data as any; // User object from API
      const userName = userData?.fullName || 'Unknown User';

      // Cache the result
      setUserNameCache(prev => new Map(prev).set(userId, userName));

      return userName;
    } catch (error: any) {
      console.error('Error fetching user name for ID:', userId, error.message);

      // Return a more descriptive fallback
      return `User ${userId.slice(0, 8)}...`;
    }
  }, [userNameCache]);

  const getUserProfilePic = useCallback(async (userId: string): Promise<string | null> => {
    // Check cache first
    const cachedPic = userProfilePicCache.get(userId);
    if (cachedPic !== undefined) {
      return cachedPic;
    }

    try {
      const response = await userAPI.getById(userId);

      // The API returns { data: { success: boolean; data: User } }
      // So response.data.data should contain the user object
      const userData = response.data?.data as any; // User object from API
      const profilePic = userData?.profilePic || null;

      // Cache the result
      setUserProfilePicCache(prev => new Map(prev).set(userId, profilePic));

      return profilePic;
    } catch (error: any) {
      console.error('Error fetching user profile pic for ID:', userId, error.message);

      // Cache null for failed requests
      setUserProfilePicCache(prev => new Map(prev).set(userId, null));
      return null;
    }
  }, [userProfilePicCache]);

  const selectConversation = useCallback((conversation: InboxModel) => {
    setCurrentConversation(conversation);
  }, []);

  const sendTextMessage = useCallback(async (message: string) => {
    if (!currentConversation || !message.trim()) return;

    const otherUserId = currentConversation.otherUserId || currentConversation.senderId || currentConversation.receiverId;
    if (!otherUserId) return;

    try {
      // Get current user name and receiver name
      const currentUserName = user?.name || 'You';
      const receiverName = currentConversation.userName || await getUserName(otherUserId);

      const chatModel = await chatService.sendTextMessage(otherUserId, message.trim(), currentUserName, receiverName);

      // Mark as sending - the real-time listener will add the message to state
      setSendingMessageIds(prev => new Set(prev).add(chatModel.chatID!));

    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show error to user
    }
  }, [currentConversation, user, getUserName]);

  const sendFileMessage = useCallback(async (file: File, type: ChatMessageType, caption?: string, onProgress?: (progress: number) => void) => {
    if (!currentConversation) return;

    const otherUserId = currentConversation.otherUserId || currentConversation.senderId || currentConversation.receiverId;
    if (!otherUserId) return;

    try {
      setIsLoading(true);
      onProgress?.(0);

      // Get current user name and receiver name
      const currentUserName = user?.name || 'You';
      const receiverName = currentConversation.userName || await getUserName(otherUserId);

      // First upload the file (with thumbnail for images)
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uploadResult = type === ChatType.image
        ? await chatService.uploadFileWithThumbnail(file, otherUserId, messageId)
        : await chatService.uploadFile(file, otherUserId, messageId);

      onProgress?.(50);

      // Then send the message with the uploaded file URL
      const chatModel = await chatService.sendMessageWithAttachment(
        otherUserId,
        uploadResult.url,
        uploadResult.fileName,
        type,
        uploadResult.size,
        uploadResult.mimeType,
        caption,
        'thumbnailUrl' in uploadResult ? (uploadResult as any).thumbnailUrl : undefined,
        currentUserName,
        receiverName
      );

      onProgress?.(100);

      // Mark as sending - the real-time listener will add the message to state
      setSendingMessageIds(prev => new Set(prev).add(chatModel.chatID!));

    } catch (error) {
      console.error('Error sending file:', error);
      onProgress?.(-1); // Error state
      // TODO: Show error to user
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, user, getUserName]);

  const markMessagesAsSeen = useCallback(async () => {
    if (!currentConversation || !user) return; // Ensure user is authenticated

    const otherUserId = currentConversation.otherUserId || currentConversation.senderId || currentConversation.receiverId;
    if (!otherUserId) return;

    try {
      await chatService.markMessagesAsSeen(otherUserId);
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  }, [currentConversation, user]);

  const deleteMessageForMe = useCallback(async (messageId: string) => {
    if (!currentConversation) return;

    const otherUserId = currentConversation.otherUserId || currentConversation.senderId || currentConversation.receiverId;
    if (!otherUserId) return;

    try {
      await chatService.deleteMessageForMe(otherUserId, messageId);

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.chatID !== messageId));

    } catch (error) {
      console.error('Error deleting message for me:', error);
    }
  }, [currentConversation]);

  const deleteMessageForEveryone = useCallback(async (messageId: string) => {
    if (!currentConversation) return;

    const otherUserId = currentConversation.otherUserId || currentConversation.senderId || currentConversation.receiverId;
    if (!otherUserId) return;

    try {
      await chatService.deleteMessageForEveryone(otherUserId, messageId);

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.chatID !== messageId));

    } catch (error) {
      console.error('Error deleting message for everyone:', error);
      // TODO: Show error to user
    }
  }, [currentConversation]);

  const clearCurrentConversation = useCallback(() => {
    // Cleanup message listener
    messageUnsubscribe?.();
    setMessageUnsubscribe(null);

    setCurrentConversation(null);
    setMessages([]);
  }, [messageUnsubscribe]);

  // Initialize message listener when conversation changes
  useEffect(() => {
    if (currentConversation) {
      const otherUserId = currentConversation.otherUserId || currentConversation.senderId || currentConversation.receiverId;
      if (otherUserId) {
        // Cleanup previous listener
        messageUnsubscribe?.();

        // Start new listener
        const unsubscribe = chatService.listenToMessages(
          otherUserId,
          (updatedMessages) => {
            setMessages(updatedMessages);

            // Update sending status
            const stillSending = new Set<string>();
            updatedMessages.forEach(msg => {
              if (msg.chatID && !msg.delivered && !msg.seen) {
                stillSending.add(msg.chatID);
              }
            });
            setSendingMessageIds(stillSending);
          },
          (error) => {
            console.error('Error listening to messages:', error);
          }
        );

        setMessageUnsubscribe(() => unsubscribe);

        // Mark messages as seen
        markMessagesAsSeen();
      }
    }
  }, [currentConversation, user]);

  const value: ChatContextType = {
    currentConversation,
    messages,
    conversations,
    isLoading,
    isOnline,
    sendingMessageIds,
    startConversation,
    selectConversation,
    sendTextMessage,
    sendFileMessage,
    markMessagesAsSeen,
    deleteMessageForMe,
    deleteMessageForEveryone,
    loadConversations,
    clearCurrentConversation,
    getUserName,
    userNameCache,
    getUserProfilePic,
    userProfilePicCache,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

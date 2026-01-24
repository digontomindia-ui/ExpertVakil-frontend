import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Paperclip,
  Send,
  ArrowLeft,
  File,
  FileVideo,
  FileAudio,
  Download,
  Menu,
  X,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useUser } from "../../context/UserContext";
import { ChatType, ChatHelpers } from "../../types/chat";
import type { ChatMessageType } from "../../types/chat";
import { clientAPI } from "../../services/api";

// UI Components
function Avatar({ src, name }: { src?: string; name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return src ? (
    <img
      src={src}
      alt={name}
      className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
    />
  ) : (
    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-br from-slate-100 to-white grid place-items-center text-xs md:text-sm font-semibold text-gray-700 ring-1 ring-gray-100 shadow-inner">
      {initials}
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="sticky top-3 z-10 mx-auto my-3 w-fit rounded-full bg-white/90 px-4 py-1 text-xs font-medium text-gray-500 backdrop-blur shadow-sm">
      {label}
    </div>
  );
}

function MessageBubble({
  message,
  time,
  isMine,
}: {
  message: any;
  time: string;
  isMine?: boolean;
}) {
  const base =
    "relative max-w-[82%] px-4 py-3 text-[14px] leading-relaxed rounded-2xl shadow-sm";
  const mineCls =
    "bg-gradient-to-br from-green-50 to-green-100 text-gray-900 rounded-br-md self-end";
  const theirsCls =
    "bg-gradient-to-br from-blue-50 to-white text-gray-900 rounded-bl-md self-start";

  const handleDownload = (url: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMediaContent = () => {
    const type = message.type;
    const mediaUrl = message.mediaUrl;
    const fileName = message.fileName;
    const mimeType = message.mimeType;

    if (!mediaUrl) return null;

    switch (type) {
      case ChatType.image:
        return (
          <div className="mb-2">
            <img
              src={message.thumbnailUrl || mediaUrl}
              alt={fileName || "Image"}
              className="w-full max-w-full h-auto rounded-lg cursor-pointer hover:opacity-95 transition-opacity border border-gray-100"
              onClick={() => window.open(mediaUrl, "_blank")}
              style={{ maxHeight: "320px", objectFit: "cover" }}
            />
          </div>
        );

      case ChatType.video:
        return (
          <div className="mb-2">
            <video
              src={mediaUrl}
              controls
              className="w-full max-w-full h-auto rounded-lg border border-gray-100"
              style={{ maxHeight: "320px" }}
              preload="metadata"
            >
              <source src={mediaUrl} type={mimeType} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case ChatType.audio:
        return (
          <div className="mb-2">
            <audio src={mediaUrl} controls className="w-full max-w-xs">
              <source src={mediaUrl} type={mimeType} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );

      case ChatType.document:
        const getFileIcon = () => {
          if (mimeType?.includes("pdf")) return "📄";
          if (mimeType?.includes("doc") || mimeType?.includes("word")) return "📝";
          if (mimeType?.includes("xls") || mimeType?.includes("excel")) return "📊";
          if (mimeType?.includes("ppt") || mimeType?.includes("powerpoint")) return "📽️";
          return "📎";
        };

        return (
          <div className="mb-2">
            <div
              className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-gray-200 cursor-pointer hover:bg-white/75 transition-colors"
              onClick={() => handleDownload(mediaUrl, fileName || "document")}
            >
              <span className="text-2xl">{getFileIcon()}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fileName || "Document"}</p>
                <p className="text-xs text-gray-500">{ChatHelpers.getFormattedFileSize(message.fileSize)}</p>
              </div>
              <Download className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-2`}>
      <div className={`${base} ${isMine ? mineCls : theirsCls}`}>
        {renderMediaContent()}
        {message.message && <p className="whitespace-pre-wrap">{message.message}</p>}
        <span className="absolute -right-12 bottom-0 translate-y-1 text-[11px] text-gray-400">{time}</span>
      </div>
    </div>
  );
}

function Chip({
  children,
  variant = "gray",
}: {
  children: React.ReactNode;
  variant?: "gray" | "blue" | "amber";
}) {
  const variantClasses = {
    gray: "bg-gray-100 text-gray-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-700",
  };
  return <span className={`px-2 py-[2px] text-[10px] rounded-full ${variantClasses[variant]}`}>{children}</span>;
}

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  const {
    conversations,
    messages,
    currentConversation,
    sendTextMessage,
    sendFileMessage,
    selectConversation,
    clearCurrentConversation,
    isLoading,
    getUserName,
    userNameCache,
    getUserProfilePic,
    userProfilePicCache,
  } = useChat();

  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [conversationUserNames, setConversationUserNames] = useState<Map<string, string>>(new Map());
  const [conversationUserProfilePics, setConversationUserProfilePics] = useState<Map<string, string | null>>(new Map());
  const [showConversations, setShowConversations] = useState(false); // mobile drawer toggle
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Verify authentication with backend token/ID validation
  useEffect(() => {
    const verifyAuthentication = async () => {
      try {
        const authResult = await clientAPI.verifyAuth();
        
        if (authResult.authenticated && authResult.user) {
          const userId = authResult.user.id || authResult.user._id;
          
          // Verify user has valid ID
          if (userId) {
            setIsAuthenticated(true);
            setIsAuthenticating(false);
            return;
          }
        }
        
        // If authentication fails, redirect to login
        setIsAuthenticated(false);
        setIsAuthenticating(false);
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Authentication verification failed:", error);
        setIsAuthenticated(false);
        setIsAuthenticating(false);
        navigate("/login", { replace: true });
      }
    };

    verifyAuthentication();
  }, [navigate]);

  // Get conversation data from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.otherUserId) {
      // Find the conversation or create a placeholder
      const conversation = conversations.find((conv) => conv.otherUserId === state.otherUserId);

      if (conversation) {
        selectConversation(conversation);
      } else {
        // Create a placeholder conversation
        const placeholderConversation = {
          archive: false,
          seen: true,
          senderId: state.otherUserId,
          receiverId: "", // Will be set by chat service
          lastMessage: "",
          timestamp: new Date(),
          otherUserId: state.otherUserId,
        };
        selectConversation(placeholderConversation);
      }
    } else if (conversations.length > 0 && !currentConversation) {
      // Default to first conversation if none selected
      selectConversation(conversations[0]);
    }
  }, [location.state, conversations, selectConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Fetch user names and profile pictures for conversations that don't have stored data
  useEffect(() => {
    const fetchUserData = async () => {
      const userIdsToFetch: string[] = [];

      conversations.forEach((conversation) => {
        const otherUserId = conversation.otherUserId || conversation.senderId || conversation.receiverId;
        // Only fetch if conversation doesn't already have stored data
        if (
          otherUserId &&
          !conversation.userName &&
          !userNameCache.has(otherUserId) &&
          !conversationUserNames.has(otherUserId) &&
          !conversationUserProfilePics.has(otherUserId)
        ) {
          userIdsToFetch.push(otherUserId);
        }
      });

      if (userIdsToFetch.length > 0) {
        const promises = userIdsToFetch.map(async (userId) => {
          try {
            const [name, profilePic] = await Promise.all([getUserName(userId), getUserProfilePic(userId)]);
            return { userId, name, profilePic };
          } catch (error) {
            console.error(`Failed to fetch data for ${userId}:`, error);
            return {
              userId,
              name: `User ${userId.slice(0, 8)}...`,
              profilePic: null,
            };
          }
        });

        const results = await Promise.all(promises);
        const newNames = new Map(conversationUserNames);
        const newProfilePics = new Map(conversationUserProfilePics);

        results.forEach(({ userId, name, profilePic }) => {
          newNames.set(userId, name);
          newProfilePics.set(userId, profilePic);
        });

        setConversationUserNames(newNames);
        setConversationUserProfilePics(newProfilePics);
      }
    };

    if (conversations.length > 0) {
      fetchUserData();
    }
  }, [conversations, getUserName, getUserProfilePic, userNameCache, userProfilePicCache, conversationUserNames, conversationUserProfilePics]);

  // Show loading while verifying authentication
  if (isAuthenticating) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-sm text-gray-600">Verifying authentication...</p>
        </div>
      </main>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-[100dvh] bg-gradient-to-b from-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </main>
    );
  }

  // Helper function to get the other user's ID (not the current user)
  const getOtherUserId = (conversation: any): string => {
    const currentUserId = user?.id || user?._id;
    if (!currentUserId) return conversation.otherUserId || conversation.senderId || conversation.receiverId || "";

    // Return whichever ID is not the current user
    if (conversation.senderId && conversation.senderId !== currentUserId) {
      return conversation.senderId;
    }
    if (conversation.receiverId && conversation.receiverId !== currentUserId) {
      return conversation.receiverId;
    }
    if (conversation.otherUserId && conversation.otherUserId !== currentUserId) {
      return conversation.otherUserId;
    }

    // Fallback
    return conversation.otherUserId || conversation.senderId || conversation.receiverId || "";
  };

  // Helper function to get display name for a user ID
  const getDisplayName = (userId: string, conversation?: any): string => {
    // First check if conversation has stored userName
    if (conversation?.userName) {
      return conversation.userName;
    }

    // Then check our caches
    const cachedName = userNameCache.get(userId) || conversationUserNames.get(userId);
    if (cachedName) {
      return cachedName;
    }

    // If no cached name, return a loading placeholder
    return "Loading...";
  };

  // Helper function to get display profile picture for a user ID
  const getDisplayProfilePic = (userId: string): string | undefined => {
    // Check our caches
    const cachedPic = userProfilePicCache.get(userId) ?? conversationUserProfilePics.get(userId);
    return cachedPic ?? undefined;
  };

  const handleSend = async () => {
    const message = text.trim();
    if (!message || !currentConversation) return;

    try {
      await sendTextMessage(message);
      setText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    clearCurrentConversation();
    navigate("/findprofile");
  };

  // File validation constants
  const FILE_SIZE_LIMITS: Record<ChatMessageType, number> = {
    [ChatType.image]: 10 * 1024 * 1024, // 10MB
    [ChatType.video]: 50 * 1024 * 1024, // 50MB
    [ChatType.document]: 25 * 1024 * 1024, // 25MB
    [ChatType.audio]: 25 * 1024 * 1024, // 25MB
    [ChatType.text]: 0, // Not used for text
  };

  const ACCEPTED_TYPES: Record<ChatMessageType, string[]> = {
    [ChatType.image]: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    [ChatType.video]: ["video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv", "video/webm"],
    [ChatType.document]: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ],
    [ChatType.audio]: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"],
    [ChatType.text]: [], // Not used for text
  };

  const getFileType = (file: File): ChatMessageType => {
    if (ACCEPTED_TYPES.image.includes(file.type)) return ChatType.image;
    if (ACCEPTED_TYPES.video.includes(file.type)) return ChatType.video;
    if (ACCEPTED_TYPES.audio.includes(file.type)) return ChatType.audio;
    if (ACCEPTED_TYPES.document.includes(file.type)) return ChatType.document;
    return ChatType.document; // Default to document
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const fileType = getFileType(file);
    const sizeLimit = FILE_SIZE_LIMITS[fileType];

    if (file.size > sizeLimit) {
      const limitMB = sizeLimit / (1024 * 1024);
      return {
        valid: false,
        error: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} files must be smaller than ${limitMB}MB`,
      };
    }

    const acceptedTypes = ACCEPTED_TYPES[fileType];
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Accepted types for ${fileType}: ${acceptedTypes.join(", ")}`,
      };
    }

    return { valid: true };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);
    setShowFilePreview(true);
    setCaption(""); // Reset caption
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendFile = async () => {
    if (!selectedFile || !currentConversation) return;

    try {
      setUploadProgress(0);
      const fileType = getFileType(selectedFile);
      await sendFileMessage(selectedFile, fileType, caption.trim() || undefined, (progress: number) => {
        setUploadProgress(progress);
        if (progress === 100) {
          // Reset state after successful upload
          setSelectedFile(null);
          setCaption("");
          setShowFilePreview(false);
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      });
    } catch (error) {
      console.error("Error sending file:", error);
      setUploadProgress(0);
      alert("Failed to send file. Please try again.");
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setCaption("");
    setShowFilePreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderFilePreview = () => {
    if (!selectedFile || !showFilePreview) return null;

    const fileType = getFileType(selectedFile);

    return (
      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <div className="flex items-start gap-3 mb-3">
          {fileType === ChatType.image && (
            <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-gray-100" />
          )}
          {fileType === ChatType.video && (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileVideo className="h-6 w-6 text-gray-600" />
            </div>
          )}
          {fileType === ChatType.audio && (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileAudio className="h-6 w-6 text-gray-600" />
            </div>
          )}
          {fileType === ChatType.document && (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <File className="h-6 w-6 text-gray-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{ChatHelpers.getFormattedFileSize(selectedFile.size)}</p>
          </div>
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
        />

        {uploadProgress > 0 && uploadProgress < 100 ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancelFile} className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50" disabled={isLoading}>
              Cancel
            </button>
            <button onClick={handleSendFile} disabled={isLoading} className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (timestamp?: Date) => {
    if (!timestamp) return "";
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatConversationTime = (timestamp?: Date) => {
    if (!timestamp) return "";

    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return formatTime(messageDate);
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: "short" });
    } else {
      return messageDate.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-3 md:mb-4">
          {/* Mobile: show menu to toggle conversations */}
          <button onClick={() => setShowConversations((s) => !s)} className="md:hidden rounded-full p-2 bg-white shadow-inner" aria-label="Toggle conversations">
            {showConversations ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button onClick={handleBack} className="hidden md:flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <h1 className="text-base md:text-3xl font-semibold tracking-tight text-gray-900 truncate">
              {currentConversation ? `Chat with ${getDisplayName(currentConversation.otherUserId || getOtherUserId(currentConversation), currentConversation)}` : "Chats"}
            </h1>
            {currentConversation && <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">• Active</div>}
          </div>

          <div className="ml-auto hidden md:flex items-center gap-3">
            <div className="text-sm text-gray-500">Signed in as</div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gray-100 grid place-items-center text-xs font-semibold text-gray-700">{user?.name?.slice(0, 2) || "ME"}</div>
              <div className="text-sm font-medium text-gray-800">{user?.name || user?.email || "You"}</div>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[340px_1fr]">
          {/* Left: Conversations - on mobile this becomes an overlay/drawer */}
          <aside
            className={`rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm overflow-hidden md:static md:block transform transition-transform duration-200 ease-in-out
              ${showConversations ? "translate-x-0 fixed inset-y-0 left-0 z-40 w-full max-w-xs p-4" : " -translate-x-full md:translate-x-0 hidden md:block"}`}
            role="navigation"
          >
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-800">Messages</div>
              <div className="text-xs text-gray-500 hidden md:block">{conversations.length} chats</div>
              <button className="md:hidden rounded p-1" onClick={() => setShowConversations(false)} aria-label="Close">
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <ul className="max-h-[66vh] overflow-y-auto p-2 space-y-1">
              {conversations.map((conversation) => {
                const otherUserId = conversation.otherUserId || conversation.senderId || conversation.receiverId || "";
                const displayName = getDisplayName(otherUserId, conversation);

                return (
                  <li
                    key={otherUserId}
                    onClick={() => {
                      selectConversation(conversation);
                      setShowConversations(false); // close drawer on mobile
                    }}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 transition hover:bg-gray-50 ${
                      currentConversation &&
                      (currentConversation.otherUserId === otherUserId ||
                        currentConversation.senderId === otherUserId ||
                        currentConversation.receiverId === otherUserId)
                        ? "bg-gray-50"
                        : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar src={getDisplayProfilePic(otherUserId)} name={displayName} />
                      {!conversation.seen && <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-gray-900">{displayName}</p>
                        {conversation.seen === false && <Chip variant="blue">New</Chip>}
                        <span className="ml-auto text-[11px] text-gray-400">{formatConversationTime(conversation.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-gray-500 truncate">{conversation.lastMessage || "No messages yet"}</p>
                    </div>
                  </li>
                );
              })}
              {conversations.length === 0 && <li className="px-3 py-8 text-center text-gray-500">No conversations yet</li>}
            </ul>
          </aside>

          {/* Right: Chat panel */}
          <section className="flex min-h-[60vh] flex-col rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            {currentConversation && (
              <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-3 md:px-6 md:py-4">
                <Avatar src={getDisplayProfilePic(currentConversation.otherUserId || getOtherUserId(currentConversation))} name={getDisplayName(currentConversation.otherUserId || getOtherUserId(currentConversation), currentConversation)} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{getDisplayName(currentConversation.otherUserId || getOtherUserId(currentConversation), currentConversation)}</p>
                </div>
                <div className="ml-auto text-xs text-gray-400 hidden sm:block">{formatConversationTime(currentConversation.timestamp)}</div>
              </div>
            )}

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50 px-3 py-4 md:px-4 md:py-6">
              <div className="mx-auto max-w-3xl pb-32 md:pb-0">
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const showDateDivider =
                    !prevMessage ||
                    (message.timestamp &&
                      prevMessage.timestamp &&
                      message.timestamp.toDateString() !== prevMessage.timestamp.toDateString());

                  return (
                    <div key={message.chatID || index}>
                      {showDateDivider && message.timestamp && <DateDivider label={message.timestamp.toLocaleDateString()} />}
                      <div className="mb-3 px-1">
                        <MessageBubble message={message} time={formatTime(message.timestamp)} isMine={message.senderId === (user?.id || user?._id)} />
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && <div className="text-center py-8 text-gray-500">No messages yet. Start the conversation!</div>}
              </div>
            </div>

            {/* Composer - fixed on mobile, static on md+ */}
            {currentConversation && (
              <>
                {renderFilePreview()}
                <div
                  className={`border-t border-gray-100 px-3 py-3 md:px-4 md:py-3 bg-white
                    fixed bottom-0 left-0 right-0 z-30 md:static md:rounded-b-2xl md:bg-white md:shadow-none`}
                >
                  <div className="mx-auto flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-sm max-w-3xl">
                    <input ref={fileInputRef} type="file" onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" />
                    <button
                      type="button"
                      onClick={handleAttachClick}
                      className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                      aria-label="Attach file"
                      disabled={isLoading || showFilePreview}
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-gray-400 max-h-24 overflow-auto"
                      placeholder="Type a message..."
                      disabled={isLoading || showFilePreview}
                      rows={1}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!text.trim() || isLoading || !currentConversation || showFilePreview}
                      className="ml-auto inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-black p-2 text-white hover:opacity-95 disabled:opacity-50"
                      aria-label="Send"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {/* spacer for mobile safe-area so content isn't covered */}
                <div className="md:hidden h-4" aria-hidden />
              </>
            )}
          </section>
        </div>

        {/* Mobile overlay backdrop when conversations drawer is open */}
        {showConversations && <div className="md:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setShowConversations(false)} />}
      </div>
    </main>
  );
}

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { useToaster } from "@/hooks/ui/useToaster";
import {
  IDirectChat,
  IDirectMessage,
  ICommunityChat,
  ICommunityMessage,
  IDirectChatPreview,
  ICommunityChatPreview,
} from "@/types/Chat";
import { IBarber, IClient } from "@/types/User";
import { useSelector } from "react-redux";
import { getCurrentUserDetails } from "@/utils/helpers/getCurrentUser";
import { generateUniqueId } from "@/utils/helpers/generateUniqueId";

type ChatContextType = {
  currentChat: IDirectChat | ICommunityChat | null;
  chatType: "dm" | "community";
  setCurrentChat: (chat: IDirectChat | ICommunityChat) => void;
  setCurrentChatId: (chatId: string | null) => void;
  allChats: IDirectChatPreview[] | ICommunityChatPreview[];
  setAllChats: (chats: IDirectChatPreview[] | ICommunityChatPreview[]) => void;
  onTypeChange: (type: "dm" | "community") => void;
  messages: (IDirectMessage | ICommunityMessage)[];
  handleChangeChat: () => void;
  sendMessage: (content: string, imageUrl?: string) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const searchParams = new URLSearchParams(window.location.search);
  const typeFromUrl = searchParams.get("type");
  const [currentChat, setCurrentChatData] = useState<
    IDirectChat | ICommunityChat | null
  >(null);
  const [chatType, setChatType] = useState<"dm" | "community">(
    (typeFromUrl as "dm" | "community") || "dm"
  );

  const [messages, setMessages] = useState<
    (IDirectMessage | ICommunityMessage)[]
  >([]);
  const [allChats, setAllChatsData] = useState<
    IDirectChatPreview[] | ICommunityChatPreview[]
  >([]);

  const currentChatRef = useRef<IDirectChat | ICommunityChat | null>(null);
  const messagesRef = useRef<(IDirectMessage | ICommunityMessage)[]>([]);
  const allChatsRef = useRef<IDirectChatPreview[] | ICommunityChatPreview[]>(
    []
  );

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    allChatsRef.current = allChats;
  }, [allChats]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const socket = useSocket();
  const { notifyToast } = useToaster();
  const user: IBarber | IClient | null = useSelector(getCurrentUserDetails);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveDirectMessage = (newMessage: IDirectMessage) => {
      if (chatType === "dm") {
        const currentDirectChat = currentChatRef.current as IDirectChat | null;

        if (
          currentDirectChat &&
          newMessage.chatRoomId === currentDirectChat.chatRoomId
        ) {
          if (
            !messagesRef.current.find(
              (msg) => msg.messageId === newMessage.messageId
            )
          ) {
            setMessages((prev) => [...prev, newMessage]);
          }
        } else {
          notifyToast({
            title: `You received a DM:`,
            message: `${newMessage.content}`,
            createdAt: newMessage.timestamp,
          });
        }

        if (allChats.length > 0 && chatType === "dm") {
          setAllChatsData((prevChats) => {
            const chatsArray = [...(prevChats as IDirectChatPreview[])];
            const chatIndex = chatsArray.findIndex(
              (chat) =>
                "chatRoomId" in chat &&
                chat.chatRoomId === newMessage.chatRoomId
            );

            if (chatIndex > -1) {
              const updatedChat = chatsArray.splice(chatIndex, 1)[0];
              const chatWithNewMessage = {
                ...updatedChat,
                lastMessage: {
                  senderId: newMessage.senderId,
                  content: newMessage.content,
                  messageType: newMessage.messageType,
                  timestamp: newMessage.timestamp,
                  mediaUrl: newMessage.mediaUrl,
                },
                ...(currentChatId !== newMessage.chatRoomId
                  ? { unreadCount: updatedChat.unreadCount + 1 }
                  : {}),
              } as IDirectChatPreview;

              return [chatWithNewMessage, ...chatsArray];
            }
            return chatsArray;
          });
        }
      } else {
        notifyToast({
          title: `You received a DM:`,
          message: `${newMessage.content}`,
          createdAt: newMessage.timestamp,
        });
      }
    };

    const handleReceiveCommunityMessage = (newMessage: ICommunityMessage) => {
      if (chatType === "community") {
        const currentCommunityChat =
          currentChatRef.current as ICommunityChat | null;

        if (
          currentCommunityChat &&
          newMessage.communityId === currentCommunityChat.communityId
        ) {
          if (
            !messagesRef.current.find(
              (msg) => msg.messageId === newMessage.messageId
            )
          ) {
            setMessages((prev) => [...prev, newMessage]);
          }
        } else {
          notifyToast({
            title: `New community message received!`,
            message: `${newMessage.senderName}: ${newMessage.content}`,
            createdAt: newMessage.timestamp,
          });
        }
      } else {
        notifyToast({
          title: `New community message received!`,
          message: `${newMessage.senderName}: ${newMessage.content}`,
          createdAt: newMessage.timestamp,
        });
      }
    };

    const handleMarkDirectMessageAsRead = (chatRoomId: string) => {
      if (chatType === "dm") {
        if (currentChatId === chatRoomId) {
          setAllChatsData((prevChats) => {
            return (prevChats as IDirectChatPreview[]).map((chat) =>
              chat.chatRoomId === chatRoomId
                ? { ...chat, unreadCount: 0 }
                : chat
            );
          });
        }
      }
    };

    socket.on("direct-chat:receive-message", handleReceiveDirectMessage);
    socket.on("community-chat:receive-message", handleReceiveCommunityMessage);
    socket.on("direct-chat:mark-as-read", handleMarkDirectMessageAsRead);

    return () => {
      socket.off("direct-chat:receive-message", handleReceiveDirectMessage);
      socket.off(
        "community-chat:receive-message",
        handleReceiveCommunityMessage
      );
      socket.off("direct-chat:mark-as-read", handleMarkDirectMessageAsRead);
    };
  }, [socket, chatType, allChats, notifyToast]);

  const setAllChats = (
    chats: IDirectChatPreview[] | ICommunityChatPreview[]
  ) => {
    if (allChatsRef.current.length === 0) {
      setAllChatsData(chats);
    }
  };

  const setCurrentChat = (chat: IDirectChat | ICommunityChat) => {
    const chatId = "chatRoomId" in chat ? chat.chatRoomId : chat.communityId;
    setCurrentChatId(chatId);
    setMessages(chat.messages || []);
    setCurrentChatData(chat);
  };

  const onTypeChange = (type: "dm" | "community") => {
    setChatType(type);
    setCurrentChatData(null);
    setAllChatsData([]);
    setCurrentChatId(null);
    setMessages([]);
  };

  const sendMessage = (content: string, imageUrl?: string) => {
    if (!socket || !currentChat || !chatType || !user) return;

    const currentUserId = user.userId || "";
    const senderName =
      user.role === "barber"
        ? (user as IBarber).shopName
        : (user as IClient).fullName;
    const senderAvatar = user.avatar || "/placeholder.svg";

    if (chatType === "dm") {
      const directChat = currentChat as IDirectChat;
      const newMessage: IDirectMessage = {
        messageId: generateUniqueId("direct-message"),
        chatRoomId: directChat.chatRoomId,
        senderId: currentUserId,
        receiverId: directChat.participant.userId || "",
        messageType: imageUrl ? "image" : "text",
        content,
        mediaUrl: imageUrl,
        timestamp: new Date(),
        status: "sent",
      };

      socket.emit("direct-chat:send-message", newMessage);

      setMessages((prev) => [...prev, newMessage]);
      setAllChatsData((prevChats) => {
        const chatsArray = [...(prevChats as IDirectChatPreview[])];
        const chatIndex = chatsArray.findIndex(
          (chat) => chat.chatRoomId === directChat.chatRoomId
        );

        if (chatIndex > -1) {
          const updatedChat = chatsArray[chatIndex];
          const chatWithNewMessage = {
            ...updatedChat,
            lastMessage: {
              senderId: newMessage.senderId,
              content: newMessage.content,
              messageType: newMessage.messageType,
              timestamp: newMessage.timestamp,
              mediaUrl: newMessage.mediaUrl,
            },
          };

          const newChatsArray = [
            chatWithNewMessage,
            ...chatsArray.slice(0, chatIndex),
            ...chatsArray.slice(chatIndex + 1),
          ];

          return newChatsArray;
        }

        return chatsArray;
      });
    } else {
      const communityChat = currentChat as ICommunityChat;
      const newMessage: ICommunityMessage = {
        messageId: generateUniqueId("community-message"),
        communityId: communityChat.communityId,
        senderId: currentUserId,
        messageType: imageUrl ? "image" : "text",
        content,
        mediaUrl: imageUrl,
        timestamp: new Date(),
        status: "sent",
        readBy: [currentUserId],
        senderName: senderName || "User",
        senderAvatar,
      };

      socket.emit("community-chat:send-message", newMessage);

      setMessages((prev) => [...prev, newMessage]);

      setAllChatsData((prevChats) => {
        if (chatType !== "community") return prevChats;

        const chatsArray = [...(prevChats as ICommunityChatPreview[])];
        const chatIndex = chatsArray.findIndex(
          (chat) => chat.communityId === communityChat.communityId
        );

        if (chatIndex > -1) {
          const updatedChat = chatsArray.splice(chatIndex, 1)[0];
          const chatWithNewMessage: ICommunityChatPreview = {
            ...updatedChat,
            lastMessage: {
              senderDetails: {
                userId: newMessage.senderId,
                name: newMessage.senderName,
                profileImageUrl: newMessage.senderAvatar,
              },
              content: newMessage.content,
              messageType: newMessage.messageType,
              timestamp: newMessage.timestamp,
              mediaUrl: newMessage.mediaUrl,
            },
          };

          return [chatWithNewMessage, ...chatsArray];
        }
        return chatsArray;
      });
    }
  };

  const handleChangeChat = () => {
    setCurrentChatData(null);
    // setCurrentChatId(chatId);
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{
        currentChat,
        allChats,
        setAllChats,
        chatType,
        handleChangeChat,
        setCurrentChat,
        onTypeChange,
        messages,
        sendMessage,
        setCurrentChatId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside ChatProvider");
  return context;
};

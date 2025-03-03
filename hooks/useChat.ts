"use client";

import firestore from "@react-native-firebase/firestore";
import { useEffect, useState, useMemo, useCallback } from "react";
import CryptoJS from "react-native-crypto-js";
import storage from "@react-native-firebase/storage";
import { Image } from "react-native";
import { realtimeDatabase, useIsOnline } from "./userOnlineHook";
import useRentoData from "@/stores/dataStore";
import { compatibilityFlags } from "react-native-screens";

const chatsCollection = firestore().collection("chats");
const messagesCollection = firestore().collection("messages");

export type RoomChatType = {
  roomId: string;
  lastMessage: string;
  lastTimestamp: string;
};

export type MessageChatType = {
  author: number;
  message: string;
  roomId: string;
  seen: boolean;
  timestamp: string;
  image?: {
    path: string;
    width: number;
    height: number;
  };
};

export type ChatsData = RoomChatType & {
  isOnline: boolean;
  messages: MessageChatType[] | never[];
};

const SECRET_KEY = process.env.EXPO_PUBLIC_SECRET_MESSAGE;

export function decrypt(message: string) {
  if (!SECRET_KEY) return "";

  try {
    const bytes = CryptoJS.AES.decrypt(message ?? "", SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
  } catch (error) {
    console.error("Decryption error:", error);
    return "[Encrypted message]";
  }
}

export function encrypt(messageRaw: string) {
  if (!SECRET_KEY) return "";

  return CryptoJS.AES.encrypt(messageRaw, SECRET_KEY).toString();
}

export const useGetChat = () => {
  const [chatState, setChatState] = useState<{
    rooms: RoomChatType[];
    isOnline: boolean;
    messages: MessageChatType[];
    isLoading: boolean;
    error: string | null;
  }>({
    rooms: [],
    messages: [],
    isOnline: false,
    isLoading: true,
    error: null,
  });

  const [listOnline, setListOnline] = useState<Set<string>>();
  useEffect(() => {
    let isMounted = true;
    let roomsUnsubscribe: (() => void) | null = null;
    let messagesUnsubscribe: (() => void) | null = null;
    let realtimeOnline = realtimeDatabase
      .ref("/online")
      .on("value", (snapshot) => {
        const onlineHashSet = new Set<string>();
        snapshot.forEach((c) => {
          onlineHashSet.add(c.key);
        });
        setListOnline(onlineHashSet);
      });

    const setupListeners = async () => {
      try {
        roomsUnsubscribe = chatsCollection.onSnapshot(
          (roomsSnapshot) => {
            if (!isMounted) return;

            const rooms: RoomChatType[] = [];
            roomsSnapshot.forEach(async (doc) => {
              rooms.push(doc.data() as RoomChatType);
            });

            setChatState((prev) => ({
              ...prev,
              rooms,
              isLoading: false,
            }));
          },
          (error) => {
            console.error("Error fetching chat rooms:", error);
            if (isMounted) {
              setChatState((prev) => ({
                ...prev,
                error: "Failed to load chat rooms",
                isLoading: false,
              }));
            }
          },
        );

        messagesUnsubscribe = messagesCollection.onSnapshot(
          (messagesSnapshot) => {
            if (!isMounted) return;

            const messages: MessageChatType[] = [];
            messagesSnapshot.forEach((doc) => {
              const messageData = doc.data();
              try {
                const decryptedMessage = decrypt(messageData.message);
                messages.push({
                  ...messageData,
                  message: decryptedMessage,
                } as MessageChatType);
              } catch (error) {
                console.error("Error processing message:", error);
                messages.push({
                  ...messageData,
                  message: "[Encrypted message]",
                } as MessageChatType);
              }
            });

            messages.sort(
              (a, b) =>
                Number.parseInt(a.timestamp) - Number.parseInt(b.timestamp),
            );

            setChatState((prev) => ({
              ...prev,
              messages,
              isLoading: false,
            }));
          },
          (error) => {
            console.error("Error fetching messages:", error);
            if (isMounted) {
              setChatState((prev) => ({
                ...prev,
                error: "Failed to load messages",
                isLoading: false,
              }));
            }
          },
        );
      } catch (error) {
        console.error("Error setting up listeners:", error);
        if (isMounted) {
          setChatState((prev) => ({
            ...prev,
            error: "Failed to initialize chat",
            isLoading: false,
          }));
        }
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      if (roomsUnsubscribe) roomsUnsubscribe();
      if (messagesUnsubscribe) messagesUnsubscribe();
      realtimeDatabase.ref("/online").off("value", realtimeOnline);
    };
  }, []);

  const chatsData = useMemo(() => {
    return chatState.rooms.map((room) => {
      const messageOfRoom = chatState.messages.filter(
        (m) => m.roomId === room.roomId,
      );
      return {
        ...room,
        messages: messageOfRoom,
      };
    });
  }, [chatState.rooms, chatState.messages]);

  return {
    chatsData,
    listOnline,
    isLoading: chatState.isLoading,
    error: chatState.error,
  };
};

const getImageSize = (
  uri: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      (error) => {
        console.error("Error getting image size:", error);
        reject(error);
      },
    );
  });
};

const imageToBase64 = async (
  uri: string,
  maxWidth = 800,
  maxHeight = 800,
): Promise<{
  base64: string;
  width: number;
  height: number;
}> => {
  try {
    const dimensions = await getImageSize(uri);

    let newWidth = dimensions.width;
    let newHeight = dimensions.height;

    if (dimensions.width > maxWidth) {
      newWidth = maxWidth;
      newHeight = (dimensions.height * maxWidth) / dimensions.width;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = (dimensions.width * maxHeight) / dimensions.height;
    }

    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve({
          base64: base64.split(",")[1], // Remove data:image/jpeg;base64, prefix
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error processing image:", error);
    throw new Error("Failed to process image");
  }
};

export const useSendChat = () => {
  const sendChat = useCallback(
    async (data: {
      senderId: number;
      receiverId: number;
      message: string;
      image?: {
        path: string;
        width: number;
        height: number;
      };
    }) => {
      const { senderId, receiverId, message, image } = data;

      if (!senderId || !receiverId || (!message.trim() && !image)) {
        console.error("Invalid message data:", {
          senderId,
          receiverId,
          message,
        });
        throw new Error("Invalid message data");
      }

      try {
        const roomId = getRoomId(senderId, receiverId);
        const timestamp = Date.now().toString();

        const roomData: RoomChatType = {
          roomId,
          lastMessage: image?.path ? "📷 Hình ảnh" : message,
          lastTimestamp: timestamp,
        };

        const encryptedMessage = encrypt(message);
        if (!message.trim() && !encryptedMessage && !image) {
          throw new Error("Failed to encrypt message");
        }

        const messageData: MessageChatType = {
          author: senderId,
          message: encryptedMessage || "",
          roomId,
          seen: false,
          timestamp,
          ...(image?.path && {
            image: {
              path: image.path,
              width: image.width,
              height: image.height,
            },
          }),
        };

        const batch = firestore().batch();

        batch.set(chatsCollection.doc(roomId), roomData);

        const newMessageRef = messagesCollection.doc();
        batch.set(newMessageRef, messageData);

        await batch.commit();
        return newMessageRef;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    [],
  );

  return sendChat;
};

export function getRoomId(senderId: number, receiverId: number) {
  const maxId = Math.max(senderId, receiverId);
  const minId = Math.min(senderId, receiverId);
  const roomId = `room-${minId}-${maxId}`;
  return roomId;
}

// Update markMessagesAsSeen to be a hook for better integration
export const useMarkMessagesAsSeen = () => {
  const markAsSeen = useCallback(async (roomId: string, userId: number) => {
    try {
      const messagesSnapshot = await messagesCollection
        .where("roomId", "==", roomId)
        .where("author", "!=", userId)
        .where("seen", "==", false)
        .get();

      if (messagesSnapshot.empty) return;

      const batch = firestore().batch();
      messagesSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { seen: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error marking messages as seen:", error);
      throw new Error("Failed to update message status");
    }
  }, []);

  return markAsSeen;
};

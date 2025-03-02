"use client";

import firestore from "@react-native-firebase/firestore";
import { useEffect, useState, useMemo, useCallback } from "react";
import CryptoJS from "react-native-crypto-js";
import storage from "@react-native-firebase/storage";
import { Image } from "react-native";

const chatsCollection = firestore().collection("chats");
const messagesCollection = firestore().collection("messages");

export type RoomChatType = {
  roomId: string;
  lastMessage: string;
  lastTimestamp: string;
};

// Update MessageChatType to use base64 instead of url
export type MessageChatType = {
  author: number;
  message: string;
  roomId: string;
  seen: boolean;
  timestamp: string;
  image?: {
    base64: string;
    width: number;
    height: number;
  };
};

export type ChatsData = RoomChatType & {
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
    messages: MessageChatType[];
    isLoading: boolean;
    error: string | null;
  }>({
    rooms: [],
    messages: [],
    isLoading: true,
    error: null,
  });

  // Combine both Firebase listeners into a single useEffect
  useEffect(() => {
    let isMounted = true;
    let roomsUnsubscribe: (() => void) | null = null;
    let messagesUnsubscribe: (() => void) | null = null;

    const setupListeners = async () => {
      try {
        // Set up rooms listener
        roomsUnsubscribe = chatsCollection.onSnapshot(
          (roomsSnapshot) => {
            if (!isMounted) return;

            const rooms: RoomChatType[] = [];
            roomsSnapshot.forEach((doc) => {
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

        // Set up messages listener
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

            // Sort messages by timestamp
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

    // Cleanup function
    return () => {
      isMounted = false;
      if (roomsUnsubscribe) roomsUnsubscribe();
      if (messagesUnsubscribe) messagesUnsubscribe();
    };
  }, []); // Empty dependency array since we don't want to recreate listeners

  // Memoize the chat data processing
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
    isLoading: chatState.isLoading,
    error: chatState.error,
  };
};

export const uploadImage = async (uri: string): Promise<string> => {
  try {
    // Create blob from uri
    const response = await fetch(uri);
    const blob = await response.blob();

    // Generate unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const storageRef = storage().ref().child(`chat-images/${filename}`);

    // Upload blob
    await storageRef.put(blob);

    // Get download URL
    const url = await storageRef.getDownloadURL();
    return url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
};

// Add function to convert image to base64
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
    // Get image dimensions first
    const dimensions = await getImageSize(uri);

    // Calculate new dimensions while maintaining aspect ratio
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

    // Fetch image and convert to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Convert blob to base64
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

// Update useSendChat to handle base64 images
export const useSendChat = () => {
  const sendChat = useCallback(
    async (data: {
      senderId: number;
      receiverId: number;
      message: string;
      image?: {
        uri: string;
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

        // If there's an image, process it with error handling
        let imageData = null;
        if (image) {
          try {
            imageData = await imageToBase64(image.uri);
          } catch (error) {
            console.error("Error processing image:", error);
            throw new Error(
              "Failed to process image. Please try again with a smaller image.",
            );
          }

          // Check if the base64 string is too large (approaching Firestore's 1MB limit)
          if (imageData.base64.length > 750000) {
            // Leave some room for other message data
            throw new Error(
              "Image size too large. Please use a smaller image.",
            );
          }
        }

        const roomData: RoomChatType = {
          roomId,
          lastMessage: image ? "📷 Image" : message,
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
          ...(imageData && {
            image: {
              base64: imageData.base64,
              width: imageData.width,
              height: imageData.height,
            },
          }),
        };

        // Use a batch write for atomicity
        const batch = firestore().batch();

        // Update or create chat room
        batch.set(chatsCollection.doc(roomId), roomData);

        // Add new message
        const newMessageRef = messagesCollection.doc();
        batch.set(newMessageRef, messageData);

        await batch.commit();
        return newMessageRef;
      } catch (error) {
        console.error("Error sending message:", error);
        if (error.message.includes("Image size too large")) {
          throw new Error("Image size too large. Please use a smaller image.");
        }
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

export const markMessagesAsSeen = async (roomId: string, userId: number) => {
  try {
    const messagesSnapshot = await messagesCollection
      .where("roomId", "==", roomId)
      .where("author", "!=", userId)
      .where("seen", "==", false)
      .get();

    const batch = firestore().batch();
    messagesSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { seen: true });
    });

    return batch.commit();
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    throw new Error("Failed to update message status");
  }
};

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

import firestore from "@react-native-firebase/firestore";
import { useEffect, useState } from "react";
import CryptoJS from "react-native-crypto-js";

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
};

export type ChatsData = RoomChatType & {
  messages: MessageChatType[] | never[];
};

const SECRET_KEY = process.env.EXPO_PUBLIC_SECRET_MESSAGE;

export function decrypt(message: string) {
  if (!SECRET_KEY) return "";

  const bytes = CryptoJS.AES.decrypt(message ?? "", SECRET_KEY);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
}

export function encrypt(messageRaw: string) {
  if (!SECRET_KEY) return "";

  return CryptoJS.AES.encrypt(messageRaw, SECRET_KEY).toString();
}

export const useGetChat = () => {
  const [chatRooms, setChatRooms] = useState<RoomChatType[]>([]);
  const [messages, setMessages] = useState<MessageChatType[]>([]);
  useEffect(() => {
    const subscriber = chatsCollection.onSnapshot((rooms) => {
      const arrRoomData: any[] = [];
      rooms.forEach((room) => {
        arrRoomData.push({
          ...room.data(),
        });
      });
      setChatRooms(arrRoomData);
    });
    return () => subscriber();
  }, []);

  useEffect(() => {
    const subscriber = messagesCollection.onSnapshot((messages) => {
      const arrMsgData: any[] = [];
      messages.forEach((msg) => {
        arrMsgData.push({
          ...msg.data(),
          message: decrypt(msg.data().message),
        });
      });
      setMessages(arrMsgData);
    });
    return () => subscriber();
  }, []);

  const chatsData: ChatsData[] = chatRooms.map((room) => {
    const roomId = room.roomId;
    const messageOfRoom = messages.filter((m) => m.roomId === roomId);
    return {
      ...room,
      messages: messageOfRoom,
    };
  });
  return chatsData;
};

export const useSendChat = (data: {
  senderId: number;
  receiverId: number;
  message: string;
}) => {
  const { senderId, receiverId, message } = data;
  const roomId = getRoomId(senderId, receiverId);
  const roomData: RoomChatType = {
    roomId,
    lastMessage: message,
    lastTimestamp: Date.now().toString(),
  };
  const messageData: MessageChatType = {
    author: senderId,
    message: encrypt(message) ?? "",
    roomId,
    seen: false,
    timestamp: Date.now().toString(),
  };
  chatsCollection.doc(roomId).set(roomData);
  messagesCollection.add(messageData);
};

export function getRoomId(senderId: number, receiverId: number) {
  const maxId = Math.max(senderId, receiverId);
  const minId = Math.min(senderId, receiverId);
  const roomId = `room-${minId}-${maxId}`;
  return roomId;
}

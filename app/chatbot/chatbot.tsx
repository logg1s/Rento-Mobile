import React, { useCallback, useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Message from "@/components/Chatbot/Message";
import Response from "@/components/Chatbot/Response";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { storage } from "@/stores/mmkv";
import {
  ChatBotResponseData,
  ChatBotResponseSql,
  ChatBotResponseType,
} from "@/types/chatbot";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { chatInstruction } from "./chat_instruction";
import { chatHistory } from "./chat_history";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { twMerge } from "tailwind-merge";
export type ChatHistoryType = {
  role: "user" | "model";
  message?: string;
  time: string;
  firstResponse?: ChatBotResponseSql | ChatBotResponseData;
  laterResponse?: ChatBotResponseData[];
};

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI || "");
const key = "AI_CHAT_HISTORY";

const getChatHistory = () => {
  const chatHistory = storage.getString(key);
  return chatHistory ? JSON.parse(chatHistory) : [];
};

const getJsonFromText = (
  text: string
): ChatBotResponseSql | ChatBotResponseData => {
  const jsonString = text.replace(/```json\n|\n```/g, "");
  const jsonObject = JSON.parse(jsonString);
  return jsonObject;
};

const sendRequestToServer = async (command: string) => {
  try {
    const response = await axiosFetch(`/chatbot/run`, "post", {
      command,
    });
    return response?.data;
  } catch (error) {
    console.error("Loi sendRequestToServer", error?.response?.data);
    throw error;
  }
};

const getTime = () => {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const minutesStr = minutes.toString().padStart(2, "0");
  return hours + ":" + minutesStr;
};

const buildChatHistory = (data: ChatHistoryType[]) => {
  return data.map((item) => {
    let text = "";
    if (item.role === "user") {
      text = item.message || "";
    } else {
      const firstMessage = item.firstResponse?.message || "";
      const laterMessage =
        item.laterResponse?.map((item) => item?.message).join("\n") || "";
      text = firstMessage + "\n" + laterMessage;
    }

    return {
      role: item.role,
      parts: [
        {
          text,
        },
      ],
    };
  });
};

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export default function App() {
  /* #STATE */
  const [inputText, setInputText] = useState("");
  const [listData, setListData] = useState<ChatHistoryType[] | []>(
    getChatHistory()
  );
  const flatListRef = useRef<FlatList>(null);
  const user = useRentoData((state) => state.user);
  const navigation = useNavigation();

  /* #FUNCTION */
  const sendChat = async (prompt: string) => {
    console.log("promt", prompt);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig,
      systemInstruction: chatInstruction(user?.id || ""),
    });
    const chat = await model.startChat({
      history: [...chatHistory, ...buildChatHistory(listData)],
    });
    const result = await chat.sendMessage(prompt);
    const text = result.response.text();
    console.log("text", text);
    const jsonObject: unknown = getJsonFromText(text);
    return jsonObject;
  };

  const handleNextChat = async (command: string) => {
    try {
      const response = await sendRequestToServer(command);
      const nextChat = await sendChat(JSON.stringify(response));
      console.log("nextChat", nextChat);
      return nextChat;
    } catch (error) {
      console.error("Loi next chat", error);
      return [];
    }
  };

  const updateChatHistory = (
    newChatHistory: ChatHistoryType,
    isLastMessage: boolean = false
  ) => {
    setListData((prev) => {
      if (isLastMessage) {
        const lastData = prev[prev.length - 1];
        lastData.firstResponse = newChatHistory.firstResponse;
        lastData.laterResponse = newChatHistory.laterResponse;
        storage.set(key, JSON.stringify(prev));
        return [...prev];
      }

      const newListData = [...prev, newChatHistory];
      storage.set(key, JSON.stringify(newListData));
      return newListData;
    });
  };

  const handleChat = async (prompt: string) => {
    const firstResponse = (await sendChat(prompt)) as ChatBotResponseType;
    let laterResponse: ChatBotResponseData[] = [];

    updateChatHistory({
      role: "model",
      time: getTime(),
      firstResponse,
      laterResponse,
    });

    if (firstResponse.type === "sql") {
      laterResponse.push(
        (await handleNextChat(firstResponse.sql)) as ChatBotResponseData
      );
    }

    console.log("laterResponse", laterResponse);

    updateChatHistory(
      {
        role: "model",
        time: getTime(),
        firstResponse,
        laterResponse,
      },
      true
    );
  };

  const onPressSendMessage = () => {
    if (inputText.trim() === "") return;
    updateChatHistory({ role: "user", message: inputText, time: getTime() });
    setInputText("");
    handleChat(inputText);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd();
  };

  /* #USE EFFECT */
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPressIn={() => {
            Alert.alert(
              "Xoá lịch sử chat",
              "Bạn có muốn xoá lịch sử chat không?",
              [
                {
                  text: "Hủy",
                  style: "cancel",
                },
                {
                  text: "Xoá",
                  onPress: () => {
                    storage.delete(key);
                    setListData([]);
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-bin-outline" size={20} color="red" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollToBottom();
    }, 50);

    return () => clearTimeout(timeout);
  }, [listData]);

  return (
    <View className="flex-1 gap-1">
      <FlatList
        ref={flatListRef}
        contentContainerClassName="p-2 gap-5"
        data={listData as ChatHistoryType[]}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View>
            {item.role === "user" && (
              <Message
                message={item.message}
                user={user}
                time={item.time}
                onAfterNewMessage={scrollToBottom}
              />
            )}
            {item.role === "model" && (
              <Response
                firstResponse={item.firstResponse}
                onTextResponse={scrollToBottom}
                laterResponseData={item.laterResponse}
                time={item.time}
              />
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="justify-center items-center">
            <Text className="text-lg ">
              Tin nhắn đang trống. Bắt đầu trò truyện với AI để hiển thị
            </Text>
          </View>
        )}
      />

      {/* Search-Bar */}
      <View className="flex flex-row items-center justify-between gap-2 bg-white py-4 px-2 x shadow shadow-gray-300">
        <TextInput
          placeholder="Trò chuyện với AI"
          className={twMerge(
            `flex-1 rounded-2xl border border-gray-500 p-4 text-lg focus:border-2 focus:border-primary-500 `
          )}
          value={inputText}
          onChangeText={(text) => setInputText(text)}
          selectionColor={"#323232"}
          multiline={true}
        />
        <TouchableOpacity onPress={onPressSendMessage}>
          <Image
            source={require("@/assets/icons/right-arrow.png")}
            className="w-8 h-8"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

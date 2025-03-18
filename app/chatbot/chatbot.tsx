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

const sendChat = async (prompt: string, userId: string | number) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: chatInstruction(userId),
  });
  const chat = await model.startChat({
    history: chatHistory,
  });
  const result = await chat.sendMessage(prompt);
  const text = result.response.text();
  const jsonObject: unknown = getJsonFromText(text);
  return jsonObject;
};

const handleNextChat = async (command: string, userId: string | number) => {
  try {
    const response = await sendRequestToServer(command);
    const nextChat = await sendChat(JSON.stringify(response), userId);
    return nextChat;
  } catch (error) {
    console.error("Loi next chat", error);
    return [];
  }
};

const getTime = () => {
  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // get minute with 2 digit
  const minutesStr = minutes.toString().padStart(2, "0");
  return hours + ":" + minutesStr;
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
  const updateChatHistory = (newChatHistory: ChatHistoryType) => {
    storage.set(key, JSON.stringify([...listData, newChatHistory]));
    setListData((prev) => [...prev, newChatHistory]);
  };

  const handleChat = async (prompt: string) => {
    updateChatHistory({ role: "user", message: inputText, time: getTime() });
    setInputText("");

    const firstResponse = (await sendChat(
      prompt,
      user?.id || ""
    )) as ChatBotResponseType;

    let laterResponse: ChatBotResponseData[] = [];
    if (firstResponse.type === "sql") {
      laterResponse.push(
        (await handleNextChat(
          firstResponse.sql,
          user?.id || ""
        )) as ChatBotResponseData
      );
    }

    updateChatHistory({
      role: "model",
      time: getTime(),
      firstResponse,
      laterResponse,
    });
  };

  const onPressSendMessage = () => {
    if (inputText.trim() === "") return;
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
    scrollToBottom();
  }, [listData]);

  return (
    <View className="flex-1 gap-4">
      <FlatList
        ref={flatListRef}
        className="flex-1 p-5"
        data={listData as ChatHistoryType[]}
        renderItem={({ item }) => (
          <View>
            {item.role === "user" && (
              <Message message={item.message} user={user} time={item.time} />
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
            <Text className="text-xl ">
              Tin nhắn đang trống. Bắt đầu trò truyện với AI để hiển thị
            </Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />

      {/* Search-Bar */}
      <View className="flex flex-row items-center justify-between gap-2 bg-white p-4 shadow shadow-gray-300">
        <TextInput
          placeholder="Trò chuyện với AI"
          className="flex-1 rounded-full border border-gray-300 p-4 text-lg"
          value={inputText}
          onChangeText={(text) => setInputText(text)}
          selectionColor={"#323232"}
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

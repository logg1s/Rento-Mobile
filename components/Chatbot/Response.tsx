import React, { useState, useEffect } from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from "react-native-markdown-display";
import { chatHistory } from "@/app/chatbot/chat_history";
import { ChatBotResponseText, ChatBotResponseType } from "@/types/chatbot";
import { chatInstruction } from "@/app/chatbot/chat_instruction";
import { axiosFetch } from "@/stores/dataStore";

const date = new Date();

const getTime = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // get minute with 2 digit
  const minutesStr = minutes.toString().padStart(2, "0");
  return hours + ":" + minutesStr;
};

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI || "");

const getJsonFromText = (text: string): ChatBotResponseType => {
  const jsonString = text.replace(/```json\n|\n```/g, "");
  const jsonObject: ChatBotResponseType = JSON.parse(jsonString);
  return jsonObject;
};

const host = process.env.EXPO_PUBLIC_API_HOST;

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

const handleNextChat = async (command: string) => {
  try {
    const response = await sendRequestToServer(command);
    const lastMessage = await sendChat(JSON.stringify(response));
    return lastMessage;
  } catch (error) {
    console.error("Loi next chat", error);
    return "";
  }
};

const sendChat = async (prompt: string) => {
  let chatResponseText = "";
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: chatInstruction,
  });
  const chat = await model.startChat({
    history: chatHistory,
  });
  const result = await chat.sendMessage(prompt);
  const text = result.response.text();
  console.log("text", text);
  const jsonObject = getJsonFromText(text);

  chatResponseText += jsonObject.message;
  console.log("chat response text", chatResponseText);

  if (jsonObject.type === "sql") {
    chatResponseText += await handleNextChat(jsonObject.sql);
  }

  return chatResponseText;
};

export default function Response({
  prompt,
  onTextResponse,
}: {
  prompt: string;
  onTextResponse?: () => void;
}) {
  const [generatedText, setGeneratedText] = useState("");
  useEffect(() => {
    sendChat(prompt).then((text) => {
      setGeneratedText(text || "Lỗi khi trả lời. Bạn hãy gửi lại câu hỏi !");
    });
  }, []);

  useEffect(() => {
    if (generatedText.trim() !== "") {
      onTextResponse?.();
    }
  }, [generatedText]);

  return (
    <View style={styles.response}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image
            source={require("@/assets/icons/robot.png")}
            style={styles.icon}
          />
          <Text style={{ fontWeight: 600 }}>Rento</Text>
        </View>
        <Text style={{ fontSize: 10, fontWeight: "600" }}>{getTime(date)}</Text>
      </View>
      <Markdown>{generatedText}</Markdown>
    </View>
  );
}

const styles = StyleSheet.create({
  response: {
    flexDirection: "column",
    gap: 8,
    backgroundColor: "#fafafa",
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
  },
  icon: {
    width: 28,
    height: 28,
  },
});

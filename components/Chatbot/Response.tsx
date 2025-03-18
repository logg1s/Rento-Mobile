import React, { useState, useEffect, useCallback, useRef } from "react";
import { StyleSheet, View, Image, Text, ActivityIndicator } from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from "react-native-markdown-display";
import { chatHistory } from "@/app/chatbot/chat_history";
import {
  ChatBotResponseData,
  ChatBotResponseSql,
  ChatBotResponseType,
} from "@/types/chatbot";
import { chatInstruction } from "@/app/chatbot/chat_instruction";
import { axiosFetch } from "@/stores/dataStore";
import LaterResponseChat from "./LaterResponse";
import { UserType } from "@/types/type";
import { first } from "lodash";

export default function Response({
  onTextResponse,
  firstResponse,
  laterResponseData,
  time,
}: {
  onTextResponse?: () => void;
  firstResponse: ChatBotResponseSql | null;
  laterResponseData: ChatBotResponseData[];
  time: string;
}) {
  return (
    <View className="bg-white p-4 shadow shadow-gray-300 rounded-2xl">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Image
            source={require("@/assets/icons/robot.png")}
            className="w-8 h-8 rounded-full"
          />
          <Text className="font-medium">Rento</Text>
        </View>
        <Text className="text-sm font-medium">{time}</Text>
      </View>
      {firstResponse?.message.trim() !== "" && (
        <Markdown>{firstResponse?.message}</Markdown>
      )}
      {firstResponse?.type === "sql" && (
        <LaterResponseChat
          laterResponse={laterResponseData}
          onTextResponse={onTextResponse}
        />
      )}
    </View>
  );
}

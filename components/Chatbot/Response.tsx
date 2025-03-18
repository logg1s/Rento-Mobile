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
        <Text style={{ fontSize: 10, fontWeight: "600" }}>{time}</Text>
      </View>
      {firstResponse?.message.trim() !== "" && (
        <Markdown>{firstResponse?.message}</Markdown>
      )}
      {laterResponseData?.length > 0 && (
        <LaterResponseChat
          laterResponse={laterResponseData}
          onTextResponse={onTextResponse}
        />
      )}
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

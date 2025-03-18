import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import Markdown from "react-native-markdown-display";
import { ChatBotResponseData } from "@/types/chatbot";
import CardItemData from "./CardItemData";

const LaterResponseChat = ({
  laterResponse,
  onTextResponse,
}: {
  laterResponse: ChatBotResponseData[];
  onTextResponse?: () => void;
}) => {
  // #useEffect
  useEffect(() => {
    const timeout = setTimeout(() => {
      onTextResponse?.();
    }, 50);

    return () => clearTimeout(timeout);
  }, [laterResponse]);
  return (
    <View>
      {laterResponse.length > 0 ? (
        laterResponse.map((item, index) => (
          <View key={index}>
            <CardItemData data={item.data} dataType={item.dataType} />
            <Markdown>{item.message}</Markdown>
          </View>
        ))
      ) : (
        <ActivityIndicator size="small" color="#000" />
      )}
    </View>
  );
};

export default LaterResponseChat;

import { View, Text, ActivityIndicator } from "react-native";
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
    onTextResponse?.();
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

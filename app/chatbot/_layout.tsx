import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const ChatbotLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="chatbot" options={{ title: "Chat với AI" }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
};
export default ChatbotLayout;

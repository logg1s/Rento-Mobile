import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getImageSource } from "@/utils/utils";
import useRentoData from "@/stores/dataStore";

const ChatScreen = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]); // TODO: Replace with actual chat data

  const ChatListItem = ({ chat }) => (
    <TouchableOpacity
      onPress={() => setSelectedChat(chat)}
      className={`flex-row items-center p-4 ${
        selectedChat?.id === chat.id ? "bg-gray-100" : "bg-white"
      }`}
    >
      <Image
        source={getImageSource(chat.user)}
        className="w-12 h-12 rounded-full"
      />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between">
          <Text className="font-pbold text-base">{chat.user.name}</Text>
          <Text className="text-gray-500 text-sm">
            {chat.lastMessage?.timestamp}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          className={`mt-1 ${
            chat.unread ? "text-black font-pmedium" : "text-gray-500"
          }`}
        >
          {chat.lastMessage?.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ChatView = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setSelectedChat(null)}
          className="mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Image
          source={getImageSource(selectedChat?.user)}
          className="w-10 h-10 rounded-full"
        />
        <View className="flex-1 ml-3">
          <Text className="font-pbold text-lg">{selectedChat?.user.name}</Text>
          <Text className="text-gray-500">
            {selectedChat?.user.isOnline ? "Đang hoạt động" : "Không hoạt động"}
          </Text>
        </View>
      </View>

      <FlatList
        data={selectedChat?.messages}
        inverted
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View
            className={`mb-4 max-w-[80%] ${
              item.isMe ? "self-end" : "self-start"
            }`}
          >
            <View
              className={`rounded-2xl p-3 ${
                item.isMe ? "bg-primary-500" : "bg-gray-200"
              }`}
            >
              <Text className={item.isMe ? "text-white" : "text-black"}>
                {item.text}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs mt-1">{item.timestamp}</Text>
          </View>
        )}
      />

      <View className="p-4 border-t border-gray-200 flex-row items-center">
        <TextInput
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={setMessage}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
        />
        <TouchableOpacity
          onPress={() => {
            // TODO: Send message
            setMessage("");
          }}
          className="bg-primary-500 w-10 h-10 rounded-full items-center justify-center"
        >
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {selectedChat ? (
        <ChatView />
      ) : (
        <>
          <View className="p-4 border-b border-gray-200">
            <Text className="text-2xl font-pbold">Tin nhắn</Text>
          </View>
          <FlatList
            data={conversations}
            renderItem={({ item }) => <ChatListItem chat={item} />}
            keyExtractor={(item) => item.id.toString()}
            ItemSeparatorComponent={() => (
              <View className="h-[1px] bg-gray-100" />
            )}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="chatbubbles-outline" size={48} color="gray" />
                <Text className="text-gray-500 text-lg mt-4 text-center">
                  Chưa có cuộc trò chuyện nào
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

export default ChatScreen;

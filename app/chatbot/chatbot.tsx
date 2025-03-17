import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import Message from "@/components/Chatbot/Message";
import Response from "@/components/Chatbot/Response";
import useRentoData from "@/stores/dataStore";
import { Ionicons } from "@expo/vector-icons";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [listData, setListData] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const user = useRentoData((state) => state.user);

  const handleSendMessage = () => {
    setListData((prevList) => [...prevList, inputText]);
    setInputText("");
  };

  useEffect(() => {
    scrollToBottom();
  }, [listData]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd();
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        style={{ paddingHorizontal: 16, marginBottom: 80 }}
        data={listData}
        renderItem={({ item }) => (
          <View>
            <Message message={item} user={user} />
            <Response prompt={item} onTextResponse={scrollToBottom} />
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
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Ask to Gemini AI"
          style={styles.input}
          value={inputText}
          onChangeText={(text) => setInputText(text)}
          selectionColor={"#323232"}
        ></TextInput>
        <TouchableOpacity onPress={handleSendMessage}>
          <Image
            source={require("@/assets/icons/right-arrow.png")}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    margin: 8,
    gap: 8,
  },
  icon: {
    width: 32,
    height: 32,
  },
  searchBar: {
    backgroundColor: "#ffffff",
    width: "100%",
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 8,
  },
  input: {
    backgroundColor: "#fff",
    width: "100%",
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 32,
    borderWidth: 0.1,
  },
});

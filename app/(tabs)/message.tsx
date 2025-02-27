"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";

const MessageScreen = () => {
  const { callDuration } = useLocalSearchParams();
  const [conversations, setConversations] = useState([
    {
      id: "1",
      name: "Lê Hoàng Cường",
      lastMessage: "Tôi sẽ đến trong 15 phút",
      time: "10:30",
      unread: 2,
      avatar: "https://picsum.photos/id/1/100",
      online: true,
    },
    {
      id: "2",
      name: "Nguyễn Thị Anh",
      lastMessage: "Cảm ơn bạn đã sử dụng dịch vụ",
      time: "09:45",
      unread: 0,
      avatar: "https://picsum.photos/id/2/100",
      online: false,
    },
    {
      id: "3",
      name: "Trần Văn Bình",
      lastMessage: "Bạn có cần hỗ trợ gì thêm không?",
      time: "Hôm qua",
      unread: 1,
      avatar: "https://picsum.photos/id/3/100",
      online: true,
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);
  const [longPressedMessage, setLongPressedMessage] = useState(null);
  const [showConversationOptions, setShowConversationOptions] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (selectedConversation && !messages[selectedConversation.id]) {
      const currentDate = new Date();
      const yesterdayDate = new Date(currentDate);
      yesterdayDate.setDate(currentDate.getDate() - 1);
      const lastWeekDate = new Date(currentDate);
      lastWeekDate.setDate(currentDate.getDate() - 7);

      setMessages({
        ...messages,
        [selectedConversation.id]: [
          {
            id: "1",
            text: "Xin chào, tôi cần hỗ trợ về dịch vụ",
            sender: "user",
            time: lastWeekDate.toISOString(),
            status: "seen",
          },
          {
            id: "2",
            text: "Chào bạn, tôi có thể giúp gì cho bạn?",
            sender: "provider",
            time: lastWeekDate.toISOString(),
            status: "seen",
          },
          {
            id: "3",
            text: "Tôi cần sửa ổ điện bị hỏng",
            sender: "user",
            time: yesterdayDate.toISOString(),
            status: "seen",
          },
          {
            id: "4",
            text: "Vâng, tôi có thể giúp bạn. Bạn có thể cho tôi biết địa chỉ của bạn không?",
            sender: "provider",
            time: yesterdayDate.toISOString(),
            status: "seen",
          },
          {
            id: "5",
            text: "Số 123 Đường ABC, Quận XYZ",
            sender: "user",
            time: currentDate.toISOString(),
            status: "seen",
          },
          {
            id: "6",
            text: "Tôi sẽ đến trong 15 phút",
            sender: "provider",
            time: currentDate.toISOString(),
            status: "delivered",
          },
        ],
      });
    }
  }, [selectedConversation, messages]);

  useEffect(() => {
    if (callDuration && selectedConversation) {
      const newCallSummary = {
        id: String(Date.now()),
        text: `Cuộc gọi kết thúc (${formatDuration(Number.parseInt(callDuration))})`,
        sender: "system",
        time: new Date().toISOString(),
        status: "seen",
      };
      setMessages((prevMessages) => ({
        ...prevMessages,
        [selectedConversation.id]: [
          ...prevMessages[selectedConversation.id],
          newCallSummary,
        ],
      }));
    }
  }, [callDuration, selectedConversation]);

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 border-b border-gray-200"
      onPress={() => setSelectedConversation(item)}
    >
      <View className="relative">
        <Image
          source={{ uri: item.avatar }}
          className="w-12 h-12 rounded-full"
        />
        {item.online && (
          <View className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>
      <View className="flex-1 ml-4">
        <View className="flex-row justify-between items-center">
          <Text className="font-pbold text-lg">{item.name}</Text>
          <Text className="font-pregular text-gray-500 text-sm">
            {item.time}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text
            className="font-pregular text-gray-600 text-sm"
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View className="bg-primary-500 rounded-full w-5 h-5 justify-center items-center">
              <Text className="font-pmedium text-white text-xs">
                {item.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDateSeparator = (date) => (
    <View className="flex-row items-center justify-center my-4">
      <View className="flex-1 h-[1px] bg-gray-300" />
      <Text className="mx-4 text-gray-500 font-pmedium">
        {formatDate(date)}
      </Text>
      <View className="flex-1 h-[1px] bg-gray-300" />
    </View>
  );

  const handleLongPress = (message) => {
    setLongPressedMessage(message);
  };

  const renderMessage = ({ item, index }) => {
    const showDateSeparator =
      index === 0 ||
      !isSameDay(
        new Date(item.time),
        new Date(messages[selectedConversation.id][index - 1].time),
      );
    return (
      <>
        {showDateSeparator && renderDateSeparator(new Date(item.time))}
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => handleLongPress(item)}
        >
          <View
            className={`flex-row ${item.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
          >
            {item.sender === "provider" && (
              <Image
                source={{ uri: selectedConversation.avatar }}
                className="w-8 h-8 rounded-full mr-2"
              />
            )}
            {item.sender === "system" ? (
              <View className="bg-gray-200 rounded-full px-4 py-2">
                <Text className="font-pmedium text-sm text-gray-600">
                  {item.text}
                </Text>
              </View>
            ) : (
              <View
                className={`rounded-2xl p-3 ${item.sender === "user" ? "bg-primary-500" : "bg-gray-200"}`}
              >
                {item.attachment ? (
                  <View>
                    {item.attachment.type.startsWith("image") ? (
                      <Image
                        source={{ uri: item.attachment.uri }}
                        className="w-48 h-48 rounded-lg mb-2"
                      />
                    ) : item.attachment.type.startsWith("video") ? (
                      <View className="w-48 h-48 bg-black rounded-lg mb-2 justify-center items-center">
                        <Ionicons name="play-circle" size={48} color="white" />
                      </View>
                    ) : (
                      <View className="flex-row items-center bg-white p-2 rounded-lg mb-2">
                        <MaterialCommunityIcons
                          name={getFileIcon(item.attachment.type)}
                          size={24}
                          color="#0286FF"
                        />
                        <Text className="ml-2 font-pmedium" numberOfLines={1}>
                          {item.attachment.name}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text
                    className={`font-pregular ${item.sender === "user" ? "text-white" : "text-black"}`}
                  >
                    {item.text}
                  </Text>
                )}
                <View className="flex-row items-center justify-end mt-1">
                  <Text
                    className={`text-xs mr-1 font-pregular ${item.sender === "user" ? "text-white" : "text-gray-500"}`}
                  >
                    {formatTime(new Date(item.time))}
                  </Text>
                  {item.sender === "user" && (
                    <Ionicons
                      name={getStatusIcon(item.status)}
                      size={16}
                      color={item.sender === "user" ? "white" : "gray"}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </>
    );
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const sendMessage = async (attachment = null) => {
    if ((!inputMessage.trim() && !attachment) || !selectedConversation) return;
    const newMessage = {
      id: String(Date.now()),
      text: inputMessage,
      sender: "user",
      time: new Date().toISOString(),
      attachment: attachment,
      status: "sending",
    };
    setMessages((prevMessages) => ({
      ...prevMessages,
      [selectedConversation.id]: [
        ...prevMessages[selectedConversation.id],
        newMessage,
      ],
    }));
    setInputMessage("");
    setIsAttachmentModalVisible(false);

    // Scroll to bottom after sending
    setTimeout(scrollToBottom, 100);

    // Simulate message sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setMessages((prevMessages) => ({
      ...prevMessages,
      [selectedConversation.id]: prevMessages[selectedConversation.id].map(
        (msg) => (msg.id === newMessage.id ? { ...msg, status: "sent" } : msg),
      ),
    }));

    // Simulate message delivered delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setMessages((prevMessages) => ({
      ...prevMessages,
      [selectedConversation.id]: prevMessages[selectedConversation.id].map(
        (msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg,
      ),
    }));
  };

  const handleImagePicker = async (useCamera = false) => {
    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });
    }

    if (!result.canceled) {
      const asset = result.assets[0];
      sendMessage({ uri: asset.uri, type: asset.type, name: "Image" });
    }
  };

  const handleDocumentPicker = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
    });

    if (result.type === "success") {
      sendMessage({
        uri: result.uri,
        type: result.mimeType,
        name: result.name,
      });
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith("image")) return "file-image";
    if (mimeType.startsWith("video")) return "file-video";
    if (mimeType.startsWith("audio")) return "file-music";
    if (mimeType.includes("pdf")) return "file-pdf-box";
    if (mimeType.includes("word")) return "file-word";
    if (mimeType.includes("excel") || mimeType.includes("sheet"))
      return "file-excel";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
      return "file-powerpoint";
    return "file-document";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sending":
        return "time-outline";
      case "sent":
        return "checkmark-outline";
      case "delivered":
        return "checkmark-done-outline";
      case "seen":
        return "checkmark-done";
      default:
        return "checkmark-outline";
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7)
      return [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
      ][date.getDay()];
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const AttachmentModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isAttachmentModalVisible}
      onRequestClose={() => setIsAttachmentModalVisible(false)}
    >
      <TouchableOpacity
        className="flex-1 justify-end bg-black bg-opacity-50"
        activeOpacity={1}
        onPress={() => setIsAttachmentModalVisible(false)}
      >
        <View className="bg-white rounded-t-3xl p-6">
          <Text className="font-pbold text-xl mb-4">Đính kèm tệp</Text>
          <View className="flex-row justify-around">
            <TouchableOpacity
              className="items-center"
              onPress={() => handleImagePicker(false)}
            >
              <View className="w-16 h-16 bg-primary-100 rounded-full justify-center items-center mb-2">
                <Ionicons name="images" size={32} color="#0286FF" />
              </View>
              <Text className="font-pmedium">Thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center"
              onPress={() => handleImagePicker(true)}
            >
              <View className="w-16 h-16 bg-primary-100 rounded-full justify-center items-center mb-2">
                <Ionicons name="camera" size={32} color="#0286FF" />
              </View>
              <Text className="font-pmedium">Máy ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="items-center"
              onPress={handleDocumentPicker}
            >
              <View className="w-16 h-16 bg-primary-100 rounded-full justify-center items-center mb-2">
                <Ionicons name="document" size={32} color="#0286FF" />
              </View>
              <Text className="font-pmedium">Tài liệu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {!selectedConversation ? (
        <>
          <View className="p-4 border-b border-gray-200">
            <Text className="font-pbold text-2xl">Tin nhắn</Text>
          </View>
          <View className="p-4">
            <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <Ionicons name="search" size={20} color="gray" />
              <TextInput
                placeholder="Tìm kiếm tin nhắn"
                className="ml-2 flex-1 font-pmedium"
              />
            </View>
          </View>
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id}
          />
        </>
      ) : (
        <>
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedConversation.avatar }}
              className="w-10 h-10 rounded-full ml-4"
            />
            <View className="ml-3 flex-1">
              <Text className="font-pbold text-lg">
                {selectedConversation.name}
              </Text>
              <Text className="text-green-500 font-pregular">
                {selectedConversation.online
                  ? "Đang hoạt động"
                  : "Không hoạt động"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/message/call",
                  params: {
                    name: selectedConversation.name,
                    avatar: selectedConversation.avatar,
                  },
                })
              }
              className="mr-4"
            >
              <Ionicons name="call" size={24} color="#0286FF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowConversationOptions(true)}>
              <Ionicons name="ellipsis-vertical" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <FlatList
            ref={flatListRef}
            data={messages[selectedConversation.id]}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "flex-end",
              paddingHorizontal: 16,
            }}
            onContentSizeChange={scrollToBottom}
            inverted={false}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="flex-row items-center border-t border-gray-200 p-4">
              <TouchableOpacity
                className="mr-2"
                onPress={() => setIsAttachmentModalVisible(true)}
              >
                <Ionicons name="attach" size={24} color="#0286FF" />
              </TouchableOpacity>
              <TextInput
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 font-pmedium"
                placeholder="Nhập tin nhắn..."
                value={inputMessage}
                onChangeText={setInputMessage}
              />
              <TouchableOpacity onPress={() => sendMessage()}>
                <Ionicons name="send" size={24} color="#0286FF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
          <AttachmentModal />
          {longPressedMessage && (
            <Modal
              transparent
              visible={!!longPressedMessage}
              onRequestClose={() => setLongPressedMessage(null)}
            >
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                activeOpacity={1}
                onPress={() => setLongPressedMessage(null)}
              >
                <View className="bg-white rounded-lg p-4 m-4">
                  <TouchableOpacity
                    className="py-2"
                    onPress={() => {
                      Clipboard.setString(longPressedMessage.text);
                      setLongPressedMessage(null);
                    }}
                  >
                    <Text className="font-pmedium text-lg">Sao chép</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-2"
                    onPress={() => {
                      setMessages((prevMessages) => ({
                        ...prevMessages,
                        [selectedConversation.id]: prevMessages[
                          selectedConversation.id
                        ].filter((msg) => msg.id !== longPressedMessage.id),
                      }));
                      setLongPressedMessage(null);
                    }}
                  >
                    <Text className="font-pmedium text-lg text-red-500">
                      Xóa
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
          {showConversationOptions && (
            <Modal
              transparent
              visible={showConversationOptions}
              onRequestClose={() => setShowConversationOptions(false)}
            >
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
                activeOpacity={1}
                onPress={() => setShowConversationOptions(false)}
              >
                <View className="bg-white rounded-lg p-4 m-4">
                  <TouchableOpacity
                    className="py-2"
                    onPress={() => {
                      // Handle block user
                      setShowConversationOptions(false);
                    }}
                  >
                    <Text className="font-pmedium text-lg text-red-500">
                      Chặn người dùng
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-2"
                    onPress={() => {
                      // Handle report user
                      setShowConversationOptions(false);
                    }}
                  >
                    <Text className="font-pmedium text-lg">
                      Báo cáo người dùng
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default MessageScreen;

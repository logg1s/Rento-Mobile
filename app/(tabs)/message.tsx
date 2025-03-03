// Utility functions
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (date: Date): string => {
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const givenDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.floor(
    (today.getTime() - givenDate.getTime()) / (1000 * 60 * 60 * 24),
  );

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

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getFileIcon = (mimeType: string): string => {
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

const getStatusIcon = (status: string): string => {
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
("use client");

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Alert,
  ActivityIndicator,
  BackHandler,
  RefreshControl,
  ProgressBarAndroidComponent,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import {
  useGetChat,
  useSendChat,
  useMarkMessagesAsSeen,
} from "@/hooks/useChat";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { UserType } from "@/types/type";
import { getImagePath, getImageSource } from "@/utils/utils";
import { realtimeDatabase, useIsOnline } from "@/hooks/userOnlineHook";

const MessageScreen = () => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const { callDuration } = useLocalSearchParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);
  const [longPressedMessage, setLongPressedMessage] = useState(null);
  const [showConversationOptions, setShowConversationOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Added loading state
  const flatListRef = useRef(null);
  const user = useRentoData((state) => state.user);
  const markMessagesSeen = useMarkMessagesAsSeen();

  // Get real-time chat data using the useChat hook
  const { chatsData, isLoading, error, listOnline } = useGetChat();
  const sendChat = useSendChat();

  // Handle conversation selection and mark messages as seen
  const handleConversationSelect = useCallback(
    async (conversation) => {
      setSelectedConversation(conversation);

      if (user?.id) {
        try {
          await markMessagesSeen(conversation.id, user.id);
        } catch (error) {
          console.error("Error marking messages as seen:", error);
          // Don't show error to user as this is a background operation
        }
      }
    },
    [user?.id, markMessagesSeen],
  );
  useEffect(() => {
    const backAction = () => {
      setSelectedConversation(null);
      return true;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const [conversations, setConversations] = useState([]);
  useEffect(() => {
    if (conversations.length === 0) return;
    setConversations((prev: any) =>
      prev.map((conversation: any) => {
        return {
          ...conversation,
          isOnline: listOnline?.has(conversation?.otherUserId?.toString()),
        };
      }),
    );
  }, [listOnline]);

  const fetchConversations = async () => {
    if (chatsData.length === 0) return;
    const conversationsData = await Promise.all(
      chatsData
        .filter((chat) => {
          const roomIds = chat.roomId.split("-");
          const firstId = roomIds[1];
          const secondId = roomIds[2];
          const userId = user?.id.toString();
          return userId === firstId || userId === secondId;
        })
        .map(async (chat) => {
          const roomParts = chat.roomId.split("-");
          const id1 = Number.parseInt(roomParts[1]);
          const id2 = Number.parseInt(roomParts[2]);
          const otherUserId = user?.id === id1 ? id2 : id1;

          const response = await axiosFetch(`/users/${otherUserId}`, "get");
          const otherUserData = response?.data as UserType;
          const lastMsg =
            chat.messages.length > 0
              ? chat.messages[chat.messages.length - 1]
              : {
                  message: "No messages yet",
                  timestamp: Date.now().toString(),
                };

          const unreadCount = chat.messages.filter(
            (msg) => msg.author !== user?.id && !msg.seen,
          ).length;

          return {
            id: chat.roomId,
            name: otherUserData ? otherUserData.name : `User ${otherUserId}`,
            lastMessage: lastMsg.message,
            time: formatTime(new Date(Number.parseInt(lastMsg.timestamp))),
            unread: unreadCount,
            avatar: getImageSource(otherUserData),
            isOnline: listOnline?.has(otherUserId.toString()),
            otherUserId: otherUserId,
          };
        }),
    );
    setConversations(conversationsData);
  };
  useEffect(() => {
    if (selectedConversation !== null) {
      const newSelectedConversation = conversations?.find(
        (conversation) => conversation?.id === selectedConversation?.id,
      );
      if (newSelectedConversation)
        setSelectedConversation(newSelectedConversation);
    }
  }, [conversations]);
  useEffect(() => {
    if (!chatsData || !user?.id) {
      return;
    }

    fetchConversations();
  }, [chatsData, user?.id]);

  useEffect(() => {
    if (!selectedConversation || !user?.id) return;

    const markSeen = async () => {
      try {
        await markMessagesSeen(selectedConversation.id, user.id);
      } catch (error) {
        console.error("Error marking messages as seen:", error);
      }
    };

    markSeen();
  }, [selectedConversation, user?.id, markMessagesSeen]);

  // Memoize current chat messages
  const currentChatMessages = useMemo(() => {
    if (!selectedConversation || !chatsData) return [];

    const chatData = chatsData.find(
      (chat) => chat.roomId === selectedConversation.id,
    );
    return chatData?.messages || [];
  }, [selectedConversation, chatsData]);

  // Message sending handler
  const handleSendMessage = useCallback(
    async (text = inputMessage, messageType = "user", attachment = null) => {
      if ((!text.trim() && !attachment) || !selectedConversation || !user?.id)
        return;

      try {
        await sendChat({
          senderId: user.id,
          receiverId: selectedConversation.otherUserId,
          message: text,
        });

        setInputMessage("");
        setIsAttachmentModalVisible(false);

        // Scroll to bottom after sending
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      } catch (error) {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send message. Please try again.");
      }
    },
    [inputMessage, selectedConversation, user?.id, sendChat],
  );

  // Handle call duration updates
  useEffect(() => {
    if (!callDuration || !selectedConversation) return;

    const callDurationMsg = `Call ended (${formatDuration(Number.parseInt(callDuration))})`;
    handleSendMessage(callDurationMsg, "system");
  }, [callDuration, selectedConversation, handleSendMessage]);
  // Memoize rendering functions
  const renderConversation = useCallback(
    ({ item }) => (
      <TouchableOpacity
        className="flex-row items-center p-4 border-b border-gray-200"
        onPress={() => handleConversationSelect(item)}
      >
        <View className="relative">
          <Image source={item.avatar} className="w-12 h-12 rounded-full" />
          {item?.isOnline && (
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
    ),
    [handleConversationSelect],
  );

  const renderMessage = useCallback(
    ({ item, index }) => {
      if (!selectedConversation || !user?.id) return null;

      const currentMessageDate = new Date(Number.parseInt(item.timestamp));
      const previousMessageDate =
        index > 0
          ? new Date(Number.parseInt(currentChatMessages[index - 1].timestamp))
          : new Date(0);

      const showDateSeparator =
        index === 0 || !isSameDay(currentMessageDate, previousMessageDate);
      const isCurrentUser = item.author === user.id;

      return (
        <>
          {showDateSeparator && renderDateSeparator(currentMessageDate)}
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => setLongPressedMessage(item)}
          >
            <View
              className={`flex-row ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}
            >
              {!isCurrentUser && (
                <Image
                  source={selectedConversation.avatar}
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <View
                className={`rounded-2xl p-3 ${isCurrentUser ? "bg-primary-500" : "bg-gray-200"} ${item.image ? "p-1" : "p-3"}`}
              >
                {item.image ? (
                  <View>
                    {!imageError ? (
                      <TouchableOpacity
                        onPress={() => {
                          setCurrentImageUrl(
                            getImagePath(item?.image?.path) ?? "",
                          );
                          setShowFullImage(true);
                        }}
                      >
                        <Image
                          source={{
                            uri: getImagePath(item?.image?.path) ?? "",
                          }}
                          className="rounded-lg"
                          style={{
                            width: Math.min(280, item.image.width),
                            height: Math.min(
                              280 * (item.image.height / item.image.width),
                              400,
                            ),
                          }}
                          onError={() => setImageError(true)}
                        />
                      </TouchableOpacity>
                    ) : (
                      <View className="bg-gray-200 rounded-lg p-4 items-center justify-center">
                        <Ionicons name="image-outline" size={32} color="gray" />
                        <Text className="text-gray-500 mt-2">
                          Failed to load image
                        </Text>
                      </View>
                    )}
                    {item.message.trim() && (
                      <Text
                        className={`mt-2 font-pregular ${isCurrentUser ? "text-white" : "text-black"}`}
                      >
                        {item.message}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text
                    className={`font-pregular ${isCurrentUser ? "text-white" : "text-black"}`}
                  >
                    {item.message}
                  </Text>
                )}
                <View className="flex-row items-center justify-end mt-1">
                  <Text
                    className={`text-xs mr-1 font-pregular ${isCurrentUser ? "text-white" : "text-gray-500"}`}
                  >
                    {formatTime(currentMessageDate)}
                  </Text>
                  {isCurrentUser && (
                    <Ionicons
                      name={getStatusIcon(item.seen ? "seen" : "delivered")}
                      size={16}
                      color={isCurrentUser ? "white" : "gray"}
                    />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </>
      );
    },
    [selectedConversation, user?.id, currentChatMessages],
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

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };
  const uploadImage = useRentoData((state) => state.uploadImage);

  const processAndSendImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setIsUploading(true);
    try {
      const imagePath = await uploadImage(asset.uri);
      await sendChat({
        senderId: user.id,
        receiverId: selectedConversation.otherUserId,
        message: "",
        image: {
          path: imagePath,
          width: asset.width,
          height: asset.height,
        },
      });

      setIsAttachmentModalVisible(false);
    } catch (error) {
      console.error("Error sending image:", error);
      Alert.alert(
        "Error",
        error.message === "Image size too large"
          ? "Image is too large. Please choose a smaller image or take a new photo with lower quality."
          : "Failed to send image. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleImagePicker = async (useCamera = false) => {
    let result;
    try {
      if (useCamera) {
        const permissionResult =
          await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            "Permission Required",
            "You need to grant camera permission",
          );
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5, // Reduce quality to decrease file size
          allowsEditing: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5, // Reduce quality to decrease file size
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        //
        // // Check file size before processing
        // const response = await fetch(asset.uri);
        // const blob = await response.blob();
        // const fileSize = blob.size;
        //
        // // If file is larger than 5MB, warn user
        // if (fileSize > 5 * 1024 * 1024) {
        //   Alert.alert(
        //     "Large Image",
        //     "This image is quite large and may take longer to send. Would you like to continue?",
        //     [
        //       {
        //         text: "Cancel",
        //         style: "cancel",
        //       },
        //       {
        //         text: "Continue",
        //         onPress: async () => {
        //           await processAndSendImage(asset);
        //         },
        //       },
        //     ],
        //   );
        //   return;
        // }
        //
        await processAndSendImage(asset);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to pick image. Please try again.",
      );
    }
  };
  const ShowFullImageModal = () => (
    <Modal
      visible={showFullImage}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShowFullImage(false);
        setCurrentImageUrl("");
      }}
    >
      <View className="flex-1 bg-black">
        <TouchableOpacity
          onPress={() => {
            setShowFullImage(false);
            setCurrentImageUrl("");
          }}
          className="absolute right-4 top-4 z-10 rounded-full bg-white"
        >
          <Ionicons name="close" size={30} color="black" />
        </TouchableOpacity>
        <View className="flex-1 justify-center">
          {currentImageUrl ? (
            <Image
              source={{ uri: currentImageUrl }}
              style={{
                width: "100%",
                height: "100%",
              }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
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
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchConversations}
              />
            }
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center p-10">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={60}
                  color="gray"
                />
                <Text className="text-gray-500 text-center mt-4 font-pmedium">
                  Không có cuộc trò chuyện nào. Bắt đầu trò chuyện với nhà cung
                  cấp dịch vụ!
                </Text>
              </View>
            )}
          />
        </>
      ) : (
        <>
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setSelectedConversation(null)}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Image
              source={selectedConversation.avatar}
              className="w-10 h-10 rounded-full ml-4"
            />
            <View className="ml-3 flex-1">
              <Text className="font-pbold text-lg">
                {selectedConversation?.name ?? ""}
              </Text>
              {selectedConversation?.isOnline && (
                <Text className="text-green-500 font-pregular">
                  Đang hoạt động
                </Text>
              )}
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

          {/* Messages list */}
          {selectedConversation && (
            <FlatList
              ref={flatListRef}
              data={currentChatMessages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => `${item.timestamp}-${index}`}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "flex-end",
                paddingHorizontal: 16,
              }}
              onContentSizeChange={scrollToBottom}
              inverted={false}
              ListEmptyComponent={() => (
                <View className="flex-1 justify-center items-center p-10">
                  <Text className="text-gray-500 text-center font-pmedium">
                    Không có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
                  </Text>
                </View>
              )}
            />
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View className="flex-row items-center border-t border-gray-200 p-4">
              <TouchableOpacity
                className="mr-2"
                onPress={() => setIsAttachmentModalVisible(true)}
                disabled={isUploading}
              >
                <AntDesign name="picture" size={24} color="gray" />
              </TouchableOpacity>
              <TextInput
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 font-pmedium"
                placeholder="Nhập tin nhắn..."
                value={inputMessage}
                onChangeText={setInputMessage}
                editable={!isUploading}
              />
              <TouchableOpacity
                onPress={() => handleSendMessage()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#0286FF" />
                ) : (
                  <Ionicons name="send" size={24} color="#0286FF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
          <ShowFullImageModal />
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
                      // Copy message text to clipboard
                      Alert.alert(
                        "Feature in Development",
                        "Copy functionality will be available soon!",
                      );
                      setLongPressedMessage(null);
                    }}
                  >
                    <Text className="font-pmedium text-lg">Sao chép</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="py-2"
                    onPress={() => {
                      // Delete message functionality
                      Alert.alert(
                        "Feature in Development",
                        "Message deletion will be available soon!",
                      );
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
                      Alert.alert(
                        "Feature in Development",
                        "User blocking will be available soon!",
                      );
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
                      Alert.alert(
                        "Feature in Development",
                        "User reporting will be available soon!",
                      );
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

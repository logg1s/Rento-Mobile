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
    date.getDate()
  );

  const diffDays = Math.floor(
    (today.getTime() - givenDate.getTime()) / (1000 * 60 * 60 * 24)
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

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  useGetChat,
  useSendChat,
  useMarkMessagesAsSeen,
  getRoomId,
  useReportMessage,
  useReportUser,
  useBlockUser,
  useRetractMessage,
} from "@/hooks/useChat";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { UserType } from "@/types/type";
import {
  getImagePath,
  getImageSource,
  normalizeVietnamese,
  searchFilter,
} from "@/utils/utils";
import {
  realtimeDatabase,
  useIsOnline,
  useStatusOnline,
} from "@/hooks/userOnlineHook";
import { debounce } from "lodash";
import useChatStore from "@/stores/chatStore";
import * as Clipboard from "expo-clipboard";

const MessageScreen = () => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [filterMesasgeInput, setFilterMessageInput] = useState("");
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const { callDuration } = useLocalSearchParams();
  const { chatWithId } = useLocalSearchParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] =
    useState(false);
  const [longPressedMessage, setLongPressedMessage] = useState(null);
  const [showConversationOptions, setShowConversationOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const user = useRentoData((state) => state.user);
  const markMessagesSeen = useMarkMessagesAsSeen();

  const { chatsData, isLoading, error, listOnline } = useGetChat();
  const sendChat = useSendChat();
  const reportMessageHook = useReportMessage();
  const reportUserHook = useReportUser();
  const blockUserHook = useBlockUser();
  const retractMessageHook = useRetractMessage();

  useEffect(() => {
    const chatWithUser = async () => {
      const responseInfo = await axiosFetch(`/users/${chatWithId}`, "get");
      const otherUserData = responseInfo?.data as UserType;
      useChatStore.getState().setCurrentChatId(chatWithId as string);
      setSelectedConversation({
        id: getRoomId(user?.id, chatWithId),
        name: otherUserData ? otherUserData.name : `User ${chatWithId}`,
        lastMessage: "",
        time: "",
        unread: 0,
        avatar: getImageSource(otherUserData),
        isOnline: listOnline?.has(chatWithId.toString()),
        otherUserId: chatWithId.toString(),
      });
    };
    if (chatWithId && user?.id) {
      chatWithUser();
    }
  }, [chatWithId]);
  const updateStatus = useStatusOnline;
  const changeStatus = debounce(updateStatus, 1000);
  const currentChatId = useChatStore((state) => state.currentChatId);
  useFocusEffect(
    useCallback(() => {
      if (selectedConversation) {
        changeStatus(user.id, true);
      } else {
        changeStatus(user?.id, false);
        useChatStore.getState().setCurrentChatId(null);
      }
      return () => {
        changeStatus(user?.id, false);
      };
    }, [currentChatId, user])
  );

  const handleConversationSelect = useCallback(
    async (conversation) => {
      useChatStore
        .getState()
        .setCurrentChatId(conversation?.otherUserId as string);
      setSelectedConversation(conversation);

      if (user?.id) {
        try {
          await markMessagesSeen(conversation.id, user.id);
        } catch (error) {
          console.error("Error marking messages as seen:", error);
        }
      }
    },
    [user?.id, markMessagesSeen]
  );
  useFocusEffect(
    useCallback(() => {
      const backAction = () => {
        if (selectedConversation) {
          setSelectedConversation(null);
          useChatStore.getState().setCurrentChatId(null);
          router.setParams({
            chatWithId: "",
          });
        } else {
          router.back();
        }
        return true;
      };
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => backHandler.remove();
    }, [selectedConversation])
  );

  const [conversations, setConversations] = useState([]);
  useEffect(() => {
    if (conversations.length === 0) return;

    setConversations((prev: any) => {
      return prev.map((conversation: any) => {
        const newIsOnline = listOnline?.has(
          conversation?.otherUserId?.toString()
        );
        if (conversation.isOnline === newIsOnline) {
          return conversation;
        }
        return {
          ...conversation,
          isOnline: newIsOnline,
        };
      });
    });
  }, [listOnline]);

  useEffect(() => {
    if (selectedConversation !== null) {
      const newSelectedConversation = conversations?.find(
        (conversation) => conversation?.id === selectedConversation?.id
      );
      if (newSelectedConversation) {
        const hasChanges = Object.keys(newSelectedConversation).some(
          (key) => newSelectedConversation[key] !== selectedConversation[key]
        );

        if (hasChanges) {
          setSelectedConversation((prevState) => ({
            ...prevState,
            ...newSelectedConversation,
          }));
        }
      }

      useChatStore
        .getState()
        .setCurrentChatId(newSelectedConversation?.otherUserId as string);
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

  const debouncedShowScrollButton = useCallback(
    debounce((shouldShow) => {
      setShowScrollToBottom(shouldShow);
    }, 300),
    []
  );

  const messages = useMemo(() => {
    if (!selectedConversation || !chatsData) return [];

    const chatData = chatsData.find(
      (chat) => chat.roomId === selectedConversation.id
    );

    if (chatData?.messages?.length > 0) {
      const lastMessage = chatData.messages[chatData.messages.length - 1];
      const isMyMessage = lastMessage.author === user?.id;

      if (!isMyMessage) {
        if (userScrolled) {
          debouncedShowScrollButton(true);
        } else if (flatListRef.current) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    }

    return chatData?.messages || [];
  }, [
    selectedConversation,
    chatsData,
    userScrolled,
    debouncedShowScrollButton,
    user?.id,
  ]);

  const handleSendMessage = useCallback(
    async (text = inputMessage, type = "text") => {
      if ((text.trim() === "" && type !== "system") || isUploading) return;

      try {
        setInputMessage("");

        await sendChat({
          senderId: user.id,
          receiverId: selectedConversation.otherUserId,
          message: text,
        });

        if (flatListRef.current) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [inputMessage, isUploading, user?.id, selectedConversation]
  );

  useEffect(() => {
    if (!callDuration || !selectedConversation) return;

    const callDurationMsg = `Call ended (${formatDuration(Number.parseInt(callDuration))})`;
    handleSendMessage(callDurationMsg, "system");
  }, [callDuration, selectedConversation, handleSendMessage]);
  const renderConversation = useCallback(
    ({ item }) =>
      normalizeVietnamese((item?.name as string) || "")?.includes(
        normalizeVietnamese(filterMesasgeInput?.trim()?.toLowerCase() || "")
      ) ? (
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
                className={`font-pregular text-gray-600 text-sm ${item.lastMessage === "Tin nhắn đã bị thu hồi" ? "italic" : ""}`}
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
      ) : null,
    [handleConversationSelect, filterMesasgeInput]
  );

  const renderMessage = useCallback(
    ({ item, index }) => {
      if (!selectedConversation || !user?.id) return null;

      const currentMessageDate = new Date(Number.parseInt(item.timestamp));
      const previousMessageDate =
        index > 0
          ? new Date(Number.parseInt(messages[index - 1].timestamp))
          : new Date(0);

      const showDateSeparator =
        index === 0 || !isSameDay(currentMessageDate, previousMessageDate);
      const isCurrentUser = item.author === user.id;
      const isRetracted = item.retracted === true;

      return (
        <React.Fragment key={`msg-${item.id}`}>
          {showDateSeparator && renderDateSeparator(currentMessageDate)}
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => !isRetracted && setLongPressedMessage(item)}
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
                className={`rounded-2xl p-3 ${isCurrentUser ? "bg-primary-500" : "bg-gray-200"} ${
                  item.image && !item.image.retracted ? "p-1" : "p-3"
                }`}
              >
                {item.image ? (
                  <View>
                    {item.image.retracted ? (
                      <View className="flex-row items-center justify-center p-4">
                        <Ionicons
                          name="image-outline"
                          size={24}
                          color={isCurrentUser ? "white" : "gray"}
                        />
                        <Text
                          className={`ml-2 font-pregular italic ${isCurrentUser ? "text-white" : "text-gray-500"}`}
                        >
                          Hình ảnh đã bị thu hồi
                        </Text>
                      </View>
                    ) : !imageError ? (
                      <TouchableOpacity
                        onPress={() => {
                          setCurrentImageUrl(
                            getImagePath(item?.image?.path) ?? ""
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
                              400
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
                        className={`mt-2 font-pregular ${isRetracted ? "italic" : ""} ${
                          isCurrentUser ? "text-white" : "text-black"
                        }`}
                      >
                        {item.message}
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text
                    className={`font-pregular ${isRetracted ? "italic" : ""} ${
                      isCurrentUser ? "text-white" : "text-black"
                    }`}
                  >
                    {item.message}
                  </Text>
                )}
                <View className="flex-row items-center justify-end mt-1">
                  <Text
                    className={`text-xs mr-1 font-pregular ${
                      isCurrentUser ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {formatTime(currentMessageDate)}
                  </Text>
                  {isCurrentUser && !isRetracted && (
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
        </React.Fragment>
      );
    },
    [selectedConversation, user?.id, messages]
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
  const handleFilterSearch = (searchContent: string) => {
    setFilterMessageInput(searchContent);
  };

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
      debouncedShowScrollButton(false);
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
          : "Failed to send image. Please try again."
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
            "You need to grant camera permission"
          );
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          allowsEditing: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        await processAndSendImage(asset);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to pick image. Please try again."
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
  const retryCount = useRef(0);
  const fetchUser = async (otherUserId: number) => {
    try {
      const response = await axiosFetch(`/users/${otherUserId}`, "get");
      if (response?.data) {
        retryCount.current = 0;
        return response.data as UserType;
      }
      throw new Error("No data");
    } catch (error) {
      console.error("Error fetching user:", error);
      if (retryCount.current < 10) {
        retryCount.current++;
        return await fetchUser(otherUserId);
      }
      return null;
    }
  };
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

          let otherUserData;
          try {
            retryCount.current = 0;
            otherUserData = await fetchUser(otherUserId);
          } catch (error) {
            console.error("Error fetching conversation:", error);
            if (retryCount.current < 10) {
              retryCount.current++;
              fetchConversations();
            }
          }
          const lastMsg =
            chat.messages.length > 0
              ? chat.messages[chat.messages.length - 1]
              : {
                  message: "No messages yet",
                  timestamp: Date.now().toString(),
                };

          const unreadCount = chat.messages.filter(
            (msg) => msg.author !== user?.id && !msg.seen
          ).length;

          return {
            id: chat.roomId,
            name: otherUserData ? otherUserData.name : `User ${otherUserId}`,
            lastMessage: chat.lastMessage,
            time: formatTime(new Date(Number.parseInt(lastMsg.timestamp))),
            unread: unreadCount,
            avatar: getImageSource(otherUserData),
            isOnline: listOnline?.has(otherUserId.toString()),
            otherUserId: otherUserId,
          };
        })
    );
    setConversations(conversationsData);
  };

  const reportMessage = async (message) => {
    try {
      if (!message?.id || !user?.id || !message?.author) {
        Alert.alert("Lỗi", "Thiếu thông tin tin nhắn hoặc người dùng.");
        return;
      }

      await reportMessageHook({
        messageId: message.id,
        reporterId: user.id,
        reason: "Nội dung không phù hợp",
        reportedUserId: message.author,
      });
      Alert.alert(
        "Thành công",
        "Báo cáo tin nhắn đã được gửi. Chúng tôi sẽ xem xét nội dung này."
      );
    } catch (error: any) {
      console.error(
        "Error reporting message:",
        error?.response?.data || error?.message || error
      );
      Alert.alert("Lỗi", "Không thể báo cáo tin nhắn. Vui lòng thử lại sau.");
    }
  };

  const reportUser = async (userId) => {
    try {
      if (!userId || !user?.id) {
        Alert.alert("Lỗi", "Thiếu thông tin người dùng.");
        return;
      }

      await reportUserHook({
        reporterId: user.id,
        reason: "Người dùng có hành vi không phù hợp",
        reportedUserId: userId,
      });
      Alert.alert(
        "Thành công",
        "Báo cáo người dùng đã được gửi. Chúng tôi sẽ xem xét nội dung này."
      );
    } catch (error: any) {
      console.error(
        "Error reporting user:",
        error?.response?.data || error?.message || error
      );
      Alert.alert("Lỗi", "Không thể báo cáo người dùng. Vui lòng thử lại sau.");
    }
  };

  const retractMessage = async (message) => {
    try {
      await retractMessageHook(message);
      Alert.alert("Thành công", "Tin nhắn đã được thu hồi.");
    } catch (error) {
      console.error("Error retracting message:", error);
      Alert.alert("Lỗi", "Không thể thu hồi tin nhắn. Vui lòng thử lại sau.");
    }
  };

  useEffect(() => {
    const keyboardDidShowListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillShow", () => {})
        : Keyboard.addListener("keyboardDidShow", () => {});

    const keyboardDidHideListener =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => {
            if (userScrolled) {
              debouncedShowScrollButton(true);
            } else if (flatListRef.current && !userScrolled) {
              requestAnimationFrame(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              });
            }
          })
        : Keyboard.addListener("keyboardDidHide", () => {
            if (userScrolled) {
              debouncedShowScrollButton(true);
            } else if (flatListRef.current && !userScrolled) {
              requestAnimationFrame(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              });
            }
          });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [userScrolled, debouncedShowScrollButton]);

  useEffect(() => {
    if (
      selectedConversation &&
      messages.length > 0 &&
      flatListRef.current &&
      isFirstLoad
    ) {
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
            setIsFirstLoad(false);
          }
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    selectedConversation,
    messages.length,
    isFirstLoad,
    debouncedShowScrollButton,
  ]);

  useEffect(() => {
    setIsFirstLoad(true);
    setUserScrolled(false);
    setShowScrollToBottom(false);
  }, [selectedConversation?.id]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {!selectedConversation ? (
        <React.Fragment key="conversation-list">
          <View className="p-4 border-b border-gray-200">
            <Text className="font-pbold text-2xl">Tin nhắn</Text>
          </View>
          <View className="p-4">
            <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <Ionicons name="search" size={20} color="gray" />
              <TextInput
                placeholder="Tìm kiếm người dùng"
                className="ml-2 flex-1 font-pmedium"
                value={filterMesasgeInput}
                onChangeText={(e) => handleFilterSearch(e)}
              />
              {filterMesasgeInput.trim().length > 0 && (
                <TouchableOpacity onPress={() => setFilterMessageInput("")}>
                  <Ionicons name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item, index) => index.toString()}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={fetchConversations}
              />
            }
            ListEmptyComponent={() => (
              <React.Fragment key="empty-list">
                <View className="flex-1 justify-center items-center p-10">
                  <Text className="text-gray-500 text-center font-pmedium">
                    Chưa có cuộc trò chuyện nào
                  </Text>
                </View>
              </React.Fragment>
            )}
          />
        </React.Fragment>
      ) : (
        <React.Fragment key="chat-detail">
          <View className="flex-row items-center p-4 border-b border-gray-200">
            <TouchableOpacity
              onPress={() => {
                setSelectedConversation(null);
                useChatStore.getState().setCurrentChatId(null);
              }}
            >
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
            {/* <TouchableOpacity
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
            </TouchableOpacity> */}
            <TouchableOpacity onPress={() => setShowConversationOptions(true)}>
              <Ionicons name="ellipsis-vertical" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Messages list */}
          {selectedConversation && (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderMessage}
              removeClippedSubviews={true}
              maxToRenderPerBatch={15}
              windowSize={10}
              initialNumToRender={15}
              onContentSizeChange={() => {
                if (!userScrolled) {
                  requestAnimationFrame(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  });
                }
              }}
              onLayout={() => {
                if (!userScrolled || isFirstLoad) {
                  requestAnimationFrame(() => {
                    flatListRef.current?.scrollToEnd({
                      animated: !isFirstLoad,
                    });
                  });
                }
              }}
              onScroll={(event) => {
                const currentScrollPosition = event.nativeEvent.contentOffset.y;
                const contentHeight = event.nativeEvent.contentSize.height;
                const scrollViewHeight =
                  event.nativeEvent.layoutMeasurement.height;

                const distanceFromBottom =
                  contentHeight - currentScrollPosition - scrollViewHeight;

                if (distanceFromBottom > 20) {
                  setUserScrolled(true);

                  if (distanceFromBottom > 150) {
                    debouncedShowScrollButton(true);
                  } else {
                    debouncedShowScrollButton(false);
                  }
                } else if (distanceFromBottom <= 5) {
                  setUserScrolled(false);
                  debouncedShowScrollButton(false);
                }
              }}
              onScrollBeginDrag={() => setUserScrolled(true)}
              scrollEventThrottle={16}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10,
              }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16 }}
              ListEmptyComponent={
                <React.Fragment key="empty-messages">
                  <View className="flex-1 justify-center items-center py-12">
                    <Text className="text-gray-500 font-pmedium text-base">
                      Không có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
                    </Text>
                  </View>
                </React.Fragment>
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          )}

          {showScrollToBottom && (
            <TouchableOpacity
              onPress={scrollToBottom}
              className="absolute bottom-20 items-center justify-center shadow-lg"
              style={{
                elevation: 5,
                backgroundColor: "#FF5A5F",
                width: 48,
                height: 48,
                borderRadius: 24,
                left: "50%",
                marginLeft: -24,
              }}
            >
              <Ionicons name="arrow-down" size={24} color="white" />
            </TouchableOpacity>
          )}

          <View style={{ width: "100%" }}>
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
          </View>
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
                <View className="bg-white rounded-t-xl p-4 absolute bottom-0 left-0 right-0">
                  <Text className="text-center font-pbold text-lg text-gray-600 mb-4 border-b border-gray-200 pb-2">
                    Tùy chọn tin nhắn
                  </Text>
                  {longPressedMessage.author === user?.id ? (
                    <React.Fragment key="own-message-options">
                      <TouchableOpacity
                        className="py-3 border-b border-gray-100"
                        onPress={async () => {
                          if (
                            longPressedMessage.image &&
                            !longPressedMessage.image.retracted
                          ) {
                            const imageUrl = getImagePath(
                              longPressedMessage.image.path
                            );
                            if (imageUrl) {
                              await Clipboard.setStringAsync(imageUrl);
                              Alert.alert(
                                "Thông báo",
                                "Đã sao chép đường dẫn hình ảnh"
                              );
                            }
                          } else if (longPressedMessage.message) {
                            await Clipboard.setStringAsync(
                              longPressedMessage.message
                            );
                            Alert.alert("Thông báo", "Đã sao chép tin nhắn");
                          }
                          setLongPressedMessage(null);
                        }}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="copy-outline"
                            size={24}
                            color="#0286FF"
                          />
                          <Text className="font-pmedium text-lg ml-3">
                            Sao chép
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="py-3"
                        onPress={() => {
                          Alert.alert(
                            "Xác nhận",
                            "Bạn có chắc muốn thu hồi tin nhắn này?",
                            [
                              {
                                text: "Hủy",
                                style: "cancel",
                              },
                              {
                                text: "Thu hồi",
                                style: "destructive",
                                onPress: () => {
                                  retractMessage(longPressedMessage);
                                  setLongPressedMessage(null);
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="trash-outline"
                            size={24}
                            color="#FF3B30"
                          />
                          <Text className="font-pmedium text-lg ml-3 text-red-500">
                            Thu hồi
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key="others-message-options">
                      <TouchableOpacity
                        className="py-3 border-b border-gray-100"
                        onPress={async () => {
                          if (
                            longPressedMessage.image &&
                            !longPressedMessage.image.retracted
                          ) {
                            const imageUrl = getImagePath(
                              longPressedMessage.image.path
                            );
                            if (imageUrl) {
                              await Clipboard.setStringAsync(imageUrl);
                              Alert.alert(
                                "Thông báo",
                                "Đã sao chép đường dẫn hình ảnh"
                              );
                            }
                          } else if (longPressedMessage.message) {
                            await Clipboard.setStringAsync(
                              longPressedMessage.message
                            );
                            Alert.alert("Thông báo", "Đã sao chép tin nhắn");
                          }
                          setLongPressedMessage(null);
                        }}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="copy-outline"
                            size={24}
                            color="#0286FF"
                          />
                          <Text className="font-pmedium text-lg ml-3">
                            Sao chép
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="py-3"
                        onPress={() => {
                          Alert.alert(
                            "Báo cáo tin nhắn",
                            "Hãy cho chúng tôi biết vấn đề với tin nhắn này",
                            [
                              {
                                text: "Hủy",
                                style: "cancel",
                              },
                              {
                                text: "Báo cáo",
                                style: "destructive",
                                onPress: () => {
                                  reportMessage(longPressedMessage);
                                  setLongPressedMessage(null);
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name="flag-outline"
                            size={24}
                            color="#FF3B30"
                          />
                          <Text className="font-pmedium text-lg ml-3 text-red-500">
                            Báo cáo tin nhắn
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  )}
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
                <View className="bg-white rounded-t-xl p-4 absolute bottom-0 left-0 right-0">
                  <Text className="text-center font-pbold text-lg text-gray-600 mb-4 border-b border-gray-200 pb-2">
                    Tùy chọn
                  </Text>

                  <TouchableOpacity
                    className="py-3"
                    onPress={() => {
                      Alert.alert(
                        "Báo cáo người dùng",
                        "Hãy cho chúng tôi biết vấn đề với người dùng này",
                        [
                          {
                            text: "Hủy",
                            style: "cancel",
                          },
                          {
                            text: "Báo cáo",
                            style: "destructive",
                            onPress: () => {
                              reportUser(selectedConversation?.otherUserId);
                              setShowConversationOptions(false);
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="flag-outline" size={24} color="#FF3B30" />
                      <Text className="font-pmedium text-lg ml-3 text-red-500">
                        Báo cáo người dùng
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </React.Fragment>
      )}
    </SafeAreaView>
  );
};

export default MessageScreen;

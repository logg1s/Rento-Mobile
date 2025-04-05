"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";
import useRentoData from "@/stores/dataStore";
import { NotificationType } from "@/types/type";
import { axiosFetch } from "@/stores/dataStore";
import { PaginationType } from "@/types/pagination";
import { router } from "expo-router";

const NotificationScreen = () => {
  const markNotificationAsRead = useRentoData(
    (state) => state.markNotificationAsRead
  );
  const markAllNotificationsAsRead = useRentoData(
    (state) => state.markAllNotificationsAsRead
  );
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const retryCount = useRef(0);
  const nextCursor = useRef<string | null>(null);

  const fetchNotificationsWithRetry = async () => {
    try {
      setRefreshing(true);
      let url = "/notifications";
      if (nextCursor.current) {
        url += `?cursor=${nextCursor.current}`;
      }
      const response = await axiosFetch(url, "get");
      const paginateData: PaginationType<NotificationType> = response?.data;
      const notificationData = paginateData?.data || [];
      if (notificationData?.length > 0) {
        nextCursor.current = paginateData?.next_cursor || null;
        retryCount.current = 0;
        setNotifications((prev) => [...prev, ...notificationData]);
      } else if (retryCount.current < 10) {
        retryCount.current++;
        fetchNotificationsWithRetry();
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error?.response?.data);
      if (retryCount.current < 10) {
        retryCount.current++;
        fetchNotificationsWithRetry();
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    retryCount.current = 0;
    fetchNotificationsWithRetry();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    retryCount.current = 0;
    setNotifications([]);
    await fetchNotificationsWithRetry();
    setRefreshing(false);
  };

  const deleteNotification = async (id: number) => {
    try {
      await axiosFetch(`/notifications/${id}`, "delete");
      fetchNotificationsWithRetry();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleDataNotification = (data: { type: string; id?: string }) => {
    switch (data.type) {
      case "message":
        if (data?.id) {
          router.push({
            pathname: "/(tabs)/message",
            params: {
              chatWithId: data.id,
            },
          });
        }
        break;
      case "order":
        router.push({
          pathname: "/profile/order-history",
        });
        break;
      default:
        Alert.alert(
          "Thông báo không hợp lệ",
          "Lỗi thông báo! Vui lòng thử lại sau!"
        );
    }
  };

  const handleNotificationPress = async (item: NotificationType) => {
    if (!item.is_read) {
      setNotifications((prev) => {
        const notificationIndex = prev.findIndex((it) => it.id === item.id);
        if (notificationIndex !== -1) {
          prev[notificationIndex] = {
            ...prev[notificationIndex],
            is_read: true,
          };
        }
        return [...prev];
      });
      await markNotificationAsRead(item.id);
    }
    const data = JSON.parse(item.data);
    handleDataNotification(data);
  };

  const renderRightActions = (id: number) => {
    return (
      <TouchableOpacity
        className="bg-red-500 justify-center items-center w-20"
        onPress={() => deleteNotification(id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const renderNotificationItem = ({ item }: { item: NotificationType }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity
        className={`flex-row items-center p-4 border-b border-gray-200 ${item.is_read ? "bg-white" : "bg-blue-50"}`}
        onPress={() => handleNotificationPress(item)}
      >
        <View className="w-12 h-12 rounded-full bg-primary-100 justify-center items-center mr-4">
          <Ionicons name="notifications" size={24} color="#0286FF" />
        </View>
        <View className="flex-1">
          <Text className="font-pbold text-lg">{item.title}</Text>
          <Text className="font-pregular text-gray-600 mt-1" numberOfLines={2}>
            {item.body}
          </Text>
          <Text className="font-pregular text-gray-400 text-sm mt-1">
            {new Date(item.created_at).toLocaleString("vi-VN")}
          </Text>
        </View>
        {!item.is_read && (
          <View className="w-3 h-3 rounded-full bg-primary-500 ml-2" />
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
        <Text className="font-pbold text-2xl">Thông báo</Text>
        {notifications.some((notif) => !notif.is_read) && (
          <TouchableOpacity
            onPress={() => {
              setNotifications((prev) =>
                prev.map((item) => ({ ...item, is_read: true }))
              );
              markAllNotificationsAsRead();
            }}
            className="bg-primary-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-pmedium">
              Đánh dấu tất cả đã đọc
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="notifications-off" size={48} color="gray" />
            <Text className="font-pmedium text-gray-500 mt-4">
              Không có thông báo nào
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default NotificationScreen;

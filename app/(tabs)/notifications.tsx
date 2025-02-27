"use client";

import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Swipeable } from "react-native-gesture-handler";

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Đơn hàng mới",
      message: "Bạn có một đơn hàng mới từ khách hàng Nguyễn Văn A",
      time: "10 phút trước",
      read: false,
    },
    {
      id: "2",
      title: "Nhắc nhở lịch hẹn",
      message:
        "Bạn có lịch hẹn với khách hàng Trần Thị B vào lúc 15:00 hôm nay",
      time: "1 giờ trước",
      read: true,
    },
    {
      id: "3",
      title: "Đánh giá mới",
      message: "Khách hàng Lê Văn C đã đánh giá dịch vụ của bạn",
      time: "2 giờ trước",
      read: false,
    },
    {
      id: "4",
      title: "Cập nhật ứng dụng",
      message:
        "Đã có phiên bản mới của ứng dụng. Vui lòng cập nhật để có trải nghiệm tốt nhất",
      time: "1 ngày trước",
      read: true,
    },
  ]);

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id));
  };

  const renderRightActions = (id) => {
    return (
      <TouchableOpacity
        className="bg-red-500 justify-center items-center w-20"
        onPress={() => deleteNotification(id)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  };

  const renderNotificationItem = ({ item }) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity
        className={`flex-row items-center p-4 border-b border-gray-200 ${item.read ? "bg-white" : "bg-blue-50"}`}
        onPress={() => {
          setNotifications(
            notifications.map((notif) =>
              notif.id === item.id ? { ...notif, read: true } : notif,
            ),
          );
        }}
      >
        <View className="w-12 h-12 rounded-full bg-primary-100 justify-center items-center mr-4">
          <Ionicons name="notifications" size={24} color="#0286FF" />
        </View>
        <View className="flex-1">
          <Text className="font-pbold text-lg">{item.title}</Text>
          <Text className="font-pregular text-gray-600 mt-1" numberOfLines={2}>
            {item.message}
          </Text>
          <Text className="font-pregular text-gray-400 text-sm mt-1">
            {item.time}
          </Text>
        </View>
        {!item.read && (
          <View className="w-3 h-3 rounded-full bg-primary-500 ml-2" />
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <Text className="font-pbold text-2xl text-center">Thông báo</Text>
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
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

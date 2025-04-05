import { View, Text } from "react-native";
import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useRentoData from "@/stores/dataStore";
const TabProvider = () => {
  const fetchUnReadNotifications = useRentoData(
    (state) => state.fetchUnReadNotifications
  );
  const unReadNotifications = useRentoData(
    (state) => state.unReadNotifications
  );
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnReadNotifications();
    }, 1000 * 10); // 10 seconds
    return () => clearInterval(interval);
  }, []);
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="services"
        options={{
          title: "Dịch vụ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Đơn dịch vụ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Tin nhắn",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Thống kê",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarLabel: "Thông báo",
          tabBarIcon: ({ color, size }) => (
            <View className="relative">
              <Ionicons
                name="notifications-outline"
                size={size}
                color={color}
              />
              {unReadNotifications > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  <Text className="text-xs text-white font-psemibold">
                    {unReadNotifications > 99 ? "99+" : unReadNotifications}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabProvider;

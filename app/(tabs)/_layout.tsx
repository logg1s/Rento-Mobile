import { Tabs, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useRentoData from "@/stores/dataStore";
import { useEffect } from "react";
import { useStatusOnline } from "@/hooks/userOnlineHook";
import { useNotification } from "@/hooks/notificationHook";
import { View, Text } from "react-native";

const TabLayout = () => {
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
  useNotification();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#0286FF",
        tabBarInactiveTintColor: "gray",
        tabBarLabelStyle: {
          fontFamily: "Poppins_500Medium",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Trang chủ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarLabel: "Tìm kiếm",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="message"
        options={{
          tabBarLabel: "Tin nhắn",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
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
          tabBarLabel: "Tài khoản",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;

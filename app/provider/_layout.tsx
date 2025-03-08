import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const ProviderLayout = () => {
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
        name="dashboard"
        options={{
          tabBarLabel: "Tổng quan",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          tabBarLabel: "Dịch vụ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: "Đơn hàng",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: "Chat",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: "Thống kê",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default ProviderLayout;

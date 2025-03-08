import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { OrderCard } from "@/components/OrderCard";

const OrdersScreen = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [orders, setOrders] = useState([]); // TODO: Replace with actual orders data

  const tabs = [
    { id: "all", label: "Tất cả" },
    { id: "pending", label: "Chờ xử lý" },
    { id: "in_progress", label: "Đang thực hiện" },
    { id: "completed", label: "Hoàn thành" },
    { id: "cancelled", label: "Đã hủy" },
  ];

  const onRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Fetch latest orders
    setIsRefreshing(false);
  };

  const handleOrderUpdate = async (orderId: number, status: string) => {
    try {
      // TODO: Update order status
      onRefresh();
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const filteredOrders = orders.filter(
    (order) => selectedTab === "all" || order.status === selectedTab
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white p-4">
        <Text className="text-2xl font-pbold">Quản lý đơn hàng</Text>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-gray-200"
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedTab(tab.id)}
              className={`px-4 py-3 border-b-2 ${
                selectedTab === tab.id
                  ? "border-primary-500"
                  : "border-transparent"
              }`}
            >
              <Text
                className={`font-pmedium ${
                  selectedTab === tab.id ? "text-primary-500" : "text-gray-600"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Order List */}
      <FlatList
        data={filteredOrders}
        renderItem={({ item }) => (
          <OrderCard order={item} onOrderUpdate={handleOrderUpdate} />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="receipt-outline" size={48} color="gray" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              Không có đơn hàng nào
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;

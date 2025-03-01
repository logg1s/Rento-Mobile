import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { OrderCard } from "@/components/OrderCard";
import { axiosFetch } from "@/stores/dataStore";
import { useState, useCallback, useEffect } from "react";
import { OrderType } from "@/types/type";

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await axiosFetch("/users/orders");
      setOrders(response?.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error?.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchOrders();
    } catch (error) {
      console.error("Error fetching orders:", error?.response?.data);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="mt-4 text-gray-600 font-medium">
          Đang tải dữ liệu...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center justify-between px-4 mb-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-pbold ml-4">Lịch sử đơn hàng</Text>
        </View>
      </View>

      {!orders.length ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
          <Text className="mt-4 text-gray-600 font-medium text-center">
            Bạn chưa có đơn hàng nào
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item }) => (
            <OrderCard order={item} onOrderUpdate={onRefresh} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerClassName="px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default OrderHistoryScreen;

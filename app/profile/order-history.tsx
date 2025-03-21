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
import { useState, useCallback, useEffect, useRef } from "react";
import { OrderType } from "@/types/type";
import { PaginationType } from "@/types/pagination";

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const retryCount = useRef(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const nextCursor = useRef<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let url = "/users/orders";
      if (nextCursor.current) {
        url += `?cursor=${nextCursor.current}`;
      }
      const response = await axiosFetch(url, "get");
      const paginateData: PaginationType<OrderType> = response?.data || [];
      const data = paginateData?.data || [];
      if (data?.length > 0) {
        setOrders(data);
        nextCursor.current = paginateData?.next_cursor || null;
      } else if (retryCount.current < 10) {
        retryCount.current++;
        fetchOrders();
      }
    } catch (error) {
      if (retryCount.current < 10) {
        retryCount.current++;
        fetchOrders();
      }
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
      setOrders([]);
      nextCursor.current = null;
      await fetchOrders();
    } catch (error) {
      console.error("Error fetching orders:", error?.response?.data);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadMoreOrders = async () => {
    if (nextCursor.current) {
      setIsLoadingMore(true);
      try {
        await fetchOrders();
      } finally {
        setIsLoadingMore(false);
      }
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
          <Text className="text-xl font-pbold ml-4">Lịch sử đơn dịch vụ</Text>
        </View>
      </View>

      {!orders.length ? (
        <View className="flex-1 justify-center items-center px-4">
          <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
          <Text className="mt-4 text-gray-600 font-medium text-center">
            Bạn chưa có đơn dịch vụ nào
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item }) => (
            <OrderCard order={item} onOrderUpdate={onRefresh} />
          )}
          keyExtractor={(item, index) => index.toString()}
          contentContainerClassName="px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color="#0284c7" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default OrderHistoryScreen;

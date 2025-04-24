"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { ServiceType } from "@/types/type";
import ServiceCard from "@/components/ServiceCard";
import { useNavigation } from "expo-router";
import { PaginationType } from "@/types/pagination";

const ViewHistoryScreen = () => {
  const user = useRentoData((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const retryCount = useRef(0);
  const [viewHistory, setViewHistory] = useState<ServiceType[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const nextCursor = useRef<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: "Lịch sử xem dịch vụ",
      headerRight: () => (
        <TouchableOpacity onPressIn={handleClearAll}>
          {viewHistory.length > 0 && (
            <Text className="text-red-500 font-pmedium">Xóa tất cả</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [viewHistory]);

  const fetchServiceWithRetry = async () => {
    try {
      let url = `/services/viewed`;
      if (nextCursor.current) {
        url += `?cursor=${nextCursor.current}`;
      }
      const response = await axiosFetch(url, "get");

      const paginateData: PaginationType<ServiceType> = response?.data || [];
      const data = paginateData?.data || [];
      if (data?.length > 0) {
        nextCursor.current = paginateData?.next_cursor || null;
        retryCount.current = 0;
        setViewHistory((prev) => [...prev, ...data]);
      } else if (retryCount.current < 10) {
        retryCount.current++;
        fetchServiceWithRetry();
      }
    } catch (error: any) {
      console.error(
        "Lỗi khi fetch dịch vụ:",
        error?.response?.data || error.message,
      );
      if (retryCount.current < 10) {
        retryCount.current++;
        fetchServiceWithRetry();
      }
    }
  };

  const onLoadMore = async () => {
    if (nextCursor.current) {
      setIsLoadingMore(true);
      await fetchServiceWithRetry();
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    try {
      setIsLoading(true);
      retryCount.current = 0;
      setViewHistory([]);
      await fetchServiceWithRetry();
    } catch (error: any) {
      console.error("Lỗi khi refresh:", error?.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchServiceWithRetry();
  }, []);

  const handleDeleteItem = async (serviceId: number) => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa mục này khỏi lịch sử?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await axiosFetch(`/users/viewed/${serviceId}`, "delete");
            setViewHistory(viewHistory.filter((item) => item.id !== serviceId));
          } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa mục này");
          }
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa toàn bộ lịch sử xem?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa tất cả",
        style: "destructive",
        onPress: async () => {
          try {
            await axiosFetch("/users/delete/viewed/all", "delete");
            setViewHistory([]);
          } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa lịch sử");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ServiceType }) => (
    <View className="relative">
      <ServiceCard data={item} containerStyles="mb-4" />
      <TouchableOpacity
        onPress={() => handleDeleteItem(item.id)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full py-1 px-3 flex-row items-center"
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        <Text className="ml-1 text-red-500 font-pmedium">Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0286FF" />
        </View>
      ) : viewHistory.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="time-outline" size={64} color="#ccc" />
          <Text className="mt-4 text-gray-500 text-lg">
            Chưa có lịch sử xem dịch vụ
          </Text>
        </View>
      ) : (
        <FlatList
          data={viewHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerClassName="p-4"
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() =>
            isLoadingMore ? (
              <ActivityIndicator size="small" color="black" />
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

export default ViewHistoryScreen;

"use client";

import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { ServiceType } from "@/types/type";
import ServiceCard from "@/components/ServiceCard";
import { PaginationType } from "@/types/pagination";

const SavedServicesScreen = () => {
  const [favorites, setFavorites] = useState<ServiceType[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const retryCount = useRef(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const nextCursor = useRef<string | null>(null);
  const favIds = useRentoData((state) => state.favIds);

  const fetchFavoritesWithRetry = async () => {
    try {
      setIsRefreshing(true);
      let url = "/favorites";
      if (nextCursor.current) {
        url += `?next_cursor=${nextCursor.current}`;
      }
      const response = await axiosFetch(url, "get");
      const paginateData: PaginationType<ServiceType> = response?.data;
      const data = paginateData?.data || [];
      if (data?.length > 0) {
        nextCursor.current = paginateData?.next_cursor || null;
        setFavorites((prev) => [...prev, ...data]);
      } else if (retryCount.current < 10) {
        retryCount.current++;
        fetchFavoritesWithRetry();
      }
    } catch (error: any) {
      console.error("Lỗi khi fetch favorites:", error?.response?.data);
      if (retryCount.current < 10) {
        retryCount.current++;
        fetchFavoritesWithRetry();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchMore = async () => {
    if (nextCursor.current) {
      setIsLoadingMore(true);
      await fetchFavoritesWithRetry();
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFavoritesWithRetry();
  }, []);

  useEffect(() => {
    setFavorites((prev) =>
      prev.filter((favorite) => favIds.includes(favorite.id)),
    );
  }, [favIds]);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      setFavorites([]);
      await fetchFavoritesWithRetry();
    } catch (error: any) {
      console.error("Lỗi khi refresh:", error?.response?.data);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderItem = ({ item }: { item: ServiceType }) => (
    <ServiceCard
      data={{
        ...item,
        is_liked: true,
      }}
      containerStyles="mb-4"
      showConfirmUnlike
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center mb-6 px-4 py-2">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold ml-4">Dịch vụ đã thích</Text>
      </View>

      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
        ListFooterComponent={
          isLoadingMore ? <ActivityIndicator size="small" color="#000" /> : null
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="heart-outline" size={48} color="gray" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              Bạn chưa thích dịch vụ nào
            </Text>
            <TouchableOpacity
              className="mt-4 bg-blue-500 px-6 py-3 rounded-full"
              onPress={() => router.push("/")}
            >
              <Text className="text-white font-pmedium">Khám phá dịch vụ</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default SavedServicesScreen;

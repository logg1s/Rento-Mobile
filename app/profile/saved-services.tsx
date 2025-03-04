"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";
import { ServiceType } from "@/types/type";
import ServiceCard from "@/components/ServiceCard";

const SavedServicesScreen = () => {
  const favorites = useRentoData((state) => state.favorites);
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const fetchFavorites = useRentoData((state) => state.fetchFavorites);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchFavorites();
    } catch (error: any) {
      console.error("Lỗi khi refresh:", error?.response?.data);
    } finally {
      setIsRefreshing(false);
    }
  };

  const onPressFavorite = (serviceId: number, action: boolean) => {
    if (serviceId) {
      updateFavorite(serviceId, action);
    }
  };

  const renderItem = ({ item }: { item: ServiceType }) => (
    <ServiceCard
      data={{
        ...item,
        is_liked: true,
      }}
      containerStyles="mb-4"
      onPressFavorite={() => onPressFavorite(item.id, false)}
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
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
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

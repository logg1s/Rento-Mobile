"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { ServiceType } from "@/types/type";
import ServiceCard from "@/components/ServiceCard";
import { useNavigation } from "expo-router";
interface ViewHistoryItem {
  service_id: number;
  service: ServiceType;
}

const ViewHistoryScreen = () => {
  const user = useRentoData((state) => state.user);
  const services = useRentoData((state) => state.services);
  const [viewHistory, setViewHistory] = useState<ViewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: "Lịch sử xem dịch vụ",
      headerRight: () => (
        <TouchableOpacity onPress={handleClearAll}>
          {viewHistory.length > 0 && (
            <Text className="text-red-500 font-pmedium">Xóa tất cả</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [viewHistory]);

  useEffect(() => {
    if (user?.viewed_service_log && services) {
      const historyItems = user.viewed_service_log
        .map((item) => {
          const service = services.find((s) => s.id === item.service_id);
          if (service) {
            return {
              service_id: item.service_id,
              service,
            };
          }
          return null;
        })
        .filter((item): item is ViewHistoryItem => item !== null);
      setViewHistory(historyItems);
    }

    setLoading(false);
  }, [user, services]);

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
            setViewHistory(
              viewHistory.filter((item) => item.service_id !== serviceId)
            );
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

  const renderItem = ({ item }: { item: ViewHistoryItem }) => (
    <View className="relative">
      <ServiceCard
        data={item.service}
        containerStyles="mb-4"
        onPressFavorite={() => {}}
      />
      <TouchableOpacity
        onPress={() => handleDeleteItem(item.service_id)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-full py-1 px-3 flex-row items-center"
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        <Text className="ml-1 text-red-500 font-pmedium">Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {loading ? (
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
          keyExtractor={(item) => item.service_id.toString()}
          contentContainerClassName="p-4"
        />
      )}
    </View>
  );
};

export default ViewHistoryScreen;

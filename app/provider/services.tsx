import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";
import { getImageSource } from "@/utils/utils";

const ServicesScreen = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const services = useRentoData((state) => state.services);

  const onRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Fetch latest services
    setIsRefreshing(false);
  };

  const ServiceCard = ({ service }) => (
    <TouchableOpacity
      onPress={() => router.push(`/provider/services/${service.id}`)}
      className="bg-white p-4 rounded-xl mb-4 flex-row"
    >
      <Image
        source={getImageSource(service)}
        className="w-24 h-24 rounded-lg"
        contentFit="cover"
      />
      <View className="flex-1 ml-4">
        <Text className="font-pbold text-lg">{service.service_name}</Text>
        <Text className="text-gray-600 mt-1">
          {service.description.slice(0, 100)}
          {service.description.length > 100 ? "..." : ""}
        </Text>
        <View className="flex-row items-center mt-2">
          <Text className="font-pbold text-primary-500">
            {service.price.toLocaleString()}đ
          </Text>
          <View
            className={`ml-2 px-2 py-1 rounded ${
              service.status === "active" ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-pmedium ${
                service.status === "active" ? "text-green-600" : "text-gray-600"
              }`}
            >
              {service.status === "active" ? "Đang hoạt động" : "Tạm ngưng"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="p-4 bg-white flex-row justify-between items-center">
        <Text className="text-2xl font-pbold">Quản lý dịch vụ</Text>
        <TouchableOpacity
          onPress={() => router.push("/provider/services/new")}
          className="bg-primary-500 p-2 rounded-full"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Service List */}
      <FlatList
        data={services}
        renderItem={({ item }) => <ServiceCard service={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="cube-outline" size={48} color="gray" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              Bạn chưa có dịch vụ nào
            </Text>
            <TouchableOpacity
              className="mt-4 bg-primary-500 px-6 py-3 rounded-full"
              onPress={() => router.push("/provider/services/new")}
            >
              <Text className="text-white font-pmedium">Thêm dịch vụ mới</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default ServicesScreen;

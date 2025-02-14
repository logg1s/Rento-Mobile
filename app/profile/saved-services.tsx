"use client";

import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const SavedServicesScreen = () => {
  const [savedServices, setSavedServices] = useState([
    {
      id: "1",
      name: "Sửa điện",
      provider: "Lê Hoàng Cường",
      rating: 4.5,
      price: "250.000đ - 600.000đ",
    },
    {
      id: "2",
      name: "Dọn dẹp nhà",
      provider: "Nguyễn Thị Anh",
      rating: 4.8,
      price: "200.000đ - 400.000đ",
    },
    {
      id: "3",
      name: "Sửa ống nước",
      provider: "Trần Văn Bình",
      rating: 4.2,
      price: "300.000đ - 700.000đ",
    },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between bg-white p-4 mb-4 rounded-lg shadow-sm"
      onPress={() => router.push(`/job/${item.id}`)}
    >
      <View className="flex-row items-center">
        <Image
          source={{ uri: `https://picsum.photos/seed/${item.name}/100` }}
          className="w-16 h-16 rounded-lg mr-4"
        />
        <View>
          <Text className="font-pbold text-lg">{item.name}</Text>
          <Text className="text-gray-600">{item.provider}</Text>
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text className="ml-1">{item.rating}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text className="font-pmedium text-right">{item.price}</Text>
        <TouchableOpacity
          onPress={() => {
            setSavedServices(
              savedServices.filter((service) => service.id !== item.id),
            );
          }}
          className="mt-2"
        >
          <Ionicons name="heart" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 px-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold ml-4">Dịch vụ đã lưu</Text>
      </View>

      <FlatList
        data={savedServices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-lg">
              Bạn chưa lưu dịch vụ nào
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default SavedServicesScreen;

import type React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import type { Service } from "@/lib/dummy";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type ServiceCardProps = {
  data: Service;
  containerStyles?: string;
  onPressFavorite: () => void;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  data: {
    id,
    name,
    service,
    category,
    rating,
    priceRange,
    pricePerHour,
    description,
    imageUrl,
    commentCount,
    isLike,
    experience,
    location,
  },
  containerStyles,
  onPressFavorite,
}) => {
  const onPressServiceCard = () => {
    router.push(`/job/${id}`);
  };

  return (
    <TouchableOpacity
      className={`rounded-xl p-4 gap-3 border border-general-100 bg-white shadow-md shadow-gray-500 ${containerStyles}`}
      onPress={onPressServiceCard}
    >
      <View className="flex-row">
        <Image source={{ uri: imageUrl }} className="w-16 h-16 rounded-full" />
        <View className="ml-4 flex-1">
          <Text className="font-pbold text-lg">{name}</Text>
          <Text className="font-pmedium text-sm text-secondary-800">
            {service} - {category}
          </Text>
          <View className="flex-row items-center mt-1">
            <FontAwesome name="star" size={14} color="#FFD700" />
            <Text className="ml-1 font-pmedium">{rating.toFixed(1)}</Text>
            <Text className="ml-2 font-pregular text-sm text-secondary-700">
              ({commentCount} đánh giá)
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onPressFavorite} className="p-2">
          <FontAwesome
            name={isLike ? "heart" : "heart-o"}
            size={24}
            color={isLike ? "#c40000" : "gray"}
          />
        </TouchableOpacity>
      </View>
      <Text className="font-pmedium text-sm" numberOfLines={2}>
        {description}
      </Text>
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={16} color="green" />
          <Text className="ml-1 font-pmedium text-sm">
            {pricePerHour?.toLocaleString("vi-VN")}đ/giờ
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={16} color="gray" />
          <Text className="ml-1 font-pmedium text-sm">{location}</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="briefcase-outline" size={16} color="blue" />
          <Text className="ml-1 font-pmedium text-sm">{experience} năm</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ServiceCard;

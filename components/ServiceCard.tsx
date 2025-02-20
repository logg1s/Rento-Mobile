import type React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import type { Service } from "@/lib/dummy";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ServiceType, Price } from "@/types/type";

type ServiceCardProps = {
  data: ServiceType;
  containerStyles?: string;
  onPressFavorite: () => void;
};

const ServiceCard: React.FC<ServiceCardProps> = ({
  data: {
    id,
    service_name,
    service_description,
    user,
    location,
    category,
    price,
    isLiked,
    created_at,
    updated_at,
    deleted_at,
  },
  containerStyles,
  onPressFavorite,
}) => {
  const onPressServiceCard = () => {
    router.push(`/job/${id}`);
  };

  const convertedPrice = (price: Price[]) => {
    if (!price?.length) return "0đ";
    const minPrice = Math.min(...price.map((p) => p.price_value));
    const maxPrice = Math.max(...price.map((p) => p.price_value));

    const formatValue = (value: number) => {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(0) + "M";
      }
      if (value >= 1000) {
        return (value / 1000).toFixed(0) + "K";
      }
      return value.toString();
    };

    if (minPrice === maxPrice) {
      return formatValue(minPrice);
    }

    return `${formatValue(minPrice)} - ${formatValue(maxPrice)}`;
  };

  return (
    <TouchableOpacity
      className={`rounded-xl p-4 gap-3 border border-general-100 bg-white shadow-md shadow-gray-500 ${containerStyles}`}
      onPress={onPressServiceCard}
    >
      <View className="flex-row">
        <Image
          source={ user?.image_id ? { uri: user?.image_id } : require("@/assets/images/people.png") }
          className="w-16 h-16 rounded-full border-2 border-black"
        />
        <View className="ml-4 flex-1">
          <Text className="font-pbold text-lg">{service_name}</Text>
          <Text className="font-pmedium text-sm text-secondary-800">
          {category?.category_name}
          </Text>
          <View className="flex-row items-center mt-1">
            <FontAwesome name="star" size={14} color="#FFD700" />
            <Text className="ml-1 font-pmedium">{(5.0).toFixed(1)}</Text>
            <Text className="ml-2 font-pregular text-sm text-secondary-700">
              (100 đánh giá)
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onPressFavorite} className="p-2">
          <FontAwesome
            name={isLiked ? "heart" : "heart-o"}
            size={24}
            color={isLiked ? "#c40000" : "gray"}
          />
        </TouchableOpacity>
      </View>
      <Text className="font-pmedium text-sm" numberOfLines={2}>
        {service_description}
      </Text>
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="cash-outline" size={16} color="green" />
          <Text className="ml-1 font-pmedium text-sm">
            Từ {convertedPrice(price)}/giờ
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={16} color="gray" />
          <Text className="ml-1 font-pmedium text-sm">
            {location?.location_name}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="briefcase-outline" size={16} color="blue" />
          <Text className="ml-1 font-pmedium text-sm">5 năm</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ServiceCard;

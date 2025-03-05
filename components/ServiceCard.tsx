import type React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ServiceCardProps } from "@/types/prop";
import { convertedPrice, getImageSource } from "@/utils/utils";
import { twMerge } from "tailwind-merge";

const ServiceCard: React.FC<ServiceCardProps> = ({
  data: {
    id,
    service_name,
    service_description,
    user,
    location,
    category,
    price,
    created_at,
    updated_at,
    deleted_at,
    comment_count,
    is_liked,
    average_rate,
  },
  containerStyles,
  onPressFavorite,
}) => {
  const onPressServiceCard = () => {
    router.push({
      pathname: "/job/[id]",
      params: {
        id,
        user_name: user?.name,
        category_name: category?.category_name,
      },
    });
  };

  return (
    <TouchableOpacity
      className={twMerge(
        `rounded-xl p-4 gap-3 border border-general-100 bg-white shadow-md shadow-gray-500`,
        containerStyles,
      )}
      onPress={onPressServiceCard}
    >
      <View className="flex-row">
        <View className={`w-20 p-1 justify-center items-center rounded-full`}>
          <Image
            source={getImageSource(user)}
            className="w-20 h-20 rounded-full "
          />
        </View>
        <View className="ml-4 flex-1">
          <Text className="font-pbold text-lg">{service_name}</Text>
          <Text className="font-pmedium text-sm text-secondary-800">
            {category?.category_name}
          </Text>
          <View className="flex-row items-center mt-1">
            <FontAwesome name="star" size={14} color="#FFD700" />
            <Text className="ml-1 font-pmedium">
              {average_rate?.toFixed(1) ?? 0}
            </Text>
            <Text className="ml-2 font-pregular text-sm text-secondary-700">
              ({comment_count} đánh giá)
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onPressFavorite} className="p-2">
          <FontAwesome
            name={is_liked ? "heart" : "heart-o"}
            size={24}
            color={is_liked ? "#c40000" : "gray"}
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
            Từ {convertedPrice(price)}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={16} color="gray" />
          <Text className="ml-1 font-pmedium text-sm">
            {location?.location_name}
          </Text>
        </View>
        {/*<View className="flex-row items-center">*/}
        {/*  <Ionicons name="briefcase-outline" size={16} color="blue" />*/}
        {/*  <Text className="ml-1 font-pmedium text-sm">5 năm</Text>*/}
        {/*</View>*/}
      </View>
    </TouchableOpacity>
  );
};

export default ServiceCard;

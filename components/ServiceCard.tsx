import type React from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ServiceCardProps } from "@/types/prop";
import { convertedPrice, getImageSource } from "@/utils/utils";
import { twMerge } from "tailwind-merge";
import useRentoData from "@/stores/dataStore";
import { useEffect } from "react";
import { useState } from "react";
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
    average_rate,
  },
  containerStyles,
  showConfirmUnlike = false,
  onPress,
  showFavorite = true,
}) => {
  const onPressServiceCard = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/job/[id]",
        params: {
          id,
        },
      });
    }
  };
  const isLiked = useRentoData((state) => state.favIds.includes(id));
  const updateFavorite = useRentoData((state) => state.updateFavorite);

  return (
    <TouchableOpacity
      className={twMerge(
        `rounded-xl p-4 gap-3 border border-general-100 bg-white shadow shadow-gray-500`,
        containerStyles
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
        {showFavorite && (
          <TouchableOpacity
            onPress={() => {
              if (showConfirmUnlike && !isLiked) {
                Alert.alert("Bỏ thích", "Bỏ thích dịch vụ này?", [
                  { text: "Huỷ", style: "cancel" },
                  {
                    text: "Bỏ thích",
                    style: "default",
                    onPress: () => updateFavorite(id, !isLiked),
                  },
                ]);
              } else {
                updateFavorite(id, !isLiked);
              }
            }}
            className="p-2"
          >
            <FontAwesome
              name={isLiked ? "heart" : "heart-o"}
              size={24}
              color={isLiked ? "#c40000" : "gray"}
            />
          </TouchableOpacity>
        )}
      </View>
      <Text className="font-pmedium text-sm" numberOfLines={2}>
        {service_description}
      </Text>
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <Ionicons name="cash-outline" size={16} color="green" />
          <Text className="ml-1 font-pmedium text-sm">
            Từ {convertedPrice(price)}
          </Text>
        </View>
        <View className="flex-row items-center w-1/2 justify-end">
          <Ionicons name="location-outline" size={16} color="gray" />
          <Text className="ml-1 font-pmedium text-sm">
            {location?.province?.name ?? location?.location_name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ServiceCard;

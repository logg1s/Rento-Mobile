import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { ServiceCardProp } from "@/types/type";
import Fontisto from "@expo/vector-icons/Fontisto";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";

const SmallerServiceCard = ({
  data: {
    id,
    name,
    service,
    rating,
    priceRange,
    description,
    imageUrl,
    commentCount,
    isLike,
  },
  containerStyles,
  onPressFavorite,
}: ServiceCardProp & {
  containerStyles?: string;
  onPressFavorite: () => void;
}) => {
  // TODO: write logic press service card
  const onPressServiceCard = () => {
    router.push(`/job/${id}`);
  };

  // TODO: write long press service card
  const onLongPressServiceCard = () => {};
  return (
    <TouchableOpacity
      className={`w-48 rounded-xl gap-3 border border-general-100 bg-white shadow-md shadow-gray-500 ${containerStyles}`}
      onPress={onPressServiceCard}
      onLongPress={onLongPressServiceCard}
    >
      <Image
        source={{ uri: imageUrl }}
        className="w-full h-40"
        resizeMode="cover"
      />
      <View className="px-3 gap-3">
        <View className="flex-row items-center">
          <View className="flex-row gap-1 flex-1 items-center">
            <Fontisto name="star" size={12} color="black" className="pb-1" />
            <View className="flex-row gap-2 items-center">
              <Text className="font-pbold text-lg">{rating}</Text>
              <Text className="font-pregular text-sm">({commentCount})</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onPressFavorite}>
            <FontAwesome
              name={isLike ? "heart" : "heart-o"}
              size={24}
              color={isLike ? "#c40000" : "gray"}
              className="mb-2"
            />
          </TouchableOpacity>
        </View>
        <Text className=" font-pmedium -mt-2" numberOfLines={3}>
          {description}
        </Text>
        <Text className="font-pregular text-right">
          Từ <Text className="font-pbold">{priceRange}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default SmallerServiceCard;

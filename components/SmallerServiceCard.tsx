import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { ServiceCardProp } from "@/types/type";
import Fontisto from "@expo/vector-icons/Fontisto";
import { FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";

const SmallerServiceCard = ({
  data: {
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
}: ServiceCardProp & { containerStyles?: string }) => {
  // TODO: write logic press service card
  const id = 123;
  const onPressServiceCard = () => {
    router.push(`/job/${id}`);
  };

  // TODO: write logic press favorite
  const onPressFavorite = () => {};

  // TODO: write long press service card
  const onLongPressServiceCard = () => {};
  return (
    <TouchableOpacity
      className={`rounded-xl p-3 gap-5 border border-general-100 bg-white shadow-md shadow-gray-500 ${containerStyles}`}
      onPress={onPressServiceCard}
      onLongPress={onLongPressServiceCard}
    >
      <View className="flex-row items-center">
        <View className="flex-row gap-3 flex-1 items-center">
          <Image
            source={{ uri: imageUrl }}
            className="w-10 h-10 rounded-full"
          />
          <View>
            <Text className="font-pbold">{name}</Text>
            <Text className="font-pmedium text-sm text-secondary-800">
              {service}
            </Text>
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
      <View>
        <Text className="text-justify font-pmedium">{description}</Text>
      </View>
      <View className="flex-row items-center">
        <View className="flex-row gap-1 flex-1 items-center">
          <Fontisto name="star" size={12} color="black" className="mb-1" />
          <View className="flex-row gap-2 items-center">
            <Text className="font-pbold text-lg">{rating}</Text>
            <Text className="font-pregular text-sm">({commentCount})</Text>
          </View>
        </View>
        <Text className="font-pregular">
          Từ <Text className="font-pbold">{priceRange}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default SmallerServiceCard;

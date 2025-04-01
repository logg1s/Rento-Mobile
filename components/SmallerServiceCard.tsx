import { Image, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Fontisto from "@expo/vector-icons/Fontisto";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ServiceCardProps } from "@/types/prop";
import { convertedPrice, getServiceImageSource } from "@/utils/utils";
import { twMerge } from "tailwind-merge";
import useRentoData from "@/stores/dataStore";
const SmallerServiceCard: React.FC<ServiceCardProps> = ({
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
    images,
  },
  containerStyles,
}) => {
  const onPressServiceCard = () => {
    router.push({
      pathname: "/job/[id]",
      params: {
        id,
      },
    });
  };

  const isLiked = useRentoData((state) => state.favIds.includes(id));
  const updateFavorite = useRentoData((state) => state.updateFavorite);

  const onLongPressServiceCard = () => {};
  return (
    <TouchableOpacity
      className={twMerge(
        `w-48 rounded-xl gap-3 border border-general-100 bg-white shadow-md shadow-gray-500 `,
        containerStyles
      )}
      onPress={onPressServiceCard}
      onLongPress={onLongPressServiceCard}
    >
      {service_name && images && images.length > 0 ? (
        <Image
          source={getServiceImageSource(images[0].image_url)}
          defaultSource={{
            uri: `https://picsum.photos/seed/services/400`,
          }}
          className="w-full h-40"
          resizeMode="cover"
        />
      ) : (
        <View className="bg-white h-32 justify-center items-center rounded-full">
          <Ionicons name="image-outline" size={32} color="gray" />
        </View>
      )}

      <View className="px-3 gap-3 justify-between flex-1">
        <View className="flex-row items-center">
          <View className="flex-row gap-1 flex-1 items-center">
            <Fontisto name="star" size={12} color="black" className="pb-1" />
            <View className="flex-row gap-2 items-center">
              <Text className="font-pbold text-lg">{5}</Text>
              <Text className="font-pregular text-sm">({comment_count})</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => updateFavorite(id, !isLiked)}>
            <FontAwesome
              name={isLiked ? "heart" : "heart-o"}
              size={24}
              color={isLiked ? "#c40000" : "gray"}
              className="mb-2"
            />
          </TouchableOpacity>
        </View>
        <Text className=" font-pmedium -mt-2" numberOfLines={3}>
          {service_description}
        </Text>
        <Text className="font-pregular text-right">
          Từ{" "}
          <Text className="font-pbold">
            {convertedPrice(price, false, "lowest")}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default SmallerServiceCard;

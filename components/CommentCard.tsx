import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { CommentCardProp } from "@/types/type";
import Fontisto from "@expo/vector-icons/Fontisto";

const CommentCard = ({
  data: { id, name, rating, comment, imageUrl },
  containerStyles,
}: CommentCardProp & {
  containerStyles?: string;
}) => {
  const onPressComment = () => {};

  // TODO: write long press service card
  const onLongPressComment = () => {};
  return (
    <TouchableOpacity
      className={`rounded-xl w-72 p-3 gap-5 border border-general-100 bg-white shadow-md shadow-gray-500 ${containerStyles}`}
      onPress={onPressComment}
      onLongPress={onLongPressComment}
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
              Comment here
            </Text>
          </View>
        </View>
      </View>
      <View>
        <Text className="font-pmedium" numberOfLines={2}>
          {comment}
        </Text>
      </View>
      <View className="flex-row items-center">
        <View className="flex-row gap-1 flex-1 items-center">
          <Fontisto name="star" size={12} color="black" className="mb-1" />
          <View className="flex-row gap-2 items-center">
            <Text className="font-pbold">{rating}</Text>
          </View>
        </View>
        <Text className="font-pregular text-sm">
          {new Date().toDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CommentCard;

import { View, Text } from "react-native";
import React from "react";
import { FontAwesome } from "@expo/vector-icons";

const RatingStar = ({
  rating,
  maxStar = 5,
}: {
  rating: number;
  maxStar?: number;
}) => {
  const starsFill = Math.floor(rating);
  const max = maxStar < rating ? Math.ceil(rating) : maxStar;
  let stars = [];
  for (let i = 0; i < max; i++) {
    stars.push(
      <FontAwesome
        key={i}
        name={`${i < starsFill ? "star" : Math.abs(rating - i - 1) < 1 ? "star-half" : "star-o"}`}
        size={16}
        color="black"
        className="mb-1"
      />,
    );
  }

  return (
    <View className="flex-row gap-2 flex-1 items-center">
      <View className="flex-row gap-1">{stars}</View>
      <Text className="font-psemibold text-2xl">{rating}</Text>
    </View>
  );
};

export default RatingStar;

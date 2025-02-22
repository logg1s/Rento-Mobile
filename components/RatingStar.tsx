import { View, Text } from "react-native";
import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";

const RatingStar = ({
  rating,
  maxStar = 5,
  isClickable = true,
  isAverage = false,
  showRateNumber = true,
  size = 16,
  selectedRating,
  setSelectedRating,
}: {
  rating: number;
  maxStar?: number;
  isClickable?: boolean;
  isAverage?: boolean;
  showRateNumber?: boolean;
  size?: number;
  selectedRating?: number;
  setSelectedRating?: (rating: number) => void;
}) => {
  const starsFill = Math.floor(isAverage ? rating : selectedRating);
  const hasHalfStar = isAverage && rating % 1 >= 0.5;
  const max = maxStar < selectedRating ? Math.ceil(selectedRating) : maxStar;
  let stars = [];
  for (let i = 0; i < max; i++) {
    stars.push(
      <FontAwesome
        key={i}
        name={
          i < starsFill
            ? "star"
            : hasHalfStar && i === starsFill
              ? "star-half"
              : "star-o"
        }
        size={size}
        color={isAverage ? "black" : i < starsFill ? "orange" : "black"}
        className="mb-1"
        onPress={
          isClickable && !isAverage
            ? () => setSelectedRating?.(i + 1)
            : undefined
        }
      />
    );
  }

  return (
    <View className="flex-row gap-2 flex-1 items-center">
      <View className="flex-row gap-1">{stars}</View>
      {showRateNumber && (
        <Text className="font-psemibold text-2xl">{selectedRating}</Text>
      )}
    </View>
  );
};

export default RatingStar;

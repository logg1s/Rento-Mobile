import {
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";
import React, { LegacyRef, forwardRef } from "react";
import { CardPriceProp } from "@/types/prop";
import { PriceType } from "@/types/type";
import { formatToVND } from "@/utils/utils";

const CardPrice = forwardRef<
  TouchableOpacityProps,
  PriceType & {
    isActive?: boolean;
    onPress?: () => void;
  }
>(({ price_value, price_name, isActive = false, onPress }, ref) => (
  <TouchableOpacity
    className={`rounded-xl ${isActive ? "bg-primary-300 border-primary-500" : "bg-general-500 border-gray-300"} w-auto h-auto gap-3 border-2`}
    onPress={onPress}
    ref={ref}
  >
    <View
      className={`px-5 justify-center items-center ${isActive ? "bg-primary-500" : "bg-primary-300"}`}
    >
      <Text
        className={`font-pbold ${isActive ? "text-white" : "text-primary-500"} text-center`}
        numberOfLines={1}
      >
        {price_name}
      </Text>
    </View>

    <View className="px-5 gap-2">
      {/* <Text
        className={`font-pmedium text-lg  ${isActive ? "text-primary-500" : "text-secondary-900"} text-center`}
        numberOfLines={1}
      >
        {price_name}
      </Text> */}
      <Text
        className={`font-pmedium text-3xl text-center "}`}
        numberOfLines={1}
      >
        {formatToVND(price_value)}
      </Text>
    </View>
  </TouchableOpacity>
));

export default CardPrice;

import {
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
  TouchableOpacityProps,
  Image,
  ImageSourcePropType,
} from "react-native";
import React, { ReactNode } from "react";

const CustomButton = ({
  title,
  onPress,
  iconLeft,
  iconRight,
  outline = false,
  containerStyles,
  textStyles,
}: {
  title: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  containerStyles?: string;
  outline?: boolean;
  textStyles?: string;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`justify-center items-center flex-row gap-2 rounded-xl p-3.5 ${outline ? "bg-white" : "bg-primary-500"} ${containerStyles}`}
    >
      {iconLeft}
      <Text
        className={`font-pmedium text-xl ${outline ? "text-black" : "text-white"} ${textStyles}`}
      >
        {title}
      </Text>
      {iconRight}
    </TouchableOpacity>
  );
};

export default CustomButton;

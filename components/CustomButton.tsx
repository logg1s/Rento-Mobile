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
import { twMerge } from "tailwind-merge";

const CustomButton = ({
  title,
  onPress,
  iconLeft,
  iconRight,
  outline = false,
  containerStyles,
  textStyles,
  isDisabled = false,
}: {
  title: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  containerStyles?: string;
  outline?: boolean;
  textStyles?: string;
  isDisabled?: boolean;
}) => {
  return (
    <TouchableOpacity
      onPress={isDisabled ? () => {} : onPress}
      activeOpacity={isDisabled ? 1 : 0.7}
      className={twMerge(
        `justify-center items-center flex-row gap-2 rounded-xl p-3.5 ${outline ? "bg-white" : "bg-primary-500"}`,
        containerStyles,
      )}
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

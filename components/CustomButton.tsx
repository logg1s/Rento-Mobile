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
  containerStyles,
  textStyles,
}: {
  title: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  containerStyles?: string;
  textStyles?: string;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`justify-center items-center flex-row gap-2 rounded-xl p-3.5 bg-primary-500 ${containerStyles}`}
    >
      {iconLeft}
      <Text className={`font-pmedium text-xl text-white ${textStyles}`}>
        {title}
      </Text>
      {iconRight}
    </TouchableOpacity>
  );
};

export default CustomButton;

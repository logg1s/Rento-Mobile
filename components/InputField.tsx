import {
  View,
  Text,
  KeyboardAvoidingView,
  Image,
  TextInput,
  PlatformColor,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { ReactNode, useState } from "react";

const InputField = ({
  nameField,
  placeholder,
  iconLeft,
  iconRight,
  onChangeText,
  secureTextEntry,
}: {
  nameField?: string;
  placeholder?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="gap-1">
          <Text className="font-psemibold text-xl text-secondary-900">
            {nameField}
          </Text>
          <View
            className={`w-full bg-general-300 ${isFocused ? "border-2 border-primary-500" : "border border-neutral-50"} rounded-xl px-3 flex-row items-center h-16`}
          >
            <View className="flex-1 flex-row items-center gap-2">
              {iconLeft}
              <TextInput
                placeholder={placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 text-secondary-800 pt-2 font-pmedium justify-center text-lg "
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
              />
            </View>
            {iconRight}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;

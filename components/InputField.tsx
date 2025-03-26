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
import React, { ReactNode, useEffect, useState } from "react";
import { debounce, set } from "lodash";
import { twMerge } from "tailwind-merge";

const getBorderStyle = (isValid: boolean, isFocused: boolean): string => {
  if (!isValid) {
    return isFocused ? "border-2 border-red-500" : "border border-red-500";
  }
  return isFocused ? "border-2 border-primary-500" : "border border-neutral-50";
};

const InputField = ({
  nameField,
  placeholder,
  iconLeft,
  iconRight,
  onChangeText,
  secureTextEntry,
  multiline,
  containerStyles,
  rules,
  value,
  onSubmitEditing,
  returnKeyType,
  editable,
  onPressIn,
  enableValidate = true,
  keyBoardType = "default",
  canEmpty = true,
  required,
  maxLength,
}: {
  nameField?: string;
  placeholder?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  containerStyles?: string;
  value?: string;
  rules?: {
    isValid: boolean;
    message: string;
  }[];
  onSubmitEditing?: () => void;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  editable?: boolean;
  onPressIn?: () => void;
  enableValidate?: boolean;
  keyBoardType?:
    | "default"
    | "number-pad"
    | "decimal-pad"
    | "numeric"
    | "email-address"
    | "phone-pad";
  canEmpty?: boolean;
  required?: boolean;
  maxLength?: number;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isValidAll =
    value?.trim()?.length > 0
      ? rules?.every((rule) => rule?.isValid)
      : canEmpty;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="gap-1">
          <Text className="font-psemibold text-xl text-secondary-900">
            {nameField} {required && <Text className="text-red-500">*</Text>}
          </Text>
          <View
            className={twMerge(
              `w-full bg-general-300  ${isFocused ? "border-2 border-primary-500" : "border border-neutral-50"} rounded-xl px-3 flex-row items-center ${multiline && isFocused ? "h-40" : "h-16"}`,
              containerStyles
            )}
            style={
              !isValidAll &&
              enableValidate && {
                borderColor: "red",
                borderWidth: isFocused ? 2 : 1,
              }
            }
          >
            <View className="flex-1 flex-row items-center gap-2">
              {iconLeft}
              <TextInput
                placeholder={isFocused ? "" : placeholder}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                value={value}
                className={`flex-1 text-secondary-800 pt-2 font-pmedium text-lg`}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                onSubmitEditing={onSubmitEditing}
                returnKeyType={returnKeyType}
                editable={editable}
                onPressIn={onPressIn}
                keyboardType={keyBoardType}
                maxLength={maxLength}
              />
            </View>
            {iconRight}
          </View>
          <View>
            {!isValidAll &&
              rules?.map(
                (rule, index) =>
                  !rule?.isValid && (
                    <Text key={index} className="text-red-500 font-pmedium">
                      {rule?.message}
                    </Text>
                  )
              )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;

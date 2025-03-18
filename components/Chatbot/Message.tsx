import { UserType } from "@/types/type";
import { getImageSource } from "@/utils/utils";
import React, { useEffect } from "react";
import { StyleSheet, View, Image, Text } from "react-native";

export default function Message({
  message,
  user,
  onAfterNewMessage,
  time,
}: {
  message: string;
  user: UserType | null;
  onAfterNewMessage?: () => void;
  time: string;
}) {
  /* #USE EFFECT */
  useEffect(() => {
    onAfterNewMessage?.();
  }, [message]);

  /* #RENDER */
  return (
    <View className="bg-white p-4 shadow shadow-gray-300 rounded-lg">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Image
            source={getImageSource(user)}
            className="w-8 h-8 rounded-full"
          />
          <Text className="font-medium">{user?.name}</Text>
        </View>
        <Text className="text-sm font-medium">{time}</Text>
      </View>
      <Text className="text-base w-full flex-1 pl-0">{message}</Text>
    </View>
  );
}

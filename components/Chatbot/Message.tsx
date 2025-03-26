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
    const timeout = setTimeout(() => {
      onAfterNewMessage?.();
    }, 50);

    return () => clearTimeout(timeout);
  }, [message]);

  /* #RENDER */
  return (
    <View className="p-4 rounded-lg gap-2 bg-primary-600 w-2/3 self-end">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Image
            source={getImageSource(user)}
            className="w-8 h-8 rounded-full"
          />
          <Text className="font-medium text-white">{user?.name}</Text>
        </View>
        <Text className="text-sm font-medium text-white">{time}</Text>
      </View>
      <Text className="text-base w-full flex-1 text-white">{message}</Text>
    </View>
  );
}

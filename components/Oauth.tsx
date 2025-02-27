import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";

const Oauth = () => {
  return (
    <View className="justify-center items-center gap-5">
      <View className="flex-row items-center gap-5">
        <View className="flex-1 h-[1px] bg-gray-400 text-secondary-800"></View>
        <Text className="font-pregular">Hoặc đăng nhập với</Text>
        <View className="flex-1 h-[1px] bg-gray-400"></View>
      </View>
      <View className="flex-row justify-center items-center gap-5">
        <TouchableOpacity className="rounded-xl p-3 bg-zinc-200">
          <Image
            source={require("@/assets/icons/google.png")}
            className="w-10 h-10"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Oauth;

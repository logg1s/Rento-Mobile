import { View, Text, TouchableOpacity } from "react-native";
import React from "react";

const TabHome = () => {
  return (
    <View className="bg-secondary-100">
      <TouchableOpacity className="bg-secondary rounded-full w-[150px] px-1 py-5 justify-center items-center">
        <Text className="text-base text-white font-pmedium">Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TabHome;

import { View, Text } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";

const DetailJob = () => {
  const { id } = useLocalSearchParams();
  console.log(id);
  return (
    <View>
      <Text>DetailJob</Text>
    </View>
  );
};

export default DetailJob;

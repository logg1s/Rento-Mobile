import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

const JobLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="[id]" getId={({ params }) => params?.id} />
    </Stack>
  );
};

export default JobLayout;

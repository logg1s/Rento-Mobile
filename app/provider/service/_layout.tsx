import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const ServiceDetail = () => {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          title: "Chi tiết dịch vụ",
          headerShown: true,
        }}
      />
    </Stack>
  );
};

export default ServiceDetail;

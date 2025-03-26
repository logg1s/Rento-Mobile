import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const ProfileLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen name="order-history" options={{ headerShown: false }} />
      <Stack.Screen name="saved-services" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
      <Stack.Screen
        name="view-history"
        options={{
          headerTitle: "Lịch sử xem dịch vụ",
          headerBackTitle: "Quay lại",
        }}
      />
    </Stack>
  );
};

export default ProfileLayout;

import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const ProfileLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="edit" options={{ headerShown: false }} />
      <Stack.Screen name="account-settings" options={{ headerShown: false }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      <Stack.Screen name="order-history" options={{ headerShown: false }} />
      <Stack.Screen name="saved-services" options={{ headerShown: false }} />
      <Stack.Screen name="help-support" options={{ headerShown: false }} />
      <Stack.Screen name="terms-policy" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ProfileLayout;

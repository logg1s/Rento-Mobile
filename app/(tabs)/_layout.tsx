import { View, Text } from "react-native";
import React from "react";
import { Tabs } from "expo-router";

const TabLayout = () => {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ headerShown: false }} />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="message" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
};

export default TabLayout;

import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";

const JobLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          contentStyle: {},
        }}
      />
    </Stack>
  );
};

export default JobLayout;

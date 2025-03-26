import { Stack, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNotification } from "@/hooks/notificationHook";

export default function ProviderLayout() {
  useNotification();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="service" />
    </Stack>
  );
}

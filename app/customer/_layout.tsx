import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: "Chi tiết khách hàng" }} />
    </Stack>
  );
}

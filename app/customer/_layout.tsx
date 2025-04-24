import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Chi tiết đơn dịch vụ" }} />
    </Stack>
  );
}

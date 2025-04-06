import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function UserLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="[id]"
          options={{
            headerTitle: "Thông tin nhà cung cấp",
            headerBackTitle: "Quay lại",
          }}
        />
        <Stack.Screen
          name="reviews"
          options={{
            headerTitle: "Đánh giá",
            headerBackTitle: "Quay lại",
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

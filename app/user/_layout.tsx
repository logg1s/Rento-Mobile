import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerTitle: "Thông tin người dùng",
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
  );
}

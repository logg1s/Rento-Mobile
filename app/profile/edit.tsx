"use client";

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const EditProfileScreen = () => {
  const [user, setUser] = useState({
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0123456789",
  });

  const handleSave = () => {
    // Implement save logic here
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold">Chỉnh sửa thông tin</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text className="text-primary-500 font-pbold">Lưu</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4">
        <Text className="text-gray-600 mb-2">Họ và tên</Text>
        <TextInput
          value={user.name}
          onChangeText={(text) => setUser((prev) => ({ ...prev, name: text }))}
          className="border border-gray-300 rounded-lg px-4 py-2"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-600 mb-2">Email</Text>
        <TextInput
          value={user.email}
          onChangeText={(text) => setUser((prev) => ({ ...prev, email: text }))}
          keyboardType="email-address"
          className="border border-gray-300 rounded-lg px-4 py-2"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-600 mb-2">Số điện thoại</Text>
        <TextInput
          value={user.phone}
          onChangeText={(text) => setUser((prev) => ({ ...prev, phone: text }))}
          keyboardType="phone-pad"
          className="border border-gray-300 rounded-lg px-4 py-2"
        />
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

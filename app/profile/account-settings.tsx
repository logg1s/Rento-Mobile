"use client";

import React from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const AccountSettingsScreen = () => {
  const [twoFactorAuth, setTwoFactorAuth] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold ml-4">Cài đặt tài khoản</Text>
      </View>

      <View className="bg-white rounded-lg shadow-sm mb-6">
        <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
          <Text className="text-lg font-pmedium">Xác thực hai yếu tố</Text>
          <Switch
            value={twoFactorAuth}
            onValueChange={setTwoFactorAuth}
            trackColor={{ false: "#767577", true: "#0286FF" }}
            thumbColor={twoFactorAuth ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>
        <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
          <Text className="text-lg font-pmedium">Chế độ tối</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#767577", true: "#0286FF" }}
            thumbColor={darkMode ? "#f4f3f4" : "#f4f3f4"}
          />
        </View>
        <TouchableOpacity
          onPress={() => router.push("/profile/change-password")}
          className="flex-row items-center justify-between py-4"
        >
          <Text className="text-lg font-pmedium">Đổi mật khẩu</Text>
          <Ionicons name="chevron-forward" size={24} color="gray" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => {
          /* Implement delete account logic */
        }}
        className="bg-red-500 py-3 px-4 rounded-lg"
      >
        <Text className="text-white text-center font-pbold text-lg">
          Xóa tài khoản
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AccountSettingsScreen;

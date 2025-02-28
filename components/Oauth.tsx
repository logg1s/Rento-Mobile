import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  // Add StyleSheet if you want to use absolute positioning
  StyleSheet,
  Alert,
  ToastAndroid,
} from "react-native";
import React, { useState } from "react";
import useAuthStore from "@/stores/authStore";
import { router } from "expo-router";

const Oauth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const handleLoginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const success = await loginWithGoogle();
      if (success) {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      ToastAndroid.show(
        "Đăng nhập không thành công. Vui lòng thử lại !",
        ToastAndroid.SHORT
      );
      console.error("Google login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <View className="justify-center items-center gap-5">
        <View className="flex-row items-center gap-5">
          <View className="flex-1 h-[1px] bg-gray-400 text-secondary-800"></View>
          <Text className="font-pregular">Hoặc đăng nhập với</Text>
          <View className="flex-1 h-[1px] bg-gray-400"></View>
        </View>
        <View className="flex-row justify-center items-center gap-5">
          <TouchableOpacity
            className="rounded-xl p-3 bg-zinc-200"
            onPress={handleLoginWithGoogle}
            disabled={isLoading}
          >
            <Image
              source={require("@/assets/icons/google.png")}
              className="w-10 h-10"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isLoading}
        onRequestClose={() => {}}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white p-5 rounded-2xl items-center gap-3">
            <ActivityIndicator size="large" color="#4285F4" />
            <Text className="text-gray-700 font-medium">
              Đang đăng nhập với Google...
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Oauth;

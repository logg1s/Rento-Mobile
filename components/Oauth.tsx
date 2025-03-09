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
import { twMerge } from "tailwind-merge";
import useRentoData from "@/stores/dataStore";

const Oauth = ({
  containerStyles,
  textStyles,
  leftText,
  rightText,
}: {
  containerStyles?: string;
  textStyles?: string;
  leftText?: string;
  rightText?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const user = useRentoData((state) => state.user);

  const handleLoginWithGoogle = async () => {
    try {
      setIsLoading(true);
      const success = await loginWithGoogle();
      if (success) {
        const user = useRentoData.getState().user;
        if (user?.role?.some((r) => r.id === "provider")) {
          router.replace("/provider/dashboard");
        } else {
          router.replace("/(tabs)/home");
        }
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
    <TouchableOpacity
      onPress={handleLoginWithGoogle}
      className={twMerge(
        "flex-row items-center justify-center gap-3 bg-white py-4 px-2 rounded-xl",
        containerStyles
      )}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="black" />
      ) : (
        <>
          {leftText && (
            <Text
              className={twMerge("font-pmedium text-black text-lg", textStyles)}
            >
              {leftText}
            </Text>
          )}
          <Image
            source={require("@/assets/icons/google.png")}
            className="w-6 h-6"
          />
          {rightText && (
            <Text
              className={twMerge("font-pmedium text-black text-lg", textStyles)}
            >
              {rightText}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Oauth;

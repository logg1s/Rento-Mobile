import Oauth from "@/components/Oauth";
import useAuthStore from "@/stores/authStore";
import { Redirect, router } from "expo-router";
import React from "react";
import { ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WelcomeScreen = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return (
    <>
      {isLoggedIn ? (
        <Redirect href="/home" />
      ) : (
        <SafeAreaView className="flex-1">
          <ImageBackground
            source={require("@/assets/images/rento-logo-blue.jpg")}
            resizeMode="cover"
            className="w-full h-full items-center justify-center"
          >
            <View className={`gap-5 absolute bottom-20`}>
              <Oauth
                rightText="Đăng nhập với Google"
                containerStyles="bg-white"
                textStyles="text-xl"
              />
              <TouchableOpacity
                onPress={() => router.push("/login")}
                className="justify-center items-center"
              >
                <Text className="font-pregular text-xl underline text-blue-400">
                  Tiếp tục với Email
                </Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </SafeAreaView>
      )}
    </>
  );
};

export default WelcomeScreen;

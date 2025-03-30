import Oauth from "@/components/Oauth";
import { useCheckProfileComplete } from "@/hooks/useCheckProfileComplete";
import useAuthStore from "@/stores/authStore";
import useRentoData from "@/stores/dataStore";
import { Redirect, router, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WelcomeScreen = () => {
  const router = useRouter();
  const fetchUser = useRentoData((state) => state.fetchUser);
  const [isLoading, setIsLoading] = useState(false);
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        try {
          setIsLoading(true);
          const user = await fetchUser();
          console.log("user", user);
          if (user) {
            if (user.role?.some((r) => r.id === "provider")) {
              router.push("/provider/services");
            } else {
              router.push("/(tabs)/home");
            }
          }
        } catch (error: any) {
          console.error(error?.response?.data || error);
        } finally {
          setIsLoading(false);
        }
      };
      init();
    }, []),
  );

  return (
    <>
      <SafeAreaView className="flex-1">
        <ImageBackground
          source={require("@/assets/images/rento-logo-blue.jpg")}
          resizeMode="cover"
          className="w-full h-full items-center justify-center"
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
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
          )}
        </ImageBackground>
      </SafeAreaView>
    </>
  );
};

export default WelcomeScreen;

import Oauth from "@/components/Oauth";
import { useCheckProfileComplete } from "@/hooks/useCheckProfileComplete";
import useAuthStore from "@/stores/authStore";
import useRentoData from "@/stores/dataStore";
import { Redirect, router, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  const fetchFavIds = useRentoData((state) => state.fetchFavIds);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await fetchFavIds();
        const user = await fetchUser();
        if (user) {
          if (
            !user?.location?.location_name ||
            !user?.location?.real_location_name ||
            !user?.role
          ) {
            router.replace("/complete-profile");
          } else if (user.role?.some((r) => r.id === "provider")) {
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
  }, []);
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

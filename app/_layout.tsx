import { SplashScreen, Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";

import useAuthStore from "@/stores/authStore";
import {
  Poppins_100Thin,
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
  useFonts,
} from "@expo-google-fonts/poppins";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import useRentoData from "@/stores/dataStore";

SplashScreen.preventAutoHideAsync();

const Layout = () => {
  const router = useRouter();
  const initialize = useAuthStore((state) => state.initialize);
  const user = useRentoData((state) => state.user);

  useEffect(() => {
    const init = async () => {
      await initialize();
      const currentUser = useRentoData.getState().user;
      if (currentUser) {
        if (currentUser.role?.some((r) => r.id === "provider")) {
          router.replace("/provider/services");
        } else {
          router.replace("/(tabs)/home");
        }
      }
    };
    init();
  }, []);

  const [loaded, error] = useFonts({
    Poppins_100Thin,
    Poppins_200ExtraLight,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="provider" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
};

export default Layout;

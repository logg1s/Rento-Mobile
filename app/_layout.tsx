import React, { useEffect } from "react";
import { SplashScreen, Stack } from "expo-router";

import "../global.css";
import { StatusBar } from "expo-status-bar";
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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import useRentoData from "@/stores/dataStore";
import useAuthStore from "@/stores/authStore";
import { useState } from "react";
import { Appearance } from "react-native";

SplashScreen.preventAutoHideAsync();

const Layout = () => {
  const initialize = useAuthStore((state) => state.initialize);
  useEffect(() => {
    const init = async () => {
      await initialize();
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
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar
        style={Appearance.getColorScheme() === "dark" ? "dark" : "light"}
      />
    </GestureHandlerRootView>
  );
};

export default Layout;

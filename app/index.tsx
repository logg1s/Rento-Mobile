import { View, Text, Image, ImageBackground } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Redirect, router } from "expo-router";
const WelcomeScreen = () => {
  return <Redirect href={"/(tabs)/home"} />;
  return (
    <SafeAreaView className="flex-1">
      <ImageBackground
        source={require("@/assets/images/rento-logo-blue.jpg")}
        resizeMode="cover"
        className="w-full h-full items-center justify-center"
      >
        <CustomButton
          title="Khám phá ngay"
          iconRight={<AntDesign name="arrowright" size={24} color="white" />}
          containerStyles={`w-1/2 absolute bottom-24 mb-5`}
          onPress={() => router.push("/signup")}
        />
      </ImageBackground>
    </SafeAreaView>
  );
};

export default WelcomeScreen;

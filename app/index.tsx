import {View, ImageBackground} from "react-native";
import React, {useEffect, useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import {Redirect, router} from "expo-router";
import useAuthStore from "@/stores/authStore";
import useRentoData from "@/stores/dataStore";

const WelcomeScreen = () => {
    const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
    return (
        <>
            {isLoggedIn ? (
                <Redirect href="/home"/>
            ) : (
                <SafeAreaView className="flex-1">
                    <ImageBackground
                        source={require("@/assets/images/rento-logo-blue.jpg")}
                        resizeMode="cover"
                        className="w-full h-full items-center justify-center"
                    >
                        <View className={`gap-5 w-1/2 absolute bottom-24 mb-5`}>
                            <CustomButton
                                title="Đăng nhập"
                                textStyles="text-white"
                                onPress={() => router.push("/login")}
                            />
                            <CustomButton
                                title="Đăng ký"
                                outline
                                onPress={() => router.push("/signup")}
                            />
                        </View>

                    </ImageBackground>
                </SafeAreaView>
            )}
        </>
    );
};

export default WelcomeScreen;

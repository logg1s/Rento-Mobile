import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import Oauth from "@/components/Oauth";
import { Link, router } from "expo-router";
import useAuthStore from "@/stores/authStore";

const Login = () => {
  const [isHidingPw, setIsHidingPw] = useState(true);
  const [formLogin, setFormLogin] = useState({
    email: "",
    password: "",
  });
  const handleLogin = async () => {
    try {
      const result = await useAuthStore
        .getState()
        .login(formLogin.email, formLogin.password);

      if (result.success) {
        router.replace("/(tabs)/home");
      } else if (result.status === 1) {
        router.push({
          pathname: "/verify-email",
          params: { email: formLogin.email },
        });
      }
    } catch (error) {
      Alert.alert("Lỗi", "Email hoặc mật khẩu không chính xác");
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="p-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </TouchableOpacity>
        <View className="p-3 gap-5">
          <View className="gap-1 mt-5">
            <Text className="font-pbold text-4xl ">Đăng nhập tài khoản</Text>
            <Text className="font-pmedium text-lg text-secondary-700">
              Truy cập vào ứng dụng bằng tài khoản
            </Text>
          </View>
          <View className="my-7 gap-5">
            <InputField
              nameField="Email"
              placeholder="Nhập địa chỉ email"
              iconLeft={<Ionicons name="mail" size={20} color="gray" />}
              onChangeText={(e) =>
                setFormLogin((prev) => ({ ...prev, email: e }))
              }
            />
            <InputField
              nameField="Password"
              placeholder="Nhập password"
              secureTextEntry={isHidingPw}
              onChangeText={(e) =>
                setFormLogin((prev) => ({ ...prev, password: e }))
              }
              iconLeft={<Ionicons name="lock-closed" size={20} color="gray" />}
              iconRight={
                <Ionicons
                  name={`${isHidingPw ? "eye" : "eye-off"}`}
                  size={20}
                  color="gray"
                  onPress={() => setIsHidingPw((prevState) => !prevState)}
                />
              }
            />
            <Link href={"/(auth)/forgot-pw"}>
              <Text className="font-pmedium text-right text-secondary-900">
                Quên mật khẩu?
              </Text>
            </Link>
          </View>
          <View className="gap-10">
            <CustomButton title="Đăng nhập" onPress={handleLogin} />
            <View className="flex-row items-center gap-5">
              <View className="flex-1 h-[1px] bg-gray-400 text-secondary-800"></View>
              <Text className="font-pregular">Hoặc đăng nhập với</Text>
              <View className="flex-1 h-[1px] bg-gray-400"></View>
            </View>
            <Oauth rightText="Đăng nhập với Google" />
            <Text className="font-pmedium text-center text-secondary-800">
              Bạn chưa có tài khoản?{" "}
              <Link href={"/(auth)/signup"}>
                <Text className="font-pbold text-secondary-900 underline">
                  Đăng ký ngay
                </Text>
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Login;

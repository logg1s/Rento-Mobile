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
  const login = useAuthStore((state) => state.login);
  // TODO: write logic login
  const handleLogin = async () => {
    const success = await login(formLogin.email, formLogin.password);
    if (success) {
      router.replace("/(tabs)/home");
    } else {
      Alert.alert("Lỗi", "Sai email hoặc mật khẩu");
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
            <Oauth />
            <Text className="font-pmedium text-center text-secondary-800">
              Bạn chưa có tài khoản?{" "}
              <Link href={"/(auth)/signup"} replace>
                <Text className="font-pbold text-secondary-900">
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

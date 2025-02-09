import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import Oauth from "@/components/Oauth";
import { Link, router } from "expo-router";
const SignUp = () => {
  const [isHidingPw, setIsHidingPw] = useState(false);
  const [formSignUp, setFormSignUp] = useState({
    name: "",
    email: "",
    password: "",
  });
  // TODO: write logic sign up
  const handleSignUp = () => {};
  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="p-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </TouchableOpacity>
        <View className="p-3 gap-5">
          <View className="gap-1 mt-5">
            <Text className="font-pbold text-4xl ">Đăng ký tài khoản</Text>
            <Text className="font-pmedium text-lg text-secondary-700">
              Điền đầy đủ thông tin hoặc sử dụng tài khoản ứng dụng được hỗ trợ
            </Text>
          </View>
          <View className="my-7 gap-5">
            <InputField
              nameField="Họ tên"
              placeholder="Nhập họ tên"
              iconLeft={<Ionicons name="person" size={20} color="gray" />}
              onChangeText={(e) =>
                setFormSignUp((prev) => ({ ...prev, name: e }))
              }
            />
            <InputField
              nameField="Email"
              placeholder="Nhập địa chỉ email"
              iconLeft={<Ionicons name="mail" size={20} color="gray" />}
              onChangeText={(e) =>
                setFormSignUp((prev) => ({ ...prev, email: e }))
              }
            />
            <InputField
              nameField="Password"
              placeholder="Nhập password"
              secureTextEntry={isHidingPw}
              iconLeft={<Ionicons name="lock-closed" size={20} color="gray" />}
              iconRight={
                <Ionicons
                  name={`${isHidingPw ? "eye" : "eye-off"}`}
                  size={20}
                  color="gray"
                  onPress={() => setIsHidingPw((prevState) => !prevState)}
                />
              }
              onChangeText={(e) =>
                setFormSignUp((prev) => ({ ...prev, password: e }))
              }
            />
            <Link href={"/(auth)/forgot-pw"}>
              <Text className="font-pmedium text-right text-secondary-900">
                Quên mật khẩu?
              </Text>
            </Link>
          </View>
          <View className="gap-10">
            <CustomButton title="Đăng ký" onPress={handleSignUp} />
            <Oauth />
            <Text
              className="font-pmedium text-center text-secondary-800"
              style={{ paddingBottom: 60 }}
            >
              Bạn đã có tài khoản?{" "}
              <Link href={"/(auth)/login"} replace>
                <Text className="font-pbold text-secondary-900">
                  Đăng nhập ngay
                </Text>
              </Link>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;

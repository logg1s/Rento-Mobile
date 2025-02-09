import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import Oauth from "@/components/Oauth";
import { Link } from "expo-router";
const SignUp = () => {
  const [isHidingPw, setIsHidingPw] = useState(false);
  return (
    <SafeAreaView className="flex-1 p-5 bg-general-500">
      <View className="gap-1">
        <Text className="font-pbold text-4xl ">Đăng ký tài khoản</Text>
        <Text className="font-pmedium text-lg text-secondary-700">
          Điền đầy đủ thông tin hoặc sử dụng tài khoản ứng dụng được hỗ trợ
        </Text>
      </View>
      <View className="mt-7 mb-10 gap-5">
        <InputField
          nameField="Họ tên"
          placeholder="Nhập họ tên"
          iconLeft={<Ionicons name="person" size={20} color="gray" />}
        />
        <InputField
          nameField="Email"
          placeholder="Nhập địa chỉ email"
          iconLeft={<Ionicons name="mail" size={20} color="gray" />}
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
        />
        <TouchableOpacity>
          <Text className="font-pmedium text-right text-secondary-900">
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>
      </View>
      <View className="gap-10">
        <CustomButton title="Đăng ký" />
        <Oauth />
        <Text className="font-pmedium text-center text-secondary-800">
          Bạn đã có tài khoản?{" "}
          <Link href={"/(auth)/login"}>
            <Text className="font-pbold text-secondary-900">
              Đăng nhập ngay
            </Text>
          </Link>
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default SignUp;

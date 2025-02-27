import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
const ForgotPassword = () => {
  // TODO: write logic handle recover password
  const [email, setEmail] = useState("");
  const handleRecoverPw = () => {};
  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="p-5">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} />
        </TouchableOpacity>
        <View className="p-3 gap-5">
          <View className="gap-1 mt-5">
            <Text className="font-pbold text-4xl ">Quên mật khẩu</Text>
            <Text className="font-pmedium text-lg text-secondary-700">
              Điền thông tin để lấy lại mật khẩu
            </Text>
          </View>
          <View className="my-7 gap-5">
            <InputField
              nameField="Email"
              placeholder="Nhập địa chỉ email"
              iconLeft={<Ionicons name="mail" size={20} color="gray" />}
              onChangeText={(e) => setEmail(e)}
            />
          </View>
          <View className="gap-10">
            <CustomButton title="Lấy lại mật khẩu" onPress={handleRecoverPw} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ForgotPassword;

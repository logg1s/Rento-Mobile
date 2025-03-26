import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import { router, useLocalSearchParams } from "expo-router";
import { Rules } from "@/types/type";
import useAuthStore from "@/stores/authStore";
import { twMerge } from "tailwind-merge";

const VerifyEmail = () => {
  const { email } = useLocalSearchParams();
  const [verificationCode, setVerificationCode] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(2);

  const rules: Rules = {
    code: [
      {
        isValid: /^\d{6}$/.test(verificationCode),
        message: "Mã xác thực phải là 6 chữ số",
      },
    ],
  };

  const isValidate = Object.values(rules).every((rule) =>
    rule.every((r) => r.isValid)
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!canResend && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [canResend, countdown]);

  const handleVerifyCode = async () => {
    try {
      const result = await useAuthStore
        .getState()
        .verifyEmailCode(email as string, verificationCode);

      if (result.success) {
        Alert.alert("Thành công", "Đăng ký tài khoản thành công!", [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Mã xác thực không chính xác"
      );
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      const result = await useAuthStore
        .getState()
        .resendVerificationCode(email as string);

      if (result?.status === 200) {
        setCanResend(false);
        setCountdown(60);
        Alert.alert("Thành công", "Đã gửi lại mã xác thực");
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể gửi lại mã xác thực"
      );
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
            <Text className="font-pbold text-4xl">Xác thực email</Text>
            <Text className="font-pmedium text-lg text-secondary-700">
              Vui lòng nhập mã xác thực đã được gửi đến email của bạn
            </Text>
          </View>
          <View className="my-7 gap-5">
            <InputField
              nameField="Mã xác thực"
              placeholder="Nhập mã 6 chữ số"
              iconLeft={<Ionicons name="key" size={20} color="gray" />}
              rules={rules.code}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyBoardType="number-pad"
              maxLength={6}
            />

            <CustomButton
              title="Xác nhận"
              onPress={handleVerifyCode}
              containerStyles={`${isValidate ? "bg-primary-500" : "bg-primary-400"}`}
              isDisabled={!isValidate}
            />

            <View className="flex-row justify-center items-center gap-2">
              <Text className="font-pmedium text-secondary-800">
                Không nhận được mã?
              </Text>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={!canResend}
                className={twMerge(
                  "justify-center items-center",
                  !canResend && "opacity-50"
                )}
              >
                <Text className="font-pbold text-secondary-900">
                  {canResend
                    ? "Gửi lại"
                    : `Đợi ${countdown} giây để gửi lại mã`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VerifyEmail;

import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import { router } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { Rules } from "@/types/type";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const rules: Rules = {
    email: [
      {
        isValid:
          email.trim().length >= 5 &&
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email),
        message: "Email không hợp lệ",
      },
    ],
    code: [
      {
        isValid: /^\d{6}$/.test(verificationCode),
        message: "Mã xác thực phải là 6 chữ số",
      },
    ],
    password: [
      {
        isValid: newPassword.length >= 8,
        message: "Mật khẩu phải có ít nhất 8 ký tự",
      },
    ],
    confirmPassword: [
      {
        isValid: newPassword === confirmPassword,
        message: "Mật khẩu xác nhận không khớp",
      },
    ],
  };

  const isEmailValid = rules.email.every((rule) => rule.isValid);
  const isVerificationValid =
    rules.code.every((rule) => rule.isValid) &&
    rules.password.every((rule) => rule.isValid) &&
    rules.confirmPassword.every((rule) => rule.isValid);

  React.useEffect(() => {
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

  const handleRecoverPw = async () => {
    try {
      if (!isVerifying) {
        const success = await useAuthStore.getState().forgotPassword(email);
        if (success) {
          setIsVerifying(true);
          setCanResend(false);
          setCountdown(60);
          Alert.alert(
            "Thành công",
            "Mã xác thực đã được gửi đến email của bạn"
          );
        }
      } else {
        const success = await useAuthStore
          .getState()
          .verifyForgotPassword(email, verificationCode, newPassword);
        if (success) {
          Alert.alert("Thành công", "Đặt lại mật khẩu thành công!", [
            {
              text: "OK",
              onPress: () => router.replace("/login"),
            },
          ]);
        }
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"
      );
    }
  };

  const handleResendCode = async () => {
    try {
      const success = await useAuthStore.getState().forgotPassword(email);
      if (success) {
        setCanResend(false);
        setCountdown(60);
        Alert.alert("Thành công", "Mã xác thực đã được gửi lại");
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"
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
            <Text className="font-pbold text-4xl ">Quên mật khẩu</Text>
            <Text className="font-pmedium text-lg text-secondary-700">
              {isVerifying
                ? "Nhập mã xác thực và mật khẩu mới"
                : "Điền thông tin để lấy lại mật khẩu"}
            </Text>
          </View>
          <View className="my-7 gap-5">
            {!isVerifying ? (
              <InputField
                nameField="Email"
                placeholder="Nhập địa chỉ email"
                iconLeft={<Ionicons name="mail" size={20} color="gray" />}
                onChangeText={(e) => setEmail(e)}
                value={email}
                rules={rules.email}
              />
            ) : (
              <>
                <InputField
                  nameField="Mã xác thực"
                  placeholder="Nhập mã xác thực"
                  iconLeft={<Ionicons name="key" size={20} color="gray" />}
                  onChangeText={(e) => setVerificationCode(e)}
                  value={verificationCode}
                  keyBoardType="numeric"
                  rules={rules.code}
                />
                <InputField
                  nameField="Mật khẩu mới"
                  placeholder="Nhập mật khẩu mới"
                  iconLeft={
                    <Ionicons name="lock-closed" size={20} color="gray" />
                  }
                  onChangeText={(e) => setNewPassword(e)}
                  value={newPassword}
                  secureTextEntry
                  rules={rules.password}
                />
                <InputField
                  nameField="Xác nhận mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới"
                  iconLeft={
                    <Ionicons name="lock-closed" size={20} color="gray" />
                  }
                  onChangeText={(e) => setConfirmPassword(e)}
                  value={confirmPassword}
                  secureTextEntry
                  rules={rules.confirmPassword}
                />
              </>
            )}
          </View>
          <View className="gap-10">
            <CustomButton
              title={isVerifying ? "Đặt lại mật khẩu" : "Gửi mã xác thực"}
              onPress={handleRecoverPw}
              isDisabled={!isVerifying ? !isEmailValid : !isVerificationValid}
            />
            {isVerifying && (
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={!canResend}
                className={`items-center ${!canResend ? "opacity-50" : ""}`}
              >
                <Text className="text-blue-500">
                  {canResend
                    ? "Gửi lại mã xác thực"
                    : `Đợi ${countdown} giây để gửi lại mã`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ForgotPassword;

import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import { SelectList } from "react-native-dropdown-select-list";

import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import Oauth from "@/components/Oauth";
import { Link, router } from "expo-router";
import { Role } from "@/types/type";
import { axiosFetch } from "@/stores/dataStore";
import useAuthStore from "@/stores/authStore";
import { debounce, set } from "lodash";

type Rules = {
  [key: string]: { isValid: boolean; message: string }[];
};

const SignUp = () => {
  const [isHidingPw, setIsHidingPw] = useState(true);
  const [secondPhase, setSecondPhase] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [isNotExistEmail, setIsNotExistEmail] = useState(true);

  const [formSignUp, setFormSignUp] = useState({
    name: "",
    email: "",
    password: "",
    phone_number: "",
    role: "user",
  });
  const rules1: Rules = {
    name: [
      {
        isValid: formSignUp.name.trim().length >= 4,
        message: "Họ tên phải có ít nhất 4 ký tự",
      },
    ],
    email: [
      {
        isValid:
          formSignUp.email.trim().length >= 5 &&
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formSignUp.email),
        message: "Email không hợp lệ",
      },

      {
        isValid: isNotExistEmail,
        message: "Email đã tồn tại",
      },
    ],
    password: [
      {
        isValid: formSignUp.password.length >= 8,
        message: "Mật khẩu phải có ít nhất 8 ký tự",
      },
    ],
  };

  const rules2: Rules = {
    phone_number: [
      {
        isValid: /([0-9]{10})\b/.test(formSignUp.phone_number.trim()),
        message: "Số điện thoại không hợp lệ",
      },
    ],
  };

  const checkEmail = async (email: string) => {
    try {
      const result = await axiosFetch("/auth/checkEmail", "POST", { email });
      return result?.status === 200;
    } catch (error) {
      console.log("Error check email:", error?.response?.data);
      return false;
    }
  };

  const debouncedCheckEmail = debounce(async (email: string) => {
    try {
      const isNotExist = await checkEmail(email);
      setIsNotExistEmail(isNotExist);
      console.log(isNotExist);
    } catch (error) {
      console.log("Error in debounced check:", error);
    }
  }, 500);

  const isValidatePhase1 = Object.values(rules1).every((rule) =>
    rule.every((r) => r.isValid)
  );
  const isValidatePhase2 = Object.values(rules2).every((rule) =>
    rule.every((r) => r.isValid)
  );
  const isValidate = isValidatePhase2 && isValidatePhase1;

  // TODO: write logic sign up
  const handleSignUp = async () => {
    if (!secondPhase) {
      setSecondPhase(true);
      return;
    }
    try {
      console.log(formSignUp);
      const result = await axiosFetch("/auth/register", "POST", formSignUp);
      const accessToken = result?.data?.access_token;
      if (accessToken) {
        console.log(accessToken);
        await useAuthStore.getState().setToken(accessToken);
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      Alert.alert(
        "Lỗi khi đăng ký",
        "Đăng ký không thành công, vui lòng kiểm tra lại kết nối"
      );
      console.log("Error sign up:", error?.response?.data);
    }
  };

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setFormSignUp((prev) => ({ ...prev, role }));
  };
  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="p-5">
        <TouchableOpacity
          onPress={() => {
            if (secondPhase) {
              setSecondPhase(false);
            } else router.back();
          }}
        >
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
            {!secondPhase ? (
              <>
                <InputField
                  nameField="Họ tên"
                  placeholder="Nhập họ tên"
                  iconLeft={<Ionicons name="person" size={20} color="gray" />}
                  rules={rules1.name}
                  value={formSignUp.name}
                  onChangeText={(e) =>
                    setFormSignUp((prev) => ({ ...prev, name: e }))
                  }
                />
                <InputField
                  nameField="Email"
                  placeholder="Nhập địa chỉ email"
                  iconLeft={<Ionicons name="mail" size={20} color="gray" />}
                  value={formSignUp.email}
                  rules={rules1.email}
                  onChangeText={(e) => {
                    setFormSignUp((prev) => ({ ...prev, email: e }));
                    if (rules1.email.every((r) => r.isValid)) {
                      debouncedCheckEmail(e);
                    } else {
                      setIsNotExistEmail(true);
                    }
                  }}
                />
                <InputField
                  nameField="Password"
                  placeholder="Nhập password"
                  rules={rules1.password}
                  value={formSignUp.password}
                  secureTextEntry={isHidingPw}
                  iconLeft={
                    <Ionicons name="lock-closed" size={20} color="gray" />
                  }
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
              </>
            ) : (
              <>
                <InputField
                  nameField="Số điện thoại"
                  placeholder="Nhập số điện thoại"
                  iconLeft={<Ionicons name="person" size={20} color="gray" />}
                  rules={rules2.phone_number}
                  value={formSignUp.phone_number}
                  onChangeText={(e) =>
                    setFormSignUp((prev) => ({ ...prev, phone_number: e }))
                  }
                />
                <Text className="font-psemibold text-xl">
                  Vai trò bạn mong muốn
                </Text>
                <View className="flex-row gap-5 mb-5">
                  <CustomButton
                    title="Thuê dịch vụ"
                    outline={selectedRole !== "user"}
                    onPress={() => handleSelectRole("user")}
                    containerStyles={`${selectedRole !== "user" ? "bg-red-500" : ""}`}
                  />
                  <CustomButton
                    title="Cung cấp dịch vụ"
                    outline={selectedRole !== "provider"}
                    onPress={() => handleSelectRole("provider")}
                  />
                </View>

                <CustomButton
                  title="Đăng ký"
                  onPress={handleSignUp}
                  containerStyles={`${isValidate ? "bg-primary-500" : "bg-primary-400"}`}
                  isDisabled={!isValidate}
                />
              </>
            )}
          </View>
          <View className="gap-10">
            {!secondPhase && (
              <>
                <CustomButton
                  title="Tiếp tục đăng ký"
                  onPress={handleSignUp}
                  containerStyles={`${isValidatePhase1 ? "bg-primary-500" : "bg-primary-400"}`}
                  isDisabled={!isValidatePhase1}
                />
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
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;

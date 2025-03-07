import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import { SelectList } from "react-native-dropdown-select-list";

import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import Oauth from "@/components/Oauth";
import { Link, router } from "expo-router";
import { Role, Rules } from "@/types/type";
import { axiosFetch } from "@/stores/dataStore";
import useAuthStore from "@/stores/authStore";
import { debounce, set } from "lodash";
import { twMerge } from "tailwind-merge";

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
    address: "",
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
    address: [
      {
        isValid: formSignUp.phone_number.trim().length > 0,
        message: "Địa chỉ không được để trống",
      },
    ],
  };

  const checkEmail = async (email: string) => {
    try {
      const result = await axiosFetch("/auth/checkEmail", "POST", { email });
      return result?.status === 200;
    } catch (error) {
      console.error("Error check email:", error?.response?.data);
      return false;
    }
  };

  const debouncedCheckEmail = debounce(async (email: string) => {
    try {
      const isNotExist = await checkEmail(email);
      setIsNotExistEmail(isNotExist);
    } catch (error) {
      console.error("Error in debounced check:", error);
    }
  }, 500);

  const isValidatePhase1 = Object.values(rules1).every((rule) =>
    rule.every((r) => r.isValid)
  );
  const isValidatePhase2 = Object.values(rules2).every((rule) =>
    rule.every((r) => r.isValid)
  );
  const isValidate = isValidatePhase2 && isValidatePhase1;

  useEffect(() => {
    if (rules1.email.every((r) => r.isValid)) {
      debouncedCheckEmail(formSignUp.email);
    } else {
      setIsNotExistEmail(true);
    }
  }, [formSignUp.email]);

  // TODO: write logic sign up
  const handleSignUp = async () => {
    if (!secondPhase) {
      setSecondPhase(true);
      return;
    }
    try {
      const result = await axiosFetch("/auth/register", "POST", formSignUp);
      if (result?.status === 200) {
        useAuthStore.getState().setTempPassword(formSignUp.password);
        router.push({
          pathname: "/verify-email",
          params: { email: formSignUp.email },
        });
      }
    } catch (error) {
      Alert.alert(
        "Lỗi khi đăng ký",
        "Đăng ký không thành công, vui lòng kiểm tra lại kết nối"
      );
      console.error("Error sign up:", error?.response?.data);
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
            {/* <Text className="font-pmedium text-lg text-secondary-700"> */}
            {/*   Điền đầy đủ thông tin hoặc sử dụng tài khoản ứng dụng được hỗ trợ */}
            {/* </Text> */}
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
                <InputField
                  nameField="Địa chỉ"
                  placeholder="Nhập địa chỉ"
                  iconLeft={<Ionicons name="location" size={20} color="gray" />}
                  rules={rules2.address}
                  value={formSignUp.address}
                  onChangeText={(e) =>
                    setFormSignUp((prev) => ({ ...prev, address: e }))
                  }
                  canEmpty={false}
                />
                <Text className="font-psemibold text-xl">
                  Vai trò bạn mong muốn
                </Text>
                <View className="flex-row gap-5 mb-5">
                  <CustomButton
                    title="Thuê dịch vụ"
                    outline={selectedRole !== "user"}
                    onPress={() => handleSelectRole("user")}
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
                <View
                  className={twMerge("flex-row justify-center items-center")}
                >
                  <Text className="font-pmedium text-center text-secondary-800 justify-center items-center">
                    Bạn đã có tài khoản?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.back()}
                    className={twMerge("justify-center items-center")}
                  >
                    <Text className="font-pbold text-secondary-900">
                      Đăng nhập ngay
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;

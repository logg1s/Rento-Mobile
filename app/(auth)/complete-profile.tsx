import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import { Role, Rules } from "@/types/type";
import useRentoData from "@/stores/dataStore";
import { twMerge } from "tailwind-merge";

const CompleteProfile = () => {
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [formData, setFormData] = useState({
    phone_number: "",
    address: "",
    role: "user" as Role,
  });

  const update = useRentoData((state) => state.update);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true
    );

    return () => backHandler.remove();
  }, []);

  const rules: Rules = {
    phone_number: [
      {
        isValid: /([0-9]{10,})\b/.test(formData.phone_number.trim()),
        message: "Số điện thoại không hợp lệ",
      },
    ],
    address: [
      {
        isValid: formData.address.trim().length > 0,
        message: "Địa chỉ không được để trống",
      },
    ],
  };

  const isValidate = Object.values(rules).every((rule) =>
    rule.every((r) => r.isValid)
  );

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleUpdateProfile = async () => {
    try {
      const success = await update({
        phone_number: formData.phone_number.trim(),
        address: formData.address.trim(),
        role: selectedRole,
      });

      if (success) {
        router.replace("/(tabs)/home");
      } else {
        Alert.alert(
          "Lỗi khi cập nhật",
          "Cập nhật thông tin không thành công, vui lòng thử lại"
        );
      }
    } catch (error) {
      Alert.alert(
        "Lỗi khi cập nhật",
        "Cập nhật thông tin không thành công, vui lòng thử lại"
      );
      console.error("Error update profile:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <ScrollView className="p-5">
        <View className="p-3 gap-5">
          <View className="gap-1 mt-5">
            <Text className="font-pbold text-4xl">Hoàn thiện thông tin</Text>
            <Text className="font-pmedium text-lg text-secondary-700">
              Vui lòng cập nhật thông tin để tiếp tục sử dụng ứng dụng
            </Text>
          </View>
          <View className="my-7 gap-5">
            <InputField
              nameField="Số điện thoại"
              placeholder="Nhập số điện thoại"
              iconLeft={<Ionicons name="call" size={20} color="gray" />}
              rules={rules.phone_number}
              value={formData.phone_number}
              onChangeText={(e) =>
                setFormData((prev) => ({ ...prev, phone_number: e }))
              }
            />
            <InputField
              nameField="Địa chỉ"
              placeholder="Nhập địa chỉ"
              iconLeft={<Ionicons name="location" size={20} color="gray" />}
              rules={rules.address}
              value={formData.address}
              onChangeText={(e) =>
                setFormData((prev) => ({ ...prev, address: e }))
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
              title="Cập nhật thông tin"
              onPress={handleUpdateProfile}
              containerStyles={`${isValidate ? "bg-primary-500" : "bg-primary-400"}`}
              isDisabled={!isValidate}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompleteProfile;

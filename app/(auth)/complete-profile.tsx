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
import LocationInputField from "@/components/LocationInputField";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomButton from "@/components/CustomButton";
import { Role, Rules, Province } from "@/types/type";
import useRentoData from "@/stores/dataStore";
import { twMerge } from "tailwind-merge";

const CompleteProfile = () => {
  const [selectedRole, setSelectedRole] = useState<Role>("user");
  const [formData, setFormData] = useState({
    phone_number: "",
    address: "",
    role: "user" as Role,
    lat: null as number | null,
    lng: null as number | null,
    real_location_name: "",
    province_id: null as number | null,
  });

  // Theo dõi dữ liệu vị trí đầy đủ
  const [locationData, setLocationData] = useState({
    lat: null as number | null,
    lng: null as number | null,
    province: null as Province | null,
    detailedAddress: "",
    real_location_name: "",
    province_id: null as number | null,
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

  // Xử lý khi vị trí thay đổi từ LocationInputField
  const handleLocationChange = (data: {
    province: any | null;
    detailedAddress: string | null;
    latitude: number | null;
    longitude: number | null;
    formattedAddress?: string | null;
    province_id?: number | null;
    address?: string | null;
  }) => {
    setLocationData({
      lat: data.latitude,
      lng: data.longitude,
      province: data.province,
      detailedAddress: data.detailedAddress || data.address || "",
      real_location_name: data.formattedAddress || "",
      province_id: data.province_id || null,
    });

    // Cập nhật form với dữ liệu vị trí mới
    setFormData((prev) => ({
      ...prev,
      lat: data.latitude,
      lng: data.longitude,
      address: data.detailedAddress || data.address || "",
      real_location_name:
        data.formattedAddress || data.detailedAddress || data.address || "",
      province_id: data.province_id || null,
    }));
  };

  const handleLocationSelected = (data: {
    lat: number;
    lng: number;
    address: string;
    formattedAddress?: string;
    province_id?: number | null;
  }) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          lat: data.lat,
          lng: data.lng,
          address: data.address,
          real_location_name: data.formattedAddress || data.address,
          province_id: data.province_id || null,
        }) as typeof prev
    );
  };

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
        lat: formData.lat,
        lng: formData.lng,
        real_location_name: formData.real_location_name,
        province_id: formData.province_id,
      });

      if (success) {
        if (selectedRole === "provider") {
          router.replace("/provider/dashboard");
        } else {
          router.replace("/(tabs)/home");
        }
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
              keyBoardType="number-pad"
            />
            <LocationInputField
              nameField="Địa chỉ"
              placeholder="Nhập địa chỉ"
              iconLeft={<Ionicons name="location" size={20} color="gray" />}
              rules={rules.address}
              value={formData.address}
              onChangeText={(e) =>
                setFormData((prev) => ({ ...prev, address: e }))
              }
              onLocationSelected={handleLocationSelected}
              onLocationChange={handleLocationChange}
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

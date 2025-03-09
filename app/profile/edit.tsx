"use client";

import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";
import InputField from "@/components/InputField";
import LocationInputField from "@/components/LocationInputField";
import { Rules, Province } from "@/types/type";
import { useLocationStore } from "@/stores/locationStore";

const EditProfileScreen = () => {
  const user = useRentoData((state) => state.user);
  const updateProfile = useRentoData((state) => state.update);
  const { provinces } = useLocationStore();

  const [form, setForm] = useState({
    name: user?.name ?? "",
    phone_number: user?.phone_number ?? "",
    address: user?.address ?? "",
    lat: user?.location?.lat ?? null,
    lng: user?.location?.lng ?? null,
    real_location_name: user?.location?.real_location_name ?? "",
    province_id: user?.location?.province_id ?? null,
  });

  // Theo dõi dữ liệu vị trí đầy đủ
  const [locationData, setLocationData] = useState({
    lat: user?.location?.lat ?? null,
    lng: user?.location?.lng ?? null,
    province: null as Province | null,
    detailedAddress: user?.address ?? "",
    real_location_name: user?.location?.real_location_name ?? "",
    province_id: user?.location?.province_id ?? null,
  });

  // Log dữ liệu người dùng để debug
  useEffect(() => {
    // Xử lý khi user thay đổi
  }, [user]);

  // Chuẩn bị initialProvince từ user.location và danh sách provinces
  const initialProvince = useMemo(() => {
    if (!user?.location?.province_id) return null;

    // Tìm tỉnh chính xác từ danh sách provinces dựa vào province_id
    const provinceFromList = provinces.find(
      (p: Province) => p.id === user.location?.province_id
    );

    if (provinceFromList) {
      // Nếu tìm thấy, sử dụng thông tin từ danh sách provinces
      return provinceFromList;
    }

    // Fallback: Tạo đối tượng Province từ dữ liệu có sẵn nếu không tìm thấy trong danh sách
    const province: Province = {
      id: user.location.province_id,
      // Sử dụng location_name nếu không tìm được tên chính xác
      name: user.location.location_name || "",
      code: "UNKNOWN", // Giá trị mặc định vì backend không trả về code
    };

    return province;
  }, [user, provinces]);

  const rules: Rules = {
    name: [
      {
        isValid: form.name.trim().length >= 4,
        message: "Họ tên phải có ít nhất 4 ký tự",
      },
    ],
    phone_number: [
      {
        isValid: /([0-9]{10})\b/.test(form.phone_number.trim()),
        message: "Số điện thoại không hợp lệ",
      },
    ],
    address: [
      {
        isValid: form.address.trim().length > 0,
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
    // Đảm bảo province_id được cập nhật từ province nếu có
    const province_id =
      data.province_id !== undefined
        ? data.province_id
        : data.province?.id || null;

    // Tìm tỉnh chính xác từ danh sách provinces nếu có province_id
    let provinceName = "";
    if (province_id) {
      const foundProvince = provinces.find(
        (p: Province) => p.id === province_id
      );
      if (foundProvince) {
        provinceName = foundProvince.name;
      }
    }

    // Nếu không tìm thấy tên tỉnh từ danh sách, sử dụng tên từ data hoặc location_name
    if (!provinceName) {
      if (data.province?.name) {
        provinceName = data.province.name;
      } else if (data.detailedAddress) {
        provinceName = data.detailedAddress;
      }
    }

    setLocationData({
      lat: data.latitude,
      lng: data.longitude,
      province: data.province,
      detailedAddress: data.detailedAddress || data.address || "",
      real_location_name: data.formattedAddress || provinceName || "",
      province_id: province_id,
    });

    // Cập nhật form với dữ liệu vị trí mới
    setForm((prev) => ({
      ...prev,
      lat: data.latitude,
      lng: data.longitude,
      address: data.detailedAddress || data.address || "",
      real_location_name:
        data.formattedAddress ||
        provinceName ||
        data.detailedAddress ||
        data.address ||
        "",
      province_id: province_id,
    }));
  };

  const handleLocationSelected = (data: {
    lat: number;
    lng: number;
    address: string;
    formattedAddress?: string;
    province_id?: number | null;
  }) => {
    // Đảm bảo province_id từ dữ liệu được sử dụng
    const province_id =
      data.province_id !== undefined ? data.province_id : null;

    // Tìm tên tỉnh chính xác từ danh sách provinces nếu có province_id
    let provinceName = "";
    if (province_id) {
      const foundProvince = provinces.find(
        (p: Province) => p.id === province_id
      );
      if (foundProvince) {
        provinceName = foundProvince.name;
      }
    }

    setForm((prev) => ({
      ...prev,
      lat: data.lat,
      lng: data.lng,
      address: data.address,
      real_location_name: data.formattedAddress || provinceName || data.address,
      province_id: province_id,
    }));
  };

  const handleSubmit = async () => {
    if (!isValidate) return;

    const success = await updateProfile({
      name: form.name.trim(),
      phone_number: form.phone_number.trim(),
      address: form.address.trim(),
      lat: form.lat,
      lng: form.lng,
      real_location_name: form.real_location_name,
      province_id: form.province_id,
    });

    if (success) {
      Alert.alert("Thành công", "Cập nhật thông tin thành công");
      Keyboard.dismiss();
    } else {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold">Chỉnh sửa thông tin</Text>
        <View style={{ width: 24 }} />
      </View>

      <View className="gap-5">
        <InputField
          nameField="Họ tên"
          placeholder="Nhập họ tên"
          iconLeft={<Ionicons name="person" size={20} color="gray" />}
          rules={rules.name}
          value={form.name}
          onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
        />

        <InputField
          nameField="Số điện thoại"
          placeholder="Nhập số điện thoại"
          iconLeft={<Ionicons name="call" size={20} color="gray" />}
          rules={rules.phone_number}
          value={form.phone_number}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, phone_number: text }))
          }
          keyBoardType="phone-pad"
          canEmpty={false}
        />

        <LocationInputField
          nameField="Địa chỉ"
          placeholder="Nhập địa chỉ"
          iconLeft={<Ionicons name="location" size={20} color="gray" />}
          rules={rules.address}
          value={form.address}
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, address: text }))
          }
          onLocationSelected={handleLocationSelected}
          onLocationChange={handleLocationChange}
          initialAddress={user?.address || null}
          initialProvince={initialProvince}
        />
        <View className="flex-row justify-around">
          <TouchableOpacity
            onPress={handleSubmit}
            className={`py-3 px-4 rounded-lg mt-6 ${
              isValidate ? "bg-primary-500" : "bg-primary-400"
            }`}
            disabled={!isValidate}
          >
            <Text className="text-white text-center font-pbold text-lg">
              Cập nhật thông tin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className={`py-3 px-6 rounded-lg mt-6 bg-white border border-primary-500`}
          >
            <Text className="text-black text-center font-pbold text-lg">
              Hủy
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

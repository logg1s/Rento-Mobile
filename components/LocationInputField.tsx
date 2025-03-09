import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocationStore, Province } from "../stores/locationStore";
import ProvinceSelect from "./ProvinceSelect";
import InputField from "./InputField";

// Định nghĩa kiểu dữ liệu cho rule validation
export type ValidationRule = {
  isValid: boolean;
  message: string;
}[];

interface LocationInputFieldProps {
  // Props cho component
  nameField?: string;
  placeholder?: string;
  iconLeft?: React.ReactNode;
  value?: string;
  onChangeText?: (text: string) => void;
  required?: boolean;
  rules?: ValidationRule;
  canEmpty?: boolean;

  // Props cho xử lý vị trí
  initialProvince?: Province | null;
  initialAddress?: string | null;
  autoFetchLocation?: boolean;

  // Callbacks
  onLocationChange?: (data: {
    province: Province | null;
    detailedAddress: string | null;
    latitude: number | null;
    longitude: number | null;
    formattedAddress?: string | null;
  }) => void;
  onLocationSelected?: (data: {
    lat: number;
    lng: number;
    address: string;
    formattedAddress?: string;
  }) => void;
}

const LocationInputField = ({
  // Props cho component
  nameField = "Vị trí",
  placeholder = "Nhập địa chỉ",
  iconLeft,
  value,
  onChangeText,
  required = false,
  rules = [],
  canEmpty = true,

  // Props cho xử lý vị trí
  initialProvince = null,
  initialAddress = null,
  autoFetchLocation = false,

  // Callbacks
  onLocationChange,
  onLocationSelected,
}: LocationInputFieldProps) => {
  const {
    provinces,
    loadingProvinces,
    getCurrentLocation,
    loading: loadingLocation,
    latitude,
    longitude,
    fetchProvinces,
    error,
    formatAddress,
  } = useLocationStore();

  const [province, setProvince] = useState<Province | null>(initialProvince);
  const [detailedAddress, setDetailedAddress] = useState<string | null>(
    initialAddress || value || null
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formattedAddressData, setFormattedAddressData] = useState<
    string | null
  >(null);

  // Tải danh sách tỉnh thành khi component khởi tạo
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        await fetchProvinces();
      } catch (err) {
        console.error("Lỗi khi tải tỉnh thành:", err);
        setFetchError("Không thể tải danh sách tỉnh thành");
      }
    };

    loadProvinces();
  }, []);

  // Tự động lấy vị trí khi component khởi tạo nếu có yêu cầu
  useEffect(() => {
    if (autoFetchLocation) {
      handleGetCurrentLocation();
    }
  }, [autoFetchLocation]);

  // Thông báo thay đổi khi có cập nhật
  useEffect(() => {
    if (onLocationChange) {
      onLocationChange({
        province,
        detailedAddress,
        latitude,
        longitude,
        formattedAddress: formattedAddressData,
      });
    }

    // Gọi callback onLocationSelected nếu có đủ thông tin
    if (onLocationSelected && latitude && longitude && detailedAddress) {
      onLocationSelected({
        lat: latitude,
        lng: longitude,
        address: detailedAddress,
        formattedAddress: formattedAddressData || undefined,
      });
    }
  }, [province, detailedAddress, latitude, longitude, formattedAddressData]);

  // Cập nhật detailedAddress khi value thay đổi từ bên ngoài
  useEffect(() => {
    if (value !== undefined) {
      setDetailedAddress(value);
    }
  }, [value]);

  // Hiển thị lỗi khi có thông báo lỗi
  useEffect(() => {
    if (error) {
      setFetchError(error);
    }
  }, [error]);

  // Xử lý lấy vị trí hiện tại
  const handleGetCurrentLocation = async () => {
    setFetchError(null);
    try {
      const locationData = await getCurrentLocation();
      if (locationData && locationData.province) {
        setProvince(locationData.province);

        // Sử dụng formattedAddress làm detailedAddress nếu có
        if (locationData.formattedAddress) {
          setDetailedAddress(locationData.formattedAddress);
          setFormattedAddressData(locationData.formattedAddress);
        } else {
          setDetailedAddress(locationData.detailedAddress);
          setFormattedAddressData(locationData.address);
        }

        // Gọi callback onChangeText nếu có
        if (onChangeText) {
          onChangeText(
            locationData.formattedAddress || locationData.detailedAddress || ""
          );
        }

        console.log("Đã nhận vị trí:", locationData);
      } else if (locationData) {
        // Có tọa độ nhưng không có tỉnh thành, vẫn lấy địa chỉ

        // Sử dụng formattedAddress làm detailedAddress nếu có
        if (locationData.formattedAddress) {
          setDetailedAddress(locationData.formattedAddress);
          setFormattedAddressData(locationData.formattedAddress);
        } else {
          setDetailedAddress(locationData.detailedAddress);
          setFormattedAddressData(locationData.address);
        }

        // Gọi callback onChangeText nếu có
        if (onChangeText) {
          onChangeText(
            locationData.formattedAddress || locationData.detailedAddress || ""
          );
        }

        Alert.alert(
          "Thông báo",
          "Đã lấy được vị trí nhưng không thể xác định tỉnh/thành phố. Vui lòng chọn tỉnh/thành phố thủ công."
        );
      } else {
        Alert.alert(
          "Lỗi",
          "Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập vị trí và thử lại."
        );
      }
    } catch (err) {
      console.error("Lỗi khi lấy vị trí:", err);
      setFetchError("Không thể lấy vị trí hiện tại");
    }
  };

  // Xử lý khi người dùng nhập địa chỉ
  const handleAddressChange = (text: string) => {
    setDetailedAddress(text);
    setFormattedAddressData(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  // Tạo địa chỉ đầy đủ từ tỉnh và địa chỉ chi tiết
  const getFullAddress = () => {
    const components = [detailedAddress, province?.name].filter(Boolean);
    return components.join(", ");
  };

  return (
    <View className="space-y-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-psemibold text-xl text-secondary-900">
          {nameField} {required && <Text className="text-red-500">*</Text>}
        </Text>
        <TouchableOpacity
          onPress={handleGetCurrentLocation}
          disabled={loadingLocation}
          className="flex-row items-center bg-primary-50 px-3 py-1 rounded-full"
        >
          <Ionicons name="location" size={16} color="#0891B2" />
          <Text className="text-primary-600 font-pmedium ml-1">
            {loadingLocation ? "Đang lấy vị trí..." : "Vị trí hiện tại"}
          </Text>
        </TouchableOpacity>
      </View>

      {fetchError && <Text className="text-red-500 text-sm">{fetchError}</Text>}

      <ProvinceSelect
        nameField="Tỉnh/Thành phố"
        placeholder="Chọn tỉnh/thành phố"
        value={province}
        onSelect={setProvince}
        provinces={provinces}
        isLoading={loadingProvinces}
        required={required}
      />

      <InputField
        nameField="Địa chỉ chi tiết"
        placeholder={
          placeholder ||
          "Nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện)"
        }
        value={detailedAddress || ""}
        onChangeText={handleAddressChange}
        multiline={true}
        required={required}
        iconLeft={iconLeft}
        rules={rules}
        canEmpty={canEmpty}
      />

      {formattedAddressData && (
        <View className="mt-2">
          <Text className="text-sm text-gray-500">Địa chỉ đầy đủ:</Text>
          <Text className="text-sm text-gray-700">{formattedAddressData}</Text>
        </View>
      )}

      {!formattedAddressData && detailedAddress && province && (
        <View className="mt-2">
          <Text className="text-sm text-gray-500">Địa chỉ đầy đủ:</Text>
          <Text className="text-sm text-gray-700">{getFullAddress()}</Text>
        </View>
      )}
    </View>
  );
};

export default LocationInputField;

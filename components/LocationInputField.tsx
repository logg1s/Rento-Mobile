import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocationStore } from "../stores/locationStore";
import { Province } from "@/types/type";
import ProvinceSelect from "./ProvinceSelect";
import InputField from "./InputField";

export type ValidationRule = {
  isValid: boolean;
  message: string;
}[];

interface LocationInputFieldProps {
  nameField?: string;
  placeholder?: string;
  iconLeft?: React.ReactNode;
  value?: string;
  onChangeText?: (text: string) => void;
  required?: boolean;
  rules?: ValidationRule;
  canEmpty?: boolean;

  initialProvince?: Province | null;
  initialAddress?: string | null;
  autoFetchLocation?: boolean;

  onLocationChange?: (data: {
    province: Province | null;
    detailedAddress: string | null;
    latitude: number | null;
    longitude: number | null;
    formattedAddress?: string | null;
    province_id?: number | null;
    address?: string | null;
  }) => void;
  onLocationSelected?: (data: {
    lat: number;
    lng: number;
    address: string;
    formattedAddress?: string;
    province_id?: number | null;
  }) => void;
}

const LocationInputField = ({
  nameField = "Vị trí",
  placeholder = "Nhập địa chỉ",
  iconLeft,
  value,
  onChangeText,
  required = false,
  rules = [],
  canEmpty = true,

  initialProvince = null,
  initialAddress = null,
  autoFetchLocation = false,

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

  interface LocationData {
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    province: Province | null;
    detailedAddress: string | null;
    formattedAddress?: string | null;
  }

  const [province, setProvince] = useState<Province | null>(initialProvince);
  const [detailedAddress, setDetailedAddress] = useState<string | null>(
    initialAddress || value || null
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formattedAddressData, setFormattedAddressData] = useState<
    string | null
  >(null);

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

  useEffect(() => {
    if (autoFetchLocation) {
      handleGetCurrentLocation();
    }
  }, [autoFetchLocation]);

  useEffect(() => {
    if (onLocationChange) {
      const province_id = province?.id || null;

      const locationData = {
        province,
        detailedAddress,
        latitude,
        longitude,
        formattedAddress: formattedAddressData,
        province_id,
        address: detailedAddress || null,
      };

      onLocationChange(locationData);
    }

    if (onLocationSelected && latitude && longitude && detailedAddress) {
      const locationData = {
        lat: latitude,
        lng: longitude,
        address: detailedAddress,
        formattedAddress: formattedAddressData || undefined,
        province_id: province?.id || null,
      };

      onLocationSelected(locationData);
    }
  }, [province, detailedAddress, latitude, longitude, formattedAddressData]);

  useEffect(() => {
    if (value !== undefined && value !== detailedAddress) {
      setDetailedAddress(value);
    }
  }, [value]);

  useEffect(() => {
    if (initialProvince) {
      const provinceToSet: Province = {
        id: initialProvince.id,
        name: initialProvince.name || "",
        code: initialProvince.code || "UNKNOWN",
      };

      setProvince(provinceToSet);
    } else if (initialProvince === null && province !== null) {
      setProvince(null);
    }
  }, [initialProvince]);

  useEffect(() => {
    if (error) {
      setFetchError(error);
    }
  }, [error]);

  const handleGetCurrentLocation = async () => {
    setFetchError(null);
    try {
      const locationData = (await getCurrentLocation()) as LocationData;

      if (locationData && locationData.province) {
        setProvince(locationData.province);

        const addressToUse =
          locationData.formattedAddress || locationData.detailedAddress;

        setDetailedAddress(addressToUse);

        if (locationData.formattedAddress) {
          setFormattedAddressData(locationData.formattedAddress);
        }

        if (onChangeText) {
          onChangeText(addressToUse || "");
        }
      } else if (locationData) {
        const addressToUse =
          locationData.formattedAddress || locationData.detailedAddress;

        setDetailedAddress(addressToUse);

        if (locationData.formattedAddress) {
          setFormattedAddressData(locationData.formattedAddress);
        }

        if (onChangeText) {
          onChangeText(addressToUse || "");
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

  const handleAddressChange = (text: string) => {
    setDetailedAddress(text);
    setFormattedAddressData(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleProvinceSelect = (selectedProvince: Province | null) => {
    setProvince(selectedProvince);
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
        onSelect={handleProvinceSelect}
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
    </View>
  );
};

export default React.memo(LocationInputField);

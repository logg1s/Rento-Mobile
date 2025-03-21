"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { home_data, price_data } from "@/lib/dummy";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import { Ionicons } from "@expo/vector-icons";
import OrderServiceDetails from "@/components/OrderServiceDetails";
import CustomButton from "@/components/CustomButton";
import { PriceType, Rules, ServiceType } from "@/types/type";
import { axiosFetch } from "@/stores/dataStore";
import useRentoData from "@/stores/dataStore";
import CustomModal from "../components/CustomModal";

const OrderService = () => {
  // TODO: replace with database
  const { id, price_id } = useLocalSearchParams();
  const user = useRentoData((state) => state.user);

  const [formData, setFormData] = useState({
    address: "",
    phone_number: "",
    note: "",
  });

  const applyUserInfo = () => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        address:
          user.location?.location_name ||
          user.location?.real_location_name ||
          user.location?.address ||
          prev.address,
        phone_number: user.phone_number || prev.phone_number,
      }));
    }
  };

  const [service, setService] = useState<ServiceType | null>(null);
  const [price, setPrice] = useState<PriceType | null>(null);

  const fetchData = async () => {
    const [serviceRes, priceRes] = await Promise.all([
      axiosFetch(`/services/get/${id}`),
      axiosFetch(`/prices/${price_id}`),
    ]);
    setService(serviceRes?.data);
    setPrice(priceRes?.data);
  };
  useEffect(() => {
    fetchData();
  }, [id, price_id]);

  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Đặt dịch vụ " + service?.service_name,
    });
  }, [service, navigation]);

  const rules: Rules = {
    phone_number: [
      {
        isValid: /([0-9]{10})\b/.test(formData.phone_number.trim()),
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
  const [modalVisible, setModalVisible] = useState(false);

  const [isValid, setIsValid] = useState(false);
  useEffect(() => {
    const checkValid = Object.keys(rules).every((key) =>
      rules[key].every((rule) => rule.isValid)
    );
    setIsValid(checkValid);
  }, [formData, rules]);

  const handleOrder = async () => {
    if (!isValid) {
      Alert.alert("Thông báo", "Vui lòng điền địa chỉ");
      return;
    }

    try {
      await axiosFetch("/orders", "post", {
        service_id: id,
        price_id: price_id,
        price_final_value: price?.price_value || 0,
        address: formData.address,
        phone_number: formData.phone_number,
        message: formData.note,
      });

      setModalVisible(true);
    } catch (error) {
      Alert.alert("Đặt dịch vụ thất bại", "Vui lòng thử lại sau");
      console.error(error?.response?.data);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    setRefreshing(false);
  }, []);
  return (
    <>
      <ScrollView
        contentContainerClassName="p-5"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-5">
          <OrderServiceDetails service={service} price={price} />

          {((user?.location?.location_name ||
            user?.location?.real_location_name ||
            user?.location?.address ||
            user?.phone_number) ??
          null) ? (
            <View className="bg-primary-100 p-4 rounded-lg">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-pmedium text-base text-primary-900">
                  Thông tin từ tài khoản của bạn
                </Text>
                <TouchableOpacity
                  onPress={applyUserInfo}
                  className="bg-primary-500 p-2 rounded-lg"
                >
                  <Text className="font-pmedium text-white">Áp dụng</Text>
                </TouchableOpacity>
              </View>
              {(user?.location?.location_name ||
                user?.location?.real_location_name ||
                user?.location?.address) && (
                <Text className="text-gray-600 mb-1">
                  Địa chỉ:{" "}
                  {user.location?.location_name ||
                    user?.location?.real_location_name ||
                    user?.location?.address}
                </Text>
              )}
              {user?.phone_number && (
                <Text className="text-gray-600">
                  Số điện thoại: {user.phone_number}
                </Text>
              )}
            </View>
          ) : null}

          <InputField
            nameField="Địa chỉ"
            placeholder="Nhập địa chỉ của bạn"
            iconLeft={<Ionicons name="location" size={20} color="gray" />}
            onChangeText={(e) => setFormData({ ...formData, address: e })}
            rules={rules.address}
            value={formData.address}
            required
            canEmpty={false}
          />

          <InputField
            nameField="Số điện thoại"
            placeholder="Nhập số điện thoại của bạn"
            iconLeft={<Ionicons name="call" size={20} color="gray" />}
            keyBoardType="phone-pad"
            onChangeText={(e) => setFormData({ ...formData, phone_number: e })}
            rules={rules.phone_number}
            value={formData.phone_number}
            required
            canEmpty={false}
          />

          <InputField
            nameField="Ghi chú (không bắt buộc)"
            placeholder="Nhập ghi chú cho người cung cấp dịch vụ"
            iconLeft={<Ionicons name="create" size={20} color="gray" />}
            onChangeText={(e) => setFormData({ ...formData, note: e })}
            value={formData.note}
            enableValidate={false}
          />
        </View>
      </ScrollView>
      <View className="p-5">
        <CustomButton
          title="Đặt dịch vụ"
          onPress={handleOrder}
          containerStyles={`${isValid ? "bg-primary-500" : "bg-primary-400"}`}
        />
      </View>
      <CustomModal
        visible={modalVisible}
        title="Đặt dịch vụ thành công"
        message="Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi"
        type="success"
        onClose={() => {
          setModalVisible(false);
          router.back();
        }}
      />
    </>
  );
};

export default OrderService;

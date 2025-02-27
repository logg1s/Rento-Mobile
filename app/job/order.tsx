"use client";

import { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import {
  router,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { home_data, price_data } from "@/lib/dummy";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import { Ionicons } from "@expo/vector-icons";
import OrderServiceDetails from "@/components/OrderServiceDetails";
import CustomButton from "@/components/CustomButton";
import { PriceType, Rules, ServiceType } from "@/types/type";
import { axiosFetch } from "@/stores/dataStore";

const OrderService = () => {
  // TODO: replace with database
  const { id, price_id } = useLocalSearchParams();

  const [formData, setFormData] = useState({
    address: "",
    phone_number: "",
    note: "",
  });

  const [service, setService] = useState<ServiceType | null>(null);
  const [price, setPrice] = useState<PriceType | null>(null);

  const fetchData = async () => {
    const [serviceRes, priceRes] = await Promise.all([
      axiosFetch(`/services/${id}`),
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
        price_final_value: price?.price_value,
        address: formData.address,
        phone_number: formData.phone_number,
        message: formData.note,
      });

      Alert.alert(
        "Đặt dịch vụ thành công",
        "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi",
        [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)/home"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Đặt dịch vụ thất bại", "Vui lòng thử lại sau");
      console.log(error?.response?.data);
    }
  };

  return (
    <>
      <ScrollView contentContainerClassName="p-5">
        <View className="gap-5">
          <InputField
            nameField="Địa chỉ"
            placeholder="Nhập địa chỉ của bạn"
            iconLeft={<Ionicons name="location" size={20} color="gray" />}
            onChangeText={(e) => setFormData({ ...formData, address: e })}
            rules={rules.address}
            value={formData.address}
          />

          <InputField
            nameField="Số điện thoại"
            placeholder="Nhập số điện thoại của bạn"
            iconLeft={<Ionicons name="call" size={20} color="gray" />}
            keyBoardType="phone-pad"
            onChangeText={(e) => setFormData({ ...formData, phone_number: e })}
            rules={rules.phone_number}
            value={formData.phone_number}
          />

          <InputField
            nameField="Ghi chú (không bắt buộc)"
            placeholder="Nhập ghi chú cho người cung cấp dịch vụ"
            iconLeft={<Ionicons name="create" size={20} color="gray" />}
            onChangeText={(e) => setFormData({ ...formData, note: e })}
            value={formData.note}
          />

          <OrderServiceDetails service={service} price={price} />
        </View>
      </ScrollView>
      <View className="p-5">
        <CustomButton
          title="Đặt dịch vụ"
          onPress={handleOrder}
          containerStyles={`${isValid ? "bg-primary-500" : "bg-primary-400"}`}
        />
      </View>
    </>
  );
};

export default OrderService;

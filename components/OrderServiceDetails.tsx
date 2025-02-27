import { PriceType, ServiceType } from "@/types/type";
import { convertedPrice, formatToVND } from "@/utils/utils";
import React from "react";
import { View, Text } from "react-native";

const OrderServiceDetails = ({
  service,
  price,
}: {
  service: ServiceType | null;
  price: PriceType | null;
}) => {
  return (
    <View className="mt-5">
      <Text className="font-pbold text-xl mb-3">Thông tin đơn hàng</Text>
      <View className="bg-white p-4 rounded-xl">
        <Text className="font-pmedium">Dịch vụ: {service?.service_name}</Text>
        <Text className="font-pmedium">Gói: {price?.price_name}</Text>
        <Text className="font-pmedium">
          Giá: {formatToVND(price?.price_value ?? 0)}
        </Text>
        {/* {priceData.discount && (
          <Text className="font-pmedium text-primary-500">
            Giảm giá: {priceData.discount}%
          </Text>
        )} */}
      </View>
    </View>
  );
};

export default OrderServiceDetails;

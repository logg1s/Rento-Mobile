import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import { OrderCard } from "../OrderCard";
import { ORDER_STATUS_MAP, OrderStatus } from "@/types/type";
import ServiceCard from "../ServiceCard";
import { router } from "expo-router";
import { formatDateToVietnamese, formatToVND } from "@/utils/utils";
import CustomButton from "../CustomButton";

const getStatusConfig = (status: OrderStatus) => {
  return ORDER_STATUS_MAP[status];
};

const CardItemData = ({
  data,
  dataType,
}: {
  data: any[];
  dataType: "order" | "service" | "category";
}) => {
  return (
    <View>
      {dataType === "order" && (
        <View className="p-4 bg-gray-100 rounded-lg gap-2">
          {data.map((item) => (
            <View
              key={item.id}
              className="mb-2 p-3 border border-gray-300 rounded-md bg-white shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-5">
                <View
                  style={[
                    styles.statusContainer,
                    getStatusConfig(item.status).style.container,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      getStatusConfig(item.status).style.text,
                    ]}
                  >
                    {getStatusConfig(item.status).text}
                  </Text>
                </View>
                <Text className="text-sm text-gray-500">
                  {formatDateToVietnamese(new Date(item.created_at))}
                </Text>
              </View>
              <View className=" items-center justify-between">
                <Text className="font-semibold text-lg">
                  Mã đơn dịch vụ: {item.id}
                </Text>
                <Text className="text-sm text-gray-500">
                  Giá: {formatToVND(item?.price_final_value)}
                </Text>
              </View>
            </View>
          ))}

          <CustomButton
            title="Xem chi tiết"
            textStyles="font-regular"
            onPress={() => {
              router.push("/profile/order-history");
            }}
          />
        </View>
      )}
      {dataType === "service" && (
        <View>
          {data.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                router.push({
                  pathname: "/job/[id]",
                  params: {
                    id: item.id,
                  },
                });
              }}
              className="p-4 rounded-xl border border-general-100 bg-white shadow-md shadow-gray-500"
            >
              <Text className="font-psemibold text-lg">
                {item.service_name}
              </Text>
              <Text className="text-sm font-pregular text-gray-500">
                {item.service_description}
              </Text>
              <Text className="text-sm font-pregular text-gray-500">
                {item.price_name
                  ? `${item.price_name}: ${formatToVND(item.price_value)}`
                  : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {dataType === "category" && (
        <View className="gap-2 rounded-xl border border-gray-300 bg-white p-2">
          <View className=" gap-2 rounded-xl  bg-white  p-2 flex-row flex-wrap">
            {data.map((item, index) => (
              <View
                key={index}
                className="rounded-xl border border-gray-300 bg-white  p-2"
              >
                <Text>{item.category_name}</Text>
              </View>
            ))}
          </View>

          <CustomButton
            title="Xem chi tiết"
            textStyles="font-regular"
            onPress={() => {
              router.push("/(tabs)/search");
            }}
          />
        </View>
      )}
    </View>
  );
};

export default CardItemData;

const styles = StyleSheet.create({
  statusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

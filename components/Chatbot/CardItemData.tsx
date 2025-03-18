import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { OrderCard } from "../OrderCard";
import { CategoryType, OrderType, ServiceType } from "@/types/type";
import ServiceCard from "../ServiceCard";
import { router } from "expo-router";
import { convertedPrice, formatToVND } from "@/utils/utils";

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
        <View>
          {data.map((item) => (
            <View key={item.id}>
              <Text>{item.id}</Text>
              <Text>{item.service_id}</Text>
            </View>
          ))}
        </View>
      )}
      {dataType === "service" &&
        data.map((item, index) => (
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
            <Text className="font-psemibold text-lg">{item.service_name}</Text>
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
      {dataType === "category" &&
        data.map((item, index) => (
          <View key={index}>
            <Text>{item.category_name}</Text>
          </View>
        ))}
    </View>
  );
};

export default CardItemData;

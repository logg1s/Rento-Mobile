import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { home_data, price_data } from "@/lib/dummy";

const OrderService = () => {
  const { selectedPricing, id } = useLocalSearchParams();
  const [priceData, setPriceData] = useState(
    price_data[Number.parseInt(selectedPricing)],
  );
  const [homeData, setHomeData] = useState(
    home_data.find((item) => item.id.toString() === id),
  );
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Đặt lịch dịch vụ " + homeData?.service,
    });
  }, []);
  return (
    <View>
      <Text>OrderService</Text>
    </View>
  );
};

export default OrderService;

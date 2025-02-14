"use client";

import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Fontisto, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const PaymentMethodsScreen = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    { id: "1", type: "Visa", last4: "4242", expiryDate: "12/24" },
    { id: "2", type: "Mastercard", last4: "5555", expiryDate: "09/25" },
  ]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between bg-white p-4 mb-4 rounded-lg shadow-sm"
      onPress={() => {
        /* Navigate to edit payment method */
      }}
    >
      <View className="flex-row items-center">
        <Fontisto name={`${item.type === "Visa" ? "visa" : "mastercard"}`} />
        <View>
          <Text className="font-pbold text-lg">{item.type}</Text>
          <Text className="text-gray-600">**** **** **** {item.last4}</Text>
          <Text className="text-gray-600">Hết hạn: {item.expiryDate}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="gray" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 px-4">
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold">Phương thức thanh toán</Text>
        <TouchableOpacity
          onPress={() => {
            /* Navigate to add payment method */
          }}
        >
          <Ionicons name="add" size={24} color="#0286FF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={paymentMethods}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;

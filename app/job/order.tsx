"use client";

import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import {
  home_data,
  price_data,
  dateSlots,
  type TimeSlot,
  type DateSlot,
} from "@/lib/dummy";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { Ionicons } from "@expo/vector-icons";
import { Calendar, LocaleConfig } from "react-native-calendars";

const OrderService = () => {
  // TODO: replace with database
  const { selectedPricing, id } = useLocalSearchParams();
  const [priceData, setPriceData] = useState(
    price_data[Number.parseInt(selectedPricing as string)],
  );
  const [homeData, setHomeData] = useState(
    home_data.find((item) => item.id.toString() === id),
  );
  const [selectedDate, setSelectedDate] = useState<DateSlot | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const navigation = useNavigation();
  const router = useRouter();
  useEffect(() => {
    navigation.setOptions({
      headerTitle: "Đặt lịch dịch vụ " + homeData?.service,
    });
  }, [homeData?.service, navigation]);

  const handleDateSelect = (date: string) => {
    const selectedDateSlot = dateSlots.find((slot) => slot.date === date);
    if (selectedDateSlot && selectedDateSlot.isAvailable) {
      setSelectedDate(selectedDateSlot);
      setSelectedTime(null);
    } else {
      Alert.alert(
        "Thông báo",
        "Ngày này không có sẵn. Vui lòng chọn ngày khác.",
      );
    }
  };

  const handleTimeSelect = (time: TimeSlot) => {
    setSelectedTime(time);
  };

  const handleOrder = () => {
    if (!selectedDate || !selectedTime || !address) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin đặt lịch");
      return;
    }

    Alert.alert(
      "Đặt lịch thành công",
      "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi",
      [
        {
          text: "OK",
          onPress: () => router.push("/(tabs)/home"),
        },
      ],
    );
  };

  const markedDates = dateSlots.reduce((acc, slot) => {
    acc[slot.date] = {
      marked: true,
      dotColor: slot.isAvailable ? "green" : "red",
    };
    return acc;
  }, {});

  return (
    <>
      <ScrollView contentContainerClassName="p-5">
        <View className="gap-5">
          <Text className="font-pbold text-2xl">Chọn ngày và giờ</Text>

          {/* Calendar for Date Selection */}
          <Calendar
            onDayPress={(day) => handleDateSelect(day.dateString)}
            markedDates={{
              ...markedDates,
              [selectedDate?.date || ""]: {
                selected: true,
                selectedColor: "blue",
              },
            }}
            theme={{
              todayTextColor: "#0286FF",
              selectedDayBackgroundColor: "#0286FF",
              selectedDayTextColor: "#ffffff",
            }}
          />

          {/* Time Selection */}
          {selectedDate && (
            <View>
              <Text className="font-pbold text-xl mb-3">Chọn giờ</Text>
              <View className="flex-row flex-wrap justify-between">
                {selectedDate.timeSlots.map((time) => (
                  <TouchableOpacity
                    key={time.id}
                    onPress={() => handleTimeSelect(time)}
                    disabled={!time.isAvailable}
                    className={`w-[30%] p-3 rounded-lg mb-3 ${
                      selectedTime?.id === time.id
                        ? "bg-primary-500"
                        : time.isAvailable
                          ? "bg-white border border-gray-300"
                          : "bg-gray-200"
                    }`}
                  >
                    <Text
                      className={`font-pmedium text-center ${
                        selectedTime?.id === time.id
                          ? "text-white"
                          : time.isAvailable
                            ? "text-black"
                            : "text-gray-500"
                      }`}
                    >
                      {time.time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <InputField
            nameField="Địa chỉ"
            placeholder="Nhập địa chỉ của bạn"
            iconLeft={<Ionicons name="location" size={20} color="gray" />}
            onChangeText={setAddress}
          />

          <InputField
            nameField="Ghi chú (không bắt buộc)"
            placeholder="Nhập ghi chú cho người cung cấp dịch vụ"
            iconLeft={<Ionicons name="create" size={20} color="gray" />}
            onChangeText={setNote}
          />

          <View className="mt-5">
            <Text className="font-pbold text-xl mb-3">Thông tin đơn hàng</Text>
            <View className="bg-white p-4 rounded-xl">
              <Text className="font-pmedium">Dịch vụ: {homeData?.service}</Text>
              <Text className="font-pmedium">Gói: {priceData.name}</Text>
              <Text className="font-pmedium">
                Giá: {priceData.price.toLocaleString("vi-VN")} VND
              </Text>
              {priceData.discount && (
                <Text className="font-pmedium text-primary-500">
                  Giảm giá: {priceData.discount}%
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="p-5">
        <CustomButton
          title="Đặt lịch"
          onPress={handleOrder}
          containerStyles={`${!selectedDate || !selectedTime || !address ? "bg-gray-400" : ""}`}
          disabled={!selectedDate || !selectedTime || !address}
        />
      </View>
    </>
  );
};

export default OrderService;

import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PeriodInfo } from "@/app/types/statistics";

interface StatsHeaderProps {
  periodInfo?: PeriodInfo;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ periodInfo }) => {
  return (
    <View className="bg-primary-500 p-4">
      <Text className="text-2xl font-pbold text-white">Thống kê</Text>
      <View className="flex-row items-center mt-1">
        <Ionicons
          name="calendar-outline"
          size={16}
          color="rgba(255,255,255,0.8)"
        />
        <Text className="text-white opacity-80 font-pmedium ml-1">
          {periodInfo?.start_date || "Đang tải..."} -{" "}
          {periodInfo?.end_date || "Đang tải..."}
        </Text>
      </View>
    </View>
  );
};

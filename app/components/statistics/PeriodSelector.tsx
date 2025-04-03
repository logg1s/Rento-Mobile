import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { StatisticsPeriod } from "@/stores/providerStore";

interface PeriodSelectorProps {
  periods: {
    id: StatisticsPeriod;
    label: string;
  }[];
  selectedPeriod: StatisticsPeriod;
  setSelectedPeriod: (period: StatisticsPeriod) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  periods,
  selectedPeriod,
  setSelectedPeriod,
}) => {
  return (
    <View className="flex-row bg-white p-4 justify-between items-center shadow-sm  my-2 rounded-lg">
      <Text className="font-pbold text-gray-700">Thời gian:</Text>
      <View className="flex-row">
        {periods.map((period) => (
          <TouchableOpacity
            key={period.id}
            onPress={() => setSelectedPeriod(period.id)}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedPeriod === period.id ? "bg-primary-500" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-pmedium ${
                selectedPeriod === period.id ? "text-white" : "text-gray-600"
              }`}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

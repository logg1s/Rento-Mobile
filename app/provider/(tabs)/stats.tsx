import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const StatsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const screenWidth = Dimensions.get("window").width;

  const periods = [
    { id: "week", label: "Tuần" },
    { id: "month", label: "Tháng" },
    { id: "year", label: "Năm" },
  ];

  // Dummy data for charts
  const revenueData = {
    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    datasets: [
      {
        data: [200000, 450000, 280000, 800000, 990000, 430000, 650000],
      },
    ],
  };

  const orderStatusData = [
    {
      name: "Hoàn thành",
      population: 70,
      color: "#4CAF50",
      legendFontColor: "#7F7F7F",
    },
    {
      name: "Đang thực hiện",
      population: 20,
      color: "#2196F3",
      legendFontColor: "#7F7F7F",
    },
    {
      name: "Đã hủy",
      population: 10,
      color: "#F44336",
      legendFontColor: "#7F7F7F",
    },
  ];

  const ratingData = {
    labels: ["1⭐", "2⭐", "3⭐", "4⭐", "5⭐"],
    datasets: [
      {
        data: [2, 5, 8, 24, 48],
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(2, 134, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView>
        {/* Header */}
        <View className="bg-white p-4">
          <Text className="text-2xl font-pbold">Thống kê</Text>
        </View>

        {/* Period Selection */}
        <View className="flex-row bg-white p-4">
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

        {/* Revenue Chart */}
        <View className="bg-white mt-4 p-4">
          <Text className="text-xl font-pbold mb-4">Doanh thu</Text>
          <LineChart
            data={revenueData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            formatYLabel={(value) => Number(value).toLocaleString() + "đ"}
          />
        </View>

        {/* Order Status Chart */}
        <View className="bg-white mt-4 p-4">
          <Text className="text-xl font-pbold mb-4">Trạng thái đơn hàng</Text>
          <PieChart
            data={orderStatusData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>

        {/* Rating Distribution */}
        <View className="bg-white mt-4 p-4 mb-4">
          <Text className="text-xl font-pbold mb-4">Phân bố đánh giá</Text>
          <BarChart
            data={ratingData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;

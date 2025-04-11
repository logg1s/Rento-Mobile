import React from "react";
import { View, Text, ScrollView } from "react-native";
import { PieChart, BarChart, ProgressChart } from "react-native-chart-kit";
import { ProviderStatistics } from "@/app/types/statistics";
import { formatCurrency } from "@/app/utils/formatters";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";

interface CustomersSectionProps {
  stats: ProviderStatistics;
  chartConfig: any;
  screenWidth: number;
}

export const CustomersSection: React.FC<CustomersSectionProps> = ({
  stats,
  chartConfig,
  screenWidth,
}) => {
  // Order value distribution chart
  const distributionLabels =
    stats.customer_insights?.order_value_distribution?.map(
      (item) => item.label
    ) || [];

  // Calculate width for the chart - provide enough space for each category
  const orderValueChartWidth = Math.max(
    screenWidth - 48,
    distributionLabels.length * 80
  );

  const orderValueData = {
    labels: distributionLabels,
    datasets: [
      {
        data: stats.customer_insights?.order_value_distribution?.map(
          (item) => Number(item.count) || 0
        ) || [0],
      },
    ],
  };

  // Ratings distribution chart
  const ratingLabels = ["1 ⭐", "2 ⭐", "3 ⭐", "4 ⭐", "5 ⭐"];

  // Rating chart needs at least 60px per rating
  const ratingChartWidth = Math.max(screenWidth - 48, ratingLabels.length * 60);

  const ratingValues = [
    Number(stats.customer_insights?.rating_distribution?.["1"]) || 0,
    Number(stats.customer_insights?.rating_distribution?.["2"]) || 0,
    Number(stats.customer_insights?.rating_distribution?.["3"]) || 0,
    Number(stats.customer_insights?.rating_distribution?.["4"]) || 0,
    Number(stats.customer_insights?.rating_distribution?.["5"]) || 0,
  ];

  const ratingData = {
    labels: ratingLabels,
    datasets: [
      {
        data: ratingValues,
        color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
      },
    ],
  };

  // Customer loyalty chart
  const loyaltyData = {
    labels: ["Khách hàng mới", "Khách hàng quay lại"],
    data: [
      stats.customer_insights?.total_customers > 0
        ? (stats.customer_insights.total_customers -
            (stats.customer_insights.repeat_customers || 0)) /
          stats.customer_insights.total_customers
        : 0,
      stats.customer_insights?.total_customers > 0
        ? (stats.customer_insights.repeat_customers || 0) /
          stats.customer_insights.total_customers
        : 0,
    ],
  };

  return (
    <>
      {/* Customer Overview */}
      <View className="bg-white mt-2 p-4 rounded-lg shadow-sm">
        <Text className="text-xl font-pbold text-gray-800 mb-3">
          Tổng quan khách hàng
        </Text>

        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-blue-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Tổng khách hàng
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {stats.customer_insights?.total_customers || 0}
              </Text>
            </View>
          </View>

          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-green-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Khách hàng quay lại
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {stats.customer_insights?.repeat_customers || 0} (
                {stats.customer_insights?.repeat_rate || 0}%)
              </Text>
            </View>
          </View>

          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-yellow-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                LTV (Giá trị vòng đời)
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {formatCurrency(stats.summary?.customer_lifetime_value || 0)}
              </Text>
            </View>
          </View>

          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-purple-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Đánh giá trung bình
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {stats.summary?.average_rating || 0} ⭐
              </Text>
            </View>
          </View>
        </View>

        {/* Customer loyalty chart */}
        <View className="mt-4">
          <Text className="text-lg font-pbold text-gray-800 mb-2">
            Tỷ lệ khách hàng quay lại
          </Text>

          {(stats.customer_insights?.total_customers || 0) > 0 ? (
            <View className="items-center">
              <ProgressChart
                data={loyaltyData}
                width={screenWidth - 48}
                height={140}
                strokeWidth={16}
                radius={32}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                  strokeWidth: 2,
                }}
                hideLegend={false}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          ) : (
            <View className="h-[140] justify-center items-center">
              <Text className="text-gray-500 font-pmedium">
                Không có dữ liệu khách hàng
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Order Value Distribution */}
      <View className="bg-white mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-xl font-pbold text-gray-800 mb-3">
          Phân bố giá trị đơn dịch vụ
        </Text>

        {(stats.customer_insights?.order_value_distribution?.length || 0) >
        0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <BarChart
              data={orderValueData}
              width={orderValueChartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              showValuesOnTopOfBars
              fromZero
              showBarTops
              yAxisLabel=""
              yAxisSuffix=""
            />
          </ScrollView>
        ) : (
          <View className="h-[220] justify-center items-center">
            <Text className="text-gray-500 font-pmedium">
              Không có dữ liệu đơn dịch vụ
            </Text>
          </View>
        )}
      </View>

      {/* Ratings Distribution */}
      <View className="bg-white mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-xl font-pbold text-gray-800 mb-3">
          Phân bố đánh giá
        </Text>

        {ratingValues.some((value) => value > 0) ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <BarChart
              data={ratingData}
              width={ratingChartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              showValuesOnTopOfBars
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
            />
          </ScrollView>
        ) : (
          <View className="h-[220] justify-center items-center">
            <Text className="text-gray-500 font-pmedium">
              Không có dữ liệu đánh giá
            </Text>
          </View>
        )}

        {/* Customer satisfaction insights */}
        {(stats.summary?.average_rating || 0) > 0 && (
          <View className="mt-4 bg-gray-50 p-3 rounded-lg">
            <Text className="font-pbold text-gray-700 mb-2">
              Mức độ hài lòng của khách hàng
            </Text>

            <View className="flex-row items-center mt-2">
              <View className="flex-1 h-3 bg-gray-200 rounded-full">
                <View
                  className={`h-3 rounded-full ${
                    (stats.summary?.average_rating || 0) >= 4.5
                      ? "bg-green-500"
                      : (stats.summary?.average_rating || 0) >= 4.0
                        ? "bg-green-400"
                        : (stats.summary?.average_rating || 0) >= 3.5
                          ? "bg-yellow-400"
                          : (stats.summary?.average_rating || 0) >= 3.0
                            ? "bg-yellow-500"
                            : "bg-red-500"
                  }`}
                  style={{
                    width: `${((stats.summary?.average_rating || 0) / 5) * 100}%`,
                  }}
                />
              </View>
              <Text className="ml-3 font-pbold text-gray-700">
                {stats.summary?.average_rating}/5
              </Text>
            </View>

            <View className="flex-row mt-3">
              <View className="flex-1 items-center">
                <FontAwesome
                  name="smile-o"
                  size={24}
                  color={
                    (stats.summary?.average_rating || 0) >= 4.0
                      ? "#10b981"
                      : "#9ca3af"
                  }
                />
                <Text className="text-xs mt-1 text-gray-500">Hài lòng</Text>
              </View>
              <View className="flex-1 items-center">
                <FontAwesome
                  name="meh-o"
                  size={24}
                  color={
                    (stats.summary?.average_rating || 0) >= 3.0 &&
                    (stats.summary?.average_rating || 0) < 4.0
                      ? "#f59e0b"
                      : "#9ca3af"
                  }
                />
                <Text className="text-xs mt-1 text-gray-500">Bình thường</Text>
              </View>
              <View className="flex-1 items-center">
                <FontAwesome
                  name="frown-o"
                  size={24}
                  color={
                    (stats.summary?.average_rating || 0) < 3.0
                      ? "#ef4444"
                      : "#9ca3af"
                  }
                />
                <Text className="text-xs mt-1 text-gray-500">
                  Không hài lòng
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

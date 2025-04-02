import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { formatCurrency } from "@/app/utils/formatters";
import { ProviderStatistics } from "@/app/types/statistics";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

interface RevenueSectionProps {
  stats: ProviderStatistics;
  chartConfig: any;
  screenWidth: number;
}

export const RevenueSection: React.FC<RevenueSectionProps> = ({
  stats,
  chartConfig,
  screenWidth,
}) => {
  // Calculate width based on data length - minimum width is screen width
  // For longer data sets, we make the chart wider to allow scrolling
  const chartWidth = Math.max(
    screenWidth - 48,
    stats.revenue.labels.length * 60
  );

  // Ensure we have valid data by forcing number conversion
  const numericRevenueData = stats.revenue.data.map((val) => Number(val) || 0);
  const hasRevenueData = numericRevenueData.some((value) => value > 0);

  // Check for raw revenue data from the debugging properties
  const hasRawRevenueData = (stats.revenue as any).raw_revenue_count > 0;
  const rawTotalRevenue = (stats.revenue as any).raw_total_revenue || 0;

  const revenueData = {
    labels: stats.revenue.labels,
    datasets: [
      {
        data: numericRevenueData.length ? numericRevenueData : [0],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Doanh thu"],
  };

  // Calculate a total in case the backend total is incorrect
  // First try the provided total, then raw total, then sum of data
  const calculatedTotal = numericRevenueData.reduce(
    (sum, value) => sum + value,
    0
  );
  const displayTotal =
    stats.revenue.total > 0
      ? stats.revenue.total
      : rawTotalRevenue > 0
        ? rawTotalRevenue
        : calculatedTotal;

  return (
    <>
      {/* Revenue Chart */}
      <View className="bg-white mt-2 p-4 rounded-lg shadow-sm">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl font-pbold text-gray-800">Doanh thu</Text>
          <View className="flex-row items-center">
            <Text className="text-primary-500 font-pbold text-lg mr-2">
              {formatCurrency(displayTotal)}
            </Text>
            <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
              <Ionicons
                name={
                  stats.revenue.trend >= 0 ? "trending-up" : "trending-down"
                }
                size={16}
                color={stats.revenue.trend >= 0 ? "#10b981" : "#ef4444"}
              />
              <Text
                className={`ml-1 ${stats.revenue.trend >= 0 ? "text-green-500" : "text-red-500"} font-pmedium text-xs`}
              >
                {stats.revenue.trend >= 0 ? "+" : ""}
                {Math.abs(stats.revenue.trend).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {hasRevenueData ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <LineChart
              data={revenueData}
              width={chartWidth}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              withDots={false}
              withInnerLines={true}
              withOuterLines={false}
              yAxisSuffix="đ"
              formatYLabel={(value) => {
                const num = parseInt(value);
                if (num >= 1000000) {
                  return (num / 1000000).toFixed(1) + "tr";
                } else if (num >= 1000) {
                  return (num / 1000).toFixed(0) + "k";
                }
                return value;
              }}
            />
          </ScrollView>
        ) : (
          <View className="h-[220] justify-center items-center">
            <Text className="text-gray-500 font-pmedium">Không đủ dữ liệu</Text>
          </View>
        )}
      </View>

      {/* Revenue Insights */}
      <View className="bg-white mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-pbold text-gray-800 mb-3">
          Thông tin chi tiết
        </Text>

        <View className="flex-row flex-wrap mt-2">
          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-blue-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Doanh thu TB/ngày
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {formatCurrency(stats.revenue.daily_average || 0)}
              </Text>
            </View>
          </View>

          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-green-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Đơn hàng có doanh thu
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {stats.orders.completed || 0} đơn
              </Text>
            </View>
          </View>

          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-yellow-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Doanh thu cao nhất
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {formatCurrency(stats.revenue.max_revenue?.value || 0)}
              </Text>
              {stats.revenue.max_revenue?.date && (
                <Text className="text-xs text-gray-500 mt-1">
                  Ngày {stats.revenue.max_revenue.date}
                </Text>
              )}
            </View>
          </View>

          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-purple-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Giá trị đơn TB
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {formatCurrency(stats.summary.average_order_value || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Comparison with previous period */}
        {stats.comparison?.revenue && (
          <View className="mt-2 bg-gray-50 rounded-lg p-3">
            <Text className="font-pmedium text-gray-700 mb-2">
              So với kỳ trước
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-blue-500 mr-2"></View>
                <Text className="text-gray-600">Kỳ hiện tại</Text>
              </View>
              <Text className="font-pbold">
                {formatCurrency(stats.comparison.revenue.current_value || 0)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-gray-400 mr-2"></View>
                <Text className="text-gray-600">Kỳ trước</Text>
              </View>
              <Text className="font-pbold">
                {formatCurrency(stats.comparison.revenue.previous_value || 0)}
              </Text>
            </View>
            <View className="mt-2 pt-2 border-t border-gray-200 flex-row items-center">
              <Ionicons
                name={
                  stats.comparison.revenue.is_positive
                    ? "trending-up"
                    : "trending-down"
                }
                color={
                  stats.comparison.revenue.is_positive ? "#10b981" : "#ef4444"
                }
                size={16}
              />
              <Text
                className={`ml-1 font-pbold ${
                  stats.comparison.revenue.is_positive
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stats.comparison.revenue.is_positive ? "+" : ""}
                {stats.comparison.revenue.growth_percentage || 0}%
              </Text>
              <Text className="ml-1 text-gray-500">so với kỳ trước</Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

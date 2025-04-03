import React from "react";
import { View, Text, ScrollView } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { ProviderStatistics } from "@/app/types/statistics";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

interface OrdersSectionProps {
  stats: ProviderStatistics;
  chartConfig: any;
  screenWidth: number;
}

export const OrdersSection: React.FC<OrdersSectionProps> = ({
  stats,
  chartConfig,
  screenWidth,
}) => {
  // Calculate width based on data length - minimum width is screen width
  const chartWidth = Math.max(
    screenWidth - 48,
    stats.orders.trends.labels.length * 60
  );

  // Ensure we have valid data for order trends
  const numericOrderData = (stats.orders.trends.data || []).map(
    (val) => Number(val) || 0
  );
  const numericCompletedData = (stats.orders.trends.completed || []).map(
    (val) => Number(val) || 0
  );
  const hasOrderTrendData =
    numericOrderData.some((value) => value > 0) ||
    numericCompletedData.some((value) => value > 0);

  const orderStatusData = [
    {
      name: "Hoàn thành",
      population: stats.orders.completed || 0,
      color: "#10b981",
      legendFontColor: "#7f7f7f",
    },
    {
      name: "Đang thực hiện",
      population: stats.orders.in_progress || 0,
      color: "#3b82f6",
      legendFontColor: "#7f7f7f",
    },
    {
      name: "Đang chờ",
      population: stats.orders.pending || 0,
      color: "#f59e0b",
      legendFontColor: "#7f7f7f",
    },
    {
      name: "Đã hủy",
      population: stats.orders.cancelled || 0,
      color: "#ef4444",
      legendFontColor: "#7f7f7f",
    },
  ].filter((item) => item.population > 0);

  const orderTrendsData = {
    labels: stats.orders.trends.labels,
    datasets: [
      {
        data: numericOrderData.length ? numericOrderData : [0],
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: numericCompletedData.length ? numericCompletedData : [0],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ["Tổng đơn", "Hoàn thành"],
  };

  return (
    <>
      {/* Order Status */}
      <View className="bg-white mt-2 p-4 rounded-lg shadow-sm">
        <Text className="text-xl font-pbold text-gray-800 mb-3">
          Trạng thái đơn dịch vụ
        </Text>

        {stats.orders.total > 0 ? (
          <PieChart
            data={orderStatusData}
            width={screenWidth - 48}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        ) : (
          <View className="h-[220] justify-center items-center">
            <Text className="text-gray-500 font-pmedium">
              Không có đơn dịch vụ
            </Text>
          </View>
        )}

        {/* Stats summary */}
        <View className="flex-row flex-wrap justify-between mt-4 bg-gray-50 p-3 rounded-lg">
          <View className="p-2 w-1/2">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
              <Text className="font-pmedium text-gray-700">Hoàn thành:</Text>
            </View>
            <Text className="text-gray-900 font-pbold ml-5">
              {stats.orders.completed || 0}
            </Text>
          </View>

          <View className="p-2 w-1/2">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
              <Text className="font-pmedium text-gray-700">
                Đang thực hiện:
              </Text>
            </View>
            <Text className="text-gray-900 font-pbold ml-5">
              {stats.orders.in_progress || 0}
            </Text>
          </View>

          <View className="p-2 w-1/2">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
              <Text className="font-pmedium text-gray-700">Đang chờ:</Text>
            </View>
            <Text className="text-gray-900 font-pbold ml-5">
              {stats.orders.pending || 0}
            </Text>
          </View>

          <View className="p-2 w-1/2">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
              <Text className="font-pmedium text-gray-700">Đã hủy:</Text>
            </View>
            <Text className="text-gray-900 font-pbold ml-5">
              {stats.orders.cancelled || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Order Trends */}
      <View className="bg-white mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-xl font-pbold text-gray-800 mb-3">
          Xu hướng đơn dịch vụ
        </Text>

        {hasOrderTrendData ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <LineChart
              data={orderTrendsData}
              width={chartWidth}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              withDots={false}
              withInnerLines={true}
              withOuterLines={false}
            />
          </ScrollView>
        ) : (
          <View className="h-[220] justify-center items-center">
            <Text className="text-gray-500 font-pmedium">Không đủ dữ liệu</Text>
          </View>
        )}
      </View>

      {/* Order Insights */}
      <View className="bg-white mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-pbold text-gray-800 mb-3">
          Thông tin chi tiết
        </Text>

        <View className="flex-row flex-wrap mt-2">
          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-blue-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Đơn hàng TB/ngày
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {(stats.orders.daily_average || 0).toFixed(1)} đơn
              </Text>
            </View>
          </View>

          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-green-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Tỷ lệ hoàn thành
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {stats.orders.completion_rate || 0}%
              </Text>
            </View>
          </View>

          <View className="w-1/2 pr-2 mb-3">
            <View className="bg-yellow-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Ngày cao điểm
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {stats.orders.busiest_day || "N/A"}{" "}
                {stats.orders.busiest_day && (
                  <Text className="text-sm text-gray-500 mt-1 font-pmedium">
                    ({stats.orders.max_orders || 0} đơn)
                  </Text>
                )}
              </Text>
            </View>
          </View>

          <View className="w-1/2 pl-2 mb-3">
            <View className="bg-red-50 rounded-lg p-3">
              <Text className="text-gray-500 font-pmedium text-xs mb-1">
                Tỷ lệ hủy đơn
              </Text>
              <Text className="text-base font-pbold text-gray-800">
                {stats.orders.cancellation_rate || 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Comparison with previous period */}
        {stats.comparison?.orders && (
          <View className="mt-2 bg-gray-50 rounded-lg p-3">
            <Text className="font-pmedium text-gray-700 mb-2">
              So với kỳ trước
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-orange-500 mr-2"></View>
                <Text className="text-gray-600">Kỳ hiện tại</Text>
              </View>
              <Text className="font-pbold">
                {stats.comparison.orders.current_value || 0} đơn
              </Text>
            </View>
            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-gray-400 mr-2"></View>
                <Text className="text-gray-600">Kỳ trước</Text>
              </View>
              <Text className="font-pbold">
                {stats.comparison.orders.previous_value || 0} đơn
              </Text>
            </View>
            <View className="mt-2 pt-2 border-t border-gray-200 flex-row items-center">
              <Ionicons
                name={
                  stats.comparison.orders.is_positive
                    ? "trending-up"
                    : "trending-down"
                }
                color={
                  stats.comparison.orders.is_positive ? "#10b981" : "#ef4444"
                }
                size={16}
              />
              <Text
                className={`ml-1 font-pbold ${
                  stats.comparison.orders.is_positive
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {stats.comparison.orders.is_positive ? "+" : ""}
                {stats.comparison.orders.growth_percentage || 0}%
              </Text>
              <Text className="ml-1 text-gray-500">so với kỳ trước</Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

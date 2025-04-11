import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { ProviderStatistics, StatisticsService } from "@/app/types/statistics";
import { formatCurrency } from "@/app/utils/formatters";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface ServiceSpecificStatsProps {
  service: StatisticsService;
  stats: ProviderStatistics;
  chartConfig: any;
  screenWidth: number;
  activeTab: string; // Which tab we're currently on: 'revenue', 'orders', etc.
}

export const ServiceSpecificStats: React.FC<ServiceSpecificStatsProps> = ({
  service,
  stats,
  chartConfig,
  screenWidth,
  activeTab,
}) => {
  // Create mock data based on general stats but scaled to this service
  // In a real app, this would be fetched from the backend

  const generateServiceRevenueData = () => {
    if (!stats.revenue.data.length) return { labels: [], data: [] };

    // Create a scaled-down version of revenue data specific to this service
    const total = stats.revenue.total || 1;
    const serviceTotal = service.revenue || 0;
    const ratio = serviceTotal / total;

    return {
      labels: stats.revenue.labels,
      data: stats.revenue.data.map((value) => Math.round(value * ratio)),
    };
  };

  const generateServiceOrdersData = () => {
    if (!stats.orders.trends.data.length) return { labels: [], data: [] };

    // Create a scaled-down version of order data specific to this service
    const totalOrders = stats.orders.total || 1;
    const serviceOrders = service.order_count || 0;
    const ratio = serviceOrders / totalOrders;

    return {
      labels: stats.orders.trends.labels,
      data: stats.orders.trends.data.map((value) => Math.round(value * ratio)),
    };
  };

  const revenueData = generateServiceRevenueData();
  const ordersData = generateServiceOrdersData();

  const renderRevenueStats = () => {
    const chartWidth = Math.max(
      screenWidth - 48,
      revenueData.labels.length * 60
    );

    const lineChartData = {
      labels: revenueData.labels,
      datasets: [
        {
          data: revenueData.data.length ? revenueData.data : [0],
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: [`Doanh thu - ${service.name}`],
    };

    // Calculate average service revenue per day
    const avgServiceRevenue =
      revenueData.data.reduce((sum, val) => sum + val, 0) /
      Math.max(revenueData.data.filter((v) => v > 0).length, 1);

    return (
      <View className="mt-3">
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-pbold text-gray-800 mb-3">
            Doanh thu từ {service.name}
          </Text>

          {revenueData.data.some((val) => val > 0) ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <LineChart
                data={lineChartData}
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
              <Text className="text-gray-500 font-pmedium">
                Không đủ dữ liệu
              </Text>
            </View>
          )}

          {/* Revenue Insights */}
          <View className="flex-row flex-wrap mt-3">
            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-blue-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Tổng doanh thu
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {formatCurrency(service.revenue || 0)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-green-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Doanh thu TB/ngày
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {formatCurrency(avgServiceRevenue || 0)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-yellow-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  TB/đơn dịch vụ
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {formatCurrency(service.revenue_per_order || 0)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-purple-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  % Tổng doanh thu
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {stats.revenue.total
                    ? Math.round((service.revenue / stats.revenue.total) * 100)
                    : 0}
                  %
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderOrderStats = () => {
    const chartWidth = Math.max(
      screenWidth - 48,
      ordersData.labels.length * 60
    );

    const barChartData = {
      labels: ordersData.labels,
      datasets: [
        {
          data: ordersData.data.length ? ordersData.data : [0],
          color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
        },
      ],
    };

    return (
      <View className="mt-3">
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-pbold text-gray-800 mb-3">
            Đơn dịch vụ từ {service.name}
          </Text>

          {ordersData.data.some((val) => val > 0) ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <BarChart
                data={barChartData}
                width={chartWidth}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                showValuesOnTopOfBars
                withInnerLines={true}
                fromZero
                yAxisSuffix=""
                yAxisLabel=""
              />
            </ScrollView>
          ) : (
            <View className="h-[220] justify-center items-center">
              <Text className="text-gray-500 font-pmedium">
                Không đủ dữ liệu
              </Text>
            </View>
          )}

          {/* Order Insights */}
          <View className="flex-row flex-wrap mt-3">
            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-blue-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Tổng đơn dịch vụ
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {service.order_count || 0}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-green-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  % Tổng đơn dịch vụ
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {stats.orders.total
                    ? Math.round(
                        (service.order_count / stats.orders.total) * 100
                      )
                    : 0}
                  %
                </Text>
              </View>
            </View>

            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-yellow-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Đánh giá
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {service.average_rating
                    ? service.average_rating.toFixed(1)
                    : "0"}{" "}
                  ⭐
                </Text>
                <Text className="text-xs text-gray-500">
                  ({service.review_count || 0} đánh giá)
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-purple-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Doanh thu
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {formatCurrency(service.revenue || 0)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCustomerStats = () => {
    return (
      <View className="mt-3">
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-pbold text-gray-800 mb-3">
            Khách hàng của dịch vụ {service.name}
          </Text>

          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-blue-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Đánh giá
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {service.average_rating
                    ? service.average_rating.toFixed(1)
                    : "0"}{" "}
                  ⭐
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-green-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Số đánh giá
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {service.review_count || 0}
                </Text>
              </View>
            </View>

            <View className="w-full mb-3">
              <View className="bg-yellow-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Tỷ lệ hài lòng
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {service.average_rating && service.average_rating >= 4
                    ? Math.round((service.average_rating / 5) * 100)
                    : "0"}
                  %
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Text className="text-center text-gray-500">
              Đang phát triển thêm thống kê chi tiết về khách hàng
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderServiceDetails = () => {
    return (
      <View className="mt-3">
        <View className="bg-white p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-pbold text-gray-800 mb-3">
            Chi tiết dịch vụ {service.name}
          </Text>

          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-blue-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Doanh thu
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {formatCurrency(service.revenue || 0)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-green-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Số đơn
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {service.order_count || 0}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-yellow-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Giá TB/đơn
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {formatCurrency(service.revenue_per_order || 0)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-purple-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Tỷ lệ lợi nhuận
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {(service.profit_margin || 0).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 p-3 border border-gray-200 rounded-lg">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-700 font-pmedium">Giá cơ bản:</Text>
              <Text className="text-gray-800 font-pbold">
                {formatCurrency(service.base_price || 0)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Decide which section to render based on active tab
  if (activeTab === "revenue") {
    return renderRevenueStats();
  } else if (activeTab === "orders") {
    return renderOrderStats();
  } else if (activeTab === "customers") {
    return renderCustomerStats();
  } else if (activeTab === "services") {
    return renderServiceDetails();
  }

  // Default rendering
  return renderServiceDetails();
};

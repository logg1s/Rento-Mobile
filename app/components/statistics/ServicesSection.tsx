import React from "react";
import { View, Text, ScrollView } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { ProviderStatistics, StatisticsService } from "@/app/types/statistics";
import { formatCurrency } from "@/app/utils/formatters";

interface ServicesSectionProps {
  stats: ProviderStatistics;
  chartConfig: any;
  screenWidth: number;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  stats,
  chartConfig,
  screenWidth,
}) => {
  const topServices = stats.services?.services?.slice(0, 5) || [];

  // Calculate width based on label length - each label should have at least 80px
  const serviceChartWidth = Math.max(screenWidth - 48, topServices.length * 80);

  const serviceData = {
    labels: topServices.map((service: StatisticsService) =>
      service.name.length > 10
        ? service.name.substr(0, 10) + "..."
        : service.name
    ),
    datasets: [
      {
        data: topServices.map(
          (service: StatisticsService) => Number(service.order_count) || 0
        ),
      },
    ],
  };

  // Category distribution data
  const categoryData = stats.services?.service_categories?.slice(0, 5) || [];

  // Calculate width based on category label length
  const categoryChartWidth = Math.max(
    screenWidth - 48,
    categoryData.length * 80
  );

  const categoryChartData =
    categoryData.length > 0
      ? {
          labels: categoryData.map((cat) =>
            cat.name.length > 10 ? cat.name.substr(0, 10) + "..." : cat.name
          ),
          datasets: [
            {
              data: categoryData.map((cat) => Number(cat.order_count) || 0),
            },
          ],
        }
      : null;

  // Prepare pie chart data for categories
  const categoryPieData = categoryData.map((category, index) => {
    const colors = [
      "#10b981",
      "#3b82f6",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#6366f1",
    ];
    return {
      name: category.name,
      population: Number(category.order_count) || 0,
      color: colors[index % colors.length],
      legendFontColor: "#7f7f7f",
    };
  });

  return (
    <>
      {/* Services Overview */}
      <View className="bg-white mt-2 p-4 rounded-lg shadow-sm">
        <Text className="text-xl font-pbold text-gray-800 mb-3">
          Tổng quan dịch vụ
        </Text>

        <View className="bg-gray-50 p-3 rounded-lg mb-4">
          <View className="flex-row justify-between mb-3">
            <View className="flex-1">
              <Text className="font-pmedium text-gray-500 mb-1">
                Dịch vụ phổ biến nhất
              </Text>
              <Text className="font-pbold text-gray-800">
                {stats.services?.most_popular || "Chưa có dữ liệu"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-pmedium text-gray-500 mb-1">
                Đánh giá cao nhất
              </Text>
              <Text className="font-pbold text-gray-800">
                {stats.services?.highest_rated || "Chưa có dữ liệu"}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="font-pmedium text-gray-500 mb-1">
                Sinh lời nhất
              </Text>
              <Text className="font-pbold text-gray-800">
                {stats.services?.most_profitable || "Chưa có dữ liệu"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-pmedium text-gray-500 mb-1">
                Dịch vụ đang hoạt động
              </Text>
              <Text className="font-pbold text-gray-800">
                {stats.services?.active_services || 0}/
                {stats.services?.total_services || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Top 5 services by order count */}
        {topServices.length > 0 && (
          <>
            <Text className="text-lg font-pbold text-gray-800 mb-3">
              Top 5 dịch vụ
            </Text>

            {serviceData.labels.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                <BarChart
                  data={serviceData}
                  width={serviceChartWidth}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  showValuesOnTopOfBars
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero
                />
              </ScrollView>
            ) : (
              <View className="h-[220] justify-center items-center">
                <Text className="text-gray-500 font-pmedium">
                  Không có dữ liệu dịch vụ
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Service Categories */}
      {categoryData.length > 0 && (
        <View className="bg-white mt-4 p-4 rounded-lg shadow-sm">
          <Text className="text-xl font-pbold text-gray-800 mb-3">
            Phân loại dịch vụ
          </Text>

          <View className="flex-row">
            <View className="flex-1">
              <PieChart
                data={categoryPieData}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        </View>
      )}

      {/* Service Details Table */}
      <View className="bg-white mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-xl font-pbold text-gray-800 mb-3">
          Chi tiết dịch vụ
        </Text>

        {topServices.length > 0 ? (
          <>
            <View className="flex-row bg-gray-100 py-2 px-3 rounded-t-lg">
              <Text className="font-pbold text-gray-600 w-2/5">
                Tên dịch vụ
              </Text>
              <Text className="font-pbold text-gray-600 w-1/5 text-center">
                Đơn
              </Text>
              <Text className="font-pbold text-gray-600 w-1/5 text-center">
                Doanh thu
              </Text>
              <Text className="font-pbold text-gray-600 w-1/5 text-center">
                Đánh giá
              </Text>
            </View>

            {topServices.map((service: StatisticsService, index: number) => (
              <View
                key={index}
                className={`flex-row py-3 px-3 ${
                  index < topServices.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <Text className="text-gray-800 w-2/5" numberOfLines={1}>
                  {service.name}
                </Text>
                <Text className="text-gray-800 w-1/5 text-center">
                  {service.order_count}
                </Text>
                <Text className="text-gray-800 w-1/5 text-center">
                  {formatCurrency(service.revenue || 0).replace("₫", "")}
                </Text>
                <Text className="text-gray-800 w-1/5 text-center">
                  {service.average_rating}⭐
                </Text>
              </View>
            ))}

            {/* Service performance metrics */}
            <View className="mt-4 bg-gray-50 p-3 rounded-lg">
              <Text className="font-pbold text-gray-700 mb-2">
                Hiệu suất chi tiết
              </Text>

              {topServices
                .slice(0, 3)
                .map((service: StatisticsService, index: number) => (
                  <View key={index} className="mb-3">
                    <View className="flex-row justify-between items-center">
                      <Text
                        className="font-pmedium text-gray-700"
                        numberOfLines={1}
                      >
                        {service.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatCurrency(service.revenue_per_order || 0)}/đơn
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <View className="flex-1 h-2 bg-gray-200 rounded-full">
                        <View
                          className="h-2 bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(service.profit_margin || 0, 100)}%`,
                          }}
                        />
                      </View>
                      <Text className="ml-2 text-xs text-gray-500">
                        {service.profit_margin?.toFixed(0) || 0}% biên lợi nhuận
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </>
        ) : (
          <View className="h-[100] justify-center items-center">
            <Text className="text-gray-500 font-pmedium">
              Không có dữ liệu dịch vụ
            </Text>
          </View>
        )}
      </View>
    </>
  );
};

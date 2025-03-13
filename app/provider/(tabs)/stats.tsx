import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
} from "react-native-chart-kit";
import { formatCurrency } from "@/app/utils/formatters";
import { Card } from "@/app/components/Card";
import { useFocusEffect } from "@react-navigation/native";
import { ProviderStatistics, StatisticsService } from "@/types/type";
import useProviderStore, { StatisticsPeriod } from "@/stores/providerStore";

const screenWidth = Dimensions.get("window").width;

const StatsScreen = () => {
  // Get statistics-related methods from provider store
  const { statistics, isLoading, error, fetchStatisticsWithPeriod } =
    useProviderStore();

  const [selectedPeriod, setSelectedPeriod] =
    useState<StatisticsPeriod>("week");
  const [refreshing, setRefreshing] = useState(false);

  // Use local fallback state when statistics is null
  const stats: ProviderStatistics = statistics || {
    revenue: {
      labels: [],
      data: [],
      total: 0,
      average: 0,
      trend: 0,
    },
    orders: {
      total: 0,
      completed: 0,
      cancelled: 0,
      pending: 0,
      in_progress: 0,
      completion_rate: 0,
      cancellation_rate: 0,
      trends: {
        labels: [],
        data: [],
      },
    },
    services: {
      services: [],
      total_services: 0,
      most_popular: null,
      highest_rated: null,
      most_profitable: null,
    },
    summary: {
      total_services: 0,
      total_orders: 0,
      total_revenue: 0,
      average_order_value: 0,
      average_rating: 0,
    },
  };

  const periods = [
    { id: "week" as StatisticsPeriod, label: "Tuần" },
    { id: "month" as StatisticsPeriod, label: "Tháng" },
    { id: "year" as StatisticsPeriod, label: "Năm" },
  ];

  // Format for charts
  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#3b82f6",
    },
  };

  const fetchStats = async (period = selectedPeriod) => {
    try {
      await fetchStatisticsWithPeriod(period);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [])
  );

  // Fetch when period changes
  useEffect(() => {
    fetchStats(selectedPeriod);
  }, [selectedPeriod]);

  // Prepare data for charts
  const revenueData = {
    labels: stats.revenue.labels || [],
    datasets: [
      {
        data: stats.revenue.data.length ? stats.revenue.data : [0],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

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
  ];

  const orderTrendsData = {
    labels: stats.orders.trends.labels || [],
    datasets: [
      {
        data: stats.orders.trends.data.length ? stats.orders.trends.data : [0],
        color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Prepare service effectiveness data
  const topServices = stats.services.services?.slice(0, 5) || [];
  const serviceData = {
    labels: topServices.map((service: StatisticsService) => service.name),
    datasets: [
      {
        data: topServices.map(
          (service: StatisticsService) => service.order_count
        ),
      },
    ],
  };

  // Show loading indicator
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 font-pmedium">
          Đang tải dữ liệu...
        </Text>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !refreshing) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-gray-800 font-pbold text-center">
          Lỗi kết nối
        </Text>
        <Text className="mt-2 text-gray-600 font-pmedium text-center mx-8">
          {error}
        </Text>
        <TouchableOpacity
          className="mt-6 bg-primary-500 px-6 py-3 rounded-full"
          onPress={() => fetchStats()}
        >
          <Text className="text-white font-pbold">Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="bg-primary-500 p-4">
          <Text className="text-2xl font-pbold text-white">Thống kê</Text>
          <Text className="text-white opacity-80 font-pmedium">
            Phân tích hiệu suất của bạn
          </Text>
        </View>

        {/* Period Selection */}
        <View className="flex-row bg-white p-4 justify-between items-center shadow-sm mx-4 my-2 rounded-lg">
          <Text className="font-pbold text-gray-700">Thời gian:</Text>
          <View className="flex-row">
            {periods.map((period) => (
              <TouchableOpacity
                key={period.id}
                onPress={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedPeriod === period.id
                    ? "bg-primary-500"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`font-pmedium ${
                    selectedPeriod === period.id
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View className="flex-row flex-wrap justify-between px-4 mt-2">
          <Card
            className="bg-white p-4 rounded-lg shadow-sm w-[48%] mb-3"
            icon={
              <MaterialCommunityIcons
                name="currency-usd"
                size={24}
                color="#3b82f6"
              />
            }
            title="Doanh thu"
            value={formatCurrency(stats.revenue.total)}
            trend={stats.revenue.trend}
            suffix={`${stats.revenue.trend >= 0 ? "+" : ""}${stats.revenue.trend}%`}
          />

          <Card
            className="bg-white p-4 rounded-lg shadow-sm w-[48%] mb-3"
            icon={
              <MaterialCommunityIcons
                name="shopping"
                size={24}
                color="#f59e0b"
              />
            }
            title="Đơn hàng"
            value={stats.orders.total.toString()}
            trend={0}
          />

          <Card
            className="bg-white p-4 rounded-lg shadow-sm w-[48%] mb-3"
            icon={
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color="#10b981"
              />
            }
            title="Tỷ lệ hoàn thành"
            value={`${stats.orders.completion_rate}%`}
            trend={0}
          />

          <Card
            className="bg-white p-4 rounded-lg shadow-sm w-[48%] mb-3"
            icon={<Ionicons name="star" size={24} color="#eab308" />}
            title="Đánh giá trung bình"
            value={`${stats.summary.average_rating} ⭐`}
            trend={0}
          />
        </View>

        {/* Revenue Chart */}
        <View className="bg-white mt-2 p-4 mx-4 rounded-lg shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-pbold text-gray-800">Doanh thu</Text>
            <View className="flex-row items-center">
              <Text className="text-primary-500 font-pbold text-lg mr-2">
                {formatCurrency(stats.revenue.total)}
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
                  {stats.revenue.trend}%
                </Text>
              </View>
            </View>
          </View>

          {stats.revenue.data.length > 1 ? (
            <LineChart
              data={revenueData}
              width={screenWidth - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
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
          ) : (
            <View className="h-[220] justify-center items-center">
              <Text className="text-gray-500 font-pmedium">
                Không đủ dữ liệu
              </Text>
            </View>
          )}
        </View>

        {/* Orders Analysis */}
        <View className="flex-row flex-wrap justify-between px-4 mt-4">
          {/* Order Status Chart */}
          <View className="bg-white p-4 rounded-lg shadow-sm w-full mb-4">
            <Text className="text-xl font-pbold text-gray-800 mb-4">
              Trạng thái đơn hàng
            </Text>

            {stats.orders.total > 0 ? (
              <PieChart
                data={orderStatusData.filter((d) => d.population > 0)}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            ) : (
              <View className="h-[200] justify-center items-center">
                <Text className="text-gray-500 font-pmedium">
                  Không có đơn hàng
                </Text>
              </View>
            )}

            {/* Stats summary */}
            <View className="flex-row flex-wrap justify-between mt-4">
              <View className="p-2 w-1/2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  <Text className="font-pmedium text-gray-700">
                    Hoàn thành:
                  </Text>
                </View>
                <Text className="text-gray-900 font-pbold ml-5">
                  {stats.orders.completed}
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
                  {stats.orders.in_progress}
                </Text>
              </View>

              <View className="p-2 w-1/2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                  <Text className="font-pmedium text-gray-700">Đang chờ:</Text>
                </View>
                <Text className="text-gray-900 font-pbold ml-5">
                  {stats.orders.pending}
                </Text>
              </View>

              <View className="p-2 w-1/2">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                  <Text className="font-pmedium text-gray-700">Đã hủy:</Text>
                </View>
                <Text className="text-gray-900 font-pbold ml-5">
                  {stats.orders.cancelled}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Order Trends */}
        <View className="bg-white mt-2 p-4 mx-4 rounded-lg shadow-sm">
          <Text className="text-xl font-pbold text-gray-800 mb-4">
            Xu hướng đơn hàng
          </Text>

          {stats.orders.trends.data.length > 1 ? (
            <LineChart
              data={orderTrendsData}
              width={screenWidth - 48}
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
            />
          ) : (
            <View className="h-[220] justify-center items-center">
              <Text className="text-gray-500 font-pmedium">
                Không đủ dữ liệu
              </Text>
            </View>
          )}
        </View>

        {/* Service Effectiveness */}
        <View className="bg-white mt-4 p-4 mx-4 rounded-lg shadow-sm">
          <Text className="text-xl font-pbold text-gray-800 mb-4">
            Hiệu quả dịch vụ
          </Text>

          {topServices.length > 0 ? (
            <>
              <View className="bg-gray-50 p-3 rounded-lg mb-4">
                <View className="flex-row justify-between">
                  <View className="flex-1">
                    <Text className="font-pmedium text-gray-500 mb-1">
                      Dịch vụ phổ biến nhất
                    </Text>
                    <Text className="font-pbold text-gray-800">
                      {stats.services.most_popular || "Chưa có dữ liệu"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-pmedium text-gray-500 mb-1">
                      Đánh giá cao nhất
                    </Text>
                    <Text className="font-pbold text-gray-800">
                      {stats.services.highest_rated || "Chưa có dữ liệu"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between mt-3">
                  <View className="flex-1">
                    <Text className="font-pmedium text-gray-500 mb-1">
                      Sinh lời nhất
                    </Text>
                    <Text className="font-pbold text-gray-800">
                      {stats.services.most_profitable || "Chưa có dữ liệu"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-pmedium text-gray-500 mb-1">
                      Tổng số dịch vụ
                    </Text>
                    <Text className="font-pbold text-gray-800">
                      {stats.services.total_services}
                    </Text>
                  </View>
                </View>
              </View>

              <Text className="text-lg font-pbold text-gray-800 mb-2">
                Top 5 dịch vụ
              </Text>

              {/* Service popularities */}
              {serviceData.labels.length > 0 ? (
                <BarChart
                  data={serviceData}
                  width={screenWidth - 48}
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
                />
              ) : (
                <View className="h-[220] justify-center items-center">
                  <Text className="text-gray-500 font-pmedium">
                    Không có dữ liệu dịch vụ
                  </Text>
                </View>
              )}

              {/* Service ratings */}
              <Text className="text-lg font-pbold text-gray-800 mt-4 mb-2">
                Đánh giá dịch vụ
              </Text>
              {topServices.map((service: StatisticsService, index: number) => (
                <View key={index} className="mb-3 bg-gray-50 p-3 rounded-lg">
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="font-pmedium text-gray-800 w-2/5"
                      numberOfLines={1}
                    >
                      {service.name}
                    </Text>
                    <View className="flex-row items-center w-3/5">
                      <View className="flex-1 h-2 bg-gray-200 rounded-full mr-2">
                        <View
                          className="h-2 bg-yellow-500 rounded-full"
                          style={{
                            width: `${(service.average_rating / 5) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="font-pbold text-gray-800 w-10 text-right">
                        {service.average_rating}⭐
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-xs text-gray-500">
                      {service.order_count} đơn hàng
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {service.review_count} đánh giá
                    </Text>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View className="h-[220] justify-center items-center">
              <Text className="text-gray-500 font-pmedium">
                Không có dữ liệu dịch vụ
              </Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;

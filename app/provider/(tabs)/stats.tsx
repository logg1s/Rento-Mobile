import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome,
  Octicons,
  Feather,
} from "@expo/vector-icons";
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
} from "react-native-chart-kit";
import { formatCurrency } from "@/app/utils/formatters";
import { useFocusEffect } from "@react-navigation/native";
import {
  ProviderStatistics,
  PeriodInfo,
  ComparisonData,
  StatisticsService,
} from "@/app/types/statistics";
import useProviderStore, { StatisticsPeriod } from "@/stores/providerStore";

// Components
import { StatsHeader } from "../../components/statistics/StatsHeader";
import { SummaryCard } from "../../components/statistics/SummaryCard";
import { PeriodSelector } from "../../components/statistics/PeriodSelector";
import { RevenueSection } from "../../components/statistics/RevenueSection";
import { OrdersSection } from "../../components/statistics/OrdersSection";
import { ServicesSection } from "../../components/statistics/ServicesSection";
import { CustomersSection } from "../../components/statistics/CustomersSection";
import { ServiceFilter } from "../../components/statistics/ServiceFilter";
import { ServiceSpecificStats } from "../../components/statistics/ServiceSpecificStats";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#3b82f6",
  },
  propsForBackgroundLines: {
    stroke: "rgba(226, 232, 240, 0.6)",
  },
};

const StatsScreen = () => {
  const { statistics, isLoading, error, fetchStatisticsWithPeriod } =
    useProviderStore();

  const [selectedPeriod, setSelectedPeriod] =
    useState<StatisticsPeriod>("week");
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState("revenue");
  const [selectedService, setSelectedService] =
    useState<StatisticsService | null>(null);

  const periods = [
    { id: "week" as StatisticsPeriod, label: "Tuần" },
    { id: "month" as StatisticsPeriod, label: "Tháng" },
    { id: "year" as StatisticsPeriod, label: "Năm" },
  ];

  const fetchStats = async (period = selectedPeriod) => {
    try {
      await fetchStatisticsWithPeriod(period, true);
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

  useEffect(() => {
    fetchStats();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [])
  );

  useEffect(() => {
    fetchStats(selectedPeriod);
  }, [selectedPeriod]);

  // Default empty statistics
  const stats = useMemo(() => {
    return (
      statistics || {
        revenue: {
          labels: [],
          data: [],
          order_counts: [],
          total: 0,
          average: 0,
          daily_average: 0,
          max_revenue: {
            value: 0,
            date: null,
          },
          min_revenue: {
            value: 0,
            date: null,
          },
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
          busiest_day: null,
          max_orders: 0,
          daily_average: 0,
          trends: {
            labels: [],
            data: [],
            completed: [],
            cancelled: [],
          },
        },
        services: {
          services: [],
          total_services: 0,
          active_services: 0,
          service_categories: [],
          most_popular: null,
          highest_rated: null,
          most_profitable: null,
        },
        customer_insights: {
          total_customers: 0,
          repeat_customers: 0,
          repeat_rate: 0,
          order_value_distribution: [],
          rating_distribution: {},
        },
        summary: {
          total_services: 0,
          total_orders: 0,
          total_revenue: 0,
          average_order_value: 0,
          average_rating: 0,
          total_customers: 0,
          customer_lifetime_value: 0,
        },
        period_info: {
          start_date: "",
          end_date: "",
          period: "week",
          days: 7,
        },
        comparison: {
          revenue: {
            current_value: 0,
            previous_value: 0,
            growth_percentage: 0,
            is_positive: true,
          },
          orders: {
            current_value: 0,
            previous_value: 0,
            growth_percentage: 0,
            is_positive: true,
          },
        },
      }
    );
  }, [statistics]);

  const sections = [
    { id: "revenue", label: "Doanh thu", icon: "cash" },
    { id: "orders", label: "Đơn hàng", icon: "cart" },
    { id: "services", label: "Dịch vụ", icon: "briefcase" },
    { id: "customers", label: "Khách hàng", icon: "people" },
  ];

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
      <StatsHeader periodInfo={stats?.period_info} />

      <ScrollView
        className="bg-gray-100 flex-1"
        contentContainerStyle={{ paddingBottom: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Summary Cards */}
        <View className="px-4 py-3">
          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-2 mb-3">
              <SummaryCard
                title="Doanh thu"
                value={formatCurrency(stats.revenue.total)}
                trend={stats.revenue.trend}
                icon={
                  <FontAwesome5
                    name="money-bill-wave"
                    size={16}
                    color="#3b82f6"
                  />
                }
              />
            </View>
            <View className="w-1/2 pl-2 mb-3">
              <SummaryCard
                title="Đơn dịch vụ"
                value={stats.orders.total.toString()}
                trend={
                  stats.orders.trends
                    ? stats.orders.trends.data.length > 0
                      ? ((stats.orders.trends.data[
                          stats.orders.trends.data.length - 1
                        ] -
                          stats.orders.trends.data[0]) /
                          Math.max(stats.orders.trends.data[0], 1)) *
                        100
                      : 0
                    : 0
                }
                icon={<Octicons name="package" size={16} color="#f97316" />}
              />
            </View>
            <View className="w-1/2 pr-2 mb-3">
              <SummaryCard
                title="Khách hàng"
                value={stats.customer_insights.total_customers.toString()}
                trend={
                  stats.comparison?.orders
                    ? stats.comparison.orders.growth_percentage
                    : 0
                }
                icon={<Ionicons name="people" size={16} color="#0ea5e9" />}
              />
            </View>
            <View className="w-1/2 pl-2 mb-3">
              <SummaryCard
                title="Đánh giá"
                value={`${parseFloat(stats.summary.average_rating.toString()).toFixed(1)}`}
                trend={0}
                icon={<Ionicons name="star" size={16} color="#facc15" />}
                suffix="⭐"
              />
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View className="px-4 mb-3">
          <PeriodSelector
            periods={periods}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
        </View>

        {/* Service Filter */}
        <View className="px-4">
          <ServiceFilter
            stats={stats}
            selectedService={selectedService}
            onServiceSelect={setSelectedService}
          />
        </View>

        {/* Tabs */}
        <View className="flex-row px-4 mt-3">
          <TouchableOpacity
            onPress={() => setActiveSection("revenue")}
            className={`px-4 py-2 rounded-full mr-2 ${
              activeSection === "revenue"
                ? "bg-primary-500"
                : "bg-white border border-gray-300"
            }`}
          >
            <Text
              className={`${
                activeSection === "revenue"
                  ? "text-white font-pbold"
                  : "text-gray-700 font-pregular"
              }`}
            >
              Doanh thu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveSection("orders")}
            className={`px-4 py-2 rounded-full mr-2 ${
              activeSection === "orders"
                ? "bg-orange-500"
                : "bg-white border border-gray-300"
            }`}
          >
            <Text
              className={`${
                activeSection === "orders"
                  ? "text-white font-pbold"
                  : "text-gray-700 font-pregular"
              }`}
            >
              Đơn hàng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveSection("services")}
            className={`px-4 py-2 rounded-full mr-2 ${
              activeSection === "services"
                ? "bg-green-500"
                : "bg-white border border-gray-300"
            }`}
          >
            <Text
              className={`${
                activeSection === "services"
                  ? "text-white font-pbold"
                  : "text-gray-700 font-pregular"
              }`}
            >
              Dịch vụ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveSection("customers")}
            className={`px-4 py-2 rounded-full ${
              activeSection === "customers"
                ? "bg-blue-500"
                : "bg-white border border-gray-300"
            }`}
          >
            <Text
              className={`${
                activeSection === "customers"
                  ? "text-white font-pbold"
                  : "text-gray-700 font-pregular"
              }`}
            >
              Khách hàng
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Content */}
        <View className="px-4 mt-3">
          {selectedService ? (
            <ServiceSpecificStats
              service={selectedService}
              stats={stats}
              chartConfig={chartConfig}
              screenWidth={screenWidth}
              activeTab={activeSection}
            />
          ) : (
            <>
              {activeSection === "revenue" && (
                <RevenueSection
                  stats={stats}
                  chartConfig={chartConfig}
                  screenWidth={screenWidth}
                />
              )}

              {activeSection === "orders" && (
                <OrdersSection
                  stats={stats}
                  chartConfig={chartConfig}
                  screenWidth={screenWidth}
                />
              )}

              {activeSection === "services" && (
                <ServicesSection
                  stats={stats}
                  chartConfig={chartConfig}
                  screenWidth={screenWidth}
                />
              )}

              {activeSection === "customers" && (
                <CustomersSection
                  stats={stats}
                  chartConfig={chartConfig}
                  screenWidth={screenWidth}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;

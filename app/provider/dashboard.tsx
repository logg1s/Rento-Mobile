import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";
import { OrderCard } from "@/components/OrderCard";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function DashboardScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useRentoData((state) => state.user);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Fetch latest data
    setIsRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color }: StatCardProps) => (
    <View className="bg-white p-4 rounded-xl flex-1 mx-2">
      <View
        className={`w-10 h-10 rounded-full ${color} items-center justify-center mb-2`}
      >
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text className="text-gray-600 font-pmedium">{title}</Text>
      <Text className="text-2xl font-pbold mt-1">{value}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="p-4 bg-white">
          <Text className="text-2xl font-pbold">Xin chào, {user?.name}</Text>
          <Text className="text-gray-600 mt-1">
            Chào mừng bạn quay trở lại với Rento
          </Text>
        </View>

        {/* Stats Overview */}
        <View className="flex-row mt-4 px-2">
          <StatCard
            title="Tổng đơn"
            value={stats.totalOrders}
            icon="receipt-outline"
            color="bg-blue-500"
          />
          <StatCard
            title="Chờ xử lý"
            value={stats.pendingOrders}
            icon="time-outline"
            color="bg-orange-500"
          />
        </View>
        <View className="flex-row mt-4 px-2">
          <StatCard
            title="Hoàn thành"
            value={stats.completedOrders}
            icon="checkmark-circle-outline"
            color="bg-green-500"
          />
          <StatCard
            title="Doanh thu"
            value={`${stats.totalRevenue.toLocaleString()}đ`}
            icon="cash-outline"
            color="bg-purple-500"
          />
        </View>

        {/* Recent Orders */}
        <View className="mt-6 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-pbold">Đơn hàng gần đây</Text>
            <TouchableOpacity
              onPress={() => router.push("/provider/orders")}
              className="flex-row items-center"
            >
              <Text className="text-primary-500 font-pmedium mr-1">
                Xem tất cả
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#0286FF" />
            </TouchableOpacity>
          </View>

          {/* Order List */}
          <View className="gap-3">
            {/* TODO: Replace with actual order data */}
            {/* <OrderCard order={order} onOrderUpdate={handleOrderUpdate} /> */}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mt-4 p-4">
          <Text className="text-xl font-pbold mb-4">Thao tác nhanh</Text>
          <View className="flex-row flex-wrap gap-4">
            <TouchableOpacity
              onPress={() => router.push("/provider/services")}
              className="bg-white p-4 rounded-xl flex-row items-center flex-1"
            >
              <Ionicons name="add-circle-outline" size={24} color="#0286FF" />
              <Text className="ml-3 font-pmedium">Thêm dịch vụ mới</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/provider/chat")}
              className="bg-white p-4 rounded-xl flex-row items-center flex-1"
            >
              <Ionicons name="chatbubble-outline" size={24} color="#0286FF" />
              <Text className="ml-3 font-pmedium">Chat với khách hàng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useEffect, useState } from "react";
import { View, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import useProviderStore from "@/stores/providerStore";
import { OrderCard } from "@/components/OrderCard";
import { SelectList } from "react-native-dropdown-select-list";

const ORDER_STATUS = {
  all: { label: "Tất cả", value: "all" },
  pending: { label: "Chờ xử lý", value: "pending" },
  processing: { label: "Đang thực hiện", value: "processing" },
  completed: { label: "Hoàn thành", value: "completed" },
  cancelled: { label: "Đã hủy", value: "cancelled" },
};

export default function ProviderOrders() {
  const { orders, isLoading, fetchOrders } = useProviderStore();
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const statusOptions = Object.values(ORDER_STATUS).map((status) => ({
    key: status.value,
    value: status.label,
  }));

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="p-4 bg-white">
        <Text className="text-2xl font-pbold mb-4">Quản lý đơn hàng</Text>
        <SelectList
          setSelected={setStatusFilter}
          data={statusOptions}
          save="key"
          placeholder="Lọc theo trạng thái"
          search={false}
          boxStyles={{
            borderRadius: 8,
            borderColor: "#E5E7EB",
          }}
          inputStyles={{
            fontSize: 16,
            fontFamily: "Poppins_500Medium",
          }}
        />
      </View>

      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onOrderUpdate={() => fetchOrders(statusFilter)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => fetchOrders(statusFilter)}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <MaterialIcons name="inbox" size={48} color="gray" />
            <Text className="text-gray-500 mt-2 font-pmedium">
              Chưa có đơn hàng nào
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

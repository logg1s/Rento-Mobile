import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import useProviderStore from "@/stores/providerStore";
import { OrderCard } from "@/components/OrderCard";
import { SelectList } from "react-native-dropdown-select-list";
import { OrderStatus, ProviderOrder } from "@/types/type";
import { searchFilter, normalizeVietnamese, formatToVND } from "@/utils/utils";
import DateTimePicker from "@react-native-community/datetimepicker";

const ORDER_STATUS = {
  all: { label: "Tất cả", value: "all", icon: "list", color: "blue" },
  pending: {
    label: "Chờ xử lý",
    value: "pending",
    icon: "clock",
    color: "yellow",
  },
  processing: {
    label: "Đang thực hiện",
    value: "processing",
    icon: "hammer",
    color: "blue",
  },
  completed: {
    label: "Hoàn thành",
    value: "completed",
    icon: "check-circle",
    color: "green",
  },
  cancelled: {
    label: "Đã hủy",
    value: "cancelled",
    icon: "times-circle",
    color: "red",
  },
};

const sortOptions = [
  { key: "newest", value: "Mới nhất" },
  { key: "oldest", value: "Cũ nhất" },
  { key: "price_high", value: "Giá cao nhất" },
  { key: "price_low", value: "Giá thấp nhất" },
];

export default function ProviderOrders() {
  const {
    orders: allOrders,
    isLoading,
    fetchOrders,
    updateOrderStatus,
    statistics,
    fetchStatistics,
  } = useProviderStore();
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [showDatePicker, setShowDatePicker] = useState({
    visible: false,
    type: "start" as "start" | "end",
  });

  // Tính toán các thống kê nhanh từ tất cả đơn hàng
  const orderStats = useMemo(() => {
    // Đảm bảo allOrders là một mảng
    const orders = Array.isArray(allOrders) ? allOrders : [];

    const pendingCount = orders.filter(
      (order) => order.status === OrderStatus.PENDING
    ).length;
    const processingCount = orders.filter(
      (order) => order.status === OrderStatus.IN_PROGRESS
    ).length;
    const completedCount = orders.filter(
      (order) => order.status === OrderStatus.COMPLETED
    ).length;
    const cancelledCount = orders.filter(
      (order) => order.status === OrderStatus.CANCELLED
    ).length;

    // Tính tổng doanh thu từ tất cả các đơn hoàn thành
    const completedOrders = orders.filter(
      (order) => order.status === OrderStatus.COMPLETED
    );
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + order.price_final_value,
      0
    );

    return {
      total: orders.length,
      pending: pendingCount,
      processing: processingCount,
      completed: completedCount,
      cancelled: cancelledCount,
      totalRevenue,
      completedCount: completedOrders.length,
    };
  }, [allOrders]);

  // Tải đơn hàng từ backend - luôn lấy tất cả đơn hàng
  const loadOrders = async () => {
    try {
      setRefreshing(true);
      // Luôn lấy tất cả đơn hàng từ API, statusFilter chỉ sử dụng cho lọc ở client
      const data = await fetchOrders("all");

      // Kiểm tra dữ liệu nhận được
      console.log(
        "Dữ liệu nhận từ API:",
        Array.isArray(data) ? `mảng với ${data.length} phần tử` : typeof data
      );
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách đơn hàng. Vui lòng thử lại sau."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Tải dữ liệu khi component mount
  useEffect(() => {
    loadOrders();
    fetchStatistics();
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      Alert.alert("Thành công", "Đã cập nhật trạng thái đơn hàng");
      loadOrders(); // Tải lại toàn bộ đơn hàng sau khi cập nhật
      fetchStatistics();
    } catch (error) {
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau."
      );
    }
  };

  // Lọc đơn hàng dựa trên trạng thái, tìm kiếm và các bộ lọc khác (tất cả thực hiện ở client-side)
  const filteredOrders = useMemo(() => {
    // Đảm bảo allOrders là một mảng
    if (!Array.isArray(allOrders)) {
      console.error("allOrders không phải là mảng:", allOrders);
      return [];
    }

    let result = [...allOrders];

    // Lọc theo trạng thái
    if (statusFilter !== "all") {
      const statusMapping: Record<string, OrderStatus> = {
        pending: OrderStatus.PENDING,
        processing: OrderStatus.IN_PROGRESS,
        completed: OrderStatus.COMPLETED,
        cancelled: OrderStatus.CANCELLED,
      };
      result = result.filter(
        (order) => order.status === statusMapping[statusFilter]
      );
    }

    // Lọc theo tìm kiếm
    if (searchQuery.trim()) {
      result = result.filter((order) => {
        // Tìm kiếm theo tên dịch vụ
        const matchServiceName =
          order.service &&
          searchFilter(order.service.service_name, searchQuery);

        // Tìm kiếm theo tên khách hàng
        const matchCustomerName =
          order.user && searchFilter(order.user.name, searchQuery);

        // Tìm kiếm theo mã đơn hàng
        const matchOrderId = order.id.toString().includes(searchQuery.trim());

        // Tìm kiếm theo số điện thoại
        const matchPhoneNumber =
          order.phone_number && order.phone_number.includes(searchQuery.trim());

        // Tìm kiếm theo địa chỉ
        const matchAddress =
          order.address && searchFilter(order.address, searchQuery);

        // Tìm kiếm theo ghi chú
        const matchMessage =
          order.message && searchFilter(order.message, searchQuery);

        // Tìm kiếm theo giá
        const matchPrice =
          order.price_final_value &&
          order.price_final_value.toString().includes(searchQuery.trim());

        // Tìm kiếm theo tên gói dịch vụ
        const matchPackageName =
          order.price &&
          order.price.price_name &&
          searchFilter(order.price.price_name, searchQuery);

        // Tìm kiếm theo email người dùng
        const matchEmail =
          order.user &&
          order.user.email &&
          searchFilter(order.user.email, searchQuery);

        return (
          matchServiceName ||
          matchCustomerName ||
          matchOrderId ||
          matchPhoneNumber ||
          matchAddress ||
          matchMessage ||
          matchPrice ||
          matchPackageName ||
          matchEmail
        );
      });
    }

    // Lọc theo ngày
    if (dateRange.startDate || dateRange.endDate) {
      result = result.filter((order) => {
        const orderDate = new Date(order.created_at);

        if (dateRange.startDate && dateRange.endDate) {
          return (
            orderDate >= dateRange.startDate && orderDate <= dateRange.endDate
          );
        } else if (dateRange.startDate) {
          return orderDate >= dateRange.startDate;
        } else if (dateRange.endDate) {
          return orderDate <= dateRange.endDate;
        }

        return true;
      });
    }

    // Sắp xếp kết quả
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "price_high":
          return b.price_final_value - a.price_final_value;
        case "price_low":
          return a.price_final_value - b.price_final_value;
        default:
          return 0;
      }
    });

    return result;
  }, [allOrders, searchQuery, statusFilter, sortBy, dateRange]);

  const renderOrderItem = ({ item }: { item: ProviderOrder }) => (
    <OrderCard
      order={item}
      isProvider={true}
      onOrderUpdate={loadOrders}
      onUpdateStatus={(newStatus) => handleUpdateStatus(item.id, newStatus)}
    />
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate =
      selectedDate ||
      (showDatePicker.type === "start"
        ? dateRange.startDate
        : dateRange.endDate);
    setShowDatePicker({ ...showDatePicker, visible: false });

    if (currentDate) {
      if (showDatePicker.type === "start") {
        setDateRange({ ...dateRange, startDate: currentDate });
      } else {
        setDateRange({ ...dateRange, endDate: currentDate });
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("newest");
    setDateRange({ startDate: null, endDate: null });
    setShowFilterModal(false);
  };

  // Render chip cho mỗi trạng thái đơn hàng
  const renderStatusChip = (
    status: string,
    label: string,
    count: number,
    icon: string,
    color: string
  ) => (
    <TouchableOpacity
      key={status}
      className={`flex-col items-center justify-center px-3 py-1.5 rounded-md ${
        statusFilter === status
          ? `bg-${color}-500`
          : "bg-white border border-gray-200"
      }`}
      onPress={() => setStatusFilter(status)}
      style={{ height: 60, width: "100%" }}
    >
      <View className="flex-row items-center justify-center mb-1">
        {status === "all" ? (
          <MaterialIcons
            name="list-alt"
            size={16}
            color={statusFilter === status ? "white" : getColorValue(color)}
          />
        ) : (
          <FontAwesome5
            name={icon}
            size={14}
            color={statusFilter === status ? "white" : getColorValue(color)}
          />
        )}
        <Text
          className={`ml-1.5 ${
            statusFilter === status
              ? "text-white font-pbold"
              : "text-gray-700 font-pmedium"
          }`}
        >
          {label}
        </Text>
      </View>
      <View
        className={`flex items-center justify-center rounded-full h-5 w-5 ${
          statusFilter === status ? "bg-white/20" : `bg-${color}-100`
        }`}
      >
        <Text
          className={`text-xs font-pbold ${
            statusFilter === status ? "text-white" : `text-${color}-600`
          }`}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Hàm tiện ích để lấy giá trị màu cho icon
  const getColorValue = (color: string) => {
    switch (color) {
      case "blue":
        return "#3b82f6";
      case "yellow":
        return "#f59e0b";
      case "green":
        return "#16a34a";
      case "red":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      {/* Phần thống kê nhanh */}
      <View className="bg-white px-4 py-3">
        <Text className="text-2xl font-pbold mb-3">Quản lý đơn hàng</Text>

        {/* Thống kê tổng quan */}
        <View className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-700 font-pmedium">
              Tổng doanh thu hoàn thành
            </Text>
            <Text className="text-blue-600 font-pbold">
              {formatToVND(orderStats.totalRevenue)}
            </Text>
          </View>
          <Text className="text-xs text-gray-500">
            Từ {orderStats.completedCount} đơn hoàn thành • {orderStats.total}{" "}
            tổng đơn hàng
          </Text>
        </View>

        {/* Thanh tìm kiếm */}
        <View className="flex-row mb-4 items-center">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mr-2">
            <Ionicons name="search-outline" size={20} color="#6b7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm kiếm đơn hàng..."
              className="flex-1 ml-2 text-base font-pregular"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            className="bg-blue-50 p-2 rounded-lg border border-blue-200"
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Bộ lọc chip trạng thái */}
        <View className="mb-3">
          {/* Hàng 1: Tất cả và Đang xử lý */}
          <View className="flex-row mb-2 justify-between">
            <View className="flex-1 mr-2">
              {renderStatusChip(
                "all",
                "Tất cả",
                orderStats.total,
                "list",
                "blue"
              )}
            </View>
            <View className="flex-1">
              {renderStatusChip(
                "processing",
                "Đang thực hiện",
                orderStats.processing,
                "hammer",
                "blue"
              )}
            </View>
          </View>

          {/* Hàng 2: Chờ xử lý, Hoàn thành, Đã hủy */}
          <View className="flex-row justify-between">
            <View className="flex-1 mr-2">
              {renderStatusChip(
                "pending",
                "Chờ xử lý",
                orderStats.pending,
                "clock",
                "yellow"
              )}
            </View>
            <View className="flex-1 mr-2">
              {renderStatusChip(
                "completed",
                "Hoàn thành",
                orderStats.completed,
                "check-circle",
                "green"
              )}
            </View>
            <View className="flex-1">
              {renderStatusChip(
                "cancelled",
                "Đã hủy",
                orderStats.cancelled,
                "times-circle",
                "red"
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Hiển thị kết quả lọc */}
      {(searchQuery ||
        dateRange.startDate ||
        dateRange.endDate ||
        sortBy !== "newest") && (
        <View className="bg-blue-50 p-3 flex-row justify-between items-center">
          <Text className="text-blue-800 font-pmedium">
            {filteredOrders.length} kết quả tìm kiếm
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text className="text-blue-600 font-pbold">Xóa bộ lọc</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadOrders} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <MaterialIcons name="inbox" size={48} color="gray" />
            <Text className="text-gray-500 mt-2 font-pmedium">
              {searchQuery || statusFilter !== "all"
                ? "Không tìm thấy đơn hàng nào"
                : "Chưa có đơn hàng nào"}
            </Text>
          </View>
        }
      />

      {/* Modal lọc nâng cao */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-2xl p-5">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-pbold">Lọc nâng cao</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Sắp xếp */}
            <View className="mb-5">
              <Text className="font-pbold mb-2">Sắp xếp theo</Text>
              <SelectList
                setSelected={setSortBy}
                data={sortOptions}
                save="key"
                search={false}
                defaultOption={sortOptions[0]}
                boxStyles={{
                  borderRadius: 8,
                  borderColor: "#E5E7EB",
                  borderWidth: 1,
                  paddingVertical: 10,
                }}
                inputStyles={{
                  fontSize: 16,
                  color: "#1f2937",
                }}
                dropdownStyles={{
                  borderColor: "#E5E7EB",
                }}
              />
            </View>

            {/* Chọn khoảng thời gian */}
            <View className="mb-5">
              <Text className="font-pbold mb-2">Khoảng thời gian</Text>
              <View className="flex-row justify-between">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-between bg-gray-100 p-3 rounded-lg mr-2 border border-gray-200"
                  onPress={() =>
                    setShowDatePicker({ visible: true, type: "start" })
                  }
                >
                  <Text className="text-gray-700">
                    {dateRange.startDate
                      ? dateRange.startDate.toLocaleDateString("vi-VN")
                      : "Từ ngày"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-between bg-gray-100 p-3 rounded-lg ml-2 border border-gray-200"
                  onPress={() =>
                    setShowDatePicker({ visible: true, type: "end" })
                  }
                >
                  <Text className="text-gray-700">
                    {dateRange.endDate
                      ? dateRange.endDate.toLocaleDateString("vi-VN")
                      : "Đến ngày"}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Nút áp dụng */}
            <View className="flex-row mb-5">
              <TouchableOpacity
                className="flex-1 mr-2 py-3 bg-gray-200 rounded-lg items-center"
                onPress={clearFilters}
              >
                <Text className="font-pbold text-gray-700">Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 ml-2 py-3 bg-blue-500 rounded-lg items-center"
                onPress={() => setShowFilterModal(false)}
              >
                <Text className="font-pbold text-white">Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker.visible && (
        <DateTimePicker
          value={
            showDatePicker.type === "start"
              ? dateRange.startDate || new Date()
              : dateRange.endDate || new Date()
          }
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </SafeAreaView>
  );
}

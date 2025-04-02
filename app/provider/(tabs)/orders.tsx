import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
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
import CustomModal from "@/app/components/CustomModal";

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

const searchFilterOptions = [
  { key: "service", value: "Tên dịch vụ", icon: "construct" },
  { key: "customer", value: "Tên khách hàng", icon: "person" },
  { key: "order_id", value: "Mã đơn dịch vụ", icon: "receipt" },
  { key: "phone", value: "Số điện thoại", icon: "call" },
  { key: "address", value: "Địa chỉ", icon: "location" },
  { key: "email", value: "Email", icon: "mail" },
  { key: "all", value: "Tất cả", icon: "search" },
];

export default function ProviderOrders() {
  const {
    orders: storeOrders,
    isLoading,
    fetchOrders,
    updateOrderStatus,
    statistics,
    fetchStatistics,
  } = useProviderStore();
  const [orders, setOrders] = useState<ProviderOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("service");
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
  const [showSearchFilter, setShowSearchFilter] = useState(false);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [orderCounts, setOrderCounts] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  });
  const [totalCompletedRevenue, setTotalCompletedRevenue] = useState(0);
  const retryCount = useRef(0);
  const [modalVisible, setModalVisible] = useState(false);

  const loadOrders = async (refresh = true) => {
    try {
      setRefreshing(refresh);
      if (refresh) {
        setNextCursor(null);
        setHasMore(true);
      }

      const response = await fetchOrders(
        statusFilter,
        refresh ? null : nextCursor,
        searchQuery,
        searchFilter,
        sortBy,
        dateRange.startDate
          ? dateRange.startDate.toISOString().split("T")[0]
          : null,
        dateRange.endDate ? dateRange.endDate.toISOString().split("T")[0] : null
      );

      if (response) {
        if (response.data && Array.isArray(response.data)) {
          if (refresh) {
            setOrders(response.data);
          } else {
            setOrders((prev) => [...prev, ...response.data]);
          }

          setNextCursor(response.next_cursor || null);
          setHasMore(!!response.has_more);

          if (response.counts) {
            setOrderCounts(response.counts);
          }

          if (response.total_revenue !== undefined) {
            setTotalCompletedRevenue(response.total_revenue);
          }
          retryCount.current = 0;
        } else {
          if (refresh) {
            setOrders([]);
          }
        }
      } else {
        if (retryCount.current < 5) {
          retryCount.current++;
          loadOrders(refresh);
        } else if (refresh) {
          setOrders([]);
          setNextCursor(null);
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn dịch vụ:", error);
      if (refresh) {
        setOrders([]);
        setNextCursor(null);
        setHasMore(false);
      }
      Alert.alert(
        "Lỗi",
        "Không thể tải danh sách đơn dịch vụ. Vui lòng thử lại sau."
      );
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      handleRefresh();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, searchFilter]);

  useEffect(() => {
    handleRefresh();
  }, [statusFilter, sortBy, dateRange.startDate, dateRange.endDate]);

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || refreshing) return;

    setLoadingMore(true);
    await loadOrders(false);
  };

  const handleRefresh = async () => {
    await loadOrders(true);
    try {
      await fetchStatistics();
      if (statistics && statistics.summary) {
        setTotalCompletedRevenue(statistics.summary.total_revenue || 0);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const success = await updateOrderStatus(orderId, newStatus);
      if (success) {
        if (newStatus === ORDER_STATUS.completed.value) {
          setModalVisible(true);
        }
        await loadOrders(true);
        try {
          await fetchStatistics();
          if (statistics && statistics.summary) {
            setTotalCompletedRevenue(statistics.summary.total_revenue || 0);
          }
        } catch (error) {
          console.error(
            "Error fetching statistics after status update:",
            error
          );
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật trạng thái đơn dịch vụ. Vui lòng thử lại sau."
      );
    }
  };

  const filteredOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const renderOrderItem = ({
    item,
    index,
  }: {
    item: ProviderOrder;
    index: number;
  }) => (
    <View key={`order-${item.id}`}>
      <Text className="text-gray-500 font-pmedium mb-2">#{index + 1}</Text>
      <OrderCard
        order={item}
        isProvider={true}
        onOrderUpdate={handleRefresh}
        onUpdateStatus={(newStatus) => {
          handleUpdateStatus(item.id, newStatus);
        }}
      />
    </View>
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

  const applyFilters = () => {
    handleRefresh();
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("newest");
    setDateRange({ startDate: null, endDate: null });
    handleRefresh();
    setShowFilterModal(false);
  };

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
      onPress={() => handleStatusFilterChange(status)}
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

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-gray-500 mt-2 text-sm">
          Đang tải thêm đơn dịch vụ...
        </Text>
      </View>
    );
  };

  const renderSearchFilterDropdown = () => {
    return (
      <Modal
        visible={showSearchFilter}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowSearchFilter(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowSearchFilter(false)}
          className="flex-1 bg-black/20"
        >
          <View
            className="absolute bg-white rounded-lg border border-gray-200 shadow-lg"
            style={{
              top: 145,
              left: 16,
              width: 200,
              maxHeight: 300,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <ScrollView bounces={false}>
              {searchFilterOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  className={`flex-row items-center px-3 py-2.5 border-b border-gray-100 ${
                    searchFilter === option.key ? "bg-blue-50" : ""
                  }`}
                  onPress={() => {
                    setSearchFilter(option.key);
                    setShowSearchFilter(false);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={18}
                    color={searchFilter === option.key ? "#3b82f6" : "#6b7280"}
                  />
                  <Text
                    className={`ml-2 ${
                      searchFilter === option.key
                        ? "text-blue-600 font-pmedium"
                        : "text-gray-700"
                    }`}
                  >
                    {option.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      {/* Stats section */}
      <View className="bg-white px-4 py-3">
        <Text className="text-2xl font-pbold mb-3">Quản lý đơn dịch vụ</Text>

        {/* Overview stats */}
        <View className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-700 font-pmedium">
              Tổng doanh thu hoàn thành
            </Text>
            <Text className="text-blue-600 font-pbold">
              {formatToVND(totalCompletedRevenue)}
            </Text>
          </View>
          <Text className="text-xs text-gray-500">
            Từ {orderCounts.completed} đơn hoàn thành • {orderCounts.total} tổng
            đơn dịch vụ
          </Text>
        </View>

        {/* Search section */}
        <View className="mb-4">
          <View className="flex-row items-center">
            {/* Custom search filter dropdown button */}
            <TouchableOpacity
              className="flex-row items-center bg-white px-3 h-[42] rounded-lg border border-gray-200"
              onPress={() => setShowSearchFilter(!showSearchFilter)}
              style={{ minWidth: 140 }}
            >
              <Ionicons
                name={
                  searchFilterOptions.find((opt) => opt.key === searchFilter)
                    ?.icon as any
                }
                size={18}
                color="#374151"
              />
              <Text
                className="mx-2 text-gray-700 font-pmedium"
                numberOfLines={1}
              >
                {
                  searchFilterOptions.find((opt) => opt.key === searchFilter)
                    ?.value
                }
              </Text>
              <Ionicons
                name={showSearchFilter ? "chevron-up" : "chevron-down"}
                size={18}
                color="#374151"
              />
            </TouchableOpacity>

            {/* Search bar */}
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 h-[42] mx-2">
              <Ionicons name="search-outline" size={20} color="#6b7280" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Tìm theo ${searchFilterOptions.find((opt) => opt.key === searchFilter)?.value.toLowerCase()}...`}
                className="flex-1 ml-2 text-base font-pregular"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter button */}
            <TouchableOpacity
              className="bg-blue-50 p-2 rounded-lg border border-blue-200"
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options-outline" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
        {renderSearchFilterDropdown()}

        {/* Status filter chips */}
        <View className="mb-3">
          {/* Row 1: All and Processing */}
          <View className="flex-row mb-2 justify-between">
            <View className="flex-1 mr-2">
              {renderStatusChip(
                "all",
                "Tất cả",
                orderCounts.total,
                "list",
                "blue"
              )}
            </View>
            <View className="flex-1">
              {renderStatusChip(
                "processing",
                "Đang thực hiện",
                orderCounts.processing,
                "hammer",
                "blue"
              )}
            </View>
          </View>

          {/* Row 2: Pending, Completed, Cancelled */}
          <View className="flex-row justify-between">
            <View className="flex-1 mr-2">
              {renderStatusChip(
                "pending",
                "Chờ xử lý",
                orderCounts.pending,
                "clock",
                "yellow"
              )}
            </View>
            <View className="flex-1 mr-2">
              {renderStatusChip(
                "completed",
                "Hoàn thành",
                orderCounts.completed,
                "check-circle",
                "green"
              )}
            </View>
            <View className="flex-1">
              {renderStatusChip(
                "cancelled",
                "Đã hủy",
                orderCounts.cancelled,
                "times-circle",
                "red"
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Show filter results */}
      {(searchQuery ||
        dateRange.startDate ||
        dateRange.endDate ||
        sortBy !== "newest") && (
        <View className="bg-blue-50 p-3 flex-row justify-between items-center">
          <Text className="text-blue-800 font-pmedium">
            {orders.length} kết quả tìm kiếm
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text className="text-blue-600 font-pbold">Xóa bộ lọc</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerClassName="p-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        extraData={orders}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            {isLoading ? (
              <View>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-gray-500 mt-4 font-pmedium">
                  Đang tải đơn dịch vụ...
                </Text>
              </View>
            ) : (
              <>
                <MaterialIcons name="inbox" size={48} color="gray" />
                <Text className="text-gray-500 mt-2 font-pmedium">
                  {searchQuery || statusFilter !== "all"
                    ? "Không tìm thấy đơn dịch vụ nào"
                    : "Chưa có đơn dịch vụ nào"}
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Advanced filter modal */}
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

            {/* Sort options */}
            <View className="mb-5">
              <Text className="font-pbold mb-2">Sắp xếp theo</Text>
              <SelectList
                setSelected={setSortBy}
                data={sortOptions}
                save="key"
                search={false}
                defaultOption={sortOptions.find(
                  (option) => option.key === sortBy
                )}
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

            {/* Date range selection */}
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

            {/* Apply buttons */}
            <View className="flex-row mb-5">
              <TouchableOpacity
                className="flex-1 mr-2 py-3 bg-gray-200 rounded-lg items-center"
                onPress={clearFilters}
              >
                <Text className="font-pbold text-gray-700">Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 ml-2 py-3 bg-blue-500 rounded-lg items-center"
                onPress={applyFilters}
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

      <CustomModal
        visible={modalVisible}
        title="Thành công"
        message="Đã cập nhật trạng thái đơn dịch vụ"
        type="success"
        onClose={() => {
          setModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

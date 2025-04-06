import React, { Fragment } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import { router } from "expo-router";
import {
  OrderType,
  OrderStatus,
  ORDER_STATUS_MAP,
  ORDER_STATUS_ENUM_MAP,
} from "@/types/type";
import {
  convertedPrice,
  formatDateToVietnamese,
  getImageSource,
  formatToVND,
} from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import useRentoData, { axiosFetch } from "@/stores/dataStore";

interface OrderCardProps {
  order: OrderType;
  onOrderUpdate?: () => void;
  isProvider?: boolean;
  onUpdateStatus?: (newStatus: string) => void;
}

export const OrderCard = ({
  order,
  onOrderUpdate,
  isProvider = false,
  onUpdateStatus,
}: OrderCardProps) => {
  const updateStatusOrder = useRentoData((state) => state.updateStatusOrder);
  if (!order?.service?.id) return null;

  const service = order.service;
  const provider = service.user;
  const statusConfig = ORDER_STATUS_MAP[order.status];

  const handleCancelOrder = async () => {
    Alert.alert(
      "Xác nhận huỷ đơn",
      "Bạn có chắc chắn muốn huỷ đơn hàng này không?",
      [
        {
          text: "Không",
          style: "cancel",
        },
        {
          text: "Có",
          style: "destructive",
          onPress: async () => {
            try {
              if (isProvider && onUpdateStatus) {
                onUpdateStatus("cancelled");
              } else {
                const success = await updateStatusOrder(
                  order.id,
                  OrderStatus.CANCELLED
                );
                if (success) {
                  Alert.alert("Thành công", "Đã huỷ đơn hàng thành công");
                  onOrderUpdate?.();
                } else {
                  throw new Error("Không thể huỷ đơn hàng");
                }
              }
            } catch (error) {
              Alert.alert(
                "Lỗi",
                "Không thể huỷ đơn hàng. Vui lòng thử lại sau"
              );
            }
          },
        },
      ]
    );
  };

  const handleContact = () => {
    if (!provider?.id) return;

    router.push({
      pathname: "/job/[id]",
      params: {
        id: provider.id,
      },
    });
  };

  const handleUpdateStatus = (newStatus: string) => {
    const statusText = {
      processing: "thực hiện",
      completed: "hoàn thành",
    }[newStatus];

    Alert.alert(
      `Xác nhận ${statusText} đơn hàng`,
      `Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng thành ${statusText}?`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xác nhận",
          onPress: () => onUpdateStatus?.(newStatus),
        },
      ]
    );
  };

  const renderProviderActions = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return (
          <View className="flex-row space-x-3 mt-5 gap-6">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-red-100 py-3 rounded-xl border border-red-300 shadow-sm"
              onPress={handleCancelOrder}
              style={{
                elevation: 2,
                shadowColor: "#ef4444",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1,
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text className="text-red-600 font-bold">Huỷ đơn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-blue-100 py-3 rounded-xl border border-blue-300 shadow-sm"
              onPress={() => handleUpdateStatus("processing")}
              style={{
                elevation: 2,
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1,
              }}
            >
              <Ionicons name="play-circle-outline" size={20} color="#2563eb" />
              <Text className="text-blue-600 font-bold">Nhận đơn</Text>
            </TouchableOpacity>
          </View>
        );
      case OrderStatus.IN_PROGRESS:
        return (
          <View className="flex-row space-x-3 mt-5 gap-6">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-green-100 py-3 rounded-xl border border-green-300 shadow-sm"
              onPress={() => handleUpdateStatus("completed")}
              style={{
                elevation: 2,
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1,
              }}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#16a34a"
              />
              <Text className="text-green-600 font-bold">Hoàn thành</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  const renderUserActions = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return (
          <View className="flex-row space-x-3 mt-5 gap-6">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-red-100 py-3 rounded-xl border border-red-300 shadow-sm"
              onPress={handleCancelOrder}
              style={{
                elevation: 2,
                shadowColor: "#ef4444",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1,
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text className="text-red-600 font-bold">Huỷ đơn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-blue-100 py-3 rounded-xl border border-blue-300 shadow-sm"
              onPress={handleContact}
              style={{
                elevation: 2,
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1,
              }}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
              <Text className="text-blue-600 font-bold">Liên hệ</Text>
            </TouchableOpacity>
          </View>
        );
      case OrderStatus.IN_PROGRESS:
        return (
          <View className="flex-row space-x-3 mt-5 gap-6">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-blue-100 py-3 rounded-xl border border-blue-300 shadow-sm"
              onPress={handleContact}
              style={{
                elevation: 2,
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1,
              }}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
              <Text className="text-blue-600 font-bold">Liên hệ</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      className="bg-white p-5 mb-3 rounded-2xl border border-gray-200 shadow"
      onPress={() =>
        router.push({
          pathname: "/customer",
          params: {
            user_id: isProvider ? order.user_id : provider?.id,
            order_id: order.id,
          },
        })
      }
    >
      <View className="flex-row items-center justify-between mb-5">
        <View style={[styles.statusContainer, statusConfig.style.container]}>
          <Text style={[styles.statusText, statusConfig.style.text]}>
            {statusConfig.text}
          </Text>
        </View>
        <Text className="text-sm text-gray-500">
          {formatDateToVietnamese(new Date(order.created_at))}
        </Text>
      </View>

      {!isProvider && (
        <TouchableOpacity
          className="flex-row items-center space-x-4 mb-5 p-3 bg-gray-50 rounded-xl gap-3"
          onPress={() =>
            router.push({
              pathname: "/job/[id]" as const,
              params: { id: service.id },
            })
          }
        >
          <Image
            source={getImageSource(provider)}
            className="w-10 h-10 rounded-full bg-gray-100"
          />
          <View className="flex-1">
            <Text className="text-base font-pbold text-gray-900">
              {provider?.name ?? "Không xác định"}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {service.service_name}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      )}

      <View className="bg-gray-50 rounded-xl p-4 space-y-3">
        <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
          <Text className="text-gray-500">Mã đơn hàng</Text>
          <Text className="font-medium">#{order.id}</Text>
        </View>

        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-500">Dịch vụ</Text>
          <Text className="font-medium text-right flex-1 ml-4">
            {service.service_name}
          </Text>
        </View>
        {order.price && (
          <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-gray-500">Gói dịch vụ</Text>
            <Text className="font-medium">{order.price.price_name}</Text>
          </View>
        )}

        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-500">Tổng tiền</Text>
          <Text className="text-lg font-pbold text-gray-900">
            {formatToVND(order.price_final_value)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {isProvider ? renderProviderActions() : renderUserActions()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statusContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default OrderCard;

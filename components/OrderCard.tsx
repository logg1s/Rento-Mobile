import React, { Fragment } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
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
import { Image } from "expo-image";
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
  // Early return if no service data
  const updateStatusOrder = useRentoData((state) => state.updateStatusOrder);
  if (!order?.service?.id) return null;

  const service = order.service;
  const provider = service.user;
  const statusConfig = ORDER_STATUS_MAP[order.status];

  const handleCancelOrder = async () => {
    Alert.alert(
      "Xác nhận hủy đơn",
      "Bạn có chắc chắn muốn hủy đơn hàng này không?",
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
                  Alert.alert("Thành công", "Đã hủy đơn hàng thành công");
                  onOrderUpdate?.();
                } else {
                  throw new Error("Không thể hủy đơn hàng");
                }
              }
            } catch (error) {
              Alert.alert(
                "Lỗi",
                "Không thể hủy đơn hàng. Vui lòng thử lại sau"
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
        user_name: provider?.name,
        category_name: service?.category?.category_name,
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
          <View className="flex-row space-x-3 mt-5">
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
              <Text className="text-red-600 font-bold">Hủy đơn</Text>
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
          <View className="flex-row space-x-3 mt-5">
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
          <View className="flex-row space-x-3 mt-5">
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
              <Text className="text-red-600 font-bold">Hủy đơn</Text>
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
          <View className="flex-row space-x-3 mt-5">
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
    <View className="bg-white p-5 mb-3 rounded-2xl">
      {/* Header - Status & Date */}
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

      {/* Thông tin Khách hàng */}
      {isProvider ? (
        <View className="mb-5">
          <Text className="text-lg font-pbold text-gray-900">
            {order.user?.name || "Khách hàng"}
          </Text>
          <Text className="text-gray-500">{order.phone_number}</Text>
        </View>
      ) : (
        /* Service Provider Info */
        <TouchableOpacity
          className="flex-row items-center space-x-4 mb-5 p-3 bg-gray-50 rounded-xl"
          onPress={() =>
            router.push({
              pathname: "/job/[id]" as const,
              params: { id: service.id },
            })
          }
        >
          <Image
            source={getImageSource(provider)}
            className="w-14 h-14 rounded-full bg-gray-100"
            contentFit="cover"
            transition={200}
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

      {/* Order Details */}
      <View className="bg-gray-50 rounded-xl p-4 space-y-3">
        <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
          <Text className="text-gray-500">Mã đơn hàng</Text>
          <Text className="font-medium">#{order.id}</Text>
        </View>

        {/* Hiển thị dịch vụ chỉ cho người dùng, không phải provider */}
        {!isProvider && (
          <>
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
          </>
        )}

        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-500">Tổng tiền</Text>
          <Text className="text-lg font-pbold text-gray-900">
            {formatToVND(order.price_final_value)}
          </Text>
        </View>

        {isProvider && (
          <>
            {/* Nút xem dịch vụ */}
            <TouchableOpacity
              className="py-3 border-b border-gray-100"
              onPress={() =>
                router.push({
                  pathname: "/provider/service/[id]",
                  params: { id: service.id },
                })
              }
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-500">Dịch vụ</Text>
                <View className="flex-row items-center">
                  <Text className="font-medium text-blue-600 mr-1">
                    Xem chi tiết
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
                </View>
              </View>

              <View className="bg-gray-50 p-3 rounded-lg">
                <Text className="font-pbold text-gray-900">
                  {service.service_name}
                </Text>
                {order.price && (
                  <View className="flex-row items-center mt-1">
                    <Text className="text-gray-500">Gói: </Text>
                    <Text className="text-gray-700 font-pmedium">
                      {order.price.price_name}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {order.address && (
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-500">Địa chỉ</Text>
                <Text className="font-medium text-right flex-1 ml-4">
                  {order.address}
                </Text>
              </View>
            )}
            {order.time_start && (
              <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                <Text className="text-gray-500">Thời gian</Text>
                <Text className="font-medium">
                  {new Date(order.time_start).toLocaleString("vi-VN")}
                </Text>
              </View>
            )}
            <TouchableOpacity
              className="mt-3 bg-gray-100 rounded-lg p-3 flex-row items-center justify-center"
              onPress={() =>
                router.push({
                  pathname: "/customer/[id]",
                  params: { id: order.user_id },
                })
              }
            >
              <Ionicons name="person-outline" size={18} color="#4b5563" />
              <Text className="ml-2 font-medium text-gray-700">
                Xem chi tiết khách hàng
              </Text>
            </TouchableOpacity>
          </>
        )}

        {order.message && (
          <View className="flex-column py-3">
            <Text className="text-gray-500 mb-2">Ghi chú</Text>
            <Text className="text-gray-700 bg-gray-100 p-3 rounded-lg">
              {order.message}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {isProvider ? renderProviderActions() : renderUserActions()}
    </View>
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

import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { router } from "expo-router";
import { OrderType, OrderStatus, ORDER_STATUS_MAP } from "@/types/type";
import {
  convertedPrice,
  formatDateToVietnamese,
  getImageSource,
} from "@/utils/utils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import useRentoData, { axiosFetch } from "@/stores/dataStore";

interface OrderCardProps {
  order: OrderType;
  onOrderUpdate?: () => void;
}

export const OrderCard = ({ order, onOrderUpdate }: OrderCardProps) => {
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
              const success = await updateStatusOrder(
                order.id,
                OrderStatus.CANCELLED,
              );
              if (success) {
                Alert.alert("Thành công", "Đã hủy đơn hàng thành công");
                onOrderUpdate?.();
              } else {
                throw new Error("Không thể hủy đơn hàng");
              }
            } catch (error) {
              Alert.alert(
                "Lỗi",
                "Không thể hủy đơn hàng. Vui lòng thử lại sau",
              );
            }
          },
        },
      ],
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

  const renderActionButtons = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return (
          <View className="flex-row space-x-3 mt-5">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-red-50 py-3 rounded-xl"
              onPress={handleCancelOrder}
            >
              <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
              <Text className="text-red-600 font-medium">Hủy đơn</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-blue-50 py-3 rounded-xl"
              onPress={handleContact}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
              <Text className="text-blue-600 font-medium">Liên hệ</Text>
            </TouchableOpacity>
          </View>
        );
      case OrderStatus.IN_PROGRESS:
        return (
          <View className="flex-row space-x-3 mt-5">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-blue-50 py-3 rounded-xl"
              onPress={handleContact}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
              <Text className="text-blue-600 font-medium">Liên hệ</Text>
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

      {/* Service Provider Info */}
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

      {/* Order Details */}
      <View className="bg-gray-50 rounded-xl p-4 space-y-3">
        <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
          <Text className="text-gray-500">Mã đơn hàng</Text>
          <Text className="font-medium">#{order.id}</Text>
        </View>
        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
          <Text className="text-gray-500">Tổng tiền</Text>
          <Text className="text-lg font-pbold text-gray-900">
            {convertedPrice(service.price)}
          </Text>
        </View>
        {order.message && (
          <View className="pt-1 flex-row justify-between items-center">
            <Text className="text-gray-500 mb-2">Ghi chú</Text>
            <Text className="text-gray-700 p-3 rounded-lg">
              {order.message}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons for Pending Orders */}
      {renderActionButtons()}
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

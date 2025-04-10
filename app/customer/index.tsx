import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useFonts } from "expo-font";
import {
  Poppins_100Thin,
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  getImageSource,
  formatToVND,
  formatDateToVietnamese,
} from "@/utils/utils";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import {
  ORDER_STATUS_MAP,
  OrderStatus,
  OrderType,
  UserType,
} from "@/types/type";

export default function CustomerDetails() {
  const { orderId } = useLocalSearchParams<{
    orderId: string;
  }>();
  const user = useRentoData((state) => state.user);
  const isProvider = user?.role.some((role) => role.id === "provider");
  const [userInfo, setUserInfo] = useState<UserType | null>(null);
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);

  const [loaded, error] = useFonts({
    Poppins_100Thin,
    Poppins_200ExtraLight,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const orderResponse = await axiosFetch(`/orders/${orderId}`);
      const orderData = orderResponse?.data as OrderType;

      if (!orderData ?? !orderData?.user_id) {
        throw new Error();
      }

      setOrder(orderData);

      const userId = isProvider
        ? orderData.user_id
        : orderData.service?.user_id;

      const userResponse = await axiosFetch(`/users/${userId}`);
      const userData = userResponse?.data as UserType;

      if (!userData) {
        throw new Error();
      }

      setUserInfo(userData);
    } catch (error) {
      console.error(
        "Lỗi khi tải thông tin đơn dịch vụ:",
        error?.response?.data ?? error
      );
      Alert.alert("Lỗi", "Không thể tải thông tin đơn dịch vụ");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = () => {
    if (!userInfo?.id) return;

    router.push({
      pathname: "/provider/(tabs)/chat",
      params: {
        chatWithId: userInfo.id,
      },
    });
  };

  const handleOpenMap = () => {
    if (!userInfo?.location?.lat || !userInfo?.location?.lng) {
      Alert.alert("Thông báo", "Thông tin vị trí không hợp lệ");
      return;
    }

    const { lat, lng } = userInfo.location;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    if (!userInfo?.phone_number) {
      Alert.alert("Thông báo", " số điện thoại");
      return;
    }

    Linking.openURL(`tel:${userInfo.phone_number}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text className="font-pmedium text-gray-600">
          Đang tải thông tin đơn dịch vụ...
        </Text>
      </View>
    );
  }

  const renderOrderStatusHeader = () => {
    if (!order) return null;

    const statusConfig = ORDER_STATUS_MAP[order?.status ?? OrderStatus.PENDING];
    return (
      <View
        style={[
          styles.detailItem,
          {
            backgroundColor: statusConfig.style.text.color,
            borderRadius: 8,
            padding: 10,
          },
        ]}
      >
        <Text style={[styles.detailLabel, { color: "white" }]}>
          Trạng thái đơn hàng
        </Text>
        <Text style={[styles.detailValue, { color: "white" }]}>
          {statusConfig.text}
        </Text>
      </View>
    );
  };

  if (!userInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy thông tin đơn dịch vụ</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <TouchableOpacity
        style={styles.profileHeader}
        disabled={isProvider}
        onPressIn={() => {
          router.push({
            pathname: "/user/[id]",
            params: {
              id: userInfo.id,
            },
          });
        }}
      >
        <Image
          source={getImageSource(userInfo)}
          style={styles.avatar}
          contentFit="cover"
        />
        <View className="flex-1">
          <Text style={styles.name}>{userInfo.name}</Text>
          <Text style={styles.email}>{userInfo.email}</Text>
        </View>
      </TouchableOpacity>

      {/* Các nút thao tác */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleChat}>
          <Ionicons name="chatbubble-outline" size={24} color="#2563eb" />
          <Text style={styles.actionText}>Nhắn tin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
          <Ionicons name="call-outline" size={24} color="#16a34a" />
          <Text style={styles.actionText}>Gọi điện</Text>
        </TouchableOpacity>

        {userInfo.location?.lat && userInfo.location?.lng && (
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenMap}>
            <Ionicons name="location-outline" size={24} color="#dc2626" />
            <Text style={styles.actionText}>Bản đồ</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Thông tin đơn dịch vụ</Text>

        {renderOrderStatusHeader()}

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Mã đơn hàng</Text>
          <Text style={styles.detailValue} selectable>
            {orderId ?? ""}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Tên dịch vụ</Text>
          <Text
            style={[
              styles.detailValue,
              { color: "royalblue", textDecorationLine: "underline" },
            ]}
            onPress={() => {
              router.push({
                pathname: "/job/[id]",
                params: {
                  id: order?.service?.id,
                },
              });
            }}
          >
            {order?.service?.service_name ?? ""}
          </Text>
        </View>

        {/* Gói dịch vụ */}
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Gói dịch vụ</Text>
          <Text style={styles.detailValue} selectable>
            {order?.price?.price_name ?? ""}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Giá</Text>
          <Text style={[styles.detailValue, { color: "green" }]} selectable>
            {formatToVND(order?.price?.price_value ?? 0)}
          </Text>
        </View>

        {/* ghi chú */}
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Ghi chú</Text>
          <Text style={styles.detailValue} selectable>
            {order?.message ?? ""}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Ngày đặt dịch vụ</Text>
          <Text style={styles.detailValue} selectable>
            {order?.created_at
              ? formatDateToVietnamese(new Date(order?.created_at))
              : ""}
          </Text>
        </View>

        {/* địa chỉ */}
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Địa chỉ</Text>
          <Text style={styles.detailValue} selectable>
            {order?.address ?? ""}
          </Text>
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Số điện thoại</Text>
          <Text style={styles.detailValue} selectable>
            {userInfo.phone_number ?? ""}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Địa chỉ</Text>
          <Text style={styles.detailValue} selectable>
            {userInfo.location?.location_name ??
              userInfo.location?.real_location_name ??
              userInfo.location?.address ??
              ""}
          </Text>
        </View>
      </View>

      {userInfo.location && (
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Thông tin vị trí</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tên địa điểm</Text>
            <Text style={styles.detailValue} selectable>
              {userInfo.location.location_name ?? ""}
            </Text>
          </View>

          {userInfo.location.real_location_name && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Địa điểm thực tế</Text>
              <Text style={styles.detailValue} selectable>
                {userInfo.location.real_location_name}
              </Text>
            </View>
          )}

          {userInfo?.location?.lat?.toString().length > 0 &&
            userInfo?.location?.lng?.toString().length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Toạ độ</Text>
                <Text style={styles.detailValue} selectable>
                  {userInfo.location.lat}, {userInfo.location.lng}
                </Text>
              </View>
            )}

          {userInfo.location.province && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tỉnh/Thành phố</Text>
              <Text style={styles.detailValue} selectable>
                {userInfo.location.province.name}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  name: {
    fontSize: 16,
    color: "#111827",
    fontFamily: "Poppins_600SemiBold",
  },
  email: {
    fontSize: 16,
    color: "#6b7280",
    fontFamily: "Poppins_500Medium",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "white",
  },
  actionButton: {
    alignItems: "center",
    padding: 10,
  },
  actionText: {
    marginTop: 5,
    color: "#374151",
    fontFamily: "Poppins_500Medium",
  },
  detailSection: {
    backgroundColor: "white",
    marginBottom: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#111827",
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  detailLabel: {
    color: "#6b7280",
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  detailValue: {
    color: "#111827",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    maxWidth: "60%",
    textAlign: "right",
  },
});

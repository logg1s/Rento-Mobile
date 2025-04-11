import React, { useEffect, useState, useRef } from "react";
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
  RefreshControl,
  Modal,
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
import MapboxGL from "@rnmapbox/maps";
import useProviderStore from "@/stores/providerStore";
import CustomModal from "../components/CustomModal";

// Set Mapbox access token
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

export default function CustomerDetails() {
  const { orderId } = useLocalSearchParams<{
    orderId: string;
  }>();
  const user = useRentoData((state) => state.user);
  const isProvider = user?.role.some((role) => role.id === "provider");
  const [userInfo, setUserInfo] = useState<UserType | null>(null);
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCallout, setShowCallout] = useState(true);
  const mapViewRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const userUpdateOrderStatus = useRentoData(
    (state) => state.updateStatusOrder
  );
  const [showModal, setShowModal] = useState(false);
  const providerUpdateOrderStatus = useProviderStore(
    (state) => state.updateOrderStatus
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleUpdateStatusOrder = async (
    orderId: number,
    status: OrderStatus
  ) => {
    if (!orderId) return;
    setShowModal(true);
    if (isProvider) {
      let statusText = "pending";
      switch (status) {
        case OrderStatus.IN_PROGRESS:
          statusText = "processing";
          break;
        case OrderStatus.COMPLETED:
          statusText = "completed";
          break;
        case OrderStatus.CANCELLED:
          statusText = "cancelled";
          break;
      }
      await providerUpdateOrderStatus(orderId, statusText);
    } else {
      await userUpdateOrderStatus(orderId, status);
    }
    setShowModal(false);
    handleRefresh();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setOrder(null);
    setUserInfo(null);
    await fetchOrderDetails();
    setIsRefreshing(false);
  };

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

  const centerMapOnMarker = () => {
    if (
      userInfo?.location?.lat &&
      userInfo?.location?.lng &&
      cameraRef.current
    ) {
      cameraRef.current.setCamera({
        centerCoordinate: [userInfo.location.lng, userInfo.location.lat],
        zoomLevel: 15,
        animationMode: "flyTo",
        animationDuration: 1000,
      });
      setShowCallout(true);
    }
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

  const renderProviderActions = () => {
    if (!order) return null;
    switch (order?.status) {
      case OrderStatus.PENDING:
        return (
          <View className="flex-row space-x-3 mt-5 gap-6">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-red-100 py-3 rounded-xl border border-red-300 shadow-sm"
              onPress={() => {
                Alert.alert(
                  "Huỷ đơn",
                  "Bạn có chắc chắn muốn huỷ đơn này không?",
                  [
                    {
                      text: "Huỷ",
                      style: "cancel",
                    },
                    {
                      text: "Đồng ý",
                      onPress: () =>
                        handleUpdateStatusOrder(
                          order.id,
                          OrderStatus.CANCELLED
                        ),
                    },
                  ]
                );
              }}
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
              onPress={() =>
                handleUpdateStatusOrder(order.id, OrderStatus.IN_PROGRESS)
              }
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
              onPress={() => {
                Alert.alert(
                  "Hoàn thành đơn",
                  "Bạn có chắc chắn muốn hoàn thành đơn này không?",
                  [
                    {
                      text: "Huỷ",
                      style: "cancel",
                    },
                    {
                      text: "Đồng ý",
                      onPress: () =>
                        handleUpdateStatusOrder(
                          order.id,
                          OrderStatus.COMPLETED
                        ),
                    },
                  ]
                );
              }}
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

  const handleContact = () => {
    if (!order?.service?.user_id) return;

    router.push({
      pathname: "/job/[id]",
      params: {
        id: order.service.user_id,
      },
    });
  };

  const renderUserActions = () => {
    if (!order) return null;
    switch (order?.status) {
      case OrderStatus.PENDING:
        return (
          <View className="flex-row space-x-3 mt-5 gap-6">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center space-x-2 bg-red-100 py-3 rounded-xl border border-red-300 shadow-sm"
              onPress={() => {
                Alert.alert(
                  "Huỷ đơn",
                  "Bạn có chắc chắn muốn huỷ đơn này không?",
                  [
                    {
                      text: "Huỷ",
                      style: "cancel",
                    },
                    {
                      text: "Đồng ý",
                      onPress: () =>
                        handleUpdateStatusOrder(
                          order.id,
                          OrderStatus.CANCELLED
                        ),
                    },
                  ]
                );
              }}
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
        <Text style={[styles.detailLabel, { color: "white" }]} selectable>
          Trạng thái dịch vụ
        </Text>
        <Text style={[styles.detailValue, { color: "white" }]} selectable>
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
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      <Modal visible={showModal} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center  bg-opacity-30">
          <View className="bg-white p-5 rounded-lg shadow-lg flex-row items-center justify-center gap-3">
            <ActivityIndicator size="small" color="black" />
            <Text className="font-pmedium">Đang xử lý...</Text>
          </View>
        </View>
      </Modal>
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

        {userInfo?.location?.lat && userInfo?.location?.lng && (
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenMap}>
            <Ionicons name="location-outline" size={24} color="#dc2626" />
            <Text style={styles.actionText}>Bản đồ</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Map Component - now positioned directly below action buttons */}
      {userInfo?.location?.lat && userInfo?.location?.lng && (
        <View
          style={styles.mapSection}
          onStartShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
        >
          <View style={styles.mapContainer}>
            <MapboxGL.MapView
              style={styles.map}
              logoEnabled={false}
              attributionEnabled={false}
              compassEnabled={true}
              styleURL={MapboxGL.StyleURL.Street}
              scrollEnabled={true}
              pitchEnabled={true}
              rotateEnabled={true}
              zoomEnabled={true}
              onStartShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onTouchStart={(e) => {
                // Prevent parent ScrollView from getting this touch event
                e.stopPropagation();
                return true;
              }}
            >
              <MapboxGL.Camera
                ref={cameraRef}
                zoomLevel={15}
                centerCoordinate={[
                  userInfo.location.lng,
                  userInfo.location.lat,
                ]}
                animationMode="flyTo"
                animationDuration={1000}
              />

              <MapboxGL.PointAnnotation
                id="userLocation"
                coordinate={[userInfo.location.lng, userInfo.location.lat]}
                title={userInfo.name || "Vị trí khách hàng"}
              >
                <View style={styles.markerContainer}>
                  <View style={styles.marker}>
                    <Ionicons name="location" size={24} color="#dc2626" />
                  </View>
                </View>
                {showCallout && (
                  <MapboxGL.Callout
                    title={userInfo.name || "Vị trí khách hàng"}
                  >
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutText}>
                        {userInfo.location.location_name}
                      </Text>
                    </View>
                  </MapboxGL.Callout>
                )}
              </MapboxGL.PointAnnotation>
            </MapboxGL.MapView>

            <TouchableOpacity
              style={styles.openMapButton}
              onPress={handleOpenMap}
            >
              <Text style={styles.openMapText}>Mở bản đồ đầy đủ</Text>
              <Ionicons
                name="open-outline"
                size={16}
                color="#0286FF"
                style={{ marginLeft: 5 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.centerMapButton}
              onPress={centerMapOnMarker}
            >
              <Ionicons name="locate" size={24} color="#0286FF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Thông tin đơn dịch vụ</Text>

        {renderOrderStatusHeader()}

        {isProvider ? renderProviderActions() : renderUserActions()}

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Mã đơn dịch vụ</Text>
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
  mapSection: {
    backgroundColor: "white",
    marginBottom: 10,
  },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  openMapButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  openMapText: {
    color: "#0286FF",
    fontFamily: "Poppins_500Medium",
  },
  calloutContainer: {
    backgroundColor: "white",
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 200,
    maxWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  calloutText: {
    color: "#111827",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    textAlign: "center",
  },
  centerMapButton: {
    position: "absolute",
    bottom: 50,
    right: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

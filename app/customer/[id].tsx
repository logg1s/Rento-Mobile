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
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { getImageSource, formatToVND } from "@/utils/utils";
import { axiosFetch } from "@/stores/dataStore";
import { UserType } from "@/types/type";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CustomerDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosFetch(`/users/${id}`);

      if (response?.data) {
        setUser(response.data);
        console.log("Thông tin khách hàng:", response.data);
      } else {
        Alert.alert("Lỗi", "Không thể tải thông tin khách hàng");
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin khách hàng:", error);
      Alert.alert("Lỗi", "Không thể tải thông tin khách hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = () => {
    if (!user?.id) return;

    router.push({
      pathname: "/message",
      params: {
        chatWithId: user.id,
      },
    });
  };

  const handleOpenMap = () => {
    if (!user?.location?.lat || !user?.location?.lng) {
      Alert.alert("Thông báo", "Không có thông tin vị trí");
      return;
    }

    const { lat, lng } = user.location;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    if (!user?.phone_number) {
      Alert.alert("Thông báo", "Không có số điện thoại");
      return;
    }

    Linking.openURL(`tel:${user.phone_number}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải thông tin khách hàng...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Text>Không tìm thấy thông tin khách hàng</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      {/* Thông tin cơ bản */}
      <View style={styles.profileHeader}>
        <Image
          source={getImageSource(user)}
          style={styles.avatar}
          contentFit="cover"
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

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

        {user.location?.lat && user.location?.lng && (
          <TouchableOpacity style={styles.actionButton} onPress={handleOpenMap}>
            <Ionicons name="location-outline" size={24} color="#dc2626" />
            <Text style={styles.actionText}>Bản đồ</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Thông tin chi tiết */}
      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Số điện thoại</Text>
          <Text style={styles.detailValue}>
            {user.phone_number || "Không có"}
          </Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Địa chỉ</Text>
          <Text style={styles.detailValue}>
            {user.location?.location_name ||
              user.location?.real_location_name ||
              user.location?.address ||
              "Không có"}
          </Text>
        </View>
      </View>

      {user.location && (
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>Thông tin vị trí</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tên địa điểm</Text>
            <Text style={styles.detailValue}>
              {user.location.location_name || "Không có"}
            </Text>
          </View>

          {user.location.real_location_name && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Địa điểm thực tế</Text>
              <Text style={styles.detailValue}>
                {user.location.real_location_name}
              </Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tọa độ</Text>
            <Text style={styles.detailValue}>
              {user.location.lat}, {user.location.lng}
            </Text>
          </View>

          {user.location.province && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tỉnh/Thành phố</Text>
              <Text style={styles.detailValue}>
                {user.location.province.name}
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
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#6b7280",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "white",
    marginVertical: 10,
  },
  actionButton: {
    alignItems: "center",
    padding: 10,
  },
  actionText: {
    marginTop: 5,
    color: "#374151",
  },
  detailSection: {
    backgroundColor: "white",
    marginBottom: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
    fontSize: 16,
  },
  detailValue: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
});

"use client";

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

const ProfileScreen = () => {
  const [user, setUser] = useState({
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0123456789",
    avatar: "https://picsum.photos/200",
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    router.push("/profile/edit");
  };

  const handleChangeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setUser((prev) => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const handleLogout = () => {
    // Implement logout logic here
    router.replace("/login");
  };

  const ProfileSection = ({ title, onPress, icon }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-200"
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={24} color="#0286FF" className="mr-3" />
        <Text className="text-lg font-pmedium">{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="gray" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4">
        <View className="items-center mt-6 mb-8">
          <TouchableOpacity onPress={handleChangeAvatar}>
            <Image
              source={{ uri: user.avatar }}
              className="w-32 h-32 rounded-full"
            />
            <View className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-2">
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="mt-4 text-2xl font-pbold">{user.name}</Text>
          <Text className="text-gray-600">{user.email}</Text>
        </View>

        <View className="bg-white rounded-lg shadow-sm mb-6">
          <ProfileSection
            title="Chỉnh sửa thông tin cá nhân"
            onPress={handleEditProfile}
            icon="person-outline"
          />
          <ProfileSection
            title="Cài đặt tài khoản"
            onPress={() => router.push("/profile/account-settings")}
            icon="settings-outline"
          />
          <View className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#0286FF"
                className="mr-3"
              />
              <Text className="text-lg font-pmedium">Thông báo</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#767577", true: "#0286FF" }}
              thumbColor={notificationsEnabled ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
        </View>

        <View className="bg-white rounded-lg shadow-sm mb-6">
          <ProfileSection
            title="Phương thức thanh toán"
            onPress={() => router.push("/profile/payment-methods")}
            icon="card-outline"
          />
          <ProfileSection
            title="Lịch sử đơn hàng"
            onPress={() => router.push("/profile/order-history")}
            icon="list-outline"
          />
          <ProfileSection
            title="Dịch vụ đã lưu"
            onPress={() => router.push("/profile/saved-services")}
            icon="heart-outline"
          />
        </View>

        <View className="bg-white rounded-lg shadow-sm mb-6">
          <ProfileSection
            title="Trợ giúp & Hỗ trợ"
            onPress={() => router.push("/profile/help-support")}
            icon="help-circle-outline"
          />
          <ProfileSection
            title="Điều khoản và Chính sách"
            onPress={() => router.push("/profile/terms-policy")}
            icon="document-text-outline"
          />
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500 py-3 px-4 rounded-lg mb-8"
        >
          <Text className="text-white text-center font-pbold text-lg">
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

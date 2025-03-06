"use client";

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import useAuthStore from "@/stores/authStore";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { getImageSource } from "@/utils/utils";

const ProfileScreen = () => {
  const user = useRentoData((state) => state.user);
  const uploadAvatar = useRentoData((state) => state.uploadAvatar);

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.user_setting?.is_notification ?? true
  );

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleChangePassword = () => {
    if (user?.is_oauth) {
      Alert.alert(
        "",
        "Bạn đang đăng nhập bằng tài khoản Google. Vui lòng truy cập trang chủ của Google để đổi mật khẩu !"
      );
      return;
    }
    router.push("/profile/change-password");
  };

  const handleNotificationsChange = async (value: boolean) => {
    axiosFetch("/users/setting", "post", { is_notification: value });
    setNotificationsEnabled(value);
  };

  const handleImageUpload = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0].uri) {
      const success = await uploadAvatar(result.assets[0].uri);
      if (!success) {
        Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện");
      }
    }
  };

  const handleCameraCapture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Cần quyền truy cập", "Bạn cần cấp quyền truy cập camera");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    await handleImageUpload(result);
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      "Thay đổi ảnh đại diện",
      "Chọn phương thức",
      [
        {
          text: "Chụp ảnh",
          onPress: handleCameraCapture,
        },
        {
          text: "Chọn từ thư viện",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 1,
            });
            await handleImageUpload(result);
          },
        },
        {
          text: "Hủy",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const logout = useAuthStore((state) => state.logout);
  const handleLogout = async () => {
    await logout();
    router.replace("/");
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
              source={getImageSource(user)}
              className="w-32 h-32 rounded-full"
            />
            <View className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-2">
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="mt-4 text-2xl font-pbold">{user?.name}</Text>
          <Text className="text-gray-600">{user?.email}</Text>
        </View>

        <View className="bg-white rounded-lg shadow-sm mb-6">
          <View className="bg-white rounded-lg shadow-sm mb-6">
            <ProfileSection
              title="Lịch sử đơn hàng"
              onPress={() => router.push("/profile/order-history")}
              icon="list-outline"
            />
            <ProfileSection
              title="Dịch vụ đã thích"
              onPress={() => router.push("/profile/saved-services")}
              icon="heart-outline"
            />
          </View>
          <ProfileSection
            title="Chỉnh sửa thông tin cá nhân"
            onPress={handleEditProfile}
            icon="person-outline"
          />
          <ProfileSection
            title="Đổi mật khẩu"
            onPress={handleChangePassword}
            icon="lock-closed-outline"
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
              onValueChange={(value) => handleNotificationsChange(value)}
              trackColor={{ false: "#767577", true: "#0286FF" }}
              thumbColor={notificationsEnabled ? "#f4f3f4" : "#f4f3f4"}
            />
          </View>
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

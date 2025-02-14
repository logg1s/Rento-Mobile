import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const HelpSupportScreen = () => {
  const supportOptions = [
    { id: "1", title: "Câu hỏi thường gặp", icon: "help-circle-outline" },
    { id: "2", title: "Liên hệ với chúng tôi", icon: "mail-outline" },
    { id: "3", title: "Báo cáo sự cố", icon: "warning-outline" },
    { id: "4", title: "Hướng dẫn sử dụng", icon: "book-outline" },
  ];

  const renderSupportOption = (option) => (
    <TouchableOpacity
      key={option.id}
      className="flex-row items-center justify-between bg-white p-4 mb-4 rounded-lg shadow-sm"
      onPress={() => {
        /* Navigate to specific support page */
      }}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={option.icon}
          size={24}
          color="#0286FF"
          className="mr-4"
        />
        <Text className="font-pmedium text-lg">{option.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="gray" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 px-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold ml-4">Trợ giúp & Hỗ trợ</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {supportOptions.map(renderSupportOption)}

        <View className="mt-6">
          <Text className="font-pbold text-lg mb-2">Liên hệ trực tiếp</Text>
          <Text className="text-gray-600 mb-1">Email: support@rento.com</Text>
          <Text className="text-gray-600 mb-1">Điện thoại: 1900 1234</Text>
          <Text className="text-gray-600">
            Giờ làm việc: 8:00 - 22:00 (Thứ 2 - Chủ nhật)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;

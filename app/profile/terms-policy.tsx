import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const TermsPolicyScreen = () => {
  const sections = [
    {
      id: "1",
      title: "Điều khoản sử dụng",
      content: "Nội dung điều khoản sử dụng...",
    },
    {
      id: "2",
      title: "Chính sách bảo mật",
      content: "Nội dung chính sách bảo mật...",
    },
    {
      id: "3",
      title: "Chính sách hoàn tiền",
      content: "Nội dung chính sách hoàn tiền...",
    },
    {
      id: "4",
      title: "Quy định về dịch vụ",
      content: "Nội dung quy định về dịch vụ...",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold ml-4">
          Điều khoản và Chính sách
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.id} className="mb-6">
            <Text className="font-pbold text-lg mb-2">{section.title}</Text>
            <Text className="text-gray-600">{section.content}</Text>
          </View>
        ))}

        <Text className="text-gray-500 text-center mt-4 mb-8">
          Bản quyền © 2023 Rento. Bảo lưu mọi quyền.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsPolicyScreen;

import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const orderHistory = [
  {
    id: "1",
    service: "Sửa điện",
    date: "2023-06-01",
    status: "Hoàn thành",
    price: "500.000đ",
  },
  {
    id: "2",
    service: "Dọn dẹp nhà",
    date: "2023-05-28",
    status: "Hoàn thành",
    price: "300.000đ",
  },
  {
    id: "3",
    service: "Sửa ống nước",
    date: "2023-05-20",
    status: "Đã hủy",
    price: "400.000đ",
  },
];

const OrderHistoryScreen = () => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center justify-between bg-white p-4 mb-4 rounded-lg shadow-sm"
      onPress={() => {
        /* Navigate to order details */
      }}
    >
      <View className="flex-row items-center">
        <Image
          source={{ uri: `https://picsum.photos/seed/${item.service}/100` }}
          className="w-16 h-16 rounded-lg mr-4"
        />
        <View>
          <Text className="font-pbold text-lg">{item.service}</Text>
          <Text className="text-gray-600">{item.date}</Text>
          <Text
            className={
              item.status === "Hoàn thành" ? "text-green-500" : "text-red-500"
            }
          >
            {item.status}
          </Text>
        </View>
      </View>
      <Text className="font-pbold text-lg">{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 px-4">
      <View className="flex-row items-center mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold ml-4">Lịch sử đơn hàng</Text>
      </View>

      <FlatList
        data={orderHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default OrderHistoryScreen;

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import Swiper from "react-native-swiper";
import ServiceCard from "@/components/ServiceCard";

const TabHome = () => {
  const data = [
    {
      name: "Lê Hoàng Cường",
      service: "Sửa điện",
      rating: 4.2,
      priceRange: "250k - 600k / giờ",
      description:
        "Thợ điện được cấp phép với hơn 8 năm kinh nghiệm, chuyên xử lý mọi vấn đề về điện trong gia đình và doanh nghiệp.",
      imageUrl: "https://picsum.photos/200",
      commentCount: 20,
      isLike: false,
    },
    {
      name: "Nguyen Thi A",
      service: "Dọn dẹp",
      rating: 4.6,
      priceRange: "250k - 600k / giờ",
      description: "Chuyên dọn dẹp với giá cả hợp lí",
      imageUrl: "https://picsum.photos/200",
      commentCount: 100,
      isLike: true,
    },
  ];
  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="px-5">
        <View className="flex-row">
          <View className="flex-1 flex-row gap-2">
            <Image
              source={{
                uri: "https://picsum.photos/200",
              }}
              className="w-10 h-10 rounded-full"
            />
            <View className="">
              <Text className="font-pregular text-sm text-secondary-800">
                Good Morning
              </Text>
              <Text className="font-psemibold text-lg">Andre Ainley</Text>
            </View>
          </View>
          <TouchableOpacity className="border-2 border-gray-300 justify-center items-center rounded-full w-10 h-10">
            <MaterialCommunityIcons
              name="bell-outline"
              size={20}
              color="black"
              className="p-0"
            />
          </TouchableOpacity>
        </View>
        <View className="mb-5">
          <InputField
            placeholder="Tìm kiếm dịch vụ"
            iconLeft={<Ionicons name="search" size={20} color="gray" />}
          />
        </View>
      </View>
      <FlatList
        data={data}
        contentContainerClassName="px-5 gap-5 pb-5"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ServiceCard data={item} />}
        ListHeaderComponent={() => (
          <>
            <View className="h-60">
              <Swiper
                loop={true}
                autoplay={true}
                // dot={<View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0]" />}
                // activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#0286FF]" />}
              >
                <Image
                  source={require("@/assets/images/picsum_1.jpg")}
                  className="w-full h-56"
                  resizeMode="contain"
                />
                <Image
                  source={require("@/assets/images/picsum_1.jpg")}
                  className="w-full h-56"
                  resizeMode="contain"
                />
              </Swiper>
            </View>
            <View className="gap-2 mb-10">
              <View className="flex-row items-center">
                <Text className="font-psemibold text-lg flex-1">Gợi ý</Text>
                <TouchableOpacity>
                  <Text className="font-psemibold text-md text-primary-500">
                    Xem tất cả
                  </Text>
                </TouchableOpacity>
              </View>
              <ServiceCard data={data[0]} />
            </View>
            <View className="flex-row items-center -mb-3">
              <Text className="font-psemibold text-lg flex-1">
                Dịch vụ phổ biến
              </Text>
              <TouchableOpacity>
                <Text className="font-psemibold text-md text-primary-500">
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      />
    </SafeAreaView>
  );
};

export default TabHome;

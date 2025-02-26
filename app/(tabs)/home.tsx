import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import Swiper from "react-native-swiper";
import ServiceCard from "@/components/ServiceCard";
import useRentoData from "@/stores/dataStore";
import { router } from "expo-router";

const TabHome = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const data = useRentoData((state) => state.services);
  const users = useRentoData((state) => state.users);
  const fetchData = useRentoData((state) => state.fetchData);
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const fetchServices = useRentoData((state) => state.fetchServices);

  const onRefresh = async () => {
    try {
      setIsLoading(true);
      await fetchServices();
    } catch (error) {
      console.log("Lỗi khi refresh:", error?.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onPressFavorite = (serviceId?: number) => {
    if (serviceId) {
      updateFavorite(serviceId);
    }
  };

  const handleSearchPress = () => {
    if (searchText.trim()) {
      router.push({
        pathname: "/(tabs)/search",
        params: { fromHome: true, searchText: searchText.trim() },
      });
    } else {
      router.push({
        pathname: "/(tabs)/search",
        params: { fromHome: true },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="px-5">
        <View className="flex-row">
          <View className="flex-1 flex-row gap-2">
            <View className={`rounded-full border-2 border-black p-2`}>
              <Image
                source={
                  users?.image_id
                    ? {
                        uri: users?.image_id,
                      }
                    : require("@/assets/images/avatar_placeholder_icon.png")
                }
                className="w-8 h-8 "
              />
            </View>
            <View>
              <Text className="font-pregular text-sm text-secondary-800">
                Xin chào
              </Text>
              <Text className="font-psemibold text-lg">{users?.name}</Text>
            </View>
          </View>
        </View>
        <View className="mb-5">
          <InputField
            placeholder="Tìm kiếm dịch vụ"
            iconLeft={<Ionicons name="search" size={20} color="gray" />}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchPress} // Xử lý khi nhấn Enter
            returnKeyType="search"
            editable={true}
            enableValidate={false}
          />
        </View>
      </View>
      <FlatList
        data={data}
        contentContainerClassName="px-5 gap-5 pb-5"
        style={{ marginTop: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center mt-5">
            <Text className="font-psemibold text-lg">Không có dữ liệu</Text>
          </View>
        )}
        renderItem={({ item }) =>
          item ? (
            <ServiceCard
              data={item}
              onPressFavorite={() => onPressFavorite(item.id)}
            />
          ) : null
        }
        ListHeaderComponent={() => (
          <>
            <View className="h-60">
              <Swiper
                autoplay
                loop
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
            {/* <View className="gap-2 mb-10">
              <View className="flex-row items-center">
                <Text className="font-psemibold text-xl flex-1">Gợi ý</Text>
                <TouchableOpacity>
                  <Text className="font-psemibold text-md text-primary-500">
                    Xem tất cả
                  </Text>
                </TouchableOpacity>
              </View>
              {data?.length > 0 && data[0] ? (
                <ServiceCard
                  data={data[0]}
                  onPressFavorite={() => onPressFavorite(data[0].id)}
                />
              ) : null}
            </View>
            <View className="flex-row items-center -mb-3">
              <Text className="font-psemibold text-xl flex-1">
                Dịch vụ gần bạn
              </Text>
              <TouchableOpacity>
                <Text className="font-psemibold text-md text-primary-500">
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View> */}
          </>
        )}
        // ListFooterComponent={() => isLoading ? <ActivityIndicator size="large" color="blue" /> : null}
      />
    </SafeAreaView>
  );
};

export default TabHome;

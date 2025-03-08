import ServiceCard from "@/components/ServiceCard";
import useRentoData from "@/stores/dataStore";
import { getImageSource } from "@/utils/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { useCheckProfileComplete } from "@/hooks/useCheckProfileComplete";

const TabHome = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const data = useRentoData((state) => state.services);
  const user = useRentoData((state) => state.user);
  const fetchData = useRentoData((state) => state.fetchData);
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const fetchServices = useRentoData((state) => state.fetchServices);

  const onRefresh = async () => {
    try {
      setIsLoading(true);
      await fetchServices();
    } catch (error) {
      console.error("Lỗi khi refresh:", error?.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onPressFavorite = (serviceId?: number, action: boolean) => {
    if (serviceId) {
      updateFavorite(serviceId, action);
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

  useCheckProfileComplete();

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="px-5">
        <View className="flex-row">
          <View className="flex-1 flex-row gap-2">
            <View className={`rounded-full border border-gray-300 p-2`}>
              <Image
                source={getImageSource(user)}
                className="w-8 h-8 rounded-full"
              />
            </View>
            <View>
              <Text className="font-pregular text-sm text-secondary-800">
                Xin chào
              </Text>
              <Text className="font-psemibold text-lg">{user?.name}</Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center bg-white rounded-full px-4 py-5 mt-5 border-2 border-gray-400 -mb-5">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            placeholder="Tìm kiếm dịch vụ..."
            onChangeText={setSearchText}
            value={searchText}
            className="flex-1 ml-2 font-pmedium text-lg"
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchText.trim()) {
                handleSearchPress();
              }
            }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
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
              onPressFavorite={() => onPressFavorite(item.id, !item.is_liked)}
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

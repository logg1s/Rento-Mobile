import ServiceCard from "@/components/ServiceCard";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { getImageSource } from "@/utils/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Notifications from "expo-notifications";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { ServiceType } from "@/types/type";
import { PaginationType } from "@/types/pagination";

const TabHome = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState<ServiceType[]>([]);
  const user = useRentoData((state) => state.user);
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const retryCount = useRef(0);
  const nextCursor = useRef<string | null>(null);
  const fetchFav = useRentoData((state) => state.fetchFavIds);
  const favIds = useRentoData((state) => state.favIds);
  console.log("favIds", favIds);

  const fetchServiceWithRetry = async () => {
    try {
      let url = `/services`;
      if (nextCursor.current) {
        url += `?cursor=${nextCursor.current}`;
      }
      const response = await axiosFetch(url, "get");

      const paginateData: PaginationType<ServiceType> = response?.data || [];
      const data = paginateData?.data || [];
      if (data?.length > 0) {
        nextCursor.current = paginateData?.next_cursor || null;
        retryCount.current = 0;
        setData((prev) => [...prev, ...data]);
      } else if (retryCount.current < 10) {
        retryCount.current++;
        fetchServiceWithRetry();
      }
    } catch (error: any) {
      console.error(
        "Lỗi khi fetch dịch vụ:",
        error?.response?.data || error.message
      );
      if (retryCount.current < 10) {
        retryCount.current++;
        fetchServiceWithRetry();
      }
    }
  };

  const onLoadMore = async () => {
    if (nextCursor.current) {
      setIsLoadingMore(true);
      await fetchServiceWithRetry();
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    try {
      setIsLoading(true);
      retryCount.current = 0;
      setData([]);
      await fetchServiceWithRetry();
    } catch (error: any) {
      console.error("Lỗi khi refresh:", error?.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openChatbotAI = () => {
    router.push("/chatbot/chatbot");
  };

  const onTapBanner = (index: number) => {
    console.log("onTapBanner", index);
    router.push({
      pathname: "/(tabs)/search",
      params: { fromHome: "true", searchText: searchText.trim() },
    });
  };

  useEffect(() => {
    setIsLoading(true);
    fetchFav();
    fetchServiceWithRetry();
    setIsLoading(false);
  }, []);

  const onPressFavorite = (serviceId: number, action: string) => {
    if (serviceId) {
      updateFavorite(serviceId, action === "true");
    }
  };

  const handleSearchPress = () => {
    if (searchText.trim()) {
      router.push({
        pathname: "/(tabs)/search",
        params: { fromHome: "true", searchText: searchText.trim() },
      });
    } else {
      router.push({
        pathname: "/(tabs)/search",
        params: { fromHome: "true" },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="px-5">
        {/* heading */}
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
          <TouchableOpacity
            onPressIn={openChatbotAI}
            className="flex-row bg-primary-100 items-center gap-2 border border-gray-400 shadow rounded-2xl px-4 py-2"
          >
            <Image
              source={require("@/assets/icons/robot.png")}
              className="w-6 h-6"
              resizeMode="contain"
            />
            <Text className="font-pmedium text-sm">Chat với AI</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-white rounded-2xl px-4 py-5 mt-5 border-2 border-gray-400 -mb-5">
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
        keyExtractor={(item, index) => index.toString()}
        style={{ marginTop: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isLoadingMore ? (
            <ActivityIndicator size="small" color="black" />
          ) : null
        }
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center mt-5">
            <Text className="font-psemibold text-lg">Không có dữ liệu</Text>
          </View>
        )}
        renderItem={({ item }) => (item ? <ServiceCard data={item} /> : null)}
        ListHeaderComponent={() => (
          <>
            <View className="h-60">
              <Swiper
                // autoplay
                loop
                // dot={<View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0]" />}
                // activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#0286FF]" />}
              >
                <TouchableWithoutFeedback onPress={() => onTapBanner(0)}>
                  <Image
                    source={require("@/assets/images/banner/1.jpg")}
                    className="w-full h-56"
                    resizeMode="cover"
                  />
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={() => onTapBanner(1)}>
                  <Image
                    source={require("@/assets/images/banner/2.jpg")}
                    className="w-full h-56"
                    resizeMode="cover"
                  />
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={() => onTapBanner(2)}>
                  <Image
                    source={require("@/assets/images/banner/3.jpg")}
                    className="w-full h-56"
                    resizeMode="cover"
                  />
                </TouchableWithoutFeedback>
                <TouchableWithoutFeedback onPress={() => onTapBanner(3)}>
                  <Image
                    source={require("@/assets/images/banner/4.jpg")}
                    className="w-full h-56"
                    resizeMode="cover"
                  />
                </TouchableWithoutFeedback>
              </Swiper>
            </View>
            <View className="flex-row gap-2 mb-5">
              <TouchableOpacity
                className="flex-1 aspect-square relative overflow-hidden rounded-2xl shadow-md"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/search",
                  })
                }
              >
                <Image
                  source={{ uri: `https://picsum.photos/seed/categories/400` }}
                  className="absolute w-full h-full"
                  resizeMode="cover"
                />
                <View className="flex-1 justify-end p-4 bg-black/30">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="grid" size={20} color="white" />
                    <Text className="font-psemibold text-lg text-white">
                      Danh mục
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 aspect-square relative overflow-hidden rounded-2xl shadow-md"
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/search",
                    params: { fromHome: "true" },
                  })
                }
              >
                <Image
                  source={{ uri: `https://picsum.photos/seed/search/400` }}
                  className="absolute w-full h-full"
                  resizeMode="cover"
                />
                <View className="flex-1 justify-end p-4 bg-black/30">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="search" size={20} color="white" />
                    <Text className="font-psemibold text-lg text-white">
                      Tìm kiếm
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-2 mb-5">
              <TouchableOpacity
                className="flex-1 aspect-square relative overflow-hidden rounded-2xl shadow-md"
                onPress={() =>
                  router.push({
                    pathname: "/nearby-search",
                  })
                }
              >
                <Image
                  source={{ uri: `https://picsum.photos/seed/nearby/400` }}
                  className="absolute w-full h-full"
                  resizeMode="cover"
                />
                <View className="flex-1 justify-end p-4 bg-black/30">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="location" size={20} color="white" />
                    <Text className="font-psemibold text-lg text-white">
                      Tìm quanh đây
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View>
              <View className="flex-row items-center">
                <Text className="font-psemibold text-xl flex-1">Dịch vụ</Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/search",
                      params: { fromHome: "true" },
                    })
                  }
                >
                  <Text className="font-psemibold text-md text-primary-500">
                    Xem tất cả
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      />
    </SafeAreaView>
  );
};

export default TabHome;

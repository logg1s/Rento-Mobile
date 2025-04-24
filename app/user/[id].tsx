import {
  View,
  Text,
  ScrollView,
  Image,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { CategoryType, ServiceType, UserType, CommentType } from "@/types/type";
import { axiosFetch } from "@/stores/dataStore";
import { getImageSource, normalizeVietnamese } from "@/utils/utils";
import ServiceCard from "@/components/ServiceCard";
import useRentoData from "@/stores/dataStore";
import * as Clipboard from "expo-clipboard";

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const [showFullImage, setShowFullImage] = useState(false);
  const favorites = useRentoData((state) => state.favorites);
  const retryCount = useRef(0);
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const [userRes, categoriesRes] = await Promise.all([
        axiosFetch(`/users/${id}`),
        axiosFetch("/categories"),
      ]);

      if (userRes?.data?.service) {
        setUserData(userRes.data);
        setServices(userRes.data.service || []);
      }

      if (categoriesRes?.data?.data) {
        setCategories(categoriesRes.data.data);
      }
      if (!userRes?.data?.service || !categoriesRes?.data?.data) {
        throw new Error("No data");
      }
      retryCount.current = 0;
    } catch (error) {
      if (retryCount.current < 10) {
        retryCount.current++;
        fetchUserData();
      }
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    retryCount.current = 0;
    await fetchUserData();
    setIsRefreshing(false);
  };

  const filteredServices = services.filter((service) => {
    if (!service || !service.service_name) return false;

    const matchesCategory =
      selectedCategory === "all" ||
      service.category?.id === parseInt(selectedCategory);

    const normalizedQuery = normalizeVietnamese(searchQuery);
    const normalizedServiceName = normalizeVietnamese(service.service_name);
    const matchesSearch = normalizedServiceName.includes(normalizedQuery);

    return matchesCategory && matchesSearch;
  });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="gap-2 pb-5 flex-grow"
    >
      {isLoading ? (
        <View className="flex-1 flex-row justify-center items-center gap-2">
          <ActivityIndicator size="large" color="black" />
          <Text className="font-pmedium text-gray-600">
            Đang tải thông tin...
          </Text>
        </View>
      ) : (
        <>
          {/* Header Profile */}
          <View className="bg-white p-5">
            <View className="items-center gap-4">
              <TouchableOpacity onPress={() => setShowFullImage(true)}>
                <Image
                  source={getImageSource(userData)}
                  className="w-24 h-24 rounded-full"
                />
              </TouchableOpacity>
              <View className="items-center gap-2">
                <Text
                  className="font-pbold text-2xl"
                  selectable
                  onPress={async () => {
                    if (userData?.name) {
                      await Clipboard.setStringAsync(userData.name);
                    }
                  }}
                >
                  {userData?.name}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="mail-outline" size={16} color="gray" />
                  <Text
                    className="font-pmedium text-gray-600"
                    selectable
                    onPress={async () => {
                      if (userData?.email) {
                        await Clipboard.setStringAsync(userData.email);
                      }
                    }}
                  >
                    {userData?.email}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {userData?.location?.location_name &&
                  userData?.location?.location_name.length > 0 ? (
                    <>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color="gray"
                      />
                      <Text
                        className="font-pmedium text-gray-600"
                        selectable
                        onPress={async () => {
                          if (userData?.location?.location_name) {
                            await Clipboard.setStringAsync(
                              userData.location.location_name
                            );
                          }
                        }}
                      >
                        {userData.location.location_name}
                      </Text>
                    </>
                  ) : null}
                </View>
                {userData?.phone_number && userData.phone_number.length > 0 ? (
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="call-outline" size={16} color="gray" />
                    <Text className="font-pmedium text-gray-600" selectable>
                      {userData.phone_number
                        ?.slice(0, -3)
                        .padEnd(userData.phone_number.length || 0, "*")}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Search */}
          <View className="bg-white p-5">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
              <FontAwesome name="search" size={16} color="gray" />
              <TextInput
                placeholder="Tìm kiếm dịch vụ..."
                className="ml-2 flex-1 font-pregular"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-full border ${
                  selectedCategory === "all"
                    ? "bg-black border-black"
                    : "border-gray-300"
                }`}
              >
                <Text
                  className={`font-pmedium ${
                    selectedCategory === "all" ? "text-white" : "text-gray-700"
                  }`}
                >
                  Tất cả ({services.length})
                </Text>
              </TouchableOpacity>
              {categories.map((category) => {
                const serviceCount = services.filter(
                  (service) => service.category?.id === category.id
                ).length;

                return (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(String(category.id))}
                    className={`px-4 py-2 rounded-full border ${
                      selectedCategory === String(category.id)
                        ? "bg-black border-black"
                        : "border-gray-300"
                    }`}
                  >
                    <Text
                      className={`font-pmedium ${
                        selectedCategory === String(category.id)
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {category.category_name} ({serviceCount})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Services List */}
          <View className="bg-white p-5">
            <Text className="font-pbold text-xl mb-4">
              Dịch vụ ({filteredServices.length})
            </Text>
            <View className="gap-4">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} data={service} />
              ))}
              {filteredServices.length === 0 && (
                <Text className="text-center text-gray-500 mt-4">
                  Không tìm thấy dịch vụ nào
                </Text>
              )}
            </View>
          </View>

          <Modal
            visible={showFullImage}
            transparent
            animationType="fade"
            onRequestClose={() => setShowFullImage(false)}
          >
            <View className="flex-1 bg-black">
              <TouchableOpacity
                onPress={() => setShowFullImage(false)}
                className="absolute right-4 top-12 z-10"
              >
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>
              <View className="flex-1 justify-center">
                <Image
                  source={getImageSource(userData)}
                  style={{
                    width: Dimensions.get("window").width,
                    height: Dimensions.get("window").width,
                  }}
                  resizeMode="contain"
                />
              </View>
            </View>
          </Modal>
        </>
      )}
    </ScrollView>
  );
};

export default UserProfile;

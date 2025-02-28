import {
  View,
  Text,
  ScrollView,
  Image,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { CategoryType, ServiceType, UserType, CommentType } from "@/types/type";
import { axiosFetch } from "@/stores/dataStore";
import { getAvatarUrl } from "@/utils/utils";
import ServiceCard from "@/components/ServiceCard";
import useRentoData from "@/stores/dataStore";
import CommentCard from "@/components/CommentCard";

const normalizeVietnamese = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const UserProfile = () => {
  const { id } = useLocalSearchParams();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const updateFavorite = useRentoData((state) => state.updateFavorite);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const [userRes, categoriesRes] = await Promise.all([
        axiosFetch(`/users/${id}`),
        axiosFetch("/categories"),
      ]);

      if (userRes?.data) {
        setUserData(userRes.data);
        setServices(userRes.data.service || []);
      }

      if (categoriesRes?.data?.data) {
        setCategories(categoriesRes.data.data);
      }
    } catch (error) {
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
    await fetchUserData();
    setIsRefreshing(false);
  };

  const onPressFavorite = async (serviceId: number) => {
    if (!serviceId) return;
    try {
      await updateFavorite(serviceId);
      await fetchUserData();
    } catch (error) {
      console.error("Error updating favorite:", error);
    }
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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="font-pmedium text-gray-600 mb-4">Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="gap-2 pb-5"
    >
      {/* Header Profile */}
      <View className="bg-white p-5">
        <View className="items-center gap-4">
          <Image
            source={getAvatarUrl(userData)}
            className="w-24 h-24 rounded-full"
          />
          <View className="items-center">
            <Text className="font-pbold text-2xl">{userData?.name}</Text>
            <Text className="font-pmedium text-gray-600 mt-1">
              {userData?.email}
            </Text>
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
              Tất cả
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
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
                {category.category_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Services List */}
      <View className="bg-white p-5">
        <Text className="font-pbold text-xl mb-4">
          Dịch vụ ({filteredServices.length})
        </Text>
        <View className="gap-4">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              data={service}
              onPressFavorite={() => onPressFavorite(service.id)}
            />
          ))}
          {filteredServices.length === 0 && (
            <Text className="text-center text-gray-500 mt-4">
              Không tìm thấy dịch vụ nào
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default UserProfile;

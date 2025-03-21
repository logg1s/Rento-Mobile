import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { ServiceType } from "@/types/type";
import { axiosFetch } from "@/stores/dataStore";
import SmallerServiceCard from "@/components/SmallerServiceCard";
import useRentoData from "@/stores/dataStore";

const UserServices = () => {
  const params = useLocalSearchParams();
  const id = params?.id ? Number(params.id) : null;
  const router = useRouter();
  const [services, setServices] = useState<ServiceType[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const retryCount = useRef(0);

  const fetchServices = async () => {
    if (!id) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosFetch(`/users/${id}`);
      if (response?.data?.services) {
        setServices(response.data.services);
        setFilteredServices(response.data.services);
        retryCount.current = 0;
      } else if (retryCount.current < 5) {
        retryCount.current++;
        fetchServices();
      }
    } catch (error) {
      if (retryCount.current < 5) {
        retryCount.current++;
        fetchServices();
      }
      console.error("Error fetching services:", error);
      Alert.alert("Lỗi", "Không thể tải dịch vụ. Vui lòng thử lại sau.");
      setServices([]);
      setFilteredServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [id]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchServices();
    setIsRefreshing(false);
  };

  const onPressFavorite = async (serviceId: number, action: boolean) => {
    if (!serviceId) return;
    try {
      await updateFavorite(serviceId, action);
      await fetchServices();
    } catch (error) {
      console.error("Error updating favorite:", error);
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại sau."
      );
    }
  };

  // Lọc services dựa trên searchQuery
  useEffect(() => {
    if (!services?.length) {
      setFilteredServices([]);
      return;
    }

    if (searchQuery) {
      const filtered = services.filter((service) =>
        service?.service_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchQuery, services]);

  if (!id) return null;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="font-pmedium text-gray-600 mb-4">
          Đang tải dịch vụ...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Search Bar */}
      <View className="bg-white p-5">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <FontAwesome name="search" size={16} color="gray" />
          <TextInput
            placeholder="Tìm kiếm dịch vụ..."
            className="ml-2 flex-1 font-pregular"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Services List */}
      <View className="bg-white mt-2 p-5">
        <Text className="font-pbold text-xl mb-4">
          Dịch vụ ({filteredServices?.length || 0})
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {filteredServices?.map((service) =>
            service?.id ? (
              <View
                key={service.id}
                style={{ width: (Dimensions.get("window").width - 40) / 2 }}
              >
                <SmallerServiceCard data={service} containerStyles="mb-4" />
              </View>
            ) : null
          )}
          {!filteredServices?.length && (
            <Text className="text-center text-gray-500 w-full mt-4">
              Không tìm thấy dịch vụ nào
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default UserServices;

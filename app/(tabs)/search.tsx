"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ServiceCard from "@/components/ServiceCard";
import CustomButton from "@/components/CustomButton";
import { services, categories, locations } from "@/lib/dummy";
import debounce from "lodash/debounce";
import Slider from "@react-native-community/slider";

type Filters = {
  category: string;
  priceRange: number;
  location: string;
  minRating: number;
};

const applyFilters = (data, searchQuery, filters) => {
  return data.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filters.category === "all" || item.category === filters.category;
    const matchesPrice = item.pricePerHour <= filters.priceRange;
    const matchesLocation =
      filters.location === "Tất cả" || item.location === filters.location;
    const matchesRating = item.rating >= filters.minRating;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesLocation &&
      matchesRating
    );
  });
};

const SearchTab = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    priceRange: 1000000,
    location: "Tất cả",
    minRating: 0,
  });
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  const [selectedCategory, setSelectedCategory] = useState("");

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query !== "") {
        setFilteredData(applyFilters(services, query, filters));
      } else {
        setFilteredData([]);
      }
    }, 300),
    [filters],
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleFavorite = (id: number) => {
    setFilteredData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isLike: !item.isLike } : item,
      ),
    );
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    if (searchQuery !== "" || selectedCategory !== "") {
      setFilteredData(
        applyFilters(services, searchQuery, {
          ...localFilters,
          category: selectedCategory,
        }),
      );
    }
    setFilterModalVisible(false);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setFilteredData(
      applyFilters(services, "", { ...filters, category: categoryId }),
    );
  };

  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isFilterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View className="flex-1 justify-end">
        <View className="bg-white rounded-t-3xl p-5">
          <Text className="font-pbold text-2xl mb-4">Bộ lọc</Text>

          <Text className="font-pmedium text-lg mb-2">
            Khoảng giá (VNĐ/giờ)
          </Text>
          <View className="mb-4">
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={0}
              maximumValue={1000000}
              step={50000}
              minimumTrackTintColor="#0286FF"
              maximumTrackTintColor="#000000"
              value={localFilters.priceRange}
              onValueChange={(value) =>
                setLocalFilters((prev) => ({ ...prev, priceRange: value }))
              }
            />
            <View className="flex-row justify-between">
              <Text className="font-pmedium">0đ</Text>
              <Text className="font-pmedium">
                {localFilters.priceRange.toLocaleString("vi-VN")}đ
              </Text>
            </View>
          </View>

          <Text className="font-pmedium text-lg mb-2">Địa điểm</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {locations.map((location) => (
              <TouchableOpacity
                key={location}
                onPress={() =>
                  setLocalFilters((prev) => ({ ...prev, location }))
                }
                className={`px-4 py-2 mr-2 rounded-full ${
                  localFilters.location === location
                    ? "bg-primary-500"
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`font-pmedium ${localFilters.location === location ? "text-white" : "text-gray-800"}`}
                >
                  {location}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text className="font-pmedium text-lg mb-2">Đánh giá tối thiểu</Text>
          <View className="flex-row justify-between mb-4">
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                onPress={() =>
                  setLocalFilters((prev) => ({ ...prev, minRating: rating }))
                }
                className={`px-4 py-2 rounded-full ${
                  localFilters.minRating === rating
                    ? "bg-primary-500"
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`font-pmedium ${localFilters.minRating === rating ? "text-white" : "text-gray-800"}`}
                >
                  {rating}⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <CustomButton title="Áp dụng" onPress={handleApplyFilters} />
        </View>
      </View>
    </Modal>
  );

  const CategoryGrid = () => (
    <View className="flex-1">
      <Text className="font-pbold text-2xl mb-4">Danh mục dịch vụ</Text>
      <FlatList
        data={categories.filter((category) => category.id !== "all")}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-1 aspect-square m-2 rounded-xl overflow-hidden"
            onPress={() => handleCategoryPress(item.id)}
          >
            <Image
              source={{ uri: `https://picsum.photos/seed/${item.id}/200` }}
              className="w-full h-full absolute bg-black opacity-90"
            />
            <View className="w-full h-full justify-end p-4">
              <Text className="font-pbold text-white text-xl">{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="p-5">
        <Text className="font-pbold text-3xl mb-4">Tìm kiếm</Text>
        <View className="flex-row items-center">
          <View className="flex-1 flex-row items-center bg-white rounded-full px-4 py-2 mr-2">
            <Ionicons name="search" size={20} color="gray" />
            <TextInput
              placeholder="Tìm kiếm dịch vụ, nhà cung cấp..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              className="flex-1 ml-2 font-pmedium text-base"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                  setFilteredData([]);
                }}
              >
                <Ionicons name="close-circle" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            className="bg-primary-500 p-3 rounded-full"
          >
            <Ionicons name="options" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {filteredData.length > 0 || selectedCategory !== "" ? (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <ServiceCard
              data={item}
              onPressFavorite={() => handleFavorite(item.id)}
              containerStyles="mb-4"
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center">
              <Text className="font-pmedium text-lg text-gray-500">
                Không tìm thấy kết quả
              </Text>
            </View>
          }
        />
      ) : (
        <CategoryGrid />
      )}

      <FilterModal />
    </SafeAreaView>
  );
};

export default SearchTab;

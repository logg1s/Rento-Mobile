"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  Modal,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ServiceCard from "@/components/ServiceCard";
import CustomButton from "@/components/CustomButton";
import debounce from "lodash/debounce";
import useRentoData from "@/stores/dataStore";
import Slider from "@react-native-community/slider";
import { formatToVND, normalizeVietnamese, searchFilter } from "@/utils/utils";
import { FilterType, defaultFilters } from "@/types/filter";
import { ScrollView } from "react-native-gesture-handler";
import { ServiceType } from "@/types/type";

const SearchTab = () => {
  const { fromHome, searchText } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState((searchText as string) || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filterState, setFilterState] = useState<FilterType>(defaultFilters);
  const [providerFilter, setProviderFilter] = useState("");
  const filters = useMemo(() => filterState, [filterState]);

  const services = useRentoData((state) => state.services);
  const categories = useRentoData((state) => state.categories);
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const fetchServices = useRentoData((state) => state.fetchServices);

  useEffect(() => {
    if (fromHome) {
      setShowSearch(true);
      setFilterState((prev) => ({ ...prev, categories: [] })); // Reset to all categories

      if (searchText) {
        setSearchQuery(searchText as string);
      }
    }
  }, [fromHome, searchText]);

  const ratingCounts = useMemo(() => {
    const counts = new Array(6).fill(0); // 0-5 stars
    services.forEach((service) => {
      const rating = Math.round(service.average_rate ?? 0);
      counts[rating]++;
    });
    return counts;
  }, [services]);

  const filteredData = useMemo(() => {
    if (!showSearch) return [];

    return services.filter((item) => {
      const searchTerms = normalizeVietnamese(searchQuery.toLowerCase());
      const providerTerms = normalizeVietnamese(providerFilter.toLowerCase());
      // Separate search conditions for clarity
      const matchesServiceName = searchFilter(item.service_name, searchTerms);
      const matchesDescription = searchFilter(
        item.service_description,
        searchTerms,
      );
      const matchesProvider = searchFilter(item.user?.name, providerTerms);

      const matchesSearch =
        searchQuery === "" || matchesServiceName || matchesDescription;
      const matchesProviderFilter = providerFilter === "" || matchesProvider;

      const matchesCategories =
        filters.categories.length === 0 ||
        filters.categories.includes(item.category?.id);

      // Updated price filtering logic
      const matchesPrice =
        !item.price || item.price.length === 0
          ? filters.priceRange.min === 0 // Show free services only when min is 0
          : item.price?.some(
              (p) =>
                p.price_value >= filters.priceRange.min &&
                p.price_value <= filters.priceRange.max,
            );

      const matchesRating =
        filters.ratings.length === 0 || // Show all if no ratings selected
        filters.ratings.includes(Math.round(item.average_rate ?? 0));

      const matchesLocation =
        !filters.location || item.location?.location_name === filters.location;

      return (
        matchesSearch &&
        matchesProviderFilter &&
        matchesCategories &&
        matchesPrice &&
        matchesRating &&
        matchesLocation
      );
    });
  }, [services, searchQuery, providerFilter, filters, showSearch]);

  const handleCategorySelect = (categoryId: number) => {
    setShowSearch(true);
    setFilterState((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const handleBackToCategories = () => {
    setShowSearch(false);
    setSearchQuery("");
    setFilterState(defaultFilters);
  };

  // Add selected category name for display
  const selectedCategoriesNames = useMemo(() => {
    return categories
      .filter((c) => filters.categories.includes(c.id))
      .map((c) => c.category_name);
  }, [filters.categories, categories]);

  // Enhanced FilterModal with better state management
  const FilterModal = () => {
    const [localFilters, setLocalFilters] = useState<FilterType>(filters);
    const [localProviderFilter, setLocalProviderFilter] =
      useState(providerFilter);

    const applyFilters = useCallback(() => {
      setFilterState(localFilters);
      setProviderFilter(localProviderFilter);
      setShowFilter(false);
    }, [localFilters, localProviderFilter]);

    const toggleRating = (rating: number) => {
      setLocalFilters((prev) => {
        const newRatings = prev.ratings.includes(rating)
          ? prev.ratings.filter((r) => r !== rating)
          : [...prev.ratings, rating];
        return { ...prev, ratings: newRatings };
      });
    };

    return (
      <Modal
        animationType="fade" // Changed to fade for smoother transitions
        transparent={true}
        visible={showFilter}
        onRequestClose={() => setShowFilter(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-pbold text-2xl">Bộ lọc tìm kiếm</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[70vh]">
              {/* Add Provider Search Section at the top */}
              <View className="mb-6">
                <Text className="font-pmedium text-lg mb-4">Nhà cung cấp</Text>
                <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2">
                  <Ionicons name="person" size={20} color="gray" />
                  <TextInput
                    placeholder="Tìm theo tên nhà cung cấp..."
                    value={localProviderFilter}
                    onChangeText={setLocalProviderFilter}
                    className="flex-1 ml-2 font-pmedium"
                  />
                  {localProviderFilter !== "" && (
                    <TouchableOpacity
                      onPress={() => setLocalProviderFilter("")}
                    >
                      <Ionicons name="close-circle" size={20} color="gray" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Price Range Section */}
              <View className="mb-6">
                <Text className="font-pmedium text-lg mb-4">Khoảng giá</Text>
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 mr-2">
                    <Text className="font-pmedium mb-2">Từ</Text>
                    <TextInput
                      className="bg-gray-100 p-3 rounded-lg font-pmedium"
                      keyboardType="numeric"
                      value={localFilters.priceRange.min.toString()}
                      onChangeText={(value) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          priceRange: {
                            ...prev.priceRange,
                            min: parseInt(value) || 0,
                          },
                        }))
                      }
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="font-pmedium mb-2">Đến</Text>
                    <TextInput
                      className="bg-gray-100 p-3 rounded-lg font-pmedium"
                      keyboardType="numeric"
                      value={localFilters.priceRange.max.toString()}
                      onChangeText={(value) =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          priceRange: {
                            ...prev.priceRange,
                            max: parseInt(value) || 0,
                          },
                        }))
                      }
                    />
                  </View>
                </View>
              </View>

              {/* Modified Rating Section */}
              <View className="mb-6">
                <Text className="font-pmedium text-lg mb-4">Đánh giá</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      onPress={() => toggleRating(rating)}
                      className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                        localFilters.ratings.includes(rating)
                          ? "bg-primary-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`font-pmedium ${
                          localFilters.ratings.includes(rating)
                            ? "text-white"
                            : "text-gray-800"
                        }`}
                      >
                        {rating}⭐
                      </Text>
                      <Text
                        className={`font-pregular text-sm ${
                          localFilters.ratings.includes(rating)
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      >
                        ({ratingCounts[rating]})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Locations Section - if you have locations data */}
              <View className="mb-6">
                <Text className="font-pmedium text-lg mb-4">Địa điểm</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {["Tất cả", "Hà Nội", "TP.HCM", "Đà Nẵng"].map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        onPress={() =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            location: loc === "Tất cả" ? null : loc,
                          }))
                        }
                        className={`px-6 py-3 rounded-full ${
                          (loc === "Tất cả" && !localFilters.location) ||
                          localFilters.location === loc
                            ? "bg-primary-500"
                            : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`font-pmedium ${
                            (loc === "Tất cả" && !localFilters.location) ||
                            localFilters.location === loc
                              ? "text-white"
                              : "text-gray-800"
                          }`}
                        >
                          {loc}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Add Sort Section */}
              <View className="mb-6">
                <Text className="font-pmedium text-lg mb-4">Sắp xếp theo</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { value: null, label: "Mặc định" },
                    { value: "price_asc", label: "Giá tăng dần" },
                    { value: "price_desc", label: "Giá giảm dần" },
                    { value: "rating", label: "Đánh giá cao nhất" },
                    { value: "newest", label: "Mới nhất" },
                  ].map((sort) => (
                    <TouchableOpacity
                      key={sort.value ?? "default"}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          sortBy: sort.value,
                        }))
                      }
                      className={`px-4 py-2 rounded-full ${
                        localFilters.sortBy === sort.value
                          ? "bg-primary-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`font-pmedium ${
                          localFilters.sortBy === sort.value
                            ? "text-white"
                            : "text-gray-800"
                        }`}
                      >
                        {sort.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-2 mt-4 pt-2 border-t border-gray-200">
              <CustomButton
                title="Đặt lại"
                onPress={() => {
                  setLocalFilters(defaultFilters);
                  setLocalProviderFilter("");
                }}
                containerStyles="flex-1 bg-gray-500"
              />
              <CustomButton
                title="Áp dụng"
                onPress={() => {
                  // Validate price range
                  if (
                    localFilters.priceRange.min > localFilters.priceRange.max
                  ) {
                    const temp = localFilters.priceRange.min;
                    setLocalFilters((prev) => ({
                      ...prev,
                      priceRange: {
                        min: prev.priceRange.max,
                        max: temp,
                      },
                    }));
                  }
                  applyFilters();
                }}
                containerStyles="flex-1"
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Add new category selection section component
  const CategorySelectionHeader = () => (
    <View className="bg-white p-5 border-b border-gray-200">
      <Text className="font-pbold text-xl mb-3">Chọn thể loại dịch vụ</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() =>
              setFilterState((prev) => ({ ...prev, categories: [] }))
            }
            className={`px-4 py-2 rounded-full ${
              filters.categories.length === 0 ? "bg-primary-500" : "bg-gray-100"
            }`}
          >
            <Text
              className={
                filters.categories.length === 0 ? "text-white" : "text-gray-800"
              }
            >
              Tất cả thể loại
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategorySelect(cat.id)}
              className={`px-4 py-2 rounded-full flex-row items-center gap-2 ${
                filters.categories.includes(cat.id)
                  ? "bg-primary-500"
                  : "bg-gray-100"
              }`}
            >
              <Text
                className={
                  filters.categories.includes(cat.id)
                    ? "text-white"
                    : "text-gray-800"
                }
              >
                {cat.category_name}
              </Text>
              {filters.categories.includes(cat.id) && (
                <Ionicons name="checkmark-circle" size={16} color="white" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  // Modified categories with "All" option
  const allCategoriesOption = { id: -1, category_name: "Tất cả" };
  const allCategories = useMemo(() => {
    return [allCategoriesOption, ...categories];
  }, [categories]);

  // Updated CategoryGrid component
  const CategoryGrid = () => (
    <View className="flex-1">
      <View className="px-5 pt-5">
        <Text className="font-pbold text-2xl mb-4">Khám phá dịch vụ</Text>
        {categories.length > 0 ? (
          <FlatList
            data={allCategories}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`flex-1 aspect-square m-2 rounded-xl overflow-hidden`}
                onPress={() => {
                  if (item.id === -1) {
                    // Chọn tất cả
                    setShowSearch(true);
                  } else {
                    handleCategorySelect(item.id);
                  }
                }}
              >
                <Image
                  source={
                    item.id === -1
                      ? require("@/assets/images/picsum_1.jpg") // Thay thế tạm thời bằng ảnh có sẵn
                      : { uri: `https://picsum.photos/seed/${item.id}/200` }
                  }
                  className="w-full h-full absolute"
                  resizeMode="cover"
                />
                <View
                  className={`w-full h-full justify-end p-4 ${
                    item.id === -1 ? "bg-primary-500/50" : "bg-black/30"
                  }`}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="font-pbold text-xl text-white flex-1">
                      {item.category_name}
                    </Text>
                    {item.id === -1 && (
                      <View className="bg-primary-500 rounded-full p-2">
                        <Ionicons name="grid" size={16} color="white" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="font-pmedium text-lg text-gray-500">
              Đang tải danh mục...
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Modified ServiceCard to handle services without price
  const renderServiceCard = (item: ServiceType) => (
    <ServiceCard
      data={{
        ...item,
        price: item.price?.length
          ? item.price
          : [{ price_value: 0, price_name: "Miễn phí" }],
      }}
      onPressFavorite={() => updateFavorite(item.id, !item.is_liked)}
      containerStyles="mb-4"
    />
  );

  // Enhanced search results view with modified price filter badge
  const SearchResults = () => (
    <View className="flex-1">
      <View className="bg-white">
        <CategorySelectionHeader />
        <View className="px-5 py-3 border-t border-gray-200">
          <Text className="font-pmedium text-gray-600">
            {filteredData.length > 0
              ? filters.categories.length === 0
                ? `Tìm thấy ${filteredData.length} kết quả từ tất cả thể loại`
                : `Tìm thấy ${filteredData.length} kết quả từ ${filters.categories.length} thể loại`
              : "Không tìm thấy kết quả phù hợp"}
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {/* Add provider filter badge */}
            {providerFilter !== "" && (
              <View className="bg-primary-100 px-3 py-1 rounded-full">
                <Text className="font-pmedium text-primary-500">
                  👤 Nhà cung cấp: {providerFilter}
                </Text>
              </View>
            )}
            {filters.sortBy && (
              <View className="bg-primary-100 px-3 py-1 rounded-full">
                <Text className="font-pmedium text-primary-500">
                  {filters.sortBy === "price_asc" && "↑ Giá tăng dần"}
                  {filters.sortBy === "price_desc" && "↓ Giá giảm dần"}
                  {filters.sortBy === "rating" && "⭐ Đánh giá cao nhất"}
                  {filters.sortBy === "newest" && "🕒 Mới nhất"}
                </Text>
              </View>
            )}
            {filters.ratings.length > 0 && (
              <View className="bg-primary-100 px-3 py-1 rounded-full">
                <Text className="font-pmedium text-primary-500">
                  {filters.ratings
                    .sort((a, b) => a - b)
                    .map((r) => `${r}⭐`)
                    .join(", ")}
                </Text>
              </View>
            )}
            {filters.location && (
              <View className="bg-primary-100 px-3 py-1 rounded-full">
                <Text className="font-pmedium text-primary-500">
                  📍 {filters.location}
                </Text>
              </View>
            )}
            {(filters.priceRange.min > 0 ||
              filters.priceRange.max !== defaultFilters.priceRange.max) && (
              <View className="bg-primary-100 px-3 py-1 rounded-full">
                <Text className="font-pmedium text-primary-500">
                  💰{" "}
                  {filters.priceRange.min === 0
                    ? `Tối đa ${formatToVND(filters.priceRange.max)}`
                    : `${formatToVND(filters.priceRange.min)} - ${formatToVND(
                        filters.priceRange.max,
                      )}`}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchServices} />
        }
        renderItem={({ item }) => renderServiceCard(item)}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-10">
            <Ionicons name="search" size={48} color="gray" />
            <Text className="font-pmedium text-lg text-gray-500 mt-4">
              Không tìm thấy kết quả
            </Text>
            <Text className="font-pregular text-gray-400 text-center mt-2">
              Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
            </Text>
          </View>
        }
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <View className="p-5">
        <View className="flex-row items-center mb-4">
          {showSearch && (
            <TouchableOpacity onPress={handleBackToCategories} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          )}
          <View>
            <Text className="font-pbold text-3xl">
              {showSearch ? "Tìm kiếm" : "Danh mục"}
            </Text>
            {showSearch && selectedCategoriesNames.length > 0 && (
              <Text className="font-pmedium text-primary-500">
                {selectedCategoriesNames.join(", ")}
              </Text>
            )}
          </View>
        </View>

        {showSearch && (
          <View className="flex-row items-center gap-2">
            <View className="flex-1 flex-row items-center bg-white rounded-full px-4 py-2">
              <Ionicons name="search" size={20} color="gray" />
              <TextInput
                placeholder="Tìm kiếm dịch vụ..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                className="flex-1 ml-2 font-pmedium text-base"
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    setShowSearch(true);
                  }
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowFilter(true)}
              className="bg-primary-500 p-3 rounded-full"
            >
              <Ionicons name="options" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showSearch ? <SearchResults /> : <CategoryGrid />}
      {showFilter && <FilterModal />}
    </SafeAreaView>
  );
};

export default SearchTab;

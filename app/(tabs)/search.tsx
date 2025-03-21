"use client";

import { useState, useCallback, useMemo, useEffect, useRef, memo } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import ServiceCard from "@/components/ServiceCard";
import CustomButton from "@/components/CustomButton";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import { formatToVND, normalizeVietnamese, searchFilter } from "@/utils/utils";
import { FilterType, defaultFilters, SortOption } from "@/types/filter";
import { ScrollView } from "react-native-gesture-handler";
import { ServiceType } from "@/types/type";
import { useLocationStore, Province } from "@/stores/locationStore";
import React from "react";

const SearchTab = () => {
  const { fromHome, searchText } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState((searchText as string) || "");
  const [showFilter, setShowFilter] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filterState, setFilterState] = useState<FilterType>(defaultFilters);
  const [providerFilter, setProviderFilter] = useState("");
  const filters = useMemo(() => filterState, [filterState]);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [provinceSearchQuery, setProvinceSearchQuery] = useState("");
  const [tempLocation, setTempLocation] = useState<string | null>(null);
  const nextCursorRef = useRef<string | null>(null);
  const categories = useRentoData((state) => state.categories) || [];
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const fetchCategories = useRentoData((state) => state.fetchCategories);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [services, setServices] = useState<ServiceType[]>([]);
  const { provinces, loadingProvinces, fetchProvinces } = useLocationStore();
  const [isLoading, setIsLoading] = useState(false);
  const retryTimeRef = useRef<number>(0);
  const listRef = useRef<FlatList>(null);
  const scrollRef = useRef<number | null>(null);
  const [filteredData, setFilteredData] = useState<ServiceType[]>([]);

  // Thêm refs để theo dõi các filter trước đó
  const prevSearchQuery = useRef(searchQuery);
  const prevProviderFilter = useRef(providerFilter);
  const prevFilters = useRef(filters);

  const onRefreshService = useCallback(async () => {
    setIsRefreshing(true);
    try {
      nextCursorRef.current = null;
      const newServices: ServiceType[] = [];
      await fetchServices(newServices);
    } catch (error: any) {
      console.error(error?.response?.data);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const onRefreshCategories = useCallback(async () => {
    try {
      setIsRefreshing(true);
      fetchCategories();
    } catch (error) {
      console.log(error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (fromHome) {
      setShowSearch(true);
      setFilterState((prev) => ({ ...prev, categories: [] })); // Reset to all categories

      if (searchText) {
        setSearchQuery(searchText as string);
      }
    }
  }, [fromHome, searchText]);

  const fetchServices = useCallback(
    async (currentService: ServiceType[] | []) => {
      setIsLoading(true);
      let urlEndpoint = "/services";
      if (nextCursorRef.current) {
        urlEndpoint += `?cursor=${nextCursorRef.current}`;
      }

      try {
        const response = await axiosFetch(urlEndpoint, "get");

        if (response?.data) {
          const servicesData = response.data;
          const newService = [...currentService, ...servicesData.data];

          if (servicesData?.next_cursor) {
            nextCursorRef.current = servicesData.next_cursor;
            retryTimeRef.current = 0;
            await fetchServices(newService);
          } else {
            setServices(newService);
            setTimeout(() => {
              if (listRef?.current && scrollRef?.current) {
                listRef.current?.scrollToOffset({
                  offset: scrollRef.current,
                  animated: false,
                });
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        if (retryTimeRef.current < 10) {
          console.log("retry", retryTimeRef.current);
          retryTimeRef.current++;
          fetchServices(currentService);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    retryTimeRef.current = 0;
    fetchCategories();
    fetchProvinces();
    fetchServices([]);
  }, [fetchProvinces, fetchServices]);

  const ratingCounts = () => {
    const counts = new Array(6).fill(0); // 0-5 stars?

    if (Array.isArray(services) && services.length > 0) {
      services.forEach((service) => {
        const rating = Math.round(service.average_rate ?? 0);
        counts[rating]++;
      });
    }
    return counts;
  };

  useEffect(() => {
    if (!(Array.isArray(services) && services.length > 0) || !showSearch) {
      setFilteredData([]);
      return;
    }

    const searchTerms = normalizeVietnamese(searchQuery.toLowerCase());
    const providerTerms = normalizeVietnamese(providerFilter.toLowerCase());

    setFilteredData((prevFilteredData) => {
      if (
        prevFilteredData.length > 0 &&
        searchQuery === prevSearchQuery.current &&
        providerFilter === prevProviderFilter.current &&
        JSON.stringify(filters) === JSON.stringify(prevFilters.current)
      ) {
        return prevFilteredData;
      }

      // Lưu trạng thái hiện tại để so sánh lần sau
      prevSearchQuery.current = searchQuery;
      prevProviderFilter.current = providerFilter;
      prevFilters.current = JSON.parse(JSON.stringify(filters));

      const filtered = services.filter((item) => {
        const matchesServiceName = searchFilter(item.service_name, searchTerms);
        const matchesDescription = searchFilter(
          item.service_description || "",
          searchTerms
        );
        const matchesProvider = searchFilter(
          item.user?.name || "",
          providerTerms
        );

        const matchesSearch =
          searchQuery === "" || matchesServiceName || matchesDescription;
        const matchesProviderFilter = providerFilter === "" || matchesProvider;

        const matchesCategories =
          filters.categories.length === 0 ||
          (item.category?.id !== undefined &&
            filters.categories.includes(item.category.id));

        const matchesPrice =
          !item.price || item.price.length === 0
            ? filters.priceRange.min === 0
            : item.price?.some(
                (p) =>
                  p.price_value >= filters.priceRange.min &&
                  p.price_value <= filters.priceRange.max
              );

        const matchesRating =
          filters.ratings.length === 0 ||
          filters.ratings.includes(Math.round(item.average_rate ?? 0));

        const matchesLocation =
          !filters.location ||
          (item.location?.location_name &&
            normalizeVietnamese(
              item.location.location_name.toLowerCase()
            ).includes(normalizeVietnamese(filters.location.toLowerCase()))) ||
          (item.location?.province?.name &&
            normalizeVietnamese(
              item.location.province.name.toLowerCase()
            ).includes(normalizeVietnamese(filters.location.toLowerCase())));

        return (
          matchesSearch &&
          matchesProviderFilter &&
          matchesCategories &&
          matchesPrice &&
          matchesRating &&
          matchesLocation
        );
      });

      return filtered;
    });
  }, [services, searchQuery, providerFilter, filters, showSearch]);

  const handleCategorySelect = useCallback((categoryId: number) => {
    setShowSearch(true);
    setFilterState((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId],
    }));
  }, []);

  const handleBackToCategories = useCallback(() => {
    setShowSearch(false);
    setSearchQuery("");
    setFilterState(defaultFilters);
  }, []);

  const ProvinceSelectionModal = React.memo(() => {
    // Use component-local state to prevent parent re-renders
    const [localSearchQuery, setLocalSearchQuery] =
      useState(provinceSearchQuery);
    const [searchResults, setSearchResults] = useState(provinces);

    // Update search results only when typing finishes
    useEffect(() => {
      if (!localSearchQuery) {
        setSearchResults(provinces);
        return;
      }

      const normalizedQuery = normalizeVietnamese(
        localSearchQuery.toLowerCase()
      );
      const filtered = provinces.filter((province) =>
        normalizeVietnamese(province.name.toLowerCase()).includes(
          normalizedQuery
        )
      );
      setSearchResults(filtered);
    }, [localSearchQuery, provinces]);

    // Only sync with parent state when modal opens
    useEffect(() => {
      if (showProvinceModal) {
        setLocalSearchQuery(provinceSearchQuery);
      }
    }, [showProvinceModal]);

    const handleSelectProvince = useCallback(
      (province: Province | null) => {
        setTempLocation(province?.name || null);
        setShowProvinceModal(false);
        setProvinceSearchQuery(localSearchQuery);
      },
      [localSearchQuery]
    );

    const handleClearSearch = useCallback(() => {
      setLocalSearchQuery("");
    }, []);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showProvinceModal}
        onRequestClose={() => setShowProvinceModal(false)}
        statusBarTranslucent={true}
      >
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-5 h-[80%]">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="font-pbold text-2xl">Chọn tỉnh thành</Text>
                <TouchableOpacity
                  onPress={() => setShowProvinceModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-2 mb-4">
                <Ionicons name="search" size={20} color="gray" />
                <TextInput
                  placeholder="Tìm kiếm tỉnh thành..."
                  value={localSearchQuery}
                  onChangeText={setLocalSearchQuery}
                  className="flex-1 ml-2 font-pmedium"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />
                {localSearchQuery !== "" && (
                  <TouchableOpacity
                    onPress={handleClearSearch}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={20} color="gray" />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => index.toString()}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={true}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={10}
                ListHeaderComponent={
                  <TouchableOpacity
                    onPress={() => handleSelectProvince(null)}
                    className="p-4 border-b border-gray-200"
                  >
                    <Text className="font-pmedium text-lg">
                      Tất cả tỉnh thành
                    </Text>
                  </TouchableOpacity>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectProvince(item)}
                    className="p-4 border-b border-gray-200"
                  >
                    <Text className="font-pmedium text-lg">{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View className="flex-1 justify-center items-center py-10">
                    {loadingProvinces ? (
                      <Text className="font-pmedium text-lg text-gray-500">
                        Đang tải danh sách tỉnh thành...
                      </Text>
                    ) : (
                      <>
                        <Ionicons name="location" size={48} color="gray" />
                        <Text className="font-pmedium text-lg text-gray-500 mt-4">
                          Không tìm thấy tỉnh thành
                        </Text>
                      </>
                    )}
                  </View>
                }
              />
            </View>
          </View>
        )}
      </Modal>
    );
  });

  const selectedCategoriesNames = useMemo(() => {
    return categories
      .filter((c) => filters.categories.includes(c.id))
      .map((c) => c.category_name);
  }, [filters.categories, categories]);

  // Memoize ratingCounts để cải thiện hiệu suất
  const countRatings = useCallback(() => {
    const counts = new Array(6).fill(0); // 0-5 stars

    if (Array.isArray(services) && services.length > 0) {
      services.forEach((service) => {
        const rating = Math.round(service.average_rate ?? 0);
        if (rating >= 0 && rating <= 5) {
          counts[rating]++;
        }
      });
    }
    return counts;
  }, [services]);

  const ratingCountsArray = useMemo(() => countRatings(), [countRatings]);

  const FilterModal = memo(() => {
    const [localFilters, setLocalFilters] = useState<FilterType>(filters);
    const [localProviderFilter, setLocalProviderFilter] =
      useState(providerFilter);

    useEffect(() => {
      if (showProvinceModal === false && tempLocation !== null) {
        setLocalFilters((prev) => ({
          ...prev,
          location: tempLocation,
        }));
      }
    }, [showProvinceModal, tempLocation]);

    const applyFilters = useCallback(() => {
      setFilterState(localFilters);
      setProviderFilter(localProviderFilter);
      setShowFilter(false);
    }, [localFilters, localProviderFilter]);

    const toggleRating = useCallback((rating: number) => {
      setLocalFilters((prev) => {
        const newRatings = prev.ratings.includes(rating)
          ? prev.ratings.filter((r) => r !== rating)
          : [...prev.ratings, rating];
        return { ...prev, ratings: newRatings };
      });
    }, []);

    return (
      <Modal
        animationType="fade"
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
                        ({ratingCountsArray[rating]})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-6">
                <Text className="font-pmedium text-lg mb-4">Địa điểm</Text>
                <View className="flex-row items-center mb-3">
                  <TouchableOpacity
                    onPress={() => setShowProvinceModal(true)}
                    className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-4 py-3 border border-gray-200"
                  >
                    <Ionicons name="location" size={20} color="gray" />
                    <Text className="flex-1 ml-2 font-pmedium text-gray-700">
                      {localFilters.location || "Chọn tỉnh thành"}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="gray" />
                  </TouchableOpacity>

                  {localFilters.location && (
                    <TouchableOpacity
                      onPress={() =>
                        setLocalFilters((prev) => ({ ...prev, location: null }))
                      }
                      className="ml-2 p-3 bg-gray-100 rounded-lg"
                    >
                      <Ionicons name="close" size={20} color="gray" />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {provinces.slice(0, 5).map((province) => (
                    <TouchableOpacity
                      key={province.id}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          location: province.name,
                        }))
                      }
                      className={`px-4 py-2 rounded-full ${
                        localFilters.location === province.name
                          ? "bg-primary-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={
                          localFilters.location === province.name
                            ? "text-white font-pmedium"
                            : "text-gray-800 font-pmedium"
                        }
                      >
                        {province.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setShowProvinceModal(true)}
                    className="px-4 py-2 rounded-full bg-gray-100 flex-row items-center"
                  >
                    <Text className="text-primary-500 font-pmedium mr-1">
                      Xem thêm
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#0ea5e9"
                    />
                  </TouchableOpacity>
                </View>
              </View>

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
                          sortBy: sort.value as SortOption,
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
  });

  const CategorySelectionHeader = memo(() => (
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
  ));

  const allCategoriesOption = { id: -1, category_name: "Tất cả" };
  const allCategories = useMemo(() => {
    return [allCategoriesOption, ...categories];
  }, [categories]);

  const CategoryGrid = memo(() => {
    const handleCategoryPress = useCallback(
      (categoryId: number) => {
        if (categoryId === -1) {
          // Chọn tất cả
          setShowSearch(true);
        } else {
          handleCategorySelect(categoryId);
        }
      },
      [handleCategorySelect]
    );

    return (
      <View className="flex-1">
        <View className="px-5 pt-5">
          <Text className="font-pbold text-2xl mb-4">Khám phá dịch vụ</Text>
          {categories.length > 0 ? (
            <FlatList
              data={allCategories}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefreshCategories}
                />
              }
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`flex-1 aspect-square m-2 rounded-xl overflow-hidden`}
                  onPress={() => handleCategoryPress(item.id)}
                >
                  <Image
                    source={
                      item.id === -1
                        ? {
                            uri: `https://picsum.photos/seed/categories/200`,
                          }
                        : {
                            uri: `https://picsum.photos/seed/${item.category_name}/200`,
                          }
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
  });

  const SearchResults = React.memo(() => {
    const updateServiceFavorite = useCallback(
      (id: number, isLiked: boolean) => {
        // Lưu lại vị trí cuộn hiện tại trước khi cập nhật
        const currentScrollPosition = scrollRef.current;

        // Cập nhật filteredData
        setFilteredData((prev) => {
          return prev.map((service) =>
            service.id === id ? { ...service, is_liked: !isLiked } : service
          );
        });

        // Cập nhật services chính
        setServices((prev) => {
          return prev.map((service) =>
            service.id === id ? { ...service, is_liked: !isLiked } : service
          );
        });

        // Cập nhật trạng thái favorite trong store
        updateFavorite(id, !isLiked);
      },
      [updateFavorite]
    );

    return (
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
                          filters.priceRange.max
                        )}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefreshService}
            />
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          getItemLayout={(data, index) => ({
            length: 180, // Chiều cao ước tính cho mỗi item
            offset: 180 * index + (index > 0 ? 16 * index : 0), // 16 là margin-bottom từ containerStyles
            index,
          })}
          disableVirtualization={false}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => {
            return (
              <ServiceCardMemo
                data={{
                  ...item,
                  price: item.price?.length
                    ? item.price
                    : [
                        {
                          id: 0,
                          price_value: 0,
                          price_name: "Miễn phí",
                          deleted_at: null,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        },
                      ],
                }}
                containerStyles="mb-4"
              />
            );
          }}
          onScroll={(event) => {
            scrollRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          ref={listRef}
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
  });

  // Memoize ServiceCard để tránh re-render không cần thiết
  const ServiceCardMemo = React.memo(ServiceCard, (prevProps, nextProps) => {
    return (
      prevProps.data.id === nextProps.data.id &&
      prevProps.data.is_liked === nextProps.data.is_liked
    );
  });

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
      <ProvinceSelectionModal />
    </SafeAreaView>
  );
};

export default memo(SearchTab);

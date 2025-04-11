import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome, Entypo } from "@expo/vector-icons";
import useProviderStore from "@/stores/providerStore";
import ServiceCard from "@/components/ServiceCard";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import * as ImagePicker from "expo-image-picker";
import useRentoStore from "@/stores/dataStore";
import { CategoryType, CommentType, ProviderService } from "@/types/type";
import {
  normalizeVietnamese,
  formatDateToVietnamese,
  getImageSource,
} from "@/utils/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import CommentCard from "@/components/CommentCard";
import LocationInputField from "@/components/LocationInputField";
import { PaginationType } from "@/types/pagination";
import useAuthStore from "@/stores/authStore";
import { twMerge } from "tailwind-merge";

type ValidationRule = {
  isValid: boolean;
  message: string;
}[];

const rules: Record<string, ValidationRule> = {
  service_name: [
    {
      isValid: true,
      message: "Tên dịch vụ không được để trống",
    },
    {
      isValid: true,
      message: "Tên dịch vụ phải có ít nhất 5 ký tự",
    },
  ],
  service_description: [
    {
      isValid: true,
      message: "Mô tả dịch vụ không được để trống",
    },
    {
      isValid: true,
      message: "Mô tả dịch vụ phải có ít nhất 20 ký tự",
    },
  ],
  location_name: [
    {
      isValid: true,
      message: "Địa chỉ không được để trống",
    },
  ],
};

const priceRules: Record<string, ValidationRule> = {
  price_name: [
    {
      isValid: true,
      message: "Tên gói dịch vụ không được để trống",
    },
    {
      isValid: true,
      message: "Tên gói dịch vụ phải có ít nhất 3 ký tự",
    },
  ],
  price_value: [
    {
      isValid: true,
      message: "Giá dịch vụ không được để trống",
    },
    {
      isValid: true,
      message: "Giá dịch vụ phải lớn hơn 0",
    },
  ],
};

export default function ProviderServices() {
  const { services, isLoading, fetchServices, createService } =
    useProviderStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const categories = useRentoStore((state) => state.categories);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [servicesList, setServicesList] = useState<ProviderService[]>([]);
  const [paginationData, setPaginationData] = useState<{
    nextCursor: string | null;
    hasMore: boolean;
    isLoadingMore: boolean;
    refreshing: boolean;
    loadedCount: number;
    isFilterChanging: boolean;
    lastEndReachTime: number;
  }>({
    nextCursor: null,
    hasMore: true,
    isLoadingMore: false,
    refreshing: false,
    loadedCount: 0,
    isFilterChanging: false,
    lastEndReachTime: 0,
  });

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    service_name: "",
    service_description: "",
    location_name: "",
    lat: null as number | null,
    lng: null as number | null,
    real_location_name: "",
    province_id: null as number | null,
  });
  const [isValid, setIsValid] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );
  const [serviceComments, setServiceComments] = useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceData, setPriceData] = useState({
    price_name: "",
    price_value: "",
  });
  const [isPriceValid, setIsPriceValid] = useState(false);

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  const [isExpandedCategories, setIsExpandedCategories] = useState(false);
  const INITIAL_CATEGORIES_TO_SHOW = 3;

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const onEndReachedCalledDuringMomentum = useRef<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const loadMoreAttempts = useRef<number>(0);
  const loadMoreRetryTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  const [isRefreshingComment, setIsRefreshingComment] = useState(false);
  const refreshComment = async () => {
    if (!selectedServiceId) return;
    setIsRefreshingComment(true);
    setServiceComments([]);
    nextCursorComment.current = null;
    await fetchServiceComments(selectedServiceId);
    setIsRefreshingComment(false);
  };

  const [isLoadMoreComment, setIsLoadMoreComment] = useState(false);
  const loadMoreComment = async () => {
    if (nextCursorComment.current && selectedServiceId) {
      await fetchServiceComments(selectedServiceId);
    }
  };

  useEffect(() => {
    setPaginationData((prev) => ({
      ...prev,
      nextCursor: null,
      hasMore: true,
      isFilterChanging: true,
    }));

    setServicesList([]);

    loadInitialServices();
  }, [debouncedSearchQuery, filterCategory]);

  useEffect(() => {
    useRentoData.getState().fetchCategories();
    loadInitialServices();
    fetchCategoryCounts();
  }, []);

  const loadInitialServices = async () => {
    try {
      setPaginationData((prev) => ({
        ...prev,
        refreshing: true,
      }));

      let url = "/provider/services/my-services";
      const params = new URLSearchParams();

      if (debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      if (filterCategory !== "all") {
        params.append("category_id", filterCategory);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axiosFetch(url);

      if (response?.data) {
        const paginatedData = response.data;

        const services = Array.isArray(paginatedData.data)
          ? paginatedData.data
          : [];

        setServicesList(services);
        setPaginationData({
          nextCursor: paginatedData.next_cursor,
          hasMore: !!paginatedData.next_cursor,
          isLoadingMore: false,
          refreshing: false,
          loadedCount: services.length,
          isFilterChanging: false,
          lastEndReachTime: Date.now(),
        });
      } else {
        setServicesList([]);
        setPaginationData({
          nextCursor: null,
          hasMore: false,
          isLoadingMore: false,
          refreshing: false,
          loadedCount: 0,
          isFilterChanging: false,
          lastEndReachTime: Date.now(),
        });
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setServicesList([]);
      setPaginationData({
        nextCursor: null,
        hasMore: false,
        isLoadingMore: false,
        refreshing: false,
        loadedCount: 0,
        isFilterChanging: false,
        lastEndReachTime: Date.now(),
      });
    }
  };

  const loadMoreServices = async (isRetry = false) => {
    if (
      !paginationData.hasMore ||
      paginationData.isLoadingMore ||
      paginationData.isFilterChanging
    ) {
      return;
    }

    if (loadMoreRetryTimeout.current) {
      clearTimeout(loadMoreRetryTimeout.current);
      loadMoreRetryTimeout.current = null;
    }

    try {
      setPaginationData((prev) => ({ ...prev, isLoadingMore: true }));

      const params = new URLSearchParams();
      params.append("cursor", paginationData.nextCursor || "");

      if (debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      if (filterCategory !== "all") {
        params.append("category_id", filterCategory);
      }

      const url = `/provider/services/my-services?${params.toString()}`;
      const response = await axiosFetch(url);

      if (response?.data) {
        loadMoreAttempts.current = 0;

        const paginatedData = response.data;

        const newServices = Array.isArray(paginatedData.data)
          ? paginatedData.data
          : [];

        if (newServices.length > 0) {
          setServicesList((prev) => [...prev, ...newServices]);
          setPaginationData((prev) => ({
            ...prev,
            nextCursor: paginatedData.next_cursor,
            hasMore: !!paginatedData.next_cursor,
            isLoadingMore: false,
            loadedCount: prev.loadedCount + newServices.length,
            lastEndReachTime: Date.now(),
          }));
        } else {
          setPaginationData((prev) => ({
            ...prev,
            nextCursor: paginatedData.next_cursor,
            hasMore: !!paginatedData.next_cursor,
            isLoadingMore: false,
            lastEndReachTime: Date.now(),
          }));
        }
      } else {
        setPaginationData((prev) => ({
          ...prev,
          hasMore: false,
          isLoadingMore: false,
          lastEndReachTime: Date.now(),
        }));
      }
    } catch (error) {
      console.error("Error loading more services:", error);

      if (loadMoreAttempts.current < 3) {
        loadMoreAttempts.current += 1;

        loadMoreRetryTimeout.current = setTimeout(() => {
          setPaginationData((prev) => ({ ...prev, isLoadingMore: false }));
          loadMoreServices(true);
        }, 2000);
      } else {
        loadMoreAttempts.current = 0;
        setPaginationData((prev) => ({
          ...prev,
          isLoadingMore: false,
          hasMore: false,
          lastEndReachTime: Date.now(),
        }));
      }
    }
  };

  const handleManualLoadMore = useCallback(() => {
    onEndReachedCalledDuringMomentum.current = false;
    loadMoreAttempts.current = 0;
    loadMoreServices();
  }, [filterCategory, debouncedSearchQuery, paginationData.nextCursor]);

  const handleRefresh = useCallback(async () => {
    loadMoreAttempts.current = 0;

    if (loadMoreRetryTimeout.current) {
      clearTimeout(loadMoreRetryTimeout.current);
      loadMoreRetryTimeout.current = null;
    }

    await loadInitialServices();
  }, [filterCategory, debouncedSearchQuery]);

  const handleEndReached = useCallback(
    ({ distanceFromEnd }: { distanceFromEnd: number }) => {
      const now = Date.now();
      const timeSinceLastEndReach = now - paginationData.lastEndReachTime;

      if (timeSinceLastEndReach < 1000) {
        return;
      }

      if (
        !onEndReachedCalledDuringMomentum.current &&
        paginationData.hasMore &&
        !paginationData.isLoadingMore &&
        !paginationData.isFilterChanging
      ) {
        onEndReachedCalledDuringMomentum.current = true;

        setPaginationData((prev) => ({
          ...prev,
          lastEndReachTime: now,
        }));

        loadMoreServices();
      }
    },
    [
      paginationData.hasMore,
      paginationData.isLoadingMore,
      paginationData.isFilterChanging,
      paginationData.lastEndReachTime,
    ]
  );

  useEffect(() => {
    return () => {
      if (loadMoreRetryTimeout.current) {
        clearTimeout(loadMoreRetryTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    rules.service_name[0].isValid = formData.service_name.trim() !== "";
    rules.service_name[1].isValid = formData.service_name.trim().length >= 5;

    rules.service_description[0].isValid =
      formData.service_description.trim() !== "";
    rules.service_description[1].isValid =
      formData.service_description.trim().length >= 20;

    rules.location_name[0].isValid = formData.location_name.trim() !== "";

    let isFormValid = true;
    for (const field in rules) {
      const fieldRules = rules[field];
      for (const rule of fieldRules) {
        if (!rule.isValid) {
          isFormValid = false;
          break;
        }
      }
    }

    isFormValid = isFormValid && selectedCategory !== null && images.length > 0;

    setIsValid(isFormValid);
  }, [formData, selectedCategory, images]);

  useEffect(() => {
    priceRules.price_name[0].isValid = priceData.price_name.trim() !== "";
    priceRules.price_name[1].isValid = priceData.price_name.trim().length >= 3;

    priceRules.price_value[0].isValid = priceData.price_value.trim() !== "";
    priceRules.price_value[1].isValid =
      !isNaN(Number(priceData.price_value)) &&
      Number(priceData.price_value) > 0;

    let isPriceFormValid = true;
    for (const field in priceRules) {
      const fieldRules = priceRules[field];
      for (const rule of fieldRules) {
        if (!rule.isValid) {
          isPriceFormValid = false;
          break;
        }
      }
    }

    setIsPriceValid(isPriceFormValid);
  }, [priceData]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleLocationSelected = (data: {
    lat: number;
    lng: number;
    address: string;
    formattedAddress?: string;
    province_id?: number | null;
  }) => {
    setFormData({
      ...formData,
      lat: data.lat,
      lng: data.lng,
      location_name: data.address,
      real_location_name: data.formattedAddress || data.address,
      province_id: data.province_id || null,
    });
  };

  const handleSubmit = async () => {
    if (!isValid) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin dịch vụ");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục dịch vụ");
      return;
    }

    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append("service_name", formData.service_name);
      formDataToSend.append(
        "service_description",
        formData.service_description
      );
      formDataToSend.append("location_name", formData.location_name);
      formDataToSend.append("category_id", selectedCategory.toString());

      if (formData.lat !== null) {
        formDataToSend.append("lat", String(formData.lat));
      }

      if (formData.lng !== null) {
        formDataToSend.append("lng", String(formData.lng));
      }

      if (formData.real_location_name) {
        formDataToSend.append(
          "real_location_name",
          formData.real_location_name
        );
      }

      if (formData.province_id) {
        formDataToSend.append("province_id", String(formData.province_id));
      }

      images.forEach((image, index) => {
        const fileName = `image_${Date.now()}_${index}.jpg`;

        const fileType = "image/jpeg";

        formDataToSend.append("images[]", {
          uri: image,
          type: fileType,
          name: fileName,
        } as any);
      });

      await createService(formDataToSend);

      setShowAddModal(false);
      resetForm();

      Alert.alert("Thành công", "Thêm dịch vụ mới thành công");

      handleRefresh();
    } catch (error) {
      console.error("Lỗi khi thêm dịch vụ:", error);
      Alert.alert(
        "Lỗi",
        "Có lỗi xảy ra khi thêm dịch vụ. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: "",
      service_description: "",
      location_name: "",
      lat: null,
      lng: null,
      real_location_name: "",
      province_id: null,
    });
    setSelectedCategory(null);
    setImages([]);
    setIsValid(false);
  };
  const nextCursorComment = useRef<string | null>(null);
  const retryLoadComment = useRef(0);

  const fetchServiceComments = async (serviceId: number) => {
    try {
      setIsLoadingComments(true);
      let url = `/provider/comments/${serviceId}`;
      if (nextCursorComment.current) {
        url += `?cursor=${nextCursorComment.current}`;
      }
      const response = await axiosFetch(url, "get");
      const paginateComment: PaginationType<CommentType> = response?.data;
      const commentData = paginateComment?.data || [];

      if (commentData?.length > 0) {
        nextCursorComment.current = paginateComment?.next_cursor || null;
        retryLoadComment.current = 0;
        setServiceComments((prev) => [...prev, ...commentData]);
      } else if (retryLoadComment.current < 10) {
        retryLoadComment.current++;
        await fetchServiceComments(serviceId);
      }
    } catch (error) {
      if (retryLoadComment.current < 10) {
        retryLoadComment.current++;
        await fetchServiceComments(serviceId);
      }
      console.error("Lỗi khi tải bình luận:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await axiosFetch(`/comments/${commentId}`, "delete");
      if (response?.status === 200) {
        Alert.alert("Thành công", "Xóa bình luận thành công");
        if (selectedServiceId) {
          setServiceComments((prev) =>
            prev.filter((cmt) => cmt.id !== commentId)
          );
          refreshComment();
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      Alert.alert("Lỗi", "Không thể xóa bình luận. Vui lòng thử lại sau.");
    }
  };

  const openCommentsModal = async (serviceId: number) => {
    setServiceComments([]);
    setSelectedServiceId(serviceId);
    setShowCommentsModal(true);
    nextCursorComment.current = null;
    await fetchServiceComments(serviceId);
  };

  const handleAddPrice = async () => {
    if (!isPriceValid || !selectedServiceId) {
      Alert.alert("Lỗi", "Vui lòng kiểm tra lại thông tin gói dịch vụ");
      return;
    }

    try {
      await axiosFetch(
        `/provider/services/${selectedServiceId}/prices`,
        "post",
        {
          price_name: priceData.price_name,
          price_value: Number(priceData.price_value),
        }
      );

      setShowPriceModal(false);
      setPriceData({
        price_name: "",
        price_value: "",
      });

      Alert.alert("Thành công", "Thêm gói dịch vụ thành công");

      handleRefresh();
    } catch (error) {
      console.error("Lỗi khi thêm gói dịch vụ:", error);
      Alert.alert(
        "Lỗi",
        "Có lỗi xảy ra khi thêm gói dịch vụ. Vui lòng thử lại sau."
      );
    }
  };

  const filteredServices = useMemo(() => {
    return servicesList;
  }, [servicesList]);

  const handleCategorySwitch = useCallback(
    (categoryId: string) => {
      if (filterCategory !== categoryId) {
        setServicesList([]);

        setFilterCategory(categoryId);
      }
    },
    [filterCategory]
  );

  const renderFooter = useCallback(() => {
    if (!paginationData.isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }, [paginationData.isLoadingMore]);

  const fetchCategoryCounts = async () => {
    try {
      setIsLoadingCounts(true);

      const response = await axiosFetch("/provider/services/category-counts");

      if (response?.data) {
        setCategoryCounts(response.data);
      }
    } catch (error) {
      console.error("Error loading category counts:", error);

      setCategoryCounts({});
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const renderEmptyComponent = useCallback(() => {
    return (
      <View className="items-center justify-center py-8">
        {paginationData.refreshing || paginationData.isFilterChanging ? (
          <>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="text-gray-500 mt-4 font-pmedium">
              Đang tải dịch vụ...
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="cube-outline" size={48} color="gray" />
            <Text className="text-gray-500 mt-2 font-pmedium">
              {searchQuery.length > 0
                ? "Không tìm thấy dịch vụ nào phù hợp với từ khóa tìm kiếm"
                : filterCategory !== "all"
                  ? "Không tìm thấy dịch vụ nào trong danh mục này"
                  : "Chưa có dịch vụ nào"}
            </Text>
            {(searchQuery.length > 0 || filterCategory !== "all") && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setServicesList([]);
                  handleCategorySwitch("all");
                }}
                className="mt-4 bg-primary-500 px-4 py-2 rounded-full"
              >
                <Text className="text-white font-pmedium">
                  Xem tất cả dịch vụ
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  }, [
    paginationData.refreshing,
    paginationData.isFilterChanging,
    searchQuery,
    filterCategory,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <FlatList
        ref={flatListRef}
        data={filteredServices}
        renderItem={({ item, index }) => (
          <View className="mx-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-primary-500 font-pbold mr-2">
                {index + 1}
              </Text>
              <View className="flex-1">
                <ServiceCard
                  data={item}
                  showFavorite={false}
                  onPress={() => {
                    router.push({
                      pathname: "/provider/service/[id]",
                      params: { id: item.id },
                    });
                  }}
                />
              </View>
            </View>
            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                onPress={() => {
                  setSelectedServiceId(item.id);
                  setShowPriceModal(true);
                }}
                className="bg-blue-500 px-3 py-1 rounded-full flex-row items-center"
              >
                <Ionicons name="pricetag-outline" size={16} color="white" />
                <Text className="text-white ml-1 font-pmedium text-sm">
                  Thêm gói
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openCommentsModal(item.id)}
                className="bg-amber-500 px-3 py-1 rounded-full flex-row items-center"
              >
                <Ionicons name="chatbubble-outline" size={16} color="white" />
                <Text className="text-white ml-1 font-pmedium text-sm">
                  Bình luận ({item.comment_count || 0})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        contentContainerClassName="pt-4 pb-20"
        refreshControl={
          <RefreshControl
            refreshing={paginationData.refreshing}
            onRefresh={handleRefresh}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.2}
        windowSize={21}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        onScroll={() => {
          if (Math.random() < 0.1) {
            onEndReachedCalledDuringMomentum.current = false;
          }
        }}
        ListFooterComponent={
          <>
            {renderFooter()}
            {paginationData.hasMore && !paginationData.isLoadingMore && (
              <TouchableOpacity
                onPress={handleManualLoadMore}
                className="py-4 items-center mb-4"
              >
                <Text className="text-primary-500 font-pmedium">Tải thêm</Text>
              </TouchableOpacity>
            )}
          </>
        }
        ListHeaderComponent={
          <>
            <View className="flex-row justify-between items-center mx-4 mb-4">
              <Text className="text-2xl font-pbold">Dịch vụ của tôi</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="bg-primary-500 px-4 py-2 rounded-full flex-row items-center"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white ml-1 font-pmedium">Thêm mới</Text>
              </TouchableOpacity>
            </View>

            <View className="mx-4 mb-4">
              <View className="flex-row items-center bg-white rounded-lg px-3 py-2 mb-4 shadow border border-gray-200">
                <FontAwesome name="search" size={16} color="gray" />
                <TextInput
                  placeholder="Tìm kiếm dịch vụ..."
                  className="ml-2 flex-1 font-pregular"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");

                      setServicesList([]);

                      handleRefresh();
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="gray" />
                  </TouchableOpacity>
                )}
              </View>

              <View className="mb-4 mt-2">
                <Text className="font-pmedium text-xl text-gray-700 mb-2">
                  Danh mục dịch vụ
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  <TouchableOpacity
                    onPress={() => handleCategorySwitch("all")}
                    activeOpacity={0.6}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    className={`py-1 px-3 justify-center items-center rounded-full border mb-2 ${
                      filterCategory === "all"
                        ? "bg-primary-500 border-primary-500"
                        : "border-gray-300"
                    }`}
                  >
                    <Text
                      className={`font-pmedium ${
                        filterCategory === "all"
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      Tất cả
                      {Object.values(categoryCounts).reduce(
                        (sum, count) => sum + count,
                        0
                      ) > 0 &&
                        ` (${Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)})`}
                    </Text>
                  </TouchableOpacity>

                  {categories
                    ?.slice(
                      0,
                      isExpandedCategories
                        ? categories.length
                        : INITIAL_CATEGORIES_TO_SHOW
                    )
                    .map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() =>
                          handleCategorySwitch(String(category.id))
                        }
                        activeOpacity={0.6}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        className={`py-1 px-3 justify-center items-center  rounded-full border mb-2 ${
                          filterCategory === String(category.id)
                            ? "bg-primary-500 border-primary-500"
                            : "border-gray-300"
                        }`}
                      >
                        <Text
                          className={`font-pmedium ${
                            filterCategory === String(category.id)
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {category.category_name}
                          {categoryCounts[category.id] > 0 &&
                            ` (${categoryCounts[category.id]})`}
                        </Text>
                      </TouchableOpacity>
                    ))}

                  {categories &&
                    categories.length > INITIAL_CATEGORIES_TO_SHOW && (
                      <TouchableOpacity
                        onPress={() =>
                          setIsExpandedCategories(!isExpandedCategories)
                        }
                        activeOpacity={0.6}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        className="py-1 px-3 justify-center items-center rounded-full border border-gray-300 mb-2 flex-row items-center"
                      >
                        <Text className="font-pmedium text-gray-700">
                          {isExpandedCategories
                            ? "Thu gọn"
                            : `Xem thêm (${categories.length - INITIAL_CATEGORIES_TO_SHOW})`}
                        </Text>
                        <Ionicons
                          name={
                            isExpandedCategories ? "chevron-up" : "chevron-down"
                          }
                          size={16}
                          color="gray"
                          style={{ marginLeft: 5 }}
                        />
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={renderEmptyComponent}
      />

      {/* Modal thêm dịch vụ mới */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        {isSubmitting ? (
          <SafeAreaView className="flex-1 bg-gray-100 justify-center items-center">
            <ActivityIndicator size="large" color="black" />
            <Text className="font-pmedium text-xl">
              Đang tạo dịch vụ mới. Vui lòng chờ!
            </Text>
          </SafeAreaView>
        ) : (
          <SafeAreaView className="flex-1 bg-gray-100">
            <View className="flex-row items-center bg-white p-4">
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-xl font-pbold ml-4">Thêm dịch vụ mới</Text>
            </View>

            <ScrollView className="flex-1 p-4">
              <View className="gap-4">
                <InputField
                  nameField="Tên dịch vụ"
                  placeholder="Nhập tên dịch vụ"
                  value={formData.service_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, service_name: text })
                  }
                  rules={rules.service_name}
                  required
                />

                <InputField
                  nameField="Mô tả dịch vụ"
                  placeholder="Nhập mô tả chi tiết về dịch vụ"
                  value={formData.service_description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, service_description: text })
                  }
                  rules={rules.service_description}
                  multiline
                  required
                />

                <LocationInputField
                  nameField="Địa chỉ"
                  placeholder="Nhập địa chỉ cung cấp dịch vụ"
                  value={formData.location_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location_name: text })
                  }
                  rules={rules.location_name}
                  required
                  onLocationSelected={handleLocationSelected}
                />

                <View>
                  <Text className="font-pmedium text-xl mb-2">
                    Danh mục dịch vụ <Text className="text-red-500">*</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row gap-2"
                  >
                    {categories?.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        onPress={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-full border ${
                          selectedCategory === category.id
                            ? "bg-primary-500 border-primary-500"
                            : "border-gray-300"
                        }`}
                      >
                        <Text
                          className={`font-pmedium ${
                            selectedCategory === category.id
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

                <View>
                  <Text className="font-pmedium text-xl mb-2">
                    Hình ảnh dịch vụ <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {images.map((image, index) => (
                      <View key={index} className="relative">
                        <Image
                          source={{ uri: image }}
                          className="w-24 h-24 rounded-lg"
                        />
                        <TouchableOpacity
                          onPress={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      onPress={pickImage}
                      className="w-24 h-24 bg-gray-200 rounded-lg justify-center items-center"
                    >
                      <Ionicons name="add" size={32} color="gray" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="p-4 bg-white">
              <CustomButton
                title="Thêm dịch vụ"
                onPress={handleSubmit}
                containerStyles={`${isValid ? "bg-primary-500" : "bg-primary-400"}`}
                isDisabled={!isValid}
              />
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* Modal quản lý bình luận */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-100">
          <View className="flex-row items-center bg-white p-4">
            <TouchableOpacity
              onPress={() => setShowCommentsModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-xl font-pbold ml-4">Bình luận</Text>
          </View>

          <FlatList
            data={serviceComments}
            keyExtractor={(item, index) => index.toString()}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshingComment}
                onRefresh={refreshComment}
              />
            }
            className="flex-1"
            onEndReached={loadMoreComment}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <CommentCard
                data={item}
                user={item.user}
                containerStyles="w-full"
                enableOption
                handleDeleteComment={handleDeleteComment}
              />
            )}
            ListFooterComponent={() =>
              isLoadMoreComment && (
                <ActivityIndicator size={"small"} color={"black"} />
              )
            }
            contentContainerClassName="p-4 gap-2"
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Ionicons name="chatbubble-outline" size={48} color="gray" />
                <Text className="text-gray-500 mt-2 font-pmedium">
                  Chưa có bình luận nào
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Modal thêm gói dịch vụ */}
      <Modal
        visible={showPriceModal}
        animationType="slide"
        onRequestClose={() => setShowPriceModal(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-100">
          <View className="flex-row items-center bg-white p-4">
            <TouchableOpacity
              onPress={() => setShowPriceModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-xl font-pbold ml-4">Thêm gói dịch vụ</Text>
          </View>

          <View className="p-4 gap-4">
            <InputField
              nameField="Tên gói dịch vụ"
              placeholder="Nhập tên gói dịch vụ"
              value={priceData.price_name}
              onChangeText={(text) =>
                setPriceData({ ...priceData, price_name: text })
              }
              rules={priceRules.price_name}
              required
            />

            <InputField
              nameField="Giá dịch vụ (VNĐ)"
              placeholder="Nhập giá dịch vụ"
              value={priceData.price_value}
              onChangeText={(text) =>
                setPriceData({ ...priceData, price_value: text })
              }
              rules={priceRules.price_value}
              keyBoardType="numeric"
              required
            />
          </View>

          <View className="p-4 mt-auto bg-white">
            <CustomButton
              title="Thêm gói dịch vụ"
              onPress={handleAddPrice}
              containerStyles={`${isPriceValid ? "bg-primary-500" : "bg-primary-400"}`}
              isDisabled={!isPriceValid}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

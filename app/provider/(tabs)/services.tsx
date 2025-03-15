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
import { useRouter } from "expo-router";
import { axiosFetch } from "@/stores/dataStore";
import CommentCard from "@/components/CommentCard";
import LocationInputField from "@/components/LocationInputField";
import { PaginationType } from "@/types/pagination";

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

// Thêm rules cho gói dịch vụ
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

  // Pagination state
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

  // Form state
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

  // Tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // State cho quản lý bình luận
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );
  const [serviceComments, setServiceComments] = useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // State cho gói dịch vụ
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceData, setPriceData] = useState({
    price_name: "",
    price_value: "",
  });
  const [isPriceValid, setIsPriceValid] = useState(false);

  // State for category counts
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  // State for expanded categories view
  const [isExpandedCategories, setIsExpandedCategories] = useState(false);
  const INITIAL_CATEGORIES_TO_SHOW = 3; // Number of categories to show initially

  // State for debounced search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Refs for more reliable infinite scrolling
  const onEndReachedCalledDuringMomentum = useRef<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const loadMoreAttempts = useRef<number>(0);
  const loadMoreRetryTimeout = useRef<NodeJS.Timeout | null>(null);

  // Apply debounce to search query
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  // Trigger search when debounced value changes
  useEffect(() => {
    // Mark that we are changing filters
    setPaginationData((prev) => ({
      ...prev,
      nextCursor: null,
      hasMore: true,
      isFilterChanging: true,
    }));

    // Immediately clear the list when filters change to prevent showing wrong data
    setServicesList([]);

    loadInitialServices();
  }, [debouncedSearchQuery, filterCategory]);

  // Load initial data
  useEffect(() => {
    loadInitialServices();
    fetchCategoryCounts(); // Fetch category counts on initial load
  }, []);

  // Function to load initial services
  const loadInitialServices = async () => {
    try {
      setPaginationData((prev) => ({
        ...prev,
        refreshing: true, // Always show refreshing when loading initial services
      }));

      // Build the API URL with search and category filters
      let url = "/provider/services/my-services";
      const params = new URLSearchParams();

      // Add search query if it exists (use debounced value)
      if (debouncedSearchQuery.trim()) {
        // Match the exact parameter name that the backend is expecting
        params.append("search", debouncedSearchQuery.trim());
        console.log(`Searching with query: "${debouncedSearchQuery.trim()}"`);
      }

      // Add category filter if not "all"
      if (filterCategory !== "all") {
        params.append("category_id", filterCategory);
        console.log(`Filtering by category ID: ${filterCategory}`);
      }

      // Append params to URL if any exist
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log("Loading services with URL:", url);
      const response = await axiosFetch(url);

      if (response?.data) {
        // Handle the pagination data structure correctly
        const paginatedData = response.data;

        // Make sure we get an array of services
        const services = Array.isArray(paginatedData.data)
          ? paginatedData.data
          : [];

        console.log(
          `Loaded ${services.length} services for category: ${filterCategory}`
        );

        // Completely replace the services list (no merging)
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

  // Function to load more services with retry mechanism
  const loadMoreServices = async (isRetry = false) => {
    // Skip if no more data, already loading, or filter changing
    if (
      !paginationData.hasMore ||
      paginationData.isLoadingMore ||
      paginationData.isFilterChanging
    ) {
      console.log(
        "Skipping loadMoreServices - hasMore:",
        paginationData.hasMore,
        "isLoadingMore:",
        paginationData.isLoadingMore,
        "isFilterChanging:",
        paginationData.isFilterChanging
      );
      return;
    }

    // Clear any existing retry timeouts
    if (loadMoreRetryTimeout.current) {
      clearTimeout(loadMoreRetryTimeout.current);
      loadMoreRetryTimeout.current = null;
    }

    try {
      console.log(
        `Loading more services... ${isRetry ? "(Retry attempt)" : ""}`
      );
      setPaginationData((prev) => ({ ...prev, isLoadingMore: true }));

      // Build the API URL with cursor, search, and category filters
      const params = new URLSearchParams();
      params.append("cursor", paginationData.nextCursor || "");

      // Add search query if it exists (use debounced value)
      if (debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      // Add category filter if not "all"
      if (filterCategory !== "all") {
        params.append("category_id", filterCategory);
      }

      const url = `/provider/services/my-services?${params.toString()}`;
      console.log("Loading more services with URL:", url);
      const response = await axiosFetch(url);

      if (response?.data) {
        // Reset retry attempts on success
        loadMoreAttempts.current = 0;

        // Handle the pagination data structure correctly
        const paginatedData = response.data;
        console.log("Load more API response received");

        // Check if data is an array (flat structure) or nested
        const newServices = Array.isArray(paginatedData.data)
          ? paginatedData.data
          : [];

        // Only update list if we got new items
        if (newServices.length > 0) {
          console.log(`Received ${newServices.length} new services`);
          setServicesList((prev) => [...prev, ...newServices]);
          setPaginationData((prev) => ({
            ...prev,
            nextCursor: paginatedData.next_cursor,
            hasMore: !!paginatedData.next_cursor,
            isLoadingMore: false,
            loadedCount: prev.loadedCount + newServices.length, // Add to current count
            lastEndReachTime: Date.now(),
          }));
        } else {
          // If no new items, just update pagination state
          console.log("No new services received");
          setPaginationData((prev) => ({
            ...prev,
            nextCursor: paginatedData.next_cursor,
            hasMore: !!paginatedData.next_cursor,
            isLoadingMore: false,
            lastEndReachTime: Date.now(),
          }));
        }
      } else {
        // If no data, mark as no more to load
        console.log("No data in response");
        setPaginationData((prev) => ({
          ...prev,
          hasMore: false,
          isLoadingMore: false,
          lastEndReachTime: Date.now(),
        }));
      }
    } catch (error) {
      console.error("Error loading more services:", error);

      // Implement retry mechanism
      if (loadMoreAttempts.current < 3) {
        loadMoreAttempts.current += 1;
        console.log(
          `Load more failed, scheduling retry #${loadMoreAttempts.current} in 2 seconds...`
        );

        // Schedule a retry after 2 seconds
        loadMoreRetryTimeout.current = setTimeout(() => {
          setPaginationData((prev) => ({ ...prev, isLoadingMore: false }));
          loadMoreServices(true);
        }, 2000);
      } else {
        console.log("Max retry attempts reached, giving up");
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

  // Function to handle manual load more button click
  const handleManualLoadMore = useCallback(() => {
    console.log("Manual load more pressed");
    // Reset momentum flag to ensure we can load more
    onEndReachedCalledDuringMomentum.current = false;
    // Reset attempt counter for a fresh start
    loadMoreAttempts.current = 0;
    loadMoreServices();
  }, [filterCategory, debouncedSearchQuery, paginationData.nextCursor]);

  // Handler for refresh
  const handleRefresh = useCallback(async () => {
    console.log("Pull-to-refresh triggered");
    // Reset retry counter
    loadMoreAttempts.current = 0;

    // Cancel any pending retries
    if (loadMoreRetryTimeout.current) {
      clearTimeout(loadMoreRetryTimeout.current);
      loadMoreRetryTimeout.current = null;
    }

    await loadInitialServices();
  }, [filterCategory, debouncedSearchQuery]);

  // Handler for end reached with debounce and retry logic
  const handleEndReached = useCallback(
    ({ distanceFromEnd }: { distanceFromEnd: number }) => {
      // Prevent too frequent end reached calls (at least 1 second between calls)
      const now = Date.now();
      const timeSinceLastEndReach = now - paginationData.lastEndReachTime;

      if (timeSinceLastEndReach < 1000) {
        console.log(
          `Ignoring end reached - too soon (${timeSinceLastEndReach}ms since last call)`
        );
        return;
      }

      // Standard checks
      if (
        !onEndReachedCalledDuringMomentum.current &&
        paginationData.hasMore &&
        !paginationData.isLoadingMore &&
        !paginationData.isFilterChanging
      ) {
        console.log(
          `End reached - distance: ${distanceFromEnd} - loading more services`
        );
        onEndReachedCalledDuringMomentum.current = true;

        // Update last end reach time immediately
        setPaginationData((prev) => ({
          ...prev,
          lastEndReachTime: now,
        }));

        loadMoreServices();
      } else {
        console.log(
          `Skipping end reached - onEndReachedCalledDuringMomentum: ${onEndReachedCalledDuringMomentum.current}, ` +
            `hasMore: ${paginationData.hasMore}, isLoadingMore: ${paginationData.isLoadingMore}, ` +
            `isFilterChanging: ${paginationData.isFilterChanging}`
        );
      }
    },
    [
      paginationData.hasMore,
      paginationData.isLoadingMore,
      paginationData.isFilterChanging,
      paginationData.lastEndReachTime,
    ]
  );

  // Cleanup timeouts on component unmount
  useEffect(() => {
    return () => {
      if (loadMoreRetryTimeout.current) {
        clearTimeout(loadMoreRetryTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    // Kiểm tra validation mỗi khi formData thay đổi
    // Kiểm tra tên dịch vụ
    rules.service_name[0].isValid = formData.service_name.trim() !== "";
    rules.service_name[1].isValid = formData.service_name.trim().length >= 5;

    // Kiểm tra mô tả dịch vụ
    rules.service_description[0].isValid =
      formData.service_description.trim() !== "";
    rules.service_description[1].isValid =
      formData.service_description.trim().length >= 20;

    // Kiểm tra địa chỉ
    rules.location_name[0].isValid = formData.location_name.trim() !== "";

    // Kiểm tra tất cả các rules
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

    // Kiểm tra danh mục và hình ảnh
    isFormValid = isFormValid && selectedCategory !== null && images.length > 0;

    setIsValid(isFormValid);
  }, [formData, selectedCategory, images]);

  // Validation cho gói dịch vụ
  useEffect(() => {
    // Kiểm tra tên gói dịch vụ
    priceRules.price_name[0].isValid = priceData.price_name.trim() !== "";
    priceRules.price_name[1].isValid = priceData.price_name.trim().length >= 3;

    // Kiểm tra giá dịch vụ
    priceRules.price_value[0].isValid = priceData.price_value.trim() !== "";
    priceRules.price_value[1].isValid =
      !isNaN(Number(priceData.price_value)) &&
      Number(priceData.price_value) > 0;

    // Kiểm tra tất cả các rules
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

    // Kiểm tra lại một lần nữa để đảm bảo selectedCategory không null
    if (!selectedCategory) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục dịch vụ");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("service_name", formData.service_name);
      formDataToSend.append(
        "service_description",
        formData.service_description
      );
      formDataToSend.append("location_name", formData.location_name);
      formDataToSend.append("category_id", selectedCategory.toString());

      // Thêm kinh độ, vĩ độ và địa chỉ thật nếu có
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

      // Thêm province_id nếu có
      if (formData.province_id) {
        formDataToSend.append("province_id", String(formData.province_id));
      }

      // Xử lý hình ảnh
      images.forEach((image, index) => {
        // Tạo tên file duy nhất
        const fileName = `image_${Date.now()}_${index}.jpg`;
        // Lấy extension từ URI
        const fileType = "image/jpeg";

        // Tạo đối tượng file để gửi lên server
        formDataToSend.append("images[]", {
          uri: image,
          type: fileType,
          name: fileName,
        } as any);
      });

      // Gọi API để tạo dịch vụ mới
      await createService(formDataToSend);

      // Đóng modal và reset form
      setShowAddModal(false);
      resetForm();

      // Hiển thị thông báo thành công
      Alert.alert("Thành công", "Thêm dịch vụ mới thành công");

      // Tải lại danh sách dịch vụ
      handleRefresh();
    } catch (error) {
      console.error("Lỗi khi thêm dịch vụ:", error);
      Alert.alert(
        "Lỗi",
        "Có lỗi xảy ra khi thêm dịch vụ. Vui lòng thử lại sau."
      );
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

  // Hàm để lấy bình luận của một dịch vụ
  const fetchServiceComments = async (serviceId: number) => {
    try {
      setIsLoadingComments(true);
      const response = await axiosFetch(`/provider/services/${serviceId}`);
      if (response?.data?.comment) {
        setServiceComments(response.data.comment);
      } else {
        setServiceComments([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
      Alert.alert("Lỗi", "Không thể tải bình luận. Vui lòng thử lại sau.");
      setServiceComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // Hàm để xóa bình luận
  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await axiosFetch(`/comments/${commentId}`, "delete");
      if (response?.status === 200) {
        Alert.alert("Thành công", "Xóa bình luận thành công");
        // Tải lại bình luận sau khi xóa
        if (selectedServiceId) {
          fetchServiceComments(selectedServiceId);
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      Alert.alert("Lỗi", "Không thể xóa bình luận. Vui lòng thử lại sau.");
    }
  };

  // Hàm để mở modal quản lý bình luận
  const openCommentsModal = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    fetchServiceComments(serviceId);
    setShowCommentsModal(true);
  };

  // Hàm để thêm gói dịch vụ
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

      // Đóng modal và reset form
      setShowPriceModal(false);
      setPriceData({
        price_name: "",
        price_value: "",
      });

      // Hiển thị thông báo thành công
      Alert.alert("Thành công", "Thêm gói dịch vụ thành công");

      // Tải lại danh sách dịch vụ
      handleRefresh();
    } catch (error) {
      console.error("Lỗi khi thêm gói dịch vụ:", error);
      Alert.alert(
        "Lỗi",
        "Có lỗi xảy ra khi thêm gói dịch vụ. Vui lòng thử lại sau."
      );
    }
  };

  // Update to search in the local state instead of services from store
  const filteredServices = useMemo(() => {
    // Return the direct servicesList without additional filtering
    // since the backend already handles the filtering
    return servicesList;
  }, [servicesList]);

  // Handler for category switching
  const handleCategorySwitch = useCallback(
    (categoryId: string) => {
      if (filterCategory !== categoryId) {
        console.log(`Switching to category ID: ${categoryId}`);

        // Clear the current list immediately to prevent showing wrong data
        setServicesList([]);

        // Then update the filter
        setFilterCategory(categoryId);
      }
    },
    [filterCategory]
  );

  // Footer component for infinite loading
  const renderFooter = useCallback(() => {
    if (!paginationData.isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }, [paginationData.isLoadingMore]);

  // Function to fetch the total count of services in each category
  const fetchCategoryCounts = async () => {
    try {
      setIsLoadingCounts(true);

      // Make a request to get category counts
      const response = await axiosFetch("/provider/services/category-counts");

      if (response?.data) {
        // The response should be an object with category IDs as keys and counts as values
        setCategoryCounts(response.data);
      }
    } catch (error) {
      console.error("Error loading category counts:", error);
      // Use a fallback of empty counts
      setCategoryCounts({});
    } finally {
      setIsLoadingCounts(false);
    }
  };

  // ListEmptyComponent to handle various states
  const renderEmptyComponent = useCallback(() => {
    return (
      <View className="items-center justify-center py-8">
        {paginationData.refreshing || paginationData.isFilterChanging ? (
          // Show loader during initial load, refresh, or filter changes
          <>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="text-gray-500 mt-4 font-pmedium">
              Đang tải dịch vụ...
            </Text>
          </>
        ) : (
          // Standard empty state when no items match
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
                #{index + 1}
              </Text>
              <View className="flex-1">
                <ServiceCard
                  data={item}
                  containerStyles=""
                  onPressFavorite={() => {}}
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
        keyExtractor={(item) => item.id.toString()}
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
          // Reset momentum flag occasionally during normal scrolling
          // This helps in case onMomentumScrollBegin doesn't trigger properly
          if (Math.random() < 0.1) {
            // 10% chance on each scroll event
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

            {/* Thêm thanh tìm kiếm */}
            <View className="mx-4 mb-4">
              <View className="flex-row items-center bg-white rounded-lg px-3 py-2 mb-4">
                <FontAwesome name="search" size={16} color="gray" />
                <TextInput
                  placeholder="Tìm kiếm dịch vụ..."
                  className="ml-2 flex-1 font-pregular"
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    // No need to call handleRefresh here as it will be triggered by the debounced effect
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      // Clear the list immediately to prevent showing wrong data
                      setServicesList([]);
                      // Still need to reset when explicitly clearing
                      handleRefresh();
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="gray" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Thêm bộ lọc danh mục */}
              <View className="mb-4">
                <View className="flex-row flex-wrap gap-3">
                  <TouchableOpacity
                    onPress={() => handleCategorySwitch("all")}
                    activeOpacity={0.6}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    className={`py-3 px-5 rounded-full border mb-2 ${
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
                        className={`py-3 px-5 rounded-full border mb-2 ${
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
                        className="py-3 px-5 rounded-full border border-gray-300 mb-2 flex-row items-center"
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
                <Text className="font-pmedium text-base mb-2">
                  Danh mục dịch vụ
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
                <Text className="font-pmedium text-base mb-2">
                  Hình ảnh dịch vụ
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

          {isLoadingComments ? (
            <View className="flex-1 justify-center items-center">
              <Text className="font-pmedium text-gray-600">
                Đang tải bình luận...
              </Text>
            </View>
          ) : (
            <FlatList
              data={serviceComments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <CommentCard
                  data={item}
                  user={item.user}
                  containerStyles="w-full"
                  enableOption
                  handleDeleteComment={handleDeleteComment}
                />
              )}
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
          )}
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

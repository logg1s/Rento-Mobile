import React, { useEffect, useState, useMemo } from "react";
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
import { CategoryType, CommentType } from "@/types/type";
import {
  normalizeVietnamese,
  formatDateToVietnamese,
  getImageSource,
} from "@/utils/utils";
import { useRouter } from "expo-router";
import { axiosFetch } from "@/stores/dataStore";
import CommentCard from "@/components/CommentCard";
import LocationInputField from "@/components/LocationInputField";

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

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    service_name: "",
    service_description: "",
    location_name: "",
    lat: null,
    lng: null,
    real_location_name: "",
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

  useEffect(() => {
    fetchServices();
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
  }) => {
    setFormData(
      (prev) =>
        ({
          ...prev,
          lat: data.lat,
          lng: data.lng,
          location_name: data.address,
          real_location_name: data.formattedAddress || data.address,
        }) as typeof prev
    );
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
      fetchServices();
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
      fetchServices();
    } catch (error) {
      console.error("Lỗi khi thêm gói dịch vụ:", error);
      Alert.alert(
        "Lỗi",
        "Có lỗi xảy ra khi thêm gói dịch vụ. Vui lòng thử lại sau."
      );
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (!service || !service.service_name) return false;

      const matchesCategory =
        filterCategory === "all" ||
        service.category?.id === parseInt(filterCategory);

      const normalizedQuery = normalizeVietnamese(searchQuery.toLowerCase());
      const normalizedServiceName = normalizeVietnamese(
        service.service_name.toLowerCase()
      );
      const normalizedDescription = service.service_description
        ? normalizeVietnamese(service.service_description.toLowerCase())
        : "";

      const matchesSearch =
        normalizedServiceName.includes(normalizedQuery) ||
        normalizedDescription.includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [services, searchQuery, filterCategory]);

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <FlatList
        data={filteredServices}
        renderItem={({ item }) => (
          <View className="mx-4 mb-4">
            <ServiceCard
              data={item}
              containerStyles="mb-2"
              onPressFavorite={() => {}}
              onPress={() => {
                router.push({
                  pathname: "/provider/service/[id]",
                  params: { id: item.id },
                });
              }}
            />
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
        contentContainerClassName="pt-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchServices} />
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
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color="gray" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Thêm bộ lọc danh mục */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                <TouchableOpacity
                  onPress={() => setFilterCategory("all")}
                  className={`px-4 py-2 rounded-full border ${
                    filterCategory === "all"
                      ? "bg-primary-500 border-primary-500"
                      : "border-gray-300"
                  }`}
                >
                  <Text
                    className={`font-pmedium ${
                      filterCategory === "all" ? "text-white" : "text-gray-700"
                    }`}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {categories?.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setFilterCategory(String(category.id))}
                    className={`px-4 py-2 rounded-full border ${
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
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Hiển thị số lượng dịch vụ đã lọc */}
            <View className="mx-4 mb-2">
              <Text className="font-pmedium text-gray-700">
                Tìm thấy {filteredServices.length} dịch vụ
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Ionicons name="cube-outline" size={48} color="gray" />
            <Text className="text-gray-500 mt-2 font-pmedium">
              {searchQuery.length > 0 || filterCategory !== "all"
                ? "Không tìm thấy dịch vụ nào"
                : "Chưa có dịch vụ nào"}
            </Text>
          </View>
        }
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

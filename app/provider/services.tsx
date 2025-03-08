import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import useProviderStore from "@/stores/providerStore";
import ServiceCard from "@/components/ServiceCard";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import * as ImagePicker from "expo-image-picker";
import useRentoStore from "@/stores/dataStore";
import { CategoryType } from "@/types/type";

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

export default function ProviderServices() {
  const { services, isLoading, fetchServices, createService } =
    useProviderStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const categories = useRentoStore(
    (state) => state.categories
  ) as CategoryType[];

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    service_name: "",
    service_description: "",
    location_name: "",
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

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

  const handleSubmit = async () => {
    if (!selectedCategory) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục dịch vụ");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Lỗi", "Vui lòng thêm ít nhất một ảnh cho dịch vụ");
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

      images.forEach((image, index) => {
        const imageFile = {
          uri: image,
          type: "image/jpeg",
          name: `image_${index}.jpg`,
        };
        formDataToSend.append("images[]", imageFile as any);
      });

      await createService(formDataToSend);
      setShowAddModal(false);
      resetForm();
      Alert.alert("Thành công", "Thêm dịch vụ mới thành công");
    } catch (error) {
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
    });
    setSelectedCategory(null);
    setImages([]);
    setIsValid(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <FlatList
        data={services}
        renderItem={({ item }) => (
          <ServiceCard
            data={item}
            containerStyles="mx-4 mb-4"
            onPressFavorite={() => {}}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerClassName="pt-4"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchServices} />
        }
        ListHeaderComponent={
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
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Ionicons name="cube-outline" size={48} color="gray" />
            <Text className="text-gray-500 mt-2 font-pmedium">
              Chưa có dịch vụ nào
            </Text>
          </View>
        }
      />

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

              <InputField
                nameField="Địa chỉ"
                placeholder="Nhập địa chỉ cung cấp dịch vụ"
                value={formData.location_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, location_name: text })
                }
                rules={rules.location_name}
                required
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
    </SafeAreaView>
  );
}

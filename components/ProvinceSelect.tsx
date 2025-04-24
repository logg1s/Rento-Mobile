import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { twMerge } from "tailwind-merge";
import { Province } from "@/types/type";

interface ProvinceSelectProps {
  nameField?: string;
  placeholder?: string;
  containerStyles?: string;
  value?: Province | null;
  onSelect: (province: Province | null) => void;
  provinces: Province[];
  required?: boolean;
  isLoading?: boolean;
}

const ProvinceSelect = ({
  nameField = "Tỉnh/Thành phố",
  placeholder = "Chọn tỉnh/thành phố",
  containerStyles,
  value,
  onSelect,
  provinces,
  required = false,
  isLoading = false,
}: ProvinceSelectProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProvinces, setFilteredProvinces] =
    useState<Province[]>(provinces);

  useEffect(() => {
    setFilteredProvinces(provinces);
  }, [provinces]);

  useEffect(() => {}, [value]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProvinces(provinces);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = provinces.filter((province) =>
        province.name.toLowerCase().includes(query)
      );
      setFilteredProvinces(filtered);
    }
  }, [searchQuery, provinces]);

  const handleSelect = (province: Province) => {
    onSelect(province);
    setModalVisible(false);
    setSearchQuery("");
  };

  const clearSelection = () => {
    onSelect(null);
  };

  const isSelected = (provinceItem: Province) => {
    if (!value) return false;

    return value.id === provinceItem.id;
  };

  const displayProvinceName = () => {
    if (isLoading) return "Đang tải...";
    if (!value) return placeholder;

    return value.name;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="gap-1">
          <Text className="font-psemibold text-xl text-secondary-900">
            {nameField} {required && <Text className="text-red-500">*</Text>}
          </Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className={twMerge(
              `w-full bg-general-300 border border-neutral-50 rounded-xl px-3 h-16 flex-row items-center justify-between`,
              containerStyles
            )}
            disabled={isLoading}
          >
            <Text
              className={`flex-1 ${
                value ? "text-secondary-800" : "text-gray-400"
              } font-pmedium text-lg`}
            >
              {displayProvinceName()}
            </Text>
            <View className="flex-row items-center">
              {value && (
                <TouchableOpacity onPress={clearSelection} className="p-2">
                  <Ionicons name="close-circle" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </View>
          </TouchableOpacity>

          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl h-2/3 p-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="font-psemibold text-xl text-secondary-900">
                    Chọn tỉnh/thành phố
                  </Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    className="p-2"
                  >
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <View className="bg-gray-100 rounded-xl mb-4 px-3 flex-row items-center">
                  <Ionicons name="search" size={20} color="#6B7280" />
                  <TextInput
                    placeholder="Tìm kiếm tỉnh/thành phố"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 h-12 ml-2 text-secondary-800 font-pmedium"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  )}
                </View>

                <FlatList
                  data={filteredProvinces}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`p-4 border-b border-gray-100 ${
                        isSelected(item) ? "bg-primary-50" : ""
                      }`}
                      onPress={() => handleSelect(item)}
                    >
                      <Text
                        className={`text-base font-pmedium ${
                          isSelected(item)
                            ? "text-primary-500"
                            : "text-secondary-800"
                        }`}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ProvinceSelect;

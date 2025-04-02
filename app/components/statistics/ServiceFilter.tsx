import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { ProviderStatistics, StatisticsService } from "@/app/types/statistics";
import { formatCurrency } from "@/app/utils/formatters";

interface ServiceFilterProps {
  stats: ProviderStatistics;
  onServiceSelect: (service: StatisticsService | null) => void;
  selectedService: StatisticsService | null;
}

export const ServiceFilter: React.FC<ServiceFilterProps> = ({
  stats,
  onServiceSelect,
  selectedService,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredServices, setFilteredServices] = useState<StatisticsService[]>(
    []
  );

  useEffect(() => {
    if (stats?.services?.services) {
      setFilteredServices(stats.services.services);
    }
  }, [stats]);

  useEffect(() => {
    if (searchText.trim() && stats?.services?.services) {
      const filtered = stats.services.services.filter((service) =>
        service.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredServices(filtered);
    } else if (stats?.services?.services) {
      setFilteredServices(stats.services.services);
    }
  }, [searchText, stats]);

  const openServiceSelector = () => {
    setModalVisible(true);
  };

  const closeServiceSelector = () => {
    setModalVisible(false);
  };

  const handleSelectService = (service: StatisticsService) => {
    onServiceSelect(service);
    setModalVisible(false);
  };

  const handleClearFilter = () => {
    onServiceSelect(null);
  };

  return (
    <View className="mb-3">
      {/* Service Filter Button */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-700 font-pbold text-base">
          Lọc theo dịch vụ
        </Text>
        {selectedService && (
          <TouchableOpacity
            onPress={handleClearFilter}
            className="flex-row items-center"
          >
            <Text className="text-primary-500 font-pmedium mr-1">
              Xóa bộ lọc
            </Text>
            <Ionicons name="close-circle" size={16} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={openServiceSelector}
        className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center bg-white"
      >
        <View className="flex-row items-center flex-1">
          <Ionicons name="filter" size={18} color="#6b7280" className="mr-2" />
          <Text
            className="text-gray-700 font-pmedium ml-2 flex-1"
            numberOfLines={1}
          >
            {selectedService
              ? selectedService.name
              : "Chọn dịch vụ để xem thống kê chi tiết"}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#6b7280" />
      </TouchableOpacity>

      {/* Selected Service Card (if any) */}
      {selectedService && (
        <View className="bg-white mt-3 p-4 rounded-lg shadow-sm border border-primary-100">
          <View className="flex-row justify-between mb-2">
            <Text className="text-lg font-pbold text-gray-800">
              {selectedService.name}
            </Text>
            <View className="bg-primary-100 px-2 py-1 rounded-full">
              <Text className="text-primary-700 font-pmedium text-xs">
                {selectedService.order_count} đơn
              </Text>
            </View>
          </View>

          {/* Service Stats */}
          <View className="flex-row flex-wrap mt-3">
            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-blue-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Doanh thu
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {formatCurrency(selectedService.revenue || 0)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-green-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  TB/đơn hàng
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {formatCurrency(selectedService.revenue_per_order || 0)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 pr-2 mb-3">
              <View className="bg-yellow-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Đánh giá
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {selectedService.average_rating
                    ? selectedService.average_rating.toFixed(1)
                    : "0"}{" "}
                  ⭐
                </Text>
                <Text className="text-xs text-gray-500">
                  ({selectedService.review_count || 0} đánh giá)
                </Text>
              </View>
            </View>

            <View className="w-1/2 pl-2 mb-3">
              <View className="bg-purple-50 rounded-lg p-3">
                <Text className="text-gray-500 font-pmedium text-xs mb-1">
                  Lợi nhuận
                </Text>
                <Text className="text-base font-pbold text-gray-800">
                  {(selectedService.profit_margin || 0).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Services Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeServiceSelector}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-xl max-h-[70%]">
            <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
              <Text className="text-xl font-pbold text-gray-800">
                Chọn dịch vụ
              </Text>
              <TouchableOpacity onPress={closeServiceSelector}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="p-4">
              <View className="bg-gray-100 rounded-lg flex-row items-center px-3 py-2 mb-4">
                <Ionicons name="search" size={18} color="#6b7280" />
                <TextInput
                  className="flex-1 ml-2 text-gray-700 font-pmedium"
                  placeholder="Tìm kiếm dịch vụ..."
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText ? (
                  <TouchableOpacity onPress={() => setSearchText("")}>
                    <Ionicons name="close-circle" size={18} color="#6b7280" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {filteredServices.length > 0 ? (
                <FlatList
                  data={filteredServices}
                  keyExtractor={(item) => item.id.toString()}
                  style={{ maxHeight: 400 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`p-3 rounded-lg mb-2 border ${
                        selectedService?.id === item.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200"
                      }`}
                      onPress={() => handleSelectService(item)}
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <Text className="font-pbold text-gray-800">
                            {item.name}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Text className="text-gray-500 text-sm">
                              {item.order_count} đơn
                            </Text>
                            <Text className="text-gray-500 text-sm mx-1">
                              •
                            </Text>
                            <Text className="text-gray-500 text-sm">
                              {formatCurrency(item.revenue)}
                            </Text>
                            {item.average_rating > 0 && (
                              <>
                                <Text className="text-gray-500 text-sm mx-1">
                                  •
                                </Text>
                                <Text className="text-gray-500 text-sm">
                                  {item.average_rating.toFixed(1)} ⭐
                                </Text>
                              </>
                            )}
                          </View>
                        </View>
                        {selectedService?.id === item.id && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#3b82f6"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View className="items-center justify-center py-8">
                  <Ionicons name="search-outline" size={48} color="#d1d5db" />
                  <Text className="text-gray-400 mt-2 font-pmedium">
                    Không tìm thấy dịch vụ phù hợp
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

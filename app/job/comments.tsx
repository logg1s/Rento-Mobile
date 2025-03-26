import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import CommentCard from "@/components/CommentCard";
import { axiosFetch } from "@/stores/dataStore";
import { Ionicons } from "@expo/vector-icons";
import { CommentType } from "@/types/type";
import { PaginationType } from "@/types/pagination";

type SortOption = "newest" | "oldest";
type RatingOption = 1 | 2 | 3 | 4 | 5;

const AllComments = () => {
  const { id, service_name } = useLocalSearchParams();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [selectedRatings, setSelectedRatings] = useState<RatingOption[]>([]);
  const [originalComments, setOriginalComments] = useState<CommentType[]>([]);
  const navigation = useNavigation();
  const retryCount = useRef(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const nextCursor = useRef<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: `Đánh giá: ${service_name}`,
    });
  }, [service_name]);

  const fetchComments = async () => {
    try {
      let url = `/services/${id}/comments`;
      if (nextCursor.current) {
        url += `?cursor=${nextCursor.current}`;
      }
      const response = await axiosFetch(url, "get");
      const paginateData: PaginationType<CommentType> = response?.data || [];
      const data = paginateData?.data || [];
      if (data?.length > 0) {
        nextCursor.current = paginateData?.next_cursor || null;
        setOriginalComments((prev) => [...prev, ...data]);
        setComments((prev) => [...prev, ...data]);
      } else if (retryCount.current < 10) {
        retryCount.current++;
        fetchComments();
      }
      retryCount.current = 0;
    } catch (error) {
      console.error("Error fetching comments:", error);
      if (retryCount.current < 10) {
        retryCount.current++;
        fetchComments();
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchComments();
    setLoading(false);
  }, []);

  const onLoadMore = async () => {
    if (nextCursor.current) {
      setIsLoadingMore(true);
      await fetchComments();
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setComments([]);
    setOriginalComments([]);
    await fetchComments();
    setRefreshing(false);
  };

  useEffect(() => {
    applyFilters();
  }, [sortOption, selectedRatings, originalComments]);

  // Calculate the count of each rating
  const ratingCounts = useMemo(() => {
    const counts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    originalComments.forEach((comment) => {
      if (comment.rate >= 1 && comment.rate <= 5) {
        counts[comment.rate as 1 | 2 | 3 | 4 | 5] += 1;
      }
    });

    return counts;
  }, [originalComments]);

  const applyFilters = () => {
    let filteredComments = [...originalComments];

    // Apply rating filter (multi-selection)
    if (selectedRatings.length > 0) {
      filteredComments = filteredComments.filter((comment) =>
        selectedRatings.includes(comment.rate as RatingOption)
      );
    }

    // Apply sort
    filteredComments.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      if (sortOption === "newest") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setComments(filteredComments);
  };

  const toggleRatingFilter = (rating: RatingOption) => {
    setSelectedRatings((prev) => {
      // Check if the rating is already selected
      if (prev.includes(rating)) {
        // If selected, remove it
        return prev.filter((r) => r !== rating);
      } else {
        // If not selected, add it
        return [...prev, rating];
      }
    });
  };

  const clearAllFilters = () => {
    setSelectedRatings([]);
  };

  const renderFilterButton = (rating: RatingOption) => {
    const count = ratingCounts[rating];
    const isSelected = selectedRatings.includes(rating);

    return (
      <TouchableOpacity
        className={`px-4 py-2 rounded-full mr-2 ${
          isSelected ? "bg-primary-500" : "bg-gray-200"
        }`}
        onPress={() => toggleRatingFilter(rating)}
      >
        <View className="flex-row items-center">
          <Text
            className={`font-pmedium ${
              isSelected ? "text-white" : "text-gray-800"
            }`}
          >
            {rating}
          </Text>
          <Text
            className={`font-pmedium ${
              isSelected ? "text-white" : "text-gray-800"
            }`}
          >
            ⭐ ({count})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Filter and Sort Options */}
      <View className="bg-white mt-1 p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-psemibold">Lọc theo đánh giá</Text>
          {selectedRatings.length > 0 && (
            <TouchableOpacity onPress={clearAllFilters}>
              <Text className="font-pmedium text-primary-500">Xóa bộ lọc</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {renderFilterButton(5)}
          {renderFilterButton(4)}
          {renderFilterButton(3)}
          {renderFilterButton(2)}
          {renderFilterButton(1)}
        </ScrollView>

        <Text className="font-psemibold mb-2">Sắp xếp</Text>
        <View className="flex-row">
          <TouchableOpacity
            className={`px-4 py-2 rounded-full mr-2 ${
              sortOption === "newest" ? "bg-primary-500" : "bg-gray-200"
            }`}
            onPress={() => setSortOption("newest")}
          >
            <Text
              className={`font-pmedium ${
                sortOption === "newest" ? "text-white" : "text-gray-800"
              }`}
            >
              Mới nhất
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              sortOption === "oldest" ? "bg-primary-500" : "bg-gray-200"
            }`}
            onPress={() => setSortOption("oldest")}
          >
            <Text
              className={`font-pmedium ${
                sortOption === "oldest" ? "text-white" : "text-gray-800"
              }`}
            >
              Cũ nhất
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Filters Display */}
      {selectedRatings.length > 0 && (
        <View className="bg-white mt-1 p-4 flex-row">
          <Text className="font-pmedium mr-2">Đang lọc:</Text>
          <View className="flex-row flex-wrap">
            {selectedRatings
              .sort((a, b) => b - a) // Sort in descending order (5 to 1)
              .map((rating) => (
                <View
                  key={rating}
                  className="flex-row items-center bg-primary-100 rounded-full px-2 py-1 mr-2 mb-1"
                >
                  <Text className="font-pmedium text-primary-700">
                    {rating} ⭐
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleRatingFilter(rating)}
                    className="ml-1"
                  >
                    <Ionicons name="close-circle" size={16} color="#4F46E5" />
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Comments List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View className="px-4 py-2">
              {item && (
                <CommentCard
                  data={item}
                  user={item.user}
                  containerStyles="w-full"
                />
              )}
            </View>
          )}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() =>
            isLoadingMore ? (
              <ActivityIndicator size="small" color="black" />
            ) : null
          }
          contentContainerClassName="pb-10"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-10">
              <Text className="font-pmedium text-gray-500 text-center">
                {selectedRatings.length > 0
                  ? "Không có đánh giá nào khớp với bộ lọc đã chọn"
                  : "Không có đánh giá nào"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default AllComments;

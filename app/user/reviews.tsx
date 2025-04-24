import { View, Text, ScrollView, RefreshControl } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { axiosFetch } from "@/stores/dataStore";
import CommentCard from "@/components/CommentCard";
import { CommentType } from "@/types/type";

const UserReviews = () => {
  const { id } = useLocalSearchParams();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await axiosFetch(`/users/${id}`);
      if (response?.data?.comments) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchComments();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="font-pmedium text-gray-600 mb-4">Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
      contentContainerClassName="p-5 gap-4"
    >
      <Text className="font-pbold text-xl mb-2">
        Tất cả đánh giá ({comments.length})
      </Text>
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          data={comment}
          user={comment.user}
          containerStyles="w-full"
        />
      ))}
      {!comments.length && (
        <Text className="text-center text-gray-500 mt-4">
          Chưa có đánh giá nào
        </Text>
      )}
    </ScrollView>
  );
};

export default UserReviews;

import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import Swiper from "react-native-swiper";
import CardPrice from "@/components/CardPrice";
import CustomButton from "@/components/CustomButton";
import { FontAwesome, Ionicons, Octicons } from "@expo/vector-icons";
import { benefit_data, price_data } from "@/lib/dummy";
import SmallerServiceCard from "@/components/SmallerServiceCard";
import RatingStar from "@/components/RatingStar";
import CommentCard from "@/components/CommentCard";
import { ServiceType } from "@/types/type";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import InputField from "@/components/InputField";
import * as ImagePicker from "expo-image-picker";
import { convertedPrice, formatToVND, getImageSource } from "@/utils/utils";

const DetailJob = () => {
  const { id, user_name, category_name } = useLocalSearchParams();
  const navigation = useNavigation();
  const [data, setData] = useState<ServiceType | null>(null);
  const [selectedPricing, setSelectedPricing] = useState(-1);
  const priceRef = useRef<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const services = useRentoData((state) => state.services);
  const favorites = useRentoData((state) => state.favorites);
  const [comment, setComment] = useState("");
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchData = async () => {
    const serviceRes = await axiosFetch(`/services/${id}`);

    const service = serviceRes?.data;
    service.is_liked =
      favorites?.some((item) => item.id === service.id) ?? false;
    setComment(service?.comment_by_you?.comment_body ?? "");
    setSelectedRating(service?.comment_by_you?.rate ?? 0);
    setData(service);
  };

  useEffect(() => {
    fetchData();
  }, [id, favorites]);

  const onPressOrder = () => {
    router.push({
      pathname: "/job/order",
      params: { id, price_id: data?.price?.[selectedPricing]?.id },
    });
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };
  useEffect(() => {
    navigation.setOptions({
      headerTitle: `${user_name} - ${category_name}` || "Thông tin dịch vụ",
      headerRight: () => (
        <TouchableOpacity
          onPress={() => onPressFavorite(data?.id, !data?.is_liked)}
        >
          {data ? (
            <FontAwesome
              name={data?.is_liked ? "heart" : "heart-o"}
              size={24}
              color={data?.is_liked ? "#c40000" : "gray"}
            />
          ) : null}
        </TouchableOpacity>
      ),
    });
  }, [id, user_name, category_name, data]);

  const onPressCardPrice = (index: number) => {
    if (index !== undefined) {
      setSelectedPricing((prev) => (prev === index ? -1 : index));
    }
  };

  const onPressFavorite = async (id: number, action: boolean) => {
    if (id) {
      setData((prev) => ({ ...prev!, is_liked: !prev?.is_liked }));
      await updateFavorite(id, action);
    }
  };

  useEffect(() => {
    if (selectedPricing !== -1 && priceRef.current[selectedPricing]) {
      const { width } = Dimensions.get("window");

      priceRef.current[selectedPricing].measureLayout(
        scrollViewRef.current!,
        (x: number) => {
          scrollViewRef.current?.scrollTo({
            x: x - width / 10,
            animated: true,
          });
        },
      );
    }
  }, [selectedPricing]);

  const submitComment = async (type: "submit" | "update") => {
    if (comment && selectedRating) {
      const id = data?.comment_by_you?.id ?? data?.id;
      await axiosFetch(`/comments/${id}`, type === "submit" ? "post" : "put", {
        comment_body: comment,
        rate: selectedRating,
      });
      Alert.alert("Cập nhật thành công !");
      await fetchData();
    } else {
      Alert.alert("Lỗi", "Bình luận hoặc đánh giá không được để trống");
      console.error("Error: Comment or rating is empty");
    }
  };

  // const pickImage = async () => {
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     allowsEditing: true,
  //     aspect: [4, 3],
  //     quality: 1,
  //   });

  //   if (!result.canceled) {
  //     setSelectedImage(result.assets[0].uri);
  //   }
  // };

  const handleDeleteComment = async (id: number) => {
    try {
      const response = await axiosFetch(`/comments/${id}`, "delete");
      if (response?.status === 200) {
        Alert.alert("Xóa bình luận thành công");
        await fetchData();
      }
    } catch (error) {
      Alert.alert("Xóa bình luận thất bại");
    }
  };
  const [hasScrolledHalfway, setHasScrolledHalfway] = useState(false);
  const screenHeight = Dimensions.get("window").height;
  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    if (scrollY > screenHeight / 2) {
      setHasScrolledHalfway(true);
    } else {
      setHasScrolledHalfway(false);
    }
  };
  const goToMessage = (userId: number) => {
    if (userId) {
      router.push({
        pathname: "/(tabs)/message",
        params: {
          chatWithId: userId,
        },
      });
    }
  };

  return (
    <View className="flex-1">
      {!hasScrolledHalfway && (
        <TouchableOpacity
          className="flex-row items-center justify-center absolute bottom-20 gap-2 bg-gray-200 right-5 z-10 p-2  border border-gray-500 rounded-full shadow-md shadow-gray-900 "
          onPress={() => goToMessage(data?.user?.id)}
        >
          <View className="rounded-full border border-gray-300 p-2">
            <Image
              source={getImageSource(data?.user)}
              className="w-8 h-8 rounded-full"
            />
          </View>

          <Text className="font-psemibold">Nhắn tin</Text>
        </TouchableOpacity>
      )}
      {data !== null && (
        <ScrollView
          onScroll={handleScroll}
          scrollEventThrottle={100}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-5"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        >
          <View className="gap-1">
            <Swiper
              className="h-60 w-full"
              renderPagination={(index, total) => (
                <View className="rounded-2xl pt-[3px] w-auto px-3 h-[25px] bg-neutral-900 justify-center items-center absolute bottom-5 right-5">
                  <Text
                    className="font-pmedium text-white text-center"
                    numberOfLines={1}
                  >
                    {index + 1}/{total}
                  </Text>
                </View>
              )}
            >
              <Image
                source={require("@/assets/images/picsum_1.jpg")}
                className="h-full w-full"
              />
              <Image
                source={require("@/assets/images/picsum_1.jpg")}
                className="h-full w-full"
              />
              <Image
                source={require("@/assets/images/picsum_1.jpg")}
                className="h-full w-full"
              />
            </Swiper>
            <View className="p-5 bg-white flex-row justify-between items-center">
              <TouchableOpacity
                className="flex-row gap-3 items-center flex-1"
                onPress={() => {
                  if (data?.user?.id) {
                    router.push({
                      pathname: "/user/[id]",
                      params: {
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        average_rate: data.user.average_rate,
                        comment_count: data.user.comment_count,
                      },
                    });
                  } else {
                    Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng");
                  }
                }}
              >
                <View className="rounded-full border border-gray-300 p-2">
                  <Image
                    source={getImageSource(data?.user)}
                    className="w-8 h-8 rounded-full"
                  />
                </View>
                <View>
                  <Text className="font-pbold">{data?.user?.name}</Text>
                  <Text className="font-pmedium text-sm text-secondary-800">
                    {data?.category?.category_name}
                  </Text>
                </View>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={16} color="gray" />
                <Text className="ml-1 font-pmedium text-sm">
                  {data?.location?.location_name}
                </Text>
              </View>
            </View>
            <View className="p-5 bg-white gap-5">
              <Text className="font-pbold text-2xl ">{data?.service_name}</Text>
              <Text className="font-pregular text-lg">
                {data?.service_description}
              </Text>
            </View>
            <View className="bg-white p-5 gap-5 ">
              {(data?.price ?? []).length > 0 ? (
                <Text className="font-psemibold text-xl">
                  Lựa chọn gói dịch vụ
                </Text>
              ) : (
                <Text className="font-psemibold text-xl text-center">
                  Không có gói dịch vụ nào khả dụng
                </Text>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                ref={scrollViewRef}
                contentContainerClassName="gap-5"
              >
                {data?.price?.map((item, index) => (
                  <CardPrice
                    key={item?.id || index}
                    price_name={item?.price_name || ""}
                    price_value={item?.price_value || 0}
                    isActive={index === selectedPricing}
                    onPress={() => onPressCardPrice(index)}
                    ref={(el) => (priceRef.current[index] = el)}
                  />
                ))}
              </ScrollView>
              {data?.benefit?.length && data?.benefit?.length > 0 && (
                <View className="gap-3 mt-5">
                  <Text className="font-psemibold text-2xl">Lợi ích gói:</Text>
                  {data?.benefit?.map((benefit, index) => (
                    <View
                      className="flex-row items-center justify-between"
                      key={benefit.id}
                    >
                      <Text
                        className="font-pregular text-lg flex-1 ml-2"
                        numberOfLines={1}
                      >
                        {index + 1}. {benefit.benefit_name}
                      </Text>
                      {selectedPricing !== -1 &&
                        benefit?.price_id &&
                        data?.price?.[selectedPricing]?.id &&
                        (benefit.price_id.includes(
                          data.price[selectedPricing].id,
                        ) ? (
                          <Octicons
                            name="check-circle-fill"
                            size={20}
                            color="#1b802f"
                          />
                        ) : (
                          <Octicons name="x-circle" size={20} color="juniper" />
                        ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View className="bg-white p-5">
            <View className="flex-row justify-between items-center">
              <View>
                <RatingStar
                  rating={data?.average_rate ?? 0}
                  showRateNumber
                  maxStar={5}
                  isAverage={true}
                />
                <Text className="font-pregular">
                  {data?.comment_count ?? 0} đánh giá
                </Text>
              </View>
              {(data?.comment_count ?? 0) > 0 && (
                <TouchableOpacity>
                  <Text className="font-psemibold text-primary-500">
                    Xem tất cả
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              contentContainerClassName="gap-5 py-5"
              showsHorizontalScrollIndicator={false}
            >
              {data?.comment?.map((item) => (
                <CommentCard key={item.id} data={item} user={item?.user} />
              ))}
            </ScrollView>
          </View>

          <View className="bg-white p-5">
            {data?.comment_by_you !== null && (
              <View>
                <Text className="font-psemibold text-xl">
                  Bình luận của bạn
                </Text>
                <CommentCard
                  data={data?.comment_by_you!}
                  user={data?.user}
                  containerStyles="w-full my-5"
                  enableOption
                  handleDeleteComment={handleDeleteComment}
                />
              </View>
            )}
            <Text className="font-psemibold text-xl">
              {data?.comment_by_you === null
                ? "Gửi đánh giá và bình luận"
                : "Chỉnh sửa bình luận"}
            </Text>
            <View className=" justify-center items-center mt-5">
              <RatingStar
                rating={selectedRating}
                maxStar={5}
                isAverage={false}
                showRateNumber={false}
                setSelectedRating={(rating) => setSelectedRating(rating)}
                size={38}
              />
            </View>
            <View className="gap-5 w-full">
              <InputField
                nameField="Bình luận"
                placeholder="Nhập bình luận của bạn"
                onChangeText={setComment}
                value={comment}
                rules={[
                  {
                    isValid: comment.length > 0,
                    message: "Bình luận không được để trống",
                  },
                ]}
                multiline
                // iconRight={
                //   <TouchableOpacity
                //     onPress={pickImage}
                //     style={{ marginLeft: 8 }}
                //   >
                //     <FontAwesome name="image" size={20} color="black" />
                //   </TouchableOpacity>
                // }
              />
            </View>
            {selectedImage && (
              <View style={{ position: "relative", marginTop: 10 }}>
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: 100, height: 100 }}
                />
                <TouchableOpacity
                  style={{ position: "absolute", top: 0, right: 0 }}
                  onPress={() => setSelectedImage(null)}
                >
                  <FontAwesome name="times" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
            <View className="bg-white">
              <CustomButton
                title={data?.comment_by_you === null ? "Gửi" : "Cập nhật"}
                onPress={() =>
                  submitComment(
                    data?.comment_by_you === null ? "submit" : "update",
                  )
                }
                containerStyles="w-1/3 self-center mt-5"
              />
            </View>
          </View>

          <View className="bg-white p-5">
            <Text className="font-psemibold text-xl">Gợi ý cho bạn</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-5 py-5"
            >
              {services?.map((item) => (
                <SmallerServiceCard
                  key={item.id}
                  data={item}
                  onPressFavorite={() => onPressFavorite(item.id)}
                />
              ))}
            </ScrollView>
          </View>
          <View className="bg-white p-5">
            <Text className="font-psemibold text-xl">Đã xem gần đây</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-5 py-5"
            >
              {services?.map((item) => (
                <SmallerServiceCard
                  key={item.id}
                  data={item}
                  onPressFavorite={() => onPressFavorite(item.id)}
                />
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      )}
      {selectedPricing !== -1 && (
        <View className="flex-row items-center justify-between border-t border-gray-300 px-5 py-2 bg-white">
          <View className="flex-row w-2/4 ">
            <Text className="font-pmedium text-2xl ">Giá: </Text>
            <Text className="font-psemibold text-3xl text-[#ee4d2d]">
              {formatToVND(data?.price?.[selectedPricing]?.price_value ?? 0)}
            </Text>
          </View>
          <CustomButton
            title="Đặt dịch vụ"
            containerStyles="bg-black-500"
            onPress={onPressOrder}
          />
        </View>
      )}
    </View>
  );
};

export default DetailJob;

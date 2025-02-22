import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import Swiper from "react-native-swiper";
import CardPrice from "@/components/CardPrice";
import CustomButton from "@/components/CustomButton";
import { FontAwesome, Octicons } from "@expo/vector-icons";
import { benefit_data, price_data } from "@/lib/dummy";
import SmallerServiceCard from "@/components/SmallerServiceCard";
import RatingStar from "@/components/RatingStar";
import CommentCard from "@/components/CommentCard";
import { ServiceType } from "@/types/type";
import useRentoData, { axiosFetch } from "@/stores/dataStore";
import InputField from "@/components/InputField";
import * as ImagePicker from "expo-image-picker";
import { convertedPrice, formatToVND } from "@/utils/utils";

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
  const [rating, setRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchData = async () => {
    const [serviceRes, benefitRes] = await Promise.all([
      axiosFetch(`/services/${id}`),
    ]);
    const service = serviceRes?.data;
    // const benefit = benefitRes?.data;
    service.is_liked =
      favorites?.some((item) => item.id === service.id) ?? false;
    setData(service);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onPressOrder = () => {
    router.push({
      pathname: "/job/order",
      params: { id, selectedPricing: selectedPricing },
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
        <TouchableOpacity onPress={() => onPressFavoriteHeader(data?.id)}>
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

  const onPressFavoriteHeader = async (id?: number) => {
    if (id) {
      setData((prev) => ({ ...prev!, is_liked: !prev?.is_liked }));
      await updateFavorite(id);
    }
  };
  const onPressFavorite = async (id?: number) => {
    if (id) {
      await updateFavorite(id);
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
        }
      );
    }
  }, [selectedPricing]);

  const submitComment = async () => {
    if (comment && rating) {
      await axiosFetch(`/comments/${id}`, "post", { comment, rating });
      setComment("");
      setRating(0);
      fetchData(); // Cập nhật lại dữ liệu để hiển thị bình luận mới
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  return (
    <>
      {data && (
        <ScrollView
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
            <View className="p-5 bg-white ">
              <View className="flex-row gap-3 flex-1 items-center">
                <Image
                  source={
                    data?.user?.image_id
                      ? { uri: data?.user?.image_id }
                      : require("@/assets/images/avatar_placeholder_icon.png")
                  }
                  className="w-10 h-10 rounded-full"
                />
                <View>
                  <Text className="font-pbold">{data?.user?.name}</Text>
                  <Text className="font-pmedium text-sm text-secondary-800">
                    123
                  </Text>
                </View>
              </View>
            </View>
            <View className="p-5 bg-white gap-5">
              <Text className="font-pbold text-2xl ">{data?.service_name}</Text>
              <Text className="font-pregular text-lg">
                {data?.service_description}
              </Text>
            </View>
            <View className="bg-white p-5 gap-5 ">
              <Text className="font-psemibold text-xl">
                Lựa chọn gói dịch vụ
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                ref={scrollViewRef}
                contentContainerClassName="gap-5"
              >
                {data?.price?.map((item, index) => (
                  <CardPrice
                    key={index + item.price_name}
                    price_name={item?.price_name}
                    price_value={item?.price_value}
                    isActive={index === selectedPricing}
                    onPress={() => onPressCardPrice(index)}
                    ref={(el) => (priceRef.current[index] = el)}
                  />
                ))}
              </ScrollView>
              <View className="gap-3">
                {benefit_data.map((benefit) => (
                  <View
                    className="flex-row items-center justify-between"
                    key={benefit.id}
                  >
                    <Text className="font-pregular text-xl">
                      {benefit.name}
                    </Text>
                    {selectedPricing !== -1 &&
                      (price_data[selectedPricing].id_benefit.includes(
                        benefit.id
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
            </View>
          </View>
          <View className="bg-white p-5">
            <View className="flex-row justify-between items-center">
              <View>
                <RatingStar
                  rating={data?.average_rate ?? 0}
                  maxStar={5}
                  isAverage={true}
                />
                <Text className="font-pregular">
                  {data?.comment_count ?? 0} đánh giá
                </Text>
              </View>
              {data?.comment_count && (
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
            <Text className="font-psemibold text-xl">
              Gửi đánh giá và bình luận
            </Text>
            <View className=" justify-center items-center mt-5">
              <RatingStar
                rating={rating}
                maxStar={5}
                isAverage={false}
                showRateNumber={false}
                selectedRating={selectedRating}
                setSelectedRating={(rating) => setSelectedRating(rating)}
                size={38}
              />
            </View>
            <View className="gap-5 flex-row items-center ">
              <InputField
                nameField="Bình luận"
                placeholder="Nhập bình luận của bạn"
                onChangeText={setComment}
                multiline
                iconRight={
                  <TouchableOpacity
                    onPress={pickImage}
                    style={{ marginLeft: 8 }}
                  >
                    <FontAwesome name="image" size={20} color="black" />
                  </TouchableOpacity>
                }
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
                title="Gửi"
                onPress={submitComment}
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
            title="Đặt lịch ngay"
            containerStyles="bg-black-500"
            onPress={onPressOrder}
          />
        </View>
      )}
    </>
  );
};

export default DetailJob;

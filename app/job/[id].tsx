import { View, Text, Image, ScrollView, Dimensions } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import Swiper from "react-native-swiper";
import CardPrice from "@/components/CardPrice";
import CustomButton from "@/components/CustomButton";
import { Octicons } from "@expo/vector-icons";
import { benefit_data, home_data, service_data } from "@/lib/dummy";
import SmallerServiceCard from "@/components/SmallerServiceCard";

const DetailJob = () => {
  const [data, setData] = useState(home_data);
  const [selectedPricing, setSelectedPricing] = useState(-1);
  const priceRef = useRef<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const { id } = useLocalSearchParams();

  const onPressCardPrice = (index: number) => {
    setSelectedPricing((prev) => (prev === index ? -1 : index));
  };

  const onPressFavorite = (id: number) => {
    setData((prev) => {
      return prev.map((item) =>
        item.id === id ? { ...item, isLike: !item.isLike } : item,
      );
    });
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

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
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
          <View className="p-5 bg-white border-b-2 border-gray-300">
            <View className="flex-row gap-3 flex-1 items-center">
              <Image
                source={{ uri: "https://picsum.photos/200" }}
                className="w-10 h-10 rounded-full"
              />
              <View>
                <Text className="font-pbold">abc</Text>
                <Text className="font-pmedium text-sm text-secondary-800">
                  123
                </Text>
              </View>
            </View>
          </View>
          <View className="p-5 bg-white border-b-2 border-gray-300">
            <Text className="font-pbold text-2xl text-justify">
              Design social media posts
            </Text>
            <Text className="font-pregular text-justify">
              Hi, i'm tanvir. I'm a professoinal social media post designer. I'm
              here to hep you grow your business ...
            </Text>
          </View>
          <View className="bg-white p-5 gap-5 border-b-2 border-gray-300">
            <Text className="font-psemibold text-xl">Lựa chọn gói dịch vụ</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              ref={scrollViewRef}
              contentContainerClassName="gap-5"
            >
              {service_data.map((item, index) => (
                <CardPrice
                  key={index + item.name}
                  data={item}
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
                  <Text className="font-pregular text-xl">{benefit.name}</Text>
                  {selectedPricing !== -1 &&
                    (service_data[selectedPricing].id_benefit.includes(
                      benefit.id,
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
        <View className="bg-white border-b-2 border-gray-300 p-5">
          <Text className="font-psemibold text-xl">Gợi ý cho bạn</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-5 py-5"
          >
            {data.map((item) => (
              <SmallerServiceCard
                data={item}
                onPressFavorite={() => onPressFavorite(item.id)}
              />
            ))}
          </ScrollView>
        </View>
        <View className="bg-white">
          <Text className="font-psemibold text-xl">Đã xem gần đây</Text>
        </View>
      </ScrollView>
      {selectedPricing !== -1 && (
        <View className="flex-row items-center justify-between border-t border-gray-300 px-5 py-2 bg-white">
          <View className="flex-row w-2/4 ">
            <Text className="font-pmedium text-2xl ">Giá: </Text>
            <Text className="font-psemibold text-3xl text-[#ee4d2d]">
              {service_data[selectedPricing].price}
            </Text>
          </View>
          <CustomButton title="Đặt lịch ngay" containerStyles="bg-black-500 " />
        </View>
      )}
    </>
  );
};

export default DetailJob;

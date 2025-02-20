"use client";

import {FlatList, Image, RefreshControl, Text, TouchableOpacity, View,} from "react-native";
import {useState} from "react";
import {SafeAreaView} from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import Ionicons from "@expo/vector-icons/Ionicons";
import Swiper from "react-native-swiper";
import ServiceCard from "@/components/ServiceCard";
import useRentoData from "@/stores/dataStore";

const TabHome = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const data = useRentoData((state) => state.services);
    const users = useRentoData((state) => state.users);
    const fetchData = useRentoData(state => state.fetchData);
    const updateFavorite = useRentoData(state => state.updateFavorite);


    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setIsRefreshing(false);
    };

    const onPressFavorite = async (serviceId: number) => {
        await updateFavorite(serviceId);
    };


    return (
        <SafeAreaView className="flex-1 bg-general-500">
            <View className="px-5">
                <View className="flex-row">
                    <View className="flex-1 flex-row gap-2">
                        <View className={`rounded-full border-2 border-black p-2`}>
                            <Image
                                source={users?.image_id ? {
                                    uri: users?.image_id,
                                } : require("@/assets/images/avatar_placeholder_icon.png")}
                                className="w-8 h-8 "
                            />
                        </View>
                        <View>
                            <Text className="font-pregular text-sm text-secondary-800">
                                Xin chào
                            </Text>
                            <Text className="font-psemibold text-lg">{users?.name}</Text>
                        </View>
                    </View>
                    {/* Notification button removed */}
                </View>
                <View className="mb-5">
                    <InputField
                        placeholder="Tìm kiếm dịch vụ"
                        iconLeft={<Ionicons name="search" size={20} color="gray"/>}
                    />
                </View>
            </View>
            <FlatList
                data={data}
                contentContainerClassName="px-5 gap-5 pb-5"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh}/>
                }
                ListEmptyComponent={() => (
                    <View className="flex-1 items-center justify-center">
                        <Text className="font-psemibold text-lg">Không có dữ liệu</Text>
                    </View>
                )}
                renderItem={({item}) =>
                    item &&
                    <ServiceCard data={item} onPressFavorite={() => onPressFavorite(item.id)}/>
                }
                ListHeaderComponent={() => (
                    <>
                        <View className="h-60">
                            <Swiper
                                autoplay
                                loop
                                // dot={<View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0]" />}
                                // activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#0286FF]" />}
                            >
                                <Image
                                    source={require("@/assets/images/picsum_1.jpg")}
                                    className="w-full h-56"
                                    resizeMode="contain"
                                />
                                <Image
                                    source={require("@/assets/images/picsum_1.jpg")}
                                    className="w-full h-56"
                                    resizeMode="contain"
                                />
                            </Swiper>
                        </View>
                        <View className="gap-2 mb-10">
                            <View className="flex-row items-center">
                                <Text className="font-psemibold text-xl flex-1">Gợi ý</Text>
                                <TouchableOpacity>
                                    <Text className="font-psemibold text-md text-primary-500">
                                        Xem tất cả
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {data[0] && (
                                <ServiceCard
                                    data={data[0]}
                                    onPressFavorite={() => onPressFavorite(data[0].id)}
                                />
                            )}
                        </View>
                        <View className="flex-row items-center -mb-3">
                            <Text className="font-psemibold text-xl flex-1">
                                Dịch vụ phổ biến
                            </Text>
                            <TouchableOpacity>
                                <Text className="font-psemibold text-md text-primary-500">
                                    Xem tất cả
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            />
        </SafeAreaView>
    );
};

export default TabHome;

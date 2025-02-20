import {create} from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {Method} from "axios";
import {CategoryType, NotificationType, ServiceType, UserType,} from "@/types/type";

type DataState = {
    services: ServiceType[];
    categories: CategoryType[];
    users: UserType | null;
    notifications: NotificationType[];
    favorites: ServiceType[],
    fetchData: () => Promise<void>;
    updateFavorite: (serviceId: number) => Promise<void>;
};

const rentoHost = process.env.EXPO_PUBLIC_API_HOST;

export const axiosFetch = async (url: string, method: Method = 'get', data?: any) => {
    const token = await AsyncStorage.getItem("jwtToken");
    return axios({
        url: rentoHost + url,
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method,
        data,
    });
};

const useRentoData = create<DataState>((set, get) => ({
    services: [],
    categories: [],
    users: null,
    notifications: [],
    favorites: [],

    fetchData: async () => {
        try {
            const [servicesRes, categoriesRes, userRes, notificationsRes, favoritesRes] =
                await Promise.all([
                    axiosFetch(`/services`),
                    axiosFetch(`/categories`),
                    axiosFetch(`/auth/me`),
                    axiosFetch(`/notifications`),
                    axiosFetch(`/favorites`),
                ]);

            const data = {
                services: servicesRes?.data?.data,
                categories: categoriesRes?.data?.data,
                users: userRes?.data,
                notifications: notificationsRes?.data?.data,
                favorites: favoritesRes?.data
            };
            set(data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    },

    updateFavorite: async (serviceId: number) => {
        const previousServices = get().services;
        try {
            set({
                services: previousServices.map(service =>
                    service.id === serviceId ? { ...service, is_liked: !service.is_liked } : service
                )
            });
            await axiosFetch(`/favorites/${serviceId}`, 'post');
        } catch (error) {
            set({ services: previousServices });
            console.error("Lỗi khi thay đổi trạng thái yêu thích:", error);
        }
    }


}));

export default useRentoData;

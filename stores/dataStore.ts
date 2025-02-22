import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosResponse, Method } from "axios";
import {
  CategoryType,
  NotificationType,
  ServiceType,
  UserType,
} from "@/types/type";
import useAuthStore from "@/stores/authStore";

type DataState = {
  services: ServiceType[];
  categories: CategoryType[];
  users: UserType | null;
  notifications: NotificationType[];
  favorites: ServiceType[];

  fetchServices: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchFavorites: () => Promise<void>;

  fetchData: () => Promise<void>;
  updateFavorite: (serviceId: number) => Promise<void>;
};

const rentoHost = process.env.EXPO_PUBLIC_API_HOST;

export const axiosFetch = async (
  url: string,
  method: Method = "get",
  data?: any
): Promise<AxiosResponse | undefined> => {
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    return axios({
      url: rentoHost + url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method,
      data,
    });
  } catch (error) {
    const refreshResult = await useAuthStore.getState().refreshAccessToken();
    if (refreshResult) {
      return axiosFetch(url, method, data);
    }
    console.log("Lỗi fetch", url, error?.response?.data);
  }
};

const useRentoData = create<DataState>((set, get) => ({
  services: [],
  categories: [],
  users: null,
  notifications: [],
  favorites: [],

  fetchServices: async () => {
    try {
      const response = await axiosFetch(`/services`);
      const currentFavorites = get().favorites;
      const updatedServices =
        response?.data?.data?.map((s: ServiceType) => ({
          ...s,
          is_liked: currentFavorites.some((f: ServiceType) => f.id === s.id),
        })) || [];
      set({ services: updatedServices });
    } catch (error) {
      console.log("Error fetching services:", error?.response?.data);
    }
  },

  fetchCategories: async () => {
    try {
      const response = await axiosFetch(`/categories`);
      set({ categories: response?.data?.data || [] });
    } catch (error) {
      console.log("Error fetching categories:", error?.response?.data);
    }
  },

  fetchUser: async () => {
    try {
      const response = await axiosFetch(`/auth/me`);
      set({ users: response?.data || null });
    } catch (error) {
      console.log("Error fetching user:", error?.response?.data);
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await axiosFetch(`/notifications`);

      set({ notifications: response?.data?.data || [] });
    } catch (error) {
      console.log("Error fetching notifications:", error?.response?.data);
    }
  },

  fetchFavorites: async () => {
    try {
      const response = await axiosFetch(`/favorites`);
      set({ favorites: response?.data || [] });
    } catch (error) {
      console.log("Error fetching favorites:", error?.response?.data);
    }
  },

  fetchData: async () => {
    try {
      await Promise.all([
        get().fetchFavorites(),
        get().fetchCategories(),
        get().fetchUser(),
        get().fetchNotifications(),
      ]);
      await get().fetchServices();
    } catch (error) {
      console.log("Error fetching data:", error?.response?.data);
    }
  },

  updateFavorite: async (serviceId: number) => {
    const previousServices = get().services;
    try {
      set({
        services: previousServices.map((service) =>
          service.id === serviceId
            ? { ...service, is_liked: !service.is_liked }
            : service
        ),
      });
      await axiosFetch(`/favorites/${serviceId}`, "post");
      await get().fetchFavorites();
    } catch (error) {
      set({ services: previousServices });
      console.log("Lỗi khi thay đổi trạng thái yêu thích:", error?.response?.data);
    }
  },
}));

export default useRentoData;

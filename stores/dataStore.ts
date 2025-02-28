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
import { Alert } from "react-native";

type DataState = {
  services: ServiceType[];
  categories: CategoryType[];
  user: UserType | null;
  notifications: NotificationType[];
  favorites: ServiceType[];

  fetchServices: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchFavorites: () => Promise<void>;

  fetchData: () => Promise<void>;
  updateFavorite: (serviceId: number) => Promise<void>;
  update: (
    data:
      | {
          name?: string | null;
          phone_number?: string | null;
          address?: string | null;
        }
      | {
          old_password: string;
          new_password: string;
        },
    isUpdatePassword?: boolean
  ) => Promise<boolean>;
  uploadAvatar: (imageUri: string) => Promise<boolean>;
};

const rentoHost = process.env.EXPO_PUBLIC_API_HOST + "/api";

export const axiosFetch = async (
  url: string,
  method: Method = "get",
  data?: any,
  isUpload = false
): Promise<AxiosResponse | undefined> => {
  console.log(
    "fetching",
    rentoHost + url,
    method,
    data ? JSON.stringify(data) : ""
  );
  try {
    const token = await AsyncStorage.getItem("jwtToken");
    return axios({
      url: rentoHost + url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `${isUpload ? "multipart/form-data" : "application/json"}`,
      },
      method,
      data,
    });
  } catch (error) {
    console.error("Lỗi fetch", url, error?.response?.data);
    const refreshResult = await useAuthStore.getState().refreshAccessToken();
    if (refreshResult) {
      return axiosFetch(url, method, data);
    }
  }
};

const useRentoData = create<DataState>((set, get) => ({
  services: [],
  categories: [],
  user: null,
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
      console.error("Error fetching services:", error?.response?.data);
    }
  },

  fetchCategories: async () => {
    try {
      const response = await axiosFetch(`/categories`);
      set({ categories: response?.data?.data || [] });
    } catch (error) {
      console.error("Error fetching categories:", error?.response?.data);
    }
  },

  fetchUser: async () => {
    try {
      const response = await axiosFetch(`/users/me`);
      set({ user: response?.data || null });
    } catch (error) {
      console.error("Error fetching user:", error?.response?.data);
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await axiosFetch(`/notifications`);

      set({ notifications: response?.data?.data || [] });
    } catch (error) {
      console.error("Error fetching notifications:", error?.response?.data);
    }
  },

  fetchFavorites: async () => {
    try {
      const response = await axiosFetch(`/favorites`);
      set({ favorites: response?.data || [] });
    } catch (error) {
      console.error("Error fetching favorites:", error?.response?.data);
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
      console.error("Error fetching data:", error?.response?.data);
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
      console.error(
        "Lỗi khi thay đổi trạng thái yêu thích:",
        error?.response?.data
      );
    }
  },

  update: async (data, isUpdatePassword: boolean = false) => {
    try {
      const response = await axiosFetch(
        `/users/update${isUpdatePassword ? "Password" : ""}`,
        "put",
        data
      );
      if (isUpdatePassword) {
        await useAuthStore.getState().refreshAccessToken();
      }
      await get().fetchUser();
      return true;
    } catch (error) {
      console.error("Error updating profile:", error?.response?.data);
      return false;
    }
  },

  uploadAvatar: async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: imageUri,
        type: "image/jpeg",
        name: "avatar.jpg",
      } as any);
      const response = await axiosFetch(
        "/users/uploadAvatar",
        "post",
        formData,
        true
      );
      await get().fetchUser();
      return true;
    } catch (error) {
      console.error("Error uploading avatar:", error?.response?.data);
      return false;
    }
  },
}));

export default useRentoData;

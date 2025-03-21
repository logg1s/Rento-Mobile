import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axios, { AxiosResponse, Method } from "axios";
import { Alert } from "react-native";
import {
  CategoryType,
  ImageType,
  NotificationType,
  OrderStatus,
  ORDER_STATUS_ENUM_MAP,
  ServiceType,
  UserType,
  ViewedServiceType,
} from "@/types/type";
import useAuthStore from "@/stores/authStore";
import { compatibilityFlags } from "react-native-screens";
import { cloneWith, get, set } from "lodash";
import { router } from "expo-router";

type DataState = {
  services: ServiceType[];
  categories: CategoryType[];
  user: UserType | null;
  notifications: NotificationType[];
  favorites: ServiceType[];
  favIds: number[];
  fetchServices: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchUser: () => Promise<UserType | null>;
  fetchNotifications: () => Promise<void>;
  fetchFavIds: () => Promise<void>;
  updateFavorite: (serviceId: number, action: boolean) => Promise<void>;
  markNotificationAsRead: (id: number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  update: (
    data:
      | {
          name?: string | null;
          phone_number?: string | null;
          address?: string | null;
          role?: string | null;
          lat?: number | null;
          lng?: number | null;
          real_location_name?: string | null;
          province_id?: number | null;
        }
      | {
          old_password: string;
          new_password: string;
        },
    isUpdatePassword?: boolean
  ) => Promise<boolean>;
  uploadAvatar: (imageUri: string) => Promise<boolean>;
  uploadImage: (imageUri: string) => Promise<string>;
  deleteImage: (imagePath: string) => Promise<boolean>;
  updateStatusOrder: (id: number, status: OrderStatus) => Promise<boolean>;
};

const rentoHost = process.env.EXPO_PUBLIC_API_HOST + "/api";

let retry = 0;

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
    const result = await axios({
      url: rentoHost + url,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `${isUpload ? "multipart/form-data" : "application/json"}`,
        Accept: "application/json",
        Connection: "keep-alive",
      },
      method,
      data,
    });
    retry = 0;
    return result;
  } catch (error: any) {
    if (retry < 10) {
      retry++;
      return await axiosFetch(url, method, data, isUpload);
    }
    throw error;
  } finally {
    retry = 0;
    await useAuthStore.getState().refreshAccessToken();
  }
};

const useRentoData = create<DataState>((set, get) => ({
  services: [],
  categories: [],
  user: null,
  notifications: [],
  favorites: [],
  favIds: [],

  fetchFavIds: async () => {
    const response = await axiosFetch(`/favorites/list`);
    if (response?.data?.service_ids?.length > 0) {
      set({ favIds: response?.data?.service_ids });
    }
  },

  fetchServices: async () => {
    try {
      const response = await axiosFetch(`/services`);
      if (response?.data?.data?.length > 0) {
        const currentFavorites = get().favorites || [];
        const updatedServices =
          response?.data?.data?.map((s: ServiceType) => ({
            ...s,
            is_liked: currentFavorites.some((f) => f.id === s.id),
          })) || [];
        set({ services: updatedServices });
      }
    } catch (error: any) {
      console.error("Lỗi khi tải dịch vụ:", error?.response?.data || error);
    }
  },

  fetchCategories: async () => {
    try {
      const response = await axiosFetch(`/categories`);
      set({ categories: response?.data?.data || [] });
    } catch (error: any) {
      console.error("Lỗi khi tải danh mục:", error?.response?.data || error);
    }
  },

  fetchUser: async () => {
    try {
      const response = await axiosFetch(`/users/me`);
      set({ user: response?.data || null });
      return response?.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi tải thông tin người dùng:",
        error?.response?.data || error
      );
      return null;
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await axiosFetch(`/notifications`);
      set({ notifications: response?.data?.data || [] });
    } catch (error: any) {
      console.error("Lỗi khi tải thông báo:", error?.response?.data || error);
    }
  },
  updateFavorite: async (serviceId: number, action: boolean) => {
    try {
      if (action) {
        set({ favIds: [...get().favIds, serviceId] });
      } else {
        set({ favIds: get().favIds.filter((id) => id !== serviceId) });
      }
      axiosFetch(`/favorites/${serviceId}`, "post", {
        action,
      });
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật yêu thích:",
        error?.response?.data || error
      );
      throw error;
    }
  },

  markNotificationAsRead: async (id: number) => {
    try {
      const response = await axiosFetch(`/notifications/readed/${id}`, "put");
      await get().fetchNotifications();
      return response?.data;
    } catch (error: any) {
      console.error("Lỗi khi đánh dấu đã đọc:", error?.response?.data || error);
      throw error;
    }
  },

  markAllNotificationsAsRead: async () => {
    try {
      const response = await axiosFetch(`/notifications/read/all`, "put");
      await get().fetchNotifications();
      return response?.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi đánh dấu tất cả đã đọc:",
        error?.response?.data || error
      );
      throw error;
    }
  },

  update: async (
    data:
      | {
          name?: string | null;
          phone_number?: string | null;
          address?: string | null;
          role?: string | null;
          lat?: number | null;
          lng?: number | null;
          real_location_name?: string | null;
          province_id?: number | null;
        }
      | {
          old_password: string;
          new_password: string;
        },
    isUpdatePassword = false
  ) => {
    try {
      const endpoint = isUpdatePassword
        ? "/users/updatePassword"
        : "/users/update";
      const response = await axiosFetch(endpoint, "put", data);
      if (!isUpdatePassword) {
        await get().fetchUser();
      }
      return true;
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật thông tin:",
        error?.response?.data || error
      );
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể cập nhật thông tin"
      );
      return false;
    }
  },

  uploadAvatar: async (imageUri: string) => {
    try {
      const formData = new FormData();
      const fileName = imageUri.split("/").pop();
      const fileType = fileName?.split(".").pop();

      formData.append("avatar", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      } as any);

      const response = await axiosFetch(
        "/users/uploadAvatar",
        "post",
        formData,
        true
      );
      await get().fetchUser();
      return true;
    } catch (error: any) {
      console.error(
        "Lỗi khi tải lên ảnh đại diện:",
        error?.response?.data || error
      );
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể tải lên ảnh đại diện"
      );
      return false;
    }
  },

  uploadImage: async (imageUri: string) => {
    try {
      const formData = new FormData();
      const fileName = imageUri.split("/").pop();
      const fileType = fileName?.split(".").pop();

      formData.append("image", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileType}`,
      } as any);

      const response = await axiosFetch(
        "/users/uploadImage",
        "post",
        formData,
        true
      );
      return response?.data?.path || "";
    } catch (error: any) {
      console.error(
        "Lỗi khi tải lên hình ảnh:",
        error?.response?.data || error
      );
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || "Không thể tải lên hình ảnh"
      );
      return "";
    }
  },

  deleteImage: async (imagePath: string) => {
    try {
      console.log("Gọi API xóa hình ảnh với đường dẫn:", imagePath);

      const response = await axiosFetch(
        `/users/deleteImage?imagePath=${encodeURIComponent(imagePath)}`,
        "delete"
      );

      console.log("Kết quả xóa hình ảnh:", response?.data);
      return true;
    } catch (error: any) {
      console.error("Lỗi khi xóa hình ảnh:", error?.response?.data || error);
      console.log("Đường dẫn hình ảnh:", imagePath);
      return false;
    }
  },

  updateStatusOrder: async (id: number, status: OrderStatus) => {
    try {
      console.log("status", status);
      await axiosFetch(`/users/orders/${id}/update-status`, "put", {
        status: status,
      });
      return true;
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật trạng thái đơn dịch vụ:",
        error?.response?.data
      );
      return false;
    }
  },
}));

export default useRentoData;

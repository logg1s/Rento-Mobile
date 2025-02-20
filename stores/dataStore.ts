import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  CategoryType,
  NotificationType,
  ServiceType,
  UserType,
} from "@/types/type";

type DataState = {
  services: ServiceType[];
  categories: CategoryType[];
  user: UserType | null;
  notifications: NotificationType[];
  fetchData: () => Promise<void>;
};

const rentoHost = process.env.EXPO_PUBLIC_API_HOST;

const axiosGetFromUrl = async (url: string) => {
  const token = await AsyncStorage.getItem("jwtToken");
  return axios.get(rentoHost + url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const useRentoData = create<DataState>((set) => ({
  services: [],
  categories: [],
  user: null,
  notifications: [],

  fetchData: async () => {
    try {
      const [servicesRes, categoriesRes, userRes, notificationsRes] =
        await Promise.all([
          axiosGetFromUrl(`/services`),
          axiosGetFromUrl(`/categories`),
          axiosGetFromUrl(`/auth/me`),
          axiosGetFromUrl(`/notifications`),
        ]);

      const data = {
        services: servicesRes?.data?.data,
        categories: categoriesRes?.data?.data,
        user: userRes?.data,
        notifications: notificationsRes?.data?.data,
      };
      set(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },
}));

export default useRentoData;

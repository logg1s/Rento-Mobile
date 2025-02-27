import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import useRentoData from "./dataStore";

type AuthState = {
  token: string | null;
  isLoggedIn: boolean | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setToken: (token: string) => Promise<void>;
};
const key = "jwtToken";

const hostAuth = process.env.EXPO_PUBLIC_API_HOST + "/api/auth";

const defaultHeader = (token: string | null) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoggedIn: false,

  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(`${hostAuth}/login`, {
        email,
        password,
      });

      const newToken = response?.data?.access_token;

      if (newToken) {
        await AsyncStorage.setItem("jwtToken", newToken);
        await useRentoData.getState().fetchData();
        set({ token: newToken, isLoggedIn: true });
        return true;
      }
    } catch (error) {
      console.log("Lỗi khi đăng nhập:", error?.response?.data);
    }
    return false;
  },

  logout: async () => {
    try {
      await axios.post(`${hostAuth}/logout`, {}, defaultHeader(get().token));
    } catch (err) {
      console.log("err", err);
    } finally {
      await AsyncStorage.removeItem(key);
      set({ token: null, isLoggedIn: false });
    }
  },

  initialize: async () => {
    const result = await get().refreshAccessToken();
    if (result) {
      await useRentoData.getState().fetchData();
    }
    // const tokenSaved = await AsyncStorage.getItem(key);
    // if (tokenSaved) {
    //   set({ token: tokenSaved, isLoggedIn: true });
    // }
  },
  refreshAccessToken: async () => {
    try {
      const storedToken = await AsyncStorage.getItem(key);
      if (!storedToken) {
        return false;
      }
      const response = await axios.post(
        `${hostAuth}/refresh`,
        {},
        defaultHeader(storedToken)
      );

      const newToken = response?.data?.access_token;
      if (newToken) {
        console.log("newToken", newToken);
        await AsyncStorage.setItem("jwtToken", newToken);
        set({ token: newToken, isLoggedIn: true });
        return true;
      }
    } catch (error) {
      console.log("Lỗi khi refresh token: ", error?.response?.data);
    }
    return false;
  },
  setToken: async (token) => {
    await AsyncStorage.setItem("jwtToken", token);
    set({ token, isLoggedIn: true });
  },
}));

export default useAuthStore;

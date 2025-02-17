import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

type AuthState = {
  token: string | null;
  isLoggedIn: boolean | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
};
const key = "jwtToken";

const hostAuth = process.env.EXPO_PUBLIC_API_HOST + "/auth";

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
        set({ token: newToken, isLoggedIn: true });
        return true;
      }
    } catch (error) {
      console.error("Lỗi khi đăng nhập:", error);
    }
    return false;
  },

  logout: async () => {
    await axios.post(`${hostAuth}/logout`, {}, defaultHeader(get().token));
    await AsyncStorage.removeItem(key);
    set({ token: null, isLoggedIn: false });
  },

  initializeAuth: async () => {
    const storedToken = await AsyncStorage.getItem(key);
    if (storedToken) {
      try {
        await axios.get(`${hostAuth}/validate`, defaultHeader(storedToken));
        set({ token: storedToken, isLoggedIn: true });
      } catch (err) {
        console.error("Error", err);
      }
    }
  },
  refreshAccessToken: async () => {
    try {
      const response = await axios.post(
        `${hostAuth}/refresh`,
        {},
        defaultHeader(get().token),
      );
      const newToken = response?.data?.access_token;
      if (newToken) {
        set({ token: newToken });
        return true;
      }
    } catch (error) {
      console.error("Lỗi khi refresh token: ", error);
    }
    set({ token: null, isLoggedIn: false });
    AsyncStorage.removeItem(key);
    return false;
  },
}));

export default useAuthStore;

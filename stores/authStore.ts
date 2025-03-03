import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import useRentoData, { axiosFetch } from "./dataStore";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Alert, processColor } from "react-native";

import auth from "@react-native-firebase/auth";
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_FIRESTORE_DATABASE,
});

type AuthState = {
  token: string | null;
  isLoggedIn: boolean | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setToken: (token: string) => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
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
      console.error("Lỗi khi đăng nhập:", error?.response?.data);
    }
    return false;
  },

  logout: async () => {
    try {
      await axios.post(`${hostAuth}/logout`, {}, defaultHeader(get().token));
      if (useRentoData.getState().user?.is_oauth) {
        await GoogleSignin.signOut();
      }
    } catch (err) {
      console.error("err", err);
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
        defaultHeader(storedToken),
      );

      const newToken = response?.data?.access_token;
      if (newToken) {
        await AsyncStorage.setItem("jwtToken", newToken);
        set({ token: newToken, isLoggedIn: true });
        return true;
      }
    } catch (error) {
      console.error("Lỗi khi refresh token: ", error?.response?.data);
    }
    return false;
  },
  setToken: async (token) => {
    await AsyncStorage.setItem("jwtToken", token);
    set({ token, isLoggedIn: true });
  },
  loginWithGoogle: async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const signInResult = await GoogleSignin.signIn();

      let idToken = signInResult.data?.idToken;
      if (!idToken) {
        idToken = signInResult.idToken;
      }
      if (!idToken) {
        throw new Error("No ID token found");
      }

      const googleCredential = auth.GoogleAuthProvider.credential(
        signInResult.data.idToken,
      );

      const credentials = await auth().signInWithCredential(googleCredential);
      const { email, displayName, photoURL } = credentials.user;
      const response = await axios.post(`${hostAuth}/login-google`, {
        email,
        name: displayName,
        image_url: photoURL,
      });

      const newToken = response?.data?.access_token;

      if (newToken) {
        await AsyncStorage.setItem("jwtToken", newToken);
        await useRentoData.getState().fetchData();
        set({ token: newToken, isLoggedIn: true });
        return true;
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            console.error("Sign in in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert("Lỗi", "Vui lòng cài đặt Google Play Services");
            console.error("Play services not available");
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            console.error("Sign in cancelled");
            break;
          default:
            console.error("Some other error happened", error);
        }
      }
      throw error;
    }
    return false;
  },
}));

export default useAuthStore;

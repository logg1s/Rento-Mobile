import { useEffect } from "react";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";

export const useCheckProfileComplete = () => {
  const user = useRentoData((state) => state.user);

  useEffect(() => {
    if (user && (!user.phone_number || !user.address || !user.role)) {
      router.push("/(auth)/complete-profile");
    }
  }, [user]);
};

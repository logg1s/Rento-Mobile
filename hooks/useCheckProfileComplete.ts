import { useEffect } from "react";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";

export const useCheckProfileComplete = () => {
  const user = useRentoData((state) => state.user);

  useEffect(() => {
    if (user) {
      if (!user.phone_number || !user.address || !user.role) {
        router.push("/(auth)/complete-profile");
      } else if (user.role?.some((r) => r.id === "provider")) {
        router.replace("/provider/dashboard");
      }
    }
  }, [user]);
};

import { useEffect } from "react";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";

export const useCheckProfileComplete = () => {
  const user = useRentoData((state) => state.user);

  useEffect(() => {
    if (user) {
      if (user.role?.some((r) => r.id === "provider")) {
        router.replace("/provider/dashboard");
      } else if (
        !user.phone_number ||
        !user.location?.location_name ||
        !user.role
      ) {
        router.push("/(auth)/complete-profile");
      }
    }
  }, [user]);
};

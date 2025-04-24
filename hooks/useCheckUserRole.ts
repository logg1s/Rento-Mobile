import { useEffect } from "react";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";

export const useCheckUserRole = () => {
  const user = useRentoData((state) => state.user);

  useEffect(() => {
    if (user?.role?.some((r) => r.id === "provider")) {
      router.replace("/provider/services");
    } else {
      router.replace("/(tabs)/home");
    }
  }, [user]);
};

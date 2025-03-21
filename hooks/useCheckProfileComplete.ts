import { useEffect } from "react";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";

export const useCheckProfileComplete = () => {
  const user = useRentoData((state) => state.user);
  console.log("user", user);

  useEffect(() => {
    if (user) {
    }
  }, [user]);
};

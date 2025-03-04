import { PriceType, UserType } from "@/types/type";
import { ImageSourcePropType } from "react-native";

export const convertedPrice = (
  price?: PriceType[],
  short = false,
  single: "no" | "lowest" | "highest" = "no",
) => {
  if (!price?.length) return formatToVND(0);
  const minPrice = Math.min(...price.map((p) => p.price_value));
  const maxPrice = Math.max(...price.map((p) => p.price_value));

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(0) + "M";
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + "K";
    }
    return value.toString();
  };

  const fnFormat = short ? formatValue : formatToVND;

  const singlePrice = single === "highest" ? maxPrice : minPrice;

  if (minPrice === maxPrice || single !== "no") {
    return fnFormat(singlePrice);
  }

  return `${fnFormat(minPrice)} - ${fnFormat(maxPrice)}`;
};

export const formatDateToVietnamese = (date: Date) => {
  const daysOfWeek = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];

  const day = daysOfWeek[date.getDay()];
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}, ${dayOfMonth}/${month}/${year}`;
};

export const formatToVND = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export const getImagePath = (path: string | null | undefined) => {
  if (path) {
    const isStorage = path.startsWith("/storage/");
    const prefixPath = isStorage ? process.env.EXPO_PUBLIC_API_HOST : "";
    return prefixPath + path;
  }
  return null;
};

export const getImageSource = (
  user: UserType | null | undefined,
): ImageSourcePropType => {
  const path = getImagePath(user?.image?.path);
  return path
    ? { uri: path }
    : require("@/assets/images/avatar_placeholder_icon.png");
};
export const normalizeVietnamese = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};
export const searchFilter = (itemName: string, searchQuery: string) => {
  if (!itemName) return false;
  if (!searchQuery) return true;

  const normalizedItem = normalizeVietnamese(itemName.trim());
  const normalizedQuery = normalizeVietnamese(searchQuery.trim());

  const queryWords = normalizedQuery.split(" ");
  return queryWords.some((word) => normalizedItem.includes(word));
};

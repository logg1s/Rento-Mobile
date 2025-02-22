import { PriceType } from "@/types/type";

export const convertedPrice = (price?: PriceType[]) => {
  if (!price?.length) return "0đ";
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

  if (minPrice === maxPrice) {
    return formatValue(minPrice);
  }

  return `${formatValue(minPrice)} - ${formatValue(maxPrice)}`;
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

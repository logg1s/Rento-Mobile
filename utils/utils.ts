import {Price} from "@/types/type";

export const convertedPrice = (price?: Price[]) => {
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
import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ComparisonData } from "@/app/types/statistics";

interface SummaryCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: number;
  suffix?: string;
  className?: string;
  comparison?: ComparisonData;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  trend = 0,
  suffix,
  className = "",
  comparison,
}) => {
  // We prioritize explicitly passed trend over comparison data
  const getEffectiveTrend = () => {
    if (trend !== undefined && trend !== null) {
      return trend;
    }
    if (comparison) {
      return comparison.is_positive
        ? comparison.growth_percentage
        : -comparison.growth_percentage;
    }
    return 0;
  };

  const effectiveTrend = getEffectiveTrend();
  const isPositiveTrend = effectiveTrend > 0;

  const getTrendIcon = () => {
    if (effectiveTrend === 0) {
      return <Ionicons name="remove" size={16} color="#9ca3af" />;
    }
    return isPositiveTrend ? (
      <Ionicons name="arrow-up" size={16} color="#10b981" />
    ) : (
      <Ionicons name="arrow-down" size={16} color="#ef4444" />
    );
  };

  const getTrendColor = () => {
    if (effectiveTrend === 0) return "text-gray-400";
    return isPositiveTrend ? "text-green-500" : "text-red-500";
  };

  const getTrendText = () => {
    if (suffix && !effectiveTrend) {
      return suffix;
    }

    const sign = isPositiveTrend ? "+" : "";
    const percentage = Math.abs(effectiveTrend).toFixed(1);

    if (suffix) {
      return `${sign}${percentage}% ${suffix}`;
    }

    return `${sign}${percentage}%`;
  };

  const shouldShowTrend = effectiveTrend !== 0 || suffix;

  return (
    <View className={`bg-white p-3 rounded-lg shadow-sm ${className}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className="text-gray-600 font-pmedium">{title}</Text>
        </View>

        {shouldShowTrend && (
          <View className="flex-row items-center">
            {getTrendIcon()}
            <Text className={`text-xs font-pmedium ${getTrendColor()} ml-1`}>
              {getTrendText()}
            </Text>
          </View>
        )}
      </View>

      <Text className="text-xl font-pbold text-gray-800 mt-1">{value}</Text>
    </View>
  );
};

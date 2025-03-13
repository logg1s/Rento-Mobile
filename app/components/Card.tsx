import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: number;
  suffix?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  value,
  icon,
  trend = 0,
  suffix,
  className = "",
}) => {
  const getTrendIcon = () => {
    if (trend > 0) {
      return <Ionicons name="trending-up" size={16} color="#10b981" />;
    } else if (trend < 0) {
      return <Ionicons name="trending-down" size={16} color="#ef4444" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (trend > 0) return "text-green-500";
    if (trend < 0) return "text-red-500";
    return "text-gray-500";
  };

  return (
    <View className={`${className}`}>
      <View className="flex-row items-center">
        {icon && <View className="mr-2">{icon}</View>}
        <Text className="text-gray-600 font-pmedium">{title}</Text>
      </View>
      <Text className="text-xl font-pbold text-gray-800 mt-1">{value}</Text>

      {(trend !== 0 || suffix) && (
        <View className="flex-row items-center mt-1">
          {getTrendIcon()}
          <Text className={`text-xs font-pmedium ${getTrendColor()} ml-1`}>
            {suffix || `${trend}%`}
          </Text>
        </View>
      )}
    </View>
  );
};

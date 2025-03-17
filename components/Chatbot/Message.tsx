import { UserType } from "@/types/type";
import { getImageSource } from "@/utils/utils";
import React, { useEffect } from "react";
import { StyleSheet, View, Image, Text } from "react-native";

const date = new Date();

const getTime = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  // get minute with 2 digit
  const minutesStr = minutes.toString().padStart(2, "0");
  return hours + ":" + minutesStr;
};

export default function Message({
  message,
  user,
  onAfterNewMessage,
}: {
  message: string;
  user: UserType | null;
  onAfterNewMessage?: () => void;
}) {
  useEffect(() => {
    onAfterNewMessage?.();
  }, [message]);
  return (
    <View style={styles.message}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image source={getImageSource(user)} style={styles.icon} />
          <Text style={{ fontWeight: 500 }}>{user?.name}</Text>
        </View>
        <Text style={{ fontSize: 10, fontWeight: 600 }}>{getTime(date)}</Text>
      </View>
      <Text style={{ fontSize: 14, width: "100%", flex: 1, paddingLeft: 0 }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    flexDirection: "column",
    gap: 8,
    backgroundColor: "#f1f2f3",
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
  },
  icon: {
    width: 28,
    height: 28,
  },
});

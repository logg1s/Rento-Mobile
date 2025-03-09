import { useState, useRef, useEffect } from "react";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { axiosFetch } from "@/stores/dataStore";
import { router } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

export const useNotification = () => {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          AsyncStorage.setItem("expo_token", token ?? "");
          axiosFetch("/notifications/token/register", "post", {
            expo_token: token,
          });
        }
      })
      .catch((error: any) => {
        console.error("Loi token", error);
        AsyncStorage.removeItem("expo_token");
      });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {});

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotification(response.notification);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useEffect(() => {
    const getLastNotificationResponse = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        handleNotification(response.notification);
      }
    };
    getLastNotificationResponse();
  }, []);
};

function handleNotification(notification: Notifications.Notification) {
  const data = notification.request.content.data;
  switch (data.type) {
    case "message":
      if (data?.id) {
        router.push({
          pathname: "/(tabs)/message",
          params: {
            chatWithId: data.id,
          },
        });
      }
      break;
    case "order":
      break;
  }
}

async function sendTestPushNotification(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    channelId: "default",
    sound: "default",
    title: "Original Title",
    body: "And here is the body!",
    data: { someData: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "Thông báo mặc định",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    Notifications.setNotificationChannelAsync("messaging", {
      name: "Tin nhắn",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      console.error("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      return pushTokenString;
    } catch (e: unknown) {
      console.error(`${e}`);
    }
  } else {
    console.error("Must use physical device for push notifications");
  }
}

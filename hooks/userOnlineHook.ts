import { firebase } from "@react-native-firebase/database";
import { compatibilityFlags } from "react-native-screens";

export const realtimeDatabase = firebase
  .app()
  .database(process.env.EXPO_PUBLIC_REALTIME_DATABASE);

export const useOnline = (userId: number) => {
  const reference = realtimeDatabase.ref(`/online/${userId}`);
  reference.set(true);
  reference.onDisconnect().remove();
};

export const useIsOnline = async (userId: number) => {
  const reference = realtimeDatabase.ref(`/online/${userId}`);
  const isOnline = await reference.once("value");
  return isOnline.val() ?? false;
};

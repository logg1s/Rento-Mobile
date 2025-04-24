import { firebase } from "@react-native-firebase/database";

export const realtimeDatabase = firebase
  .app()
  .database(process.env.EXPO_PUBLIC_REALTIME_DATABASE);

export const useStatusOnline = (userId: number, online: boolean) => {
  const reference = realtimeDatabase.ref(`/online/${userId}`);
  online ? reference.set(true) : reference.remove();
  reference.onDisconnect().remove();
};

export const useIsOnline = async (userId: number) => {
  const reference = realtimeDatabase.ref(`/online/${userId}`);
  const isOnline = await reference.once("value");
  return isOnline.val() ?? false;
};

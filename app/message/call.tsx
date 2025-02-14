"use client";

import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { AudioModule } from "expo-audio";

const CallScreen = () => {
  const { name, avatar } = useLocalSearchParams();
  const [callStatus, setCallStatus] = useState("Đang gọi...");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  useEffect(() => {
    requestMicrophonePermission();
    const timer = setTimeout(() => {
      setCallStatus("Đang kết nối");
      const durationTimer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(durationTimer);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const requestMicrophonePermission = async () => {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      Alert.alert(
        "Quyền truy cập micro bị từ chối",
        "Vui lòng cấp quyền truy cập micro trong cài đặt để thực hiện cuộc gọi.",
        [{ text: "OK" }],
      );
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    router.back();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement mute functionality here
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Implement speaker toggle functionality here
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-500 justify-between items-center p-4">
      <View className="items-center">
        <Image source={{ uri: avatar }} className="w-32 h-32 rounded-full" />
        <Text className="font-pbold text-2xl text-white mt-4">{name}</Text>
        <Text className="font-pmedium text-lg text-white mt-2">
          {callStatus === "Đang kết nối"
            ? formatDuration(callDuration)
            : callStatus}
        </Text>
      </View>

      <View className="flex-row justify-around w-full px-8">
        <TouchableOpacity
          className={`w-16 h-16 rounded-full justify-center items-center ${isMuted ? "bg-gray-600" : "bg-white"}`}
          onPress={toggleMute}
        >
          <Ionicons
            name={isMuted ? "mic-off" : "mic"}
            size={32}
            color={isMuted ? "white" : "#0286FF"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-16 h-16 bg-red-500 rounded-full justify-center items-center"
          onPress={handleEndCall}
        >
          <Ionicons name="call" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          className={`w-16 h-16 rounded-full justify-center items-center ${isSpeakerOn ? "bg-gray-600" : "bg-white"}`}
          onPress={toggleSpeaker}
        >
          <Ionicons
            name={isSpeakerOn ? "volume-high" : "volume-medium"}
            size={32}
            color={isSpeakerOn ? "white" : "#0286FF"}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CallScreen;

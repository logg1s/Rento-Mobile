import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  Modal,
  TouchableOpacityProps,
  Alert,
} from "react-native";
import React, { useRef, useState } from "react";
import { CommentCardProp } from "@/types/prop";
import Fontisto from "@expo/vector-icons/Fontisto";
import { CommentType, UserType } from "@/types/type";
import { formatDateToVietnamese } from "@/utils/utils";
import { Entypo, FontAwesome, Ionicons } from "@expo/vector-icons";
import { axiosFetch } from "@/stores/dataStore";

const CommentCard = ({
  data: { id, rate, comment_body },
  containerStyles,
  user,
  enableOption = false,
  handleDeleteComment,
}: CommentCardProp & {
  containerStyles?: string;
  user?: UserType;
  enableOption?: boolean;
  handleDeleteComment?: (id: number) => void;
}) => {
  const onPressComment = () => {};
  const [showOption, setShowOption] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const menuButtonRef = useRef(null);

  const handlePressOutside = () => {
    setShowOption(false);
  };

  const handleShowMenu = () => {
    menuButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setMenuPosition({ x: pageX - 100, y: pageY + height });
      setShowOption(true);
    });
  };

  const handleShowDeleteConfirm = () => {
    Alert.alert("Xác nhận", "Bạn có chắc chắn muốn xóa bình luận?", [
      {
        text: "Hủy",
        style: "cancel",
      },
      {
        text: "Xóa",
        onPress: () => {
          handleDeleteComment?.(id);
        },
        style: "destructive",
      },
    ]);

    setShowOption(false);
  };

  const onLongPressComment = () => {};
  return (
    <TouchableOpacity
      className={`rounded-xl w-72 p-3 gap-5 border border-general-100 bg-white shadow-md shadow-gray-500 ${containerStyles}`}
      onPress={onPressComment}
      activeOpacity={1}
      onLongPress={onLongPressComment}
    >
      <View className="flex-row gap-3 items-center">
        <View className="flex-row flex-1 item-center gap-2">
          <View className="rounded-full border border-gray p-2 ">
            <Image
              source={
                user?.image_id
                  ? { uri: user?.image_id }
                  : require("@/assets/images/avatar_placeholder_icon.png")
              }
              className="w-8 h-8"
            />
          </View>
          <Text className="font-pbold self-center">{user?.name}</Text>
        </View>
        {enableOption && (
          <View className="relative">
            <TouchableOpacity
              ref={menuButtonRef}
              onPress={handleShowMenu}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Entypo name="dots-three-vertical" size={12} color="gray" />
            </TouchableOpacity>

            <Modal
              visible={showOption}
              transparent
              animationType="none"
              onRequestClose={handlePressOutside}
            >
              <Pressable className="flex-1" onPress={handlePressOutside}>
                <View
                  className="absolute bg-white rounded-lg shadow-lg w-32 border border-gray-200"
                  style={{
                    left: menuPosition.x,
                    top: menuPosition.y - 50,
                  }}
                >
                  <TouchableOpacity
                    className="px-4 py-2 flex-row items-center gap-2"
                    onPress={() => {
                      handleShowDeleteConfirm(id);
                    }}
                  >
                    <FontAwesome name="trash" size={16} color="#ef4444" />
                    <Text className="font-pmedium text-red-500">Xóa</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          </View>
        )}
      </View>
      <View>
        <Text className="font-pmedium" numberOfLines={2}>
          {comment_body}
        </Text>
      </View>
      <View className="flex-row items-center">
        <View className="flex-row gap-1 flex-1 items-center">
          <Fontisto name="star" size={12} color="black" className="mb-1" />
          <View className="flex-row gap-2 items-center">
            <Text className="font-pbold">{rate}</Text>
          </View>
        </View>
        <Text className="font-pregular text-sm">
          {formatDateToVietnamese(new Date())}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CommentCard;

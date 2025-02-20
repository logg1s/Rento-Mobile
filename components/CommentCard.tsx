import {View, Text, Image, TouchableOpacity} from "react-native";
import React from "react";
import {CommentCardProp} from "@/types/prop";
import Fontisto from "@expo/vector-icons/Fontisto";
import {CommentType, UserType} from "@/types/type";

const CommentCard = ({
                         data: {
                             id,
                             rate,
                             comment_body
                         },
                         containerStyles,
                         user,
                     }: CommentCardProp & {
    containerStyles?: string;
    user?: UserType;
}) => {
    const onPressComment = () => {
    };

    // TODO: write long press service card
    const onLongPressComment = () => {
    };
    return (
        <TouchableOpacity
            className={`rounded-xl w-72 p-3 gap-5 border border-general-100 bg-white shadow-md shadow-gray-500 ${containerStyles}`}
            onPress={onPressComment}
            onLongPress={onLongPressComment}
        >
            <View className="flex-row items-center">
                <View className="flex-row gap-3 flex-1 items-center">
                    <Image
                        source={user?.image_id ? {uri: user?.image_id} : require("@/assets/images/avatar_placeholder_icon.png")}
                        className="w-10 h-10 rounded-full"
                    />
                    <View>
                        <Text className="font-pbold">{user?.name}</Text>
                        <Text className="font-pmedium text-sm text-secondary-800">
                            {comment_body}
                        </Text>
                    </View>
                </View>
            </View>
            <View>
                <Text className="font-pmedium" numberOfLines={2}>
                    {comment_body}
                </Text>
            </View>
            <View className="flex-row items-center">
                <View className="flex-row gap-1 flex-1 items-center">
                    <Fontisto name="star" size={12} color="black" className="mb-1"/>
                    <View className="flex-row gap-2 items-center">
                        <Text className="font-pbold">{rate}</Text>
                    </View>
                </View>
                <Text className="font-pregular text-sm">
                    {new Date().toDateString()}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

export default CommentCard;

import { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import useRentoData from "@/stores/dataStore";
import InputField from "@/components/InputField";
import { Rules } from "@/types/type";

const ChangePasswordScreen = () => {
  const updatePassword = useRentoData((state) => state.update);
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const rules: Rules = {
    old_password: [
      {
        isValid: form.old_password.length >= 6,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      },
    ],
    new_password: [
      {
        isValid: form.new_password.length >= 6,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
      },
    ],
    confirm_password: [
      {
        isValid: form.confirm_password === form.new_password,
        message: "Mật khẩu xác nhận không khớp",
      },
    ],
  };

  const isValidate = Object.values(rules).every((rule) =>
    rule.every((r) => r.isValid)
  );

  const handleSubmit = async () => {
    if (!isValidate) return;

    const success = await updatePassword(
      {
        old_password: form.old_password,
        new_password: form.new_password,
      },
      true
    );

    if (success) {
      Alert.alert("Thành công", "Đổi mật khẩu thành công");
      router.back();
    } else {
      Alert.alert("Lỗi", "Mật khẩu cũ không đúng");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-pbold">Đổi mật khẩu</Text>
        <View style={{ width: 24 }} />
      </View>

      <View className="gap-5">
        <InputField
          nameField="Mật khẩu hiện tại"
          placeholder="Nhập mật khẩu hiện tại"
          iconLeft={<Ionicons name="lock-closed" size={20} color="gray" />}
          rules={rules.old_password}
          value={form.old_password}
          secureTextEntry
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, old_password: text }))
          }
        />

        <InputField
          nameField="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          iconLeft={<Ionicons name="lock-closed" size={20} color="gray" />}
          rules={rules.new_password}
          value={form.new_password}
          secureTextEntry
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, new_password: text }))
          }
        />

        <InputField
          nameField="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          iconLeft={<Ionicons name="lock-closed" size={20} color="gray" />}
          rules={rules.confirm_password}
          value={form.confirm_password}
          secureTextEntry
          onChangeText={(text) =>
            setForm((prev) => ({ ...prev, confirm_password: text }))
          }
        />

        <TouchableOpacity
          onPress={handleSubmit}
          className={`py-3 px-4 rounded-lg mt-6 ${
            isValidate ? "bg-primary-500" : "bg-primary-400"
          }`}
          disabled={!isValidate}
        >
          <Text className="text-white text-center font-pbold text-lg">
            Đổi mật khẩu
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;

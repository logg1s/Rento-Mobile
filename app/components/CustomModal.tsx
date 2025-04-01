import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ModalType = "success" | "error" | "confirm" | "info";

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type: ModalType;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

const CustomModal = ({
  visible,
  title,
  message,
  type,
  onClose,
  onConfirm,
  onCancel,
}: CustomModalProps) => {
  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return {
          iconName: "checkmark-circle",
          color: "#10b981",
          bgColor: "#d1fae5",
        };
      case "error":
        return {
          iconName: "alert-circle",
          color: "#ef4444",
          bgColor: "#fee2e2",
        };
      case "confirm":
        return {
          iconName: "help-circle",
          color: "#f59e0b",
          bgColor: "#fef3c7",
        };
      case "info":
        return {
          iconName: "information-circle",
          color: "#3b82f6",
          bgColor: "#dbeafe",
        };
      default:
        return {
          iconName: "information-circle",
          color: "#3b82f6",
          bgColor: "#dbeafe",
        };
    }
  };

  const { iconName, color, bgColor } = getIconAndColor();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: bgColor,
              },
            ]}
          >
            <Ionicons name={iconName as any} size={40} color={color} />
          </View>

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>

          <View style={styles.buttonContainer}>
            {type === "confirm" ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    onCancel ? onCancel() : onClose();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => {
                    onConfirm && onConfirm();
                    onClose();
                  }}
                >
                  <Text style={styles.confirmButtonText}>Xác nhận</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: color,
                  },
                ]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Đóng</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "85%",
    maxWidth: 400,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    marginBottom: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Roboto_700Bold",
  },
  modalText: {
    marginBottom: 24,
    textAlign: "center",
    fontSize: 16,
    color: "#4b5563",
    fontFamily: "Roboto_400Regular",
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  button: {
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    minWidth: 100,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#3b82f6",
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    marginRight: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
  },
  cancelButtonText: {
    color: "#4b5563",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: "Roboto_500Medium",
  },
});

export default CustomModal;

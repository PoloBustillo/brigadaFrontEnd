import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

interface AlertProps {
  title?: string;
  message: string;
  variant?: "success" | "error" | "warning" | "info";
}

export default function Alert({
  title,
  message,
  variant = "info",
}: AlertProps) {
  const config = {
    success: {
      icon: "checkmark-circle" as const,
      color: "#4CAF50",
      bg: "#E8F5E9",
    },
    error: {
      icon: "close-circle" as const,
      color: "#F44336",
      bg: "#FFEBEE",
    },
    warning: {
      icon: "warning" as const,
      color: "#FF9800",
      bg: "#FFF3E0",
    },
    info: {
      icon: "information-circle" as const,
      color: "#2196F3",
      bg: "#E3F2FD",
    },
  };

  const current = config[variant];

  return (
    <View style={[styles.container, { backgroundColor: current.bg }]}>
      <Ionicons name={current.icon} size={24} color={current.color} />
      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: current.color }]}>{title}</Text>
        )}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginVertical: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#424242",
  },
});

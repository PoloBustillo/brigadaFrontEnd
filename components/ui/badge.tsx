import { Text, TextStyle, View, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "success" | "error" | "warning" | "info" | "neutral";
  size?: "small" | "medium";
}

export default function Badge({
  label,
  variant = "neutral",
  size = "medium",
}: BadgeProps) {
  const getStyles = () => {
    const colors = {
      success: { bg: "#E8F5E9", text: "#2E7D32" },
      error: { bg: "#FFEBEE", text: "#C62828" },
      warning: { bg: "#FFF3E0", text: "#E65100" },
      info: { bg: "#E3F2FD", text: "#1565C0" },
      neutral: { bg: "#F5F5F5", text: "#616161" },
    };

    const containerStyle: ViewStyle = {
      backgroundColor: colors[variant].bg,
      paddingHorizontal: size === "small" ? 8 : 12,
      paddingVertical: size === "small" ? 4 : 6,
      borderRadius: 12,
      alignSelf: "flex-start",
    };

    const textStyle: TextStyle = {
      fontSize: size === "small" ? 11 : 13,
      fontWeight: "600",
      color: colors[variant].text,
    };

    return { container: containerStyle, text: textStyle };
  };

  const styles = getStyles();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

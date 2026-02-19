import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface CMSNoticeProps {
  message: string;
}

export function CMSNotice({ message }: CMSNoticeProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.noticeBanner,
        {
          backgroundColor: colors.info + "18",
          borderColor: colors.info + "40",
        },
      ]}
    >
      <Ionicons name="eye-outline" size={16} color={colors.info} />
      <Text style={[styles.noticeText, { color: colors.info }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
});

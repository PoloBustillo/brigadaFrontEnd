import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode, memo } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightAccessory?: ReactNode;
  centerTitle?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  showBorder?: boolean;
}

function ScreenHeaderComponent({
  title,
  subtitle,
  onBackPress,
  rightAccessory,
  centerTitle = false,
  style,
  titleStyle,
  subtitleStyle,
  showBorder = true,
}: ScreenHeaderProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const leftControl = onBackPress ? (
    <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
      <Ionicons name="arrow-back" size={22} color={colors.text} />
    </TouchableOpacity>
  ) : (
    <View style={styles.iconSpacer} />
  );

  const rightControl = rightAccessory ?? <View style={styles.iconSpacer} />;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: showBorder ? 1 : 0,
          paddingTop: Math.max(insets.top, 12) + 8,
        },
        style,
      ]}
    >
      {centerTitle ? (
        <View style={styles.centerRow}>
          {leftControl}
          <Text
            style={[
              styles.title,
              styles.titleCentered,
              { color: colors.text },
              titleStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {rightControl}
        </View>
      ) : (
        <View style={styles.leftRow}>
          {onBackPress ? leftControl : null}
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: colors.text }, titleStyle]}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textSecondary },
                  subtitleStyle,
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
          {rightAccessory ? rightControl : null}
        </View>
      )}

      {centerTitle && subtitle ? (
        <Text
          style={[
            styles.subtitle,
            styles.subtitleCentered,
            { color: colors.textSecondary },
            subtitleStyle,
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export const ScreenHeader = memo(ScreenHeaderComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  iconSpacer: {
    width: 32,
    height: 32,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  titleCentered: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  subtitleCentered: {
    textAlign: "center",
    marginTop: 8,
  },
});

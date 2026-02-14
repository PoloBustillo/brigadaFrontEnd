/**
 * 🎨 Custom Tab Bar - Premium iOS Style
 * Barra de tabs moderna con blur translúcido y animaciones
 */

import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TabButtonProps {
  route: any;
  isFocused: boolean;
  options: any;
  onPress: () => void;
  onLongPress: () => void;
}

function TabButton({
  route,
  isFocused,
  options,
  onPress,
  onLongPress,
}: TabButtonProps) {
  const colors = useThemeColors();
  const scaleAnim = React.useRef(
    new Animated.Value(isFocused ? 1 : 0.95),
  ).current;

  const label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
        ? options.title
        : route.name;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isFocused ? 1 : 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isFocused, scaleAnim]);

  return (
    <TouchableOpacity
      key={route.key}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.tabContent,
          {
            backgroundColor: isFocused ? colors.primary + "15" : "transparent",
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Active indicator - Línea superior */}
        {isFocused && (
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: colors.primary },
            ]}
          />
        )}

        <View style={[styles.contentWrapper, !isFocused && styles.contentWrapperCentered]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            {options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? colors.primary : colors.textSecondary,
              size: isFocused ? 24 : 24,
            })}
          </View>

          {/* Label - Solo visible en tab activo */}
          {isFocused && (
            <Text
              style={[
                styles.label,
                {
                  color: colors.primary,
                },
              ]}
              numberOfLines={1}
            >
              {typeof label === "string" ? label : ""}
            </Text>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { theme } = useTheme();

  return (
    <BlurView
      intensity={theme === "dark" ? 70 : 85}
      tint={theme === "dark" ? "dark" : "light"}
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 4),
          borderTopColor: colors.border + "30",
          backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.4)",
        },
      ]}
    >
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              options={options}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  content: {
    flexDirection: "row",
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 8,
    minHeight: 56,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 0,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    minWidth: 56,
    minHeight: 48,
    position: "relative",
  },
  contentWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrapperCentered: {
    // Tabs inactivos - centrado perfecto
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 24,
    width: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.1,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 2,
  },
});

/**
 * 🎨 Custom Tab Bar - Premium iOS Style
 * Barra de tabs moderna con blur translúcido y animaciones
 */

import { useSync } from "@/contexts/sync-context";
import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Animated,
  Easing,
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
  badge?: number;
}

function TabButton({
  route,
  isFocused,
  options,
  onPress,
  onLongPress,
  badge,
}: TabButtonProps) {
  const colors = useThemeColors();
  const scaleAnim = React.useRef(
    new Animated.Value(isFocused ? 1 : 0.95),
  ).current;

  // Animación de pulso para badge
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

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

  // Animación de pulso cuando hay badge
  React.useEffect(() => {
    if (badge && badge > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [badge, pulseAnim]);

  const hasBadge = typeof badge === "number" && badge > 0;

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

        <View
          style={[
            styles.contentWrapper,
            !isFocused && styles.contentWrapperCentered,
          ]}
        >
          {/* Icon with badge */}
          <View style={styles.iconContainer}>
            {options.tabBarIcon &&
              options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? colors.primary : colors.textSecondary,
                size: isFocused ? 24 : 24,
              })}

            {/* Badge con pulso */}
            {hasBadge && badge !== undefined && (
              <Animated.View
                style={[
                  styles.badge,
                  {
                    backgroundColor: colors.error,
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Text style={styles.badgeText}>{badge.toString()}</Text>
              </Animated.View>
            )}
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
  const { pendingByType } = useSync();

  // Mapear rutas a tipos de sync para mostrar badges
  const getRouteBadge = (routeName: string): number => {
    if (routeName.includes("surveys")) {
      return pendingByType.surveys;
    }
    if (routeName.includes("responses")) {
      return pendingByType.responses;
    }
    if (routeName.includes("users")) {
      return pendingByType.users;
    }
    return 0;
  };

  return (
    <BlurView
      intensity={theme === "dark" ? 70 : 85}
      tint={theme === "dark" ? "dark" : "light"}
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 4),
          borderTopColor: colors.border + "30",
          backgroundColor:
            theme === "dark"
              ? "rgba(0, 0, 0, 0.3)"
              : "rgba(255, 255, 255, 0.4)",
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
              badge={getRouteBadge(route.name)}
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
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});

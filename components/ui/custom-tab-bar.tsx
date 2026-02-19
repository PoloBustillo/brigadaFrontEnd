/**
 * 🎨 Custom Tab Bar - Premium iOS Style
 * Barra de tabs moderna con blur translúcido y animaciones
 */

import { useSync } from "@/contexts/sync-context";
import { useThemeColors } from "@/contexts/theme-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Animated,
  Easing,
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
    new Animated.Value(isFocused ? 1 : 0.97),
  ).current;

  // Animación de pulso para badge
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Animación de opacidad para feedback visual
  const opacityAnim = React.useRef(
    new Animated.Value(isFocused ? 1 : 0.7),
  ).current;

  const label =
    options.tabBarLabel !== undefined
      ? options.tabBarLabel
      : options.title !== undefined
        ? options.title
        : route.name;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1 : 0.97,
        useNativeDriver: true,
        friction: 9,
        tension: 100,
      }),
      Animated.timing(opacityAnim, {
        toValue: isFocused ? 1 : 0.7,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused, scaleAnim, opacityAnim]);

  // Animación de pulso cuando hay badge (más sutil y rápida)
  React.useEffect(() => {
    if (badge && badge > 0) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
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
            opacity: opacityAnim,
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
                    borderColor: colors.surface,
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

  const handleTabPress = (route: any, isFocused: boolean) => {
    // Feedback háptico diferenciado
    if (!isFocused) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleTabLongPress = (route: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.emit({
      type: "tabLongPress",
      target: route.key,
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 4),
          borderTopColor: colors.border,
          backgroundColor: colors.backgroundSecondary,
        },
      ]}
    >
      <View style={styles.content}>
        {state.routes
          .filter((route) => {
            const { options } = descriptors[route.key];
            // Only show routes that have a tabBarIcon
            return options.tabBarIcon;
          })
          .map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === state.routes.indexOf(route);

            return (
              <TabButton
                key={route.key}
                route={route}
                isFocused={isFocused}
                options={options}
                onPress={() => handleTabPress(route, isFocused)}
                onLongPress={() => handleTabLongPress(route)}
                badge={getRouteBadge(route.name)}
              />
            );
          })}
      </View>
    </View>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  content: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 8,
    minHeight: 52,
    gap: 4,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 60,
    minHeight: 44,
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
    height: 26,
    width: 26,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  activeIndicator: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 2.5,
    borderRadius: 2,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});

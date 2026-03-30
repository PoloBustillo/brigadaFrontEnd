/**
 * Brigadista Main Menu
 * Large icon menu buttons: Maps, Tracking, Surveys, Extras, Networks, Profile
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

interface BrigadistaMainMenuProps {
  onExtraPress?: () => void;
  onReportIssuePress?: () => void;
  onNetworksPress?: () => void;
  onExitAppPress?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  expandable: boolean;
  action: () => void;
  subItems?: {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    action: () => void;
  }[];
}

export function BrigadistaMainMenu({
  onExtraPress,
  onReportIssuePress,
  onNetworksPress,
  onExitAppPress,
}: BrigadistaMainMenuProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>("maps");

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleExpand = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMenuId((currentId) => (currentId === id ? null : id));
  };

  const menuItems: MenuItem[] = [
    {
      id: "maps",
      label: "Mapas",
      icon: "map",
      expandable: true,
      action: () => toggleExpand("maps"),
      subItems: [
        {
          id: "sections",
          label: "Secciones",
          icon: "layers-outline",
          action: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(brigadista)/maps?tab=sections" as any);
          },
        },
        {
          id: "progress",
          label: "Avances",
          icon: "trending-up-outline",
          action: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(brigadista)/maps?tab=progress" as any);
          },
        },
      ],
    },
    {
      id: "tracking",
      label: "Seguimiento",
      icon: "analytics",
      expandable: false,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(brigadista)/tracking" as any);
      },
    },
    {
      id: "surveys",
      label: "Cuestionarios",
      icon: "clipboard-outline",
      expandable: true,
      action: () => toggleExpand("surveys"),
      subItems: [
        {
          id: "active",
          label: "Activos",
          icon: "play-circle-outline",
          action: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(brigadista)/questionnaires?filter=active" as any);
          },
        },
        {
          id: "completed",
          label: "Completados",
          icon: "checkmark-circle-outline",
          action: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(brigadista)/questionnaires?filter=completed" as any);
          },
        },
        {
          id: "pending",
          label: "Pendientes",
          icon: "time-outline",
          action: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(brigadista)/questionnaires?filter=pending" as any);
          },
        },
      ],
    },
    {
      id: "extras",
      label: "Extras",
      icon: "add-circle-outline",
      expandable: false,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(brigadista)/extras" as any);
      },
    },
    {
      id: "networks",
      label: "Redes",
      icon: "share-social-outline",
      expandable: false,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(brigadista)/networks" as any);
      },
    },
    {
      id: "profile",
      label: "Perfil",
      icon: "person-circle-outline",
      expandable: false,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(brigadista)/profile" as any);
      },
    },
    {
      id: "report-error",
      label: "Reportar error",
      icon: "bug-outline",
      expandable: false,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(brigadista)/report-issue" as any);
      },
    },
    {
      id: "exit",
      label: "Cerrar sesión",
      icon: "log-out-outline",
      expandable: false,
      action: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onExitAppPress?.();
      },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBlock}>
        <Text style={[styles.title, { color: colors.text }]}>
          Menu principal
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Accesos rapidos para organizar tu jornada
        </Text>
      </View>

      {/* Main Menu Grid */}
      <View style={styles.menuGrid}>
        {menuItems.map((item) => {
          const isExpanded = expandedMenuId === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: isExpanded
                    ? colors.primary + "55"
                    : colors.border,
                  shadowColor: "#000",
                },
              ]}
              onPress={item.action}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Ionicons name={item.icon} size={32} color={colors.primary} />
              </View>
              <Text
                style={[styles.menuLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {item.expandable && (
                <View
                  style={[
                    styles.expandIcon,
                    {
                      backgroundColor: isExpanded
                        ? colors.primary + "20"
                        : colors.border + "55",
                    },
                  ]}
                >
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={isExpanded ? colors.primary : colors.textSecondary}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Expandable Menus */}
      {menuItems.map((item) =>
        item.expandable && expandedMenuId === item.id && item.subItems ? (
          <View
            key={`${item.id}-expanded`}
            style={[
              styles.expandedMenu,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: "#000",
              },
            ]}
          >
            <View style={styles.expandedHeader}>
              <Text style={[styles.expandedMenuTitle, { color: colors.text }]}>
                {item.label}
              </Text>
              <Text
                style={[styles.expandedCount, { color: colors.textSecondary }]}
              >
                {item.subItems.length} accesos
              </Text>
            </View>

            <View style={styles.subItemsList}>
              {item.subItems.map((subItem) => (
                <TouchableOpacity
                  key={subItem.id}
                  style={[
                    styles.subItem,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={subItem.action}
                >
                  <Ionicons
                    name={subItem.icon}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.subItemLabel, { color: colors.text }]}>
                    {subItem.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  headerBlock: {
    paddingHorizontal: 4,
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  menuButton: {
    width: "48%",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    position: "relative",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 62,
    height: 62,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  expandIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  expandedMenu: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  expandedMenuTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  expandedCount: {
    fontSize: 12,
    fontWeight: "600",
  },
  subItemsList: {
    gap: 8,
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  subItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});

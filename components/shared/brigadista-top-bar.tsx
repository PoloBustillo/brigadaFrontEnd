/**
 * Brigadista Top Bar
 * Header with: Notifications, Extras Menu, Sync, WiFi & Theme
 */

import { useAuth } from "@/contexts/auth-context";
import { useSync } from "@/contexts/sync-context";
import { useTheme, useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BrigadistaTopBarProps {
  extraSurveys?: { id: number; title: string }[];
  onExtraSurveyPress?: (surveyId: number) => void;
  temporalSummary?: {
    active: number;
    upcoming: number;
    expired: number;
  };
  onTemporalPress?: (window: "active" | "upcoming" | "expired") => void;
}

export function BrigadistaTopBar({
  extraSurveys = [],
  onExtraSurveyPress,
  temporalSummary,
  onTemporalPress,
}: BrigadistaTopBarProps) {
  const colors = useThemeColors();
  const { isOnline, isSyncing, pendingByType, syncAll } = useSync();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [showExtrasMenu, setShowExtrasMenu] = useState(false);

  const notificationCount =
    (pendingByType?.surveys ?? 0) +
    (pendingByType?.responses ?? 0) +
    (pendingByType?.users ?? 0);

  const handleSync = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!isOnline) {
      Alert.alert(
        "Sin conexión",
        "Necesitas conexión a internet para sincronizar.",
      );
      return;
    }

    try {
      await syncAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "No se pudo completar la sincronización.");
    }
  };

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTheme();
  };

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(brigadista)/notifications" as any);
  };

  const handleExtraSurveyPress = (surveyId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowExtrasMenu(false);
    if (onExtraSurveyPress) {
      onExtraSurveyPress(surveyId);
    }
  };

  const handleTemporalPress = (window: "active" | "upcoming" | "expired") => {
    if (!onTemporalPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTemporalPress(window);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.content}>
          {/* Left: User Avatar/Initial & Greeting */}
          <View style={styles.leftSection}>
            <TouchableOpacity
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: user?.avatar_url
                    ? "transparent"
                    : colors.primary + "20",
                },
              ]}
              onPress={() => router.push("/(brigadista)/profile" as any)}
              activeOpacity={0.8}
            >
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                  }}
                />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {user?.email?.charAt(0).toUpperCase() || "B"}
                </Text>
              )}
            </TouchableOpacity>
            <View style={styles.greetingText}>
              <Text
                style={[styles.greetingLabel, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                Hola,
              </Text>
              <Text
                style={[styles.userName, { color: colors.text }]}
                numberOfLines={1}
              >
                {user?.email?.split("@")[0] || "Brigadista"}
              </Text>
            </View>
          </View>

          {/* Right: Actions */}
          <View style={styles.rightSection}>
            {/* Notifications */}
            <TouchableOpacity
              onPress={handleNotifications}
              style={[styles.actionButton]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="notifications-outline"
                size={28}
                color={colors.text}
              />
              {notificationCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Extras Menu */}
            {extraSurveys.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowExtrasMenu(true)}
                style={[styles.actionButton]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={28}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}

            {/* Sync Button */}
            <TouchableOpacity
              onPress={handleSync}
              style={[styles.actionButton]}
              activeOpacity={0.7}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size={20} color={colors.primary} />
              ) : (
                <Ionicons
                  name="cloud-upload-outline"
                  size={28}
                  color={isOnline ? colors.success : colors.warning}
                />
              )}
            </TouchableOpacity>

            {/* WiFi & Theme */}
            <View style={styles.statusGroup}>
              <TouchableOpacity
                onPress={handleThemeToggle}
                style={[styles.statusButton]}
              >
                <Ionicons
                  name={theme === "dark" ? "moon" : "sunny"}
                  size={22}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Extras Menu Modal */}
      <Modal
        visible={showExtrasMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExtrasMenu(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={() => setShowExtrasMenu(false)}
          activeOpacity={1}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.extrasMenu,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {}} // Prevent closing on menu tap
          >
            <Text style={[styles.extrasTitle, { color: colors.text }]}>
              Más Encuestas
            </Text>
            <ScrollView
              style={styles.extrasScroll}
              showsVerticalScrollIndicator={false}
            >
              {extraSurveys.map((survey) => (
                <TouchableOpacity
                  key={`extra-survey-${survey.id}`}
                  style={[
                    styles.extraItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleExtraSurveyPress(survey.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="document-outline"
                    size={22}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.extraItemText, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {survey.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
    minHeight: 100,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    maxWidth: "50%",
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "700",
  },
  greetingText: {
    gap: 4,
    flex: 0,
  },
  greetingLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    maxWidth: 100,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  statusGroup: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  extrasMenu: {
    borderRadius: 16,
    borderWidth: 1,
    width: "85%",
    maxHeight: "70%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  extrasTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  extrasScroll: {
    maxHeight: "100%",
  },
  extraItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  extraItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});

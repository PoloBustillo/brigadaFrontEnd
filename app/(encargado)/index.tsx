/**
 * Encargado Dashboard - Main Screen
 * Shows: Team overview, assigned surveys, member activity
 * Access: Team managers only (Rules 9-10)
 *
 * ✅ Modern Design: Clean cards with team focus
 * ✅ Dynamic Theme: Uses useThemeColors for full theme support
 * ✅ Mock Data: Shows realistic data for testing UI
 * ✅ Team Management: Focus on team performance and assignments
 */

import { ThemeToggleIcon } from "@/components/ui/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface TeamMemberCardProps {
  id: number;
  name: string;
  email: string;
  surveysCompleted: number;
  surveysTotal: number;
  lastActive: string;
  status: "active" | "idle" | "offline";
}

function TeamMemberCard({
  name,
  email,
  surveysCompleted,
  surveysTotal,
  lastActive,
  status,
}: TeamMemberCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const statusConfig = {
    active: {
      label: "Activo",
      color: colors.success,
      icon: "checkmark-circle" as const,
    },
    idle: {
      label: "Inactivo",
      color: colors.warning,
      icon: "time" as const,
    },
    offline: {
      label: "Sin conexión",
      color: colors.textSecondary,
      icon: "cloud-offline" as const,
    },
  };

  const config = statusConfig[status];
  const progress = (surveysCompleted / surveysTotal) * 100;

  return (
    <TouchableOpacity
      style={[
        styles.memberCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(encargado)/team/" as any);
      }}
    >
      {/* Avatar Circle */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: colors.primary + "20", borderColor: config.color },
        ]}
      >
        <Text style={[styles.avatarText, { color: colors.primary }]}>
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)}
        </Text>
      </View>

      <View style={styles.memberInfo}>
        {/* Name and Status */}
        <View style={styles.memberHeader}>
          <Text style={[styles.memberName, { color: colors.text }]}>
            {name}
          </Text>
          <View style={styles.statusContainer}>
            <Ionicons name={config.icon} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Email */}
        <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
          {email}
        </Text>

        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {surveysCompleted} de {surveysTotal} encuestas
          </Text>
          <View
            style={[styles.progressBar, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.success,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Last Active */}
        <Text style={[styles.lastActive, { color: colors.textSecondary }]}>
          Última actividad: {lastActive}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  color: string;
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

export default function EncargadoHome() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Fetch real data from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        },
        {
          text: "Cerrar Sesión",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await logout();
            router.replace("/(auth)/welcome");
          },
        },
      ],
      { cancelable: true },
    );
  };

  // 🧪 MOCK DATA
  const stats = [
    {
      icon: "people" as const,
      value: "8",
      label: "Mi Equipo",
      color: colors.primary,
    },
    {
      icon: "document-text" as const,
      value: "5",
      label: "Mis Encuestas",
      color: colors.success,
    },
    {
      icon: "clipboard" as const,
      value: "124",
      label: "Respuestas",
      color: colors.info,
    },
    {
      icon: "trending-up" as const,
      value: "78%",
      label: "Completado",
      color: colors.warning,
    },
  ];

  const teamMembers = [
    {
      id: 1,
      name: "María González",
      email: "maria.g@brigada.com",
      surveysCompleted: 12,
      surveysTotal: 15,
      lastActive: "Hace 2 horas",
      status: "active" as const,
    },
    {
      id: 2,
      name: "Carlos Ramírez",
      email: "carlos.r@brigada.com",
      surveysCompleted: 8,
      surveysTotal: 15,
      lastActive: "Hace 6 horas",
      status: "idle" as const,
    },
    {
      id: 3,
      name: "Ana Martínez",
      email: "ana.m@brigada.com",
      surveysCompleted: 15,
      surveysTotal: 15,
      lastActive: "Hace 1 hora",
      status: "active" as const,
    },
    {
      id: 4,
      name: "Luis Torres",
      email: "luis.t@brigada.com",
      surveysCompleted: 5,
      surveysTotal: 15,
      lastActive: "Hace 2 días",
      status: "offline" as const,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            Bienvenido de nuevo
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {user?.name || "Encargado"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Connection Status */}
          <View
            style={[
              styles.statusIndicator,
              {
                backgroundColor: isOnline
                  ? colors.success + "20"
                  : colors.error + "20",
                borderColor: isOnline ? colors.success : colors.error,
              },
            ]}
          >
            <Ionicons
              name={isOnline ? "wifi" : "wifi-outline"}
              size={16}
              color={isOnline ? colors.success : colors.error}
            />
          </View>
          {/* Theme Toggle */}
          <ThemeToggleIcon />
          {/* Logout */}
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </View>

      {/* Team Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Mi Equipo
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(encargado)/team/" as any);
            }}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              Ver todos
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.teamList}>
          {teamMembers.map((member) => (
            <TeamMemberCard key={member.id} {...member} />
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Acciones Rápidas
        </Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(encargado)/assignments" as any);
            }}
          >
            <Ionicons name="add-circle" size={32} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Nueva Asignación
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(encargado)/surveys/" as any);
            }}
          >
            <Ionicons name="bar-chart" size={32} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Ver Progreso
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: "22%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  teamList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  memberCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
    gap: 6,
  },
  memberHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  memberEmail: {
    fontSize: 14,
  },
  progressSection: {
    gap: 4,
  },
  progressText: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  lastActive: {
    fontSize: 12,
  },
  actionsGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
});

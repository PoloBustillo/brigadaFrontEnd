/**
 * Admin Surveys - Read-only survey list
 * Fetches from GET /admin/surveys.
 * All write operations are handled by the web CMS.
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { AdminSurvey, getAdminSurveys } from "@/lib/api/admin";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminSurveys() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();

  const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    active: true,
    inactive: false,
  });

  const fetchSurveys = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getAdminSurveys();
      setSurveys(data);
    } catch {
      setError("No se pudieron cargar las encuestas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    fetchSurveys(true);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const active = surveys.filter((s) => s.is_active);
  const inactive = surveys.filter((s) => !s.is_active);

  const SurveyCard = ({ survey }: { survey: AdminSurvey }) => (
    <View
      style={[
        styles.surveyCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <Text
            style={[styles.cardTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {survey.title}
          </Text>
          {survey.description ? (
            <Text
              style={[styles.cardDescription, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {survey.description}
            </Text>
          ) : null}
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: survey.is_active
                ? colors.success + "20"
                : colors.textSecondary + "20",
            },
          ]}
        >
          <Ionicons
            name={
              survey.is_active ? "checkmark-circle" : "pause-circle-outline"
            }
            size={14}
            color={survey.is_active ? colors.success : colors.textSecondary}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: survey.is_active ? colors.success : colors.textSecondary,
              },
            ]}
          >
            {survey.is_active ? "Activa" : "Inactiva"}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.infoItem}>
          <Ionicons
            name="layers-outline"
            size={15}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {survey.versions.length}{" "}
            {survey.versions.length === 1 ? "versión" : "versiones"}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={colors.textSecondary}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {new Date(survey.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const SectionHeader = ({
    label,
    count,
    accentColor,
    icon,
    expanded,
    onToggle,
  }: {
    label: string;
    count: number;
    accentColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    expanded: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name={icon} size={22} color={accentColor} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {label}
        </Text>
        <View style={[styles.badge, { backgroundColor: accentColor + "20" }]}>
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {count}
          </Text>
        </View>
      </View>
      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Encuestas" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Read-only notice */}
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
          <Text style={[styles.noticeText, { color: colors.info }]}>
            Vista de solo lectura. Gestiona encuestas desde el CMS web.
          </Text>
        </View>

        {/* Stats row */}
        {!loading && surveys.length > 0 && (
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {surveys.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="pulse-outline" size={18} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {active.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Activas
              </Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="pause-circle-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {inactive.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Inactivas
              </Text>
            </View>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.emptyState}>
            <Ionicons
              name="cloud-offline-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {error}
            </Text>
          </View>
        )}

        {/* Empty */}
        {!loading && !error && surveys.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Sin encuestas
            </Text>
          </View>
        )}

        {/* Activas */}
        {!loading && active.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              label="Activas"
              count={active.length}
              accentColor={colors.success}
              icon="checkmark-circle-outline"
              expanded={expandedSections.active}
              onToggle={() => toggleSection("active")}
            />
            {expandedSections.active && (
              <View style={styles.sectionContent}>
                {active.map((s) => (
                  <SurveyCard key={s.id} survey={s} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Inactivas */}
        {!loading && inactive.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              label="Inactivas"
              count={inactive.length}
              accentColor={colors.textSecondary}
              icon="pause-circle-outline"
              expanded={expandedSections.inactive}
              onToggle={() => toggleSection("inactive")}
            />
            {expandedSections.inactive && (
              <View style={styles.sectionContent}>
                {inactive.map((s) => (
                  <SurveyCard key={s.id} survey={s} />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  noticeText: { fontSize: 13, fontWeight: "500", flex: 1 },
  statsRow: { flexDirection: "row", gap: 10 },
  statPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, fontWeight: "600" },
  loader: { marginTop: 60 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, textAlign: "center" },
  section: { gap: 0 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  sectionContent: { gap: 10, marginTop: 4 },
  surveyCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  cardTitleSection: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  cardDescription: { fontSize: 13 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardInfo: { flexDirection: "row", gap: 16 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoText: { fontSize: 13 },
});

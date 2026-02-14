/**
 * Admin Dashboard - Main Screen
 * Shows: Overview metrics, recent surveys, quick filters
 * Access: Administrators only (Rule 6)
 *
 * ✅ Modern Design: Clean cards inspired by task management apps
 * ✅ Dynamic Theme: Uses useThemeColors for full theme support
 * ✅ Mock Data: Shows realistic data for testing UI
 * ✅ Filter Tabs: Quick navigation between sections
 */

import { AppHeader } from "@/components/shared";
import { useThemeColors } from "@/contexts/theme-context";
import { useTabBarHeight } from "@/hooks/use-tab-bar-height";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FilterTab = "all" | "active" | "completed" | "pending";

type SortOption =
  | "date-desc"
  | "date-asc"
  | "name-asc"
  | "name-desc"
  | "responses-desc"
  | "responses-asc";

interface FilterOptions {
  categories: string[];
  dateRange: { start: string | null; end: string | null };
  responseRange: { min: number | null; max: number | null };
}

interface SurveyCardProps {
  id: number;
  title: string;
  category: string;
  date: string;
  responses: number;
  status: "active" | "completed" | "pending";
  progress: number;
}

function SurveyCard({
  title,
  category,
  date,
  responses,
  status,
  progress,
}: SurveyCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const statusConfig = {
    active: {
      label: "En progreso",
      color: colors.warning,
      bg: colors.warning + "20",
    },
    completed: {
      label: "Completada",
      color: colors.success,
      bg: colors.success + "20",
    },
    pending: { label: "Por hacer", color: colors.info, bg: colors.info + "20" },
  };

  const config = statusConfig[status];

  return (
    <TouchableOpacity
      style={[
        styles.surveyCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push("/(admin)/surveys/" as any);
      }}
    >
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>

      {/* Title */}
      <Text
        style={[styles.cardTitle, { color: colors.text }]}
        numberOfLines={2}
      >
        {title}
      </Text>

      {/* Category */}
      <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
        {category}
      </Text>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.cardMetaText, { color: colors.textSecondary }]}>
            {date}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons
            name="chatbox-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.cardMetaText, { color: colors.textSecondary }]}>
            {responses} respuestas
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: config.color,
                width: `${progress}%`,
              },
            ]}
          />
        </View>
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

export default function AdminDashboard() {
  const colors = useThemeColors();
  const { contentPadding } = useTabBarHeight();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  // Filter & Sort State
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>("date-desc");
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    dateRange: { start: null, end: null },
    responseRange: { min: null, max: null },
  });

  const availableCategories = [
    "Salud Comunitaria",
    "Desarrollo Social",
    "Educación",
    "Seguridad",
    "Infraestructura",
  ];

  const sortOptions = [
    { value: "date-desc" as SortOption, label: "Más recientes primero" },
    { value: "date-asc" as SortOption, label: "Más antiguos primero" },
    { value: "name-asc" as SortOption, label: "Nombre (A-Z)" },
    { value: "name-desc" as SortOption, label: "Nombre (Z-A)" },
    { value: "responses-desc" as SortOption, label: "Más respuestas" },
    { value: "responses-asc" as SortOption, label: "Menos respuestas" },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: Fetch real data from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleFilterChange = (filter: FilterTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const toggleCategory = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSortSelect = (option: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSort(option);
    setShowSortModal(false);
    // TODO: Implement actual sorting logic here
  };

  const handleApplyFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFiltersModal(false);
    // TODO: Implement actual filtering logic here
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      dateRange: { start: null, end: null },
      responseRange: { min: null, max: null },
    });
  };

  // 🧪 MOCK DATA
  const stats = [
    {
      icon: "document-text" as const,
      value: "12",
      label: "Encuestas",
      color: colors.primary,
    },
    {
      icon: "people" as const,
      value: "47",
      label: "Usuarios",
      color: colors.success,
    },
    {
      icon: "clipboard" as const,
      value: "324",
      label: "Respuestas",
      color: colors.info,
    },
    {
      icon: "briefcase" as const,
      value: "28",
      label: "Asignaciones",
      color: colors.warning,
    },
  ];

  const surveys = [
    {
      id: 1,
      title: "Encuesta de Salud Mental y Bienestar",
      category: "Salud Comunitaria",
      date: "May 28, 2025",
      responses: 12,
      status: "active" as const,
      progress: 35,
    },
    {
      id: 2,
      title: "Evaluación de Infraestructura Urbana",
      category: "Desarrollo Social",
      date: "May 30, 2025",
      responses: 2,
      status: "pending" as const,
      progress: 15,
    },
    {
      id: 3,
      title: "Censo de Necesidades Educativas",
      category: "Educación",
      date: "Jun 5, 2025",
      responses: 45,
      status: "completed" as const,
      progress: 100,
    },
    {
      id: 4,
      title: "Estudio de Seguridad Vecinal",
      category: "Seguridad",
      date: "Jun 8, 2025",
      responses: 8,
      status: "active" as const,
      progress: 55,
    },
  ];

  const filteredSurveys =
    activeFilter === "all"
      ? surveys
      : surveys.filter(
          (s) =>
            s.status === activeFilter.replace("ed", "") ||
            (activeFilter === "active" && s.status === "active"),
        );

  // TODO: Apply advanced filters from FilterOptions
  // - Filter by categories: filters.categories
  // - Filter by date range: filters.dateRange.start and filters.dateRange.end
  // - Filter by response range: filters.responseRange.min and filters.responseRange.max

  // TODO: Apply sorting based on selectedSort
  // - "date-desc": Sort by date, newest first
  // - "date-asc": Sort by date, oldest first
  // - "name-asc": Sort alphabetically A-Z
  // - "name-desc": Sort alphabetically Z-A
  // - "responses-desc": Sort by responses, highest first
  // - "responses-asc": Sort by responses, lowest first

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Dashboard" />

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
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    activeFilter === "all" ? colors.text : colors.surface,
                },
              ]}
              onPress={() => handleFilterChange("all")}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === "all" ? colors.background : colors.text,
                  },
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    activeFilter === "pending" ? colors.text : colors.surface,
                },
              ]}
              onPress={() => handleFilterChange("pending")}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === "pending"
                        ? colors.background
                        : colors.text,
                  },
                ]}
              >
                Por hacer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    activeFilter === "active" ? colors.text : colors.surface,
                },
              ]}
              onPress={() => handleFilterChange("active")}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === "active"
                        ? colors.background
                        : colors.text,
                  },
                ]}
              >
                En progreso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    activeFilter === "completed" ? colors.text : colors.surface,
                },
              ]}
              onPress={() => handleFilterChange("completed")}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color:
                      activeFilter === "completed"
                        ? colors.background
                        : colors.text,
                  },
                ]}
              >
                Completadas
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFiltersModal(true);
            }}
          >
            <Ionicons name="funnel-outline" size={18} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Filtros
              {filters.categories.length > 0 && (
                <Text style={{ color: colors.primary }}>
                  {" "}
                  ({filters.categories.length})
                </Text>
              )}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSortModal(true);
            }}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={18}
              color={colors.text}
            />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Ordenar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Survey Cards */}
        <View style={styles.cardsContainer}>
          {filteredSurveys.map((survey) => (
            <SurveyCard key={survey.id} {...survey} />
          ))}
        </View>
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filtros
              </Text>
              <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Categories Section */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Categorías
              </Text>
              <View style={styles.chipContainer}>
                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: filters.categories.includes(category)
                          ? colors.primary
                          : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleCategory(category);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: filters.categories.includes(category)
                            ? colors.background
                            : colors.text,
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Range Section - Placeholder */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginTop: 24 },
                ]}
              >
                Rango de fechas
              </Text>
              <Text
                style={[
                  styles.placeholderText,
                  { color: colors.textSecondary },
                ]}
              >
                🚧 Por implementar - selector de fechas
              </Text>

              {/* Response Range Section - Placeholder */}
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginTop: 24 },
                ]}
              >
                Número de respuestas
              </Text>
              <Text
                style={[
                  styles.placeholderText,
                  { color: colors.textSecondary },
                ]}
              >
                🚧 Por implementar - rango de respuestas (min-max)
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  handleClearFilters();
                }}
              >
                <Text
                  style={[styles.secondaryButtonText, { color: colors.text }]}
                >
                  Limpiar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleApplyFilters}
              >
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: colors.background },
                  ]}
                >
                  Aplicar filtros
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              styles.sortModalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Ordenar por
              </Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor:
                        selectedSort === option.value
                          ? colors.primary + "20"
                          : "transparent",
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSortSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      {
                        color:
                          selectedSort === option.value
                            ? colors.primary
                            : colors.text,
                        fontWeight:
                          selectedSort === option.value ? "700" : "500",
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedSort === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScrollContent: {
    paddingRight: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterTabActive: {
    // backgroundColor set inline
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionBar: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardsContainer: {
    gap: 16,
  },
  surveyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
  },
  cardCategory: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    fontSize: 12,
    fontWeight: "400",
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  progressBackground: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  sortModalContent: {
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  placeholderText: {
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 12,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sortOptions: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 15,
  },
});

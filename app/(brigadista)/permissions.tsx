import { ScreenHeader } from "@/components/shared";
import { useAuth } from "@/contexts/auth-context";
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BrigadistaPermissionsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const loadedPermissions = (user?.permissions ?? []).slice().sort();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Permisos"
        subtitle="Tu rol y permisos actuales"
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 36 + Math.max(insets.bottom, 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary + "22", colors.info + "12", colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderColor: colors.border }]}
        >
          <View style={styles.heroHeader}>
            <View
              style={[
                styles.heroIconWrap,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                Seguridad de cuenta
              </Text>
              <Text
                style={[styles.heroSubtitle, { color: colors.textSecondary }]}
              >
                Rol actual y permisos cargados en tu sesion.
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Rol
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {user?.role ?? "N/A"}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total permisos
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {loadedPermissions.length}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <PermissionSection
          title="Permisos cargados"
          icon="shield-checkmark-outline"
          items={loadedPermissions}
          emptyText="No hay permisos cargados en la sesion."
          colors={colors}
        />
      </ScrollView>
    </View>
  );
}

function PermissionSection({
  title,
  icon,
  items,
  emptyText,
  colors,
  accentColor,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  items: string[];
  emptyText: string;
  colors: ReturnType<typeof useThemeColors>;
  accentColor?: string;
}) {
  const tone = accentColor ?? colors.primary;

  return (
    <View
      style={[
        styles.section,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={tone} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>

      {items.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {emptyText}
        </Text>
      ) : (
        <View style={styles.permissionList}>
          {items.map((item) => (
            <View
              key={`${title}-${item}`}
              style={[
                styles.permissionPill,
                {
                  borderColor: tone + "44",
                  backgroundColor: tone + "15",
                },
              ]}
            >
              <Text style={[styles.permissionText, { color: tone }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextWrap: {
    flex: 1,
    gap: 2,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  permissionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  permissionPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

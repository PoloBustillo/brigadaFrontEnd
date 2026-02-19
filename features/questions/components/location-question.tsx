/**
 * LocationQuestion — placeholder (expo-location not installed).
 * Allows manual coordinate entry as fallback.
 */
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type {
  LocationQuestion as LocationQ,
  QuestionAnswer,
} from "../types/question-base.types";

interface LocationValue {
  latitude: number | null;
  longitude: number | null;
  address?: string;
}

interface Props {
  question: LocationQ;
  value?: LocationValue;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function LocationQuestion({
  question,
  value,
  onChange,
  disabled = false,
}: Props) {
  const colors = useThemeColors();

  const emit = (partial: Partial<LocationValue>) => {
    onChange({
      questionId: question.id,
      value: { ...(value ?? { latitude: null, longitude: null }), ...partial },
      answeredAt: Date.now(),
    });
  };

  return (
    <View style={styles.container}>
      {/* Info banner */}
      <View
        style={[
          styles.banner,
          {
            backgroundColor: colors.primary + "12",
            borderColor: colors.primary + "40",
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.primary}
        />
        <Text style={[styles.bannerText, { color: colors.primary }]}>
          GPS automático no disponible. Ingresa las coordenadas manualmente.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Latitud
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
              },
            ]}
            value={
              value?.latitude !== null && value?.latitude !== undefined
                ? String(value.latitude)
                : ""
            }
            onChangeText={(t) =>
              emit({ latitude: t === "" ? null : parseFloat(t) })
            }
            placeholder="-33.4489"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            editable={!disabled}
          />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Longitud
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
              },
            ]}
            value={
              value?.longitude !== null && value?.longitude !== undefined
                ? String(value.longitude)
                : ""
            }
            onChangeText={(t) =>
              emit({ longitude: t === "" ? null : parseFloat(t) })
            }
            placeholder="-70.6693"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            editable={!disabled}
          />
        </View>
      </View>

      {question.captureAddress && (
        <>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Dirección (opcional)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
              },
            ]}
            value={value?.address ?? ""}
            onChangeText={(t) => emit({ address: t })}
            placeholder="Calle, número, comuna..."
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  fieldWrap: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 14,
  },
});

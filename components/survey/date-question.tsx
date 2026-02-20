/**
 * 📅 DATE QUESTION — Hybrid date picker (native + manual steppers)
 * UX:
 * - "Hoy" quick-fill button (most common field use-case)
 * - Native OS date picker as primary selection method
 * - Day / Month / Year stepper rows for fine-tuning
 * - Large readable date display
 * - Works offline
 * - date-fns for reliable formatting
 */

import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DateQuestionProps {
  value: string | null; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  colors?: ReturnType<typeof useThemeColors>;
}

/** Months in Spanish */
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function DateQuestion({
  value,
  onChange,
  colors: colorsProp,
}: DateQuestionProps) {
  const themeColors = useThemeColors();
  const colors = colorsProp ?? themeColors;
  const [showPicker, setShowPicker] = useState(false);

  // Parse current value or default to null (no selection yet)
  const parsed = useMemo(() => {
    if (!value) return null;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
  }, [value]);

  const day = parsed?.getDate() ?? null;
  const month = parsed ? parsed.getMonth() + 1 : null; // 1-indexed
  const year = parsed?.getFullYear() ?? null;

  const hasValue = day !== null && month !== null && year !== null;

  const emit = useCallback(
    (d: number, m: number, y: number) => {
      // Clamp day to valid range for the month
      const maxDay = daysInMonth(m, y);
      const clampedDay = Math.min(d, maxDay);
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
      onChange(iso);
    },
    [onChange],
  );

  const setToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const now = new Date();
    emit(now.getDate(), now.getMonth() + 1, now.getFullYear());
  };

  // ── Native picker handlers ─────────────────────────────────────────────────

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    // Android auto-dismisses; iOS stays open
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (event.type === "dismissed") {
      setShowPicker(false);
      return;
    }
    if (selectedDate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      emit(
        selectedDate.getDate(),
        selectedDate.getMonth() + 1,
        selectedDate.getFullYear(),
      );
    }
  };

  const openPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  // ── Stepper handlers ───────────────────────────────────────────────────────

  const adjustDay = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!hasValue) {
      setToday();
      return;
    }
    const maxDay = daysInMonth(month!, year!);
    let newDay = day! + delta;
    if (newDay < 1) newDay = maxDay;
    if (newDay > maxDay) newDay = 1;
    emit(newDay, month!, year!);
  };

  const adjustMonth = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!hasValue) {
      setToday();
      return;
    }
    let newMonth = month! + delta;
    let newYear = year!;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    emit(day!, newMonth, newYear);
  };

  const adjustYear = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!hasValue) {
      setToday();
      return;
    }
    emit(day!, month!, year! + delta);
  };

  // Pretty display
  const displayText = parsed
    ? format(parsed, "EEEE d 'de' MMMM, yyyy", { locale: es })
    : "Sin fecha seleccionada";

  // The date to open the picker with (defaults to today if nothing selected)
  const pickerDate = parsed ?? new Date();

  return (
    <View style={styles.container}>
      {/* Quick "Hoy" button */}
      <TouchableOpacity
        style={[
          styles.todayBtn,
          { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
        onPress={setToday}
        activeOpacity={0.8}
        accessibilityLabel="Seleccionar fecha de hoy"
        accessibilityRole="button"
      >
        <Ionicons name="today-outline" size={20} color="#fff" />
        <Text style={styles.todayText}>Hoy</Text>
      </TouchableOpacity>

      {/* Date display */}
      <View
        style={[
          styles.displayCard,
          {
            backgroundColor: colors.surface,
            borderColor: hasValue ? colors.primary : colors.border,
            borderWidth: hasValue ? 2 : 1.5,
          },
        ]}
        accessibilityLabel={
          hasValue
            ? `Fecha seleccionada: ${displayText}`
            : "Sin fecha seleccionada"
        }
      >
        <Ionicons
          name="calendar"
          size={22}
          color={hasValue ? colors.primary : colors.textTertiary}
        />
        <Text
          style={[
            styles.displayText,
            {
              color: hasValue ? colors.text : colors.textTertiary,
              fontStyle: hasValue ? "normal" : "italic",
            },
          ]}
        >
          {displayText}
        </Text>
      </View>

      {/* Open native picker button */}
      <TouchableOpacity
        style={[
          styles.pickerBtn,
          {
            borderColor: colors.primary,
            backgroundColor: colors.primary + "10",
          },
        ]}
        onPress={openPicker}
        activeOpacity={0.7}
        accessibilityLabel={hasValue ? "Cambiar fecha" : "Seleccionar fecha"}
        accessibilityRole="button"
      >
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <Text style={[styles.pickerBtnText, { color: colors.primary }]}>
          {hasValue ? "Cambiar fecha" : "Seleccionar fecha"}
        </Text>
      </TouchableOpacity>

      {/* Native DateTimePicker */}
      {showPicker && (
        <View>
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handlePickerChange}
            locale="es-ES"
            maximumDate={new Date(2100, 0, 1)}
            minimumDate={new Date(1900, 0, 1)}
          />
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={closePicker}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Listo</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Fine-tune steppers (collapsed when picker is shown) */}
      {!showPicker && hasValue && (
        <View style={styles.steppersContainer}>
          <Text style={[styles.steppersHint, { color: colors.textTertiary }]}>
            Ajuste rápido
          </Text>
          <StepperRow
            label="Día"
            value={String(day!)}
            onDecrement={() => adjustDay(-1)}
            onIncrement={() => adjustDay(1)}
            colors={colors}
          />
          <StepperRow
            label="Mes"
            value={MONTHS[month! - 1]}
            onDecrement={() => adjustMonth(-1)}
            onIncrement={() => adjustMonth(1)}
            colors={colors}
          />
          <StepperRow
            label="Año"
            value={String(year!)}
            onDecrement={() => adjustYear(-1)}
            onIncrement={() => adjustYear(1)}
            colors={colors}
          />
        </View>
      )}
    </View>
  );
}

// ── Reusable stepper row ──────────────────────────────────────────────────────

function StepperRow({
  label,
  value,
  onDecrement,
  onIncrement,
  colors,
}: {
  label: string;
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      style={[
        styles.stepperRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.stepperLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          onPress={onDecrement}
          style={styles.stepperBtn}
          activeOpacity={0.6}
          hitSlop={10}
          accessibilityLabel={`Disminuir ${label}`}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.stepperValue, { color: colors.text }]}>
          {value}
        </Text>
        <TouchableOpacity
          onPress={onIncrement}
          style={styles.stepperBtn}
          activeOpacity={0.6}
          hitSlop={10}
          accessibilityLabel={`Aumentar ${label}`}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  todayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  displayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
  },
  displayText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  pickerBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  doneBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  steppersContainer: {
    gap: 6,
    marginTop: 4,
  },
  steppersHint: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: "600",
    width: 40,
  },
  stepperControls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: "700",
    minWidth: 100,
    textAlign: "center",
  },
});

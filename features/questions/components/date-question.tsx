/**
 * DateQuestion — custom wheel-based date/time picker
 * Pure React Native, no external dependencies
 */
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type {
  DateTimeQuestion as DateTimeQ,
  QuestionAnswer,
} from "../types/question-base.types";
import { QuestionType } from "../types/question-types.enum";

interface Props {
  question: DateTimeQ;
  value?: string; // ISO date string
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

// Build arrays for the wheel columns
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from(
  { length: 100 },
  (_, i) => new Date().getFullYear() - 99 + i,
).reverse();
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const ITEM_HEIGHT = 44;

const WheelColumn = React.memo(function WheelColumn<T extends number>({
  data,
  selected,
  onSelect,
  formatFn,
  colors,
}: {
  data: T[];
  selected: T;
  onSelect: (v: T) => void;
  formatFn?: (v: T) => string;
  colors: any;
}) {
  const ref = useRef<FlatList>(null);
  const selectedIndex = data.indexOf(selected);

  const scrollToSelected = useCallback(() => {
    if (ref.current && selectedIndex >= 0) {
      ref.current.scrollToIndex({
        index: selectedIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [selectedIndex]);

  const renderItem = useCallback(
    ({ item }: { item: T }) => {
      const isSelected = item === selected;
      return (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(item);
          }}
          style={[styles.wheelItem, { height: ITEM_HEIGHT }]}
        >
          <Text
            style={[
              styles.wheelText,
              {
                color: isSelected ? colors.primary : colors.text,
                fontWeight: isSelected ? "700" : "400",
                fontSize: isSelected ? 18 : 15,
              },
            ]}
          >
            {formatFn ? formatFn(item) : String(item).padStart(2, "0")}
          </Text>
        </Pressable>
      );
    },
    [selected, onSelect, colors.primary, colors.text, formatFn],
  );

  return (
    <View style={{ flex: 1, height: ITEM_HEIGHT * 5 }}>
      {/* highlight overlay */}
      <View
        pointerEvents="none"
        style={[
          styles.wheelHighlight,
          { borderColor: colors.primary, top: ITEM_HEIGHT * 2 },
        ]}
      />
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(item) => String(item)}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onLayout={scrollToSelected}
        renderItem={renderItem}
      />
    </View>
  );
}) as <T extends number>(props: {
  data: T[];
  selected: T;
  onSelect: (v: T) => void;
  formatFn?: (v: T) => string;
  colors: any;
}) => React.ReactElement;

export function DateQuestion({
  question,
  value,
  onChange,
  disabled = false,
}: Props) {
  const colors = useThemeColors();
  const isTime = question.type === QuestionType.TIME;
  const isDateTime = question.type === QuestionType.DATETIME;
  const isDate = question.type === QuestionType.DATE;

  const now = new Date();
  const parsed = value ? new Date(value) : now;
  const base = isValid(parsed) ? parsed : now;

  const [day, setDay] = useState(base.getDate());
  const [month, setMonth] = useState(base.getMonth() + 1);
  const [year, setYear] = useState(base.getFullYear());
  const [hour, setHour] = useState(base.getHours());
  const [minute, setMinute] = useState(base.getMinutes());
  const [open, setOpen] = useState(false);

  const buildISO = (
    d: number,
    mo: number,
    y: number,
    h: number,
    mi: number,
  ): string => {
    const date = new Date(y, mo - 1, d, h, mi, 0);
    return date.toISOString();
  };

  const confirm = () => {
    const iso = buildISO(day, month, year, hour, minute);
    onChange({ questionId: question.id, value: iso, answeredAt: Date.now() });
    setOpen(false);
  };

  const displayValue = () => {
    if (!value) return question.placeholder ?? "Toca para seleccionar";
    const d = new Date(value);
    if (!isValid(d)) return "Fecha inválida";
    if (isTime) return format(d, "HH:mm");
    if (isDate) return format(d, "d 'de' MMMM yyyy", { locale: es });
    return format(d, "d/MM/yyyy HH:mm");
  };

  const MONTH_NAMES = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setOpen(true);
          }
        }}
        activeOpacity={0.8}
        style={[
          styles.trigger,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        <Ionicons
          name={isTime ? "time-outline" : "calendar-outline"}
          size={20}
          color={value ? colors.primary : colors.textSecondary}
        />
        <Text
          style={[
            styles.triggerText,
            { color: value ? colors.text : colors.textSecondary },
          ]}
        >
          {displayValue()}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View
              style={[styles.sheetHeader, { borderBottomColor: colors.border }]}
            >
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text
                  style={[styles.sheetAction, { color: colors.textSecondary }]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {isTime
                  ? "Seleccionar hora"
                  : isDate
                    ? "Seleccionar fecha"
                    : "Fecha y hora"}
              </Text>
              <TouchableOpacity onPress={confirm}>
                <Text
                  style={[
                    styles.sheetAction,
                    { color: colors.primary, fontWeight: "700" },
                  ]}
                >
                  Listo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Wheels */}
            <View style={styles.wheels}>
              {!isTime && (
                <>
                  <WheelColumn
                    data={DAYS}
                    selected={day}
                    onSelect={setDay}
                    colors={colors}
                  />
                  <WheelColumn
                    data={MONTHS}
                    selected={month}
                    onSelect={setMonth}
                    formatFn={(m) => MONTH_NAMES[m - 1]}
                    colors={colors}
                  />
                  <WheelColumn
                    data={YEARS}
                    selected={year}
                    onSelect={setYear}
                    colors={colors}
                  />
                </>
              )}
              {(isTime || isDateTime) && (
                <>
                  <WheelColumn
                    data={HOURS}
                    selected={hour}
                    onSelect={setHour}
                    colors={colors}
                  />
                  <View style={styles.colon}>
                    <Text style={[styles.colonText, { color: colors.text }]}>
                      :
                    </Text>
                  </View>
                  <WheelColumn
                    data={MINUTES}
                    selected={minute}
                    onSelect={setMinute}
                    colors={colors}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sheetAction: {
    fontSize: 16,
  },
  wheels: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  wheelItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  wheelText: {
    textAlign: "center",
  },
  wheelHighlight: {
    position: "absolute",
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  colon: {
    width: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colonText: {
    fontSize: 20,
    fontWeight: "700",
  },
});

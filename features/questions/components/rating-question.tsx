/**
 * RatingQuestion — star/heart/thumb rating + numeric scale
 */
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type {
  QuestionAnswer,
  RatingQuestion as RatingQ,
  SliderQuestion as SliderQ,
} from "../types/question-base.types";

// ─── Star/Heart/Thumb Rating ─────────────────────────────────────────────────

interface RatingProps {
  question: RatingQ;
  value?: number;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

const ICONS: Record<string, { filled: any; empty: any; color: string }> = {
  star: { filled: "star", empty: "star-outline", color: "#f59e0b" },
  heart: { filled: "heart", empty: "heart-outline", color: "#ef4444" },
  thumb: { filled: "thumbs-up", empty: "thumbs-up-outline", color: "#3b82f6" },
};

export function RatingQuestion({
  question,
  value = 0,
  onChange,
  disabled = false,
}: RatingProps) {
  const colors = useThemeColors();
  const max = question.maxRating ?? 5;
  const iconKey = question.icon ?? "star";
  const icon = ICONS[iconKey] ?? ICONS.star;

  const select = (rating: number) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // tap same → deselect
    const next = value === rating ? 0 : rating;
    onChange({ questionId: question.id, value: next, answeredAt: Date.now() });
  };

  return (
    <View style={styles.container}>
      <View style={styles.stars}>
        {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
          <TouchableOpacity
            key={rating}
            onPress={() => select(rating)}
            disabled={disabled}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Ionicons
              name={(value ?? 0) >= rating ? icon.filled : icon.empty}
              size={max <= 5 ? 38 : 30}
              color={(value ?? 0) >= rating ? icon.color : colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
      {(value ?? 0) > 0 && (
        <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
          {value} / {max}
        </Text>
      )}
    </View>
  );
}

// ─── Scale (labeled numeric scale) ───────────────────────────────────────────

interface ScaleProps {
  question: SliderQ; // reuse SliderQ shape for SCALE type
  value?: number;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function ScaleQuestion({
  question,
  value,
  onChange,
  disabled = false,
}: ScaleProps) {
  const colors = useThemeColors();
  const min = question.min ?? 0;
  const max = question.max ?? 10;
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const select = (v: number) => {
    if (disabled) return;
    Haptics.selectionAsync();
    onChange({ questionId: question.id, value: v, answeredAt: Date.now() });
  };

  return (
    <View>
      <View style={styles.scaleRow}>
        {items.map((v) => {
          const selected = value === v;
          return (
            <TouchableOpacity
              key={v}
              onPress={() => select(v)}
              disabled={disabled}
              activeOpacity={0.75}
              style={[
                styles.scaleItem,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.scaleItemText,
                  { color: selected ? "#fff" : colors.text },
                ]}
              >
                {v}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  scaleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  scaleItem: {
    minWidth: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  scaleItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

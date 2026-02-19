/**
 * SignatureQuestion — finger-drawn signature using PanResponder.
 * Uses rotated View segments to draw lines (no external dependencies).
 */
import { useThemeColors } from "@/contexts/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type {
  QuestionAnswer,
  SignatureQuestion as SignatureQ,
} from "../types/question-base.types";

interface Point {
  x: number;
  y: number;
}
interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function pointsToSegments(points: Point[]): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    segs.push({
      x1: points[i].x,
      y1: points[i].y,
      x2: points[i + 1].x,
      y2: points[i + 1].y,
    });
  }
  return segs;
}

function SegmentLine({ seg, color }: { seg: Segment; color: string }) {
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const cx = (seg.x1 + seg.x2) / 2;
  const cy = (seg.y1 + seg.y2) / 2;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: cx - length / 2,
        top: cy - 1.5,
        width: length,
        height: 3,
        backgroundColor: color,
        borderRadius: 1.5,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

interface Props {
  question: SignatureQ;
  value?: string | null;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

export function SignatureQuestion({
  question,
  value,
  onChange,
  disabled = false,
}: Props) {
  const colors = useThemeColors();
  const [allSegments, setAllSegments] = useState<Segment[]>([]);
  const [liveSegments, setLiveSegments] = useState<Segment[]>([]);
  const currentPoints = useRef<Point[]>([]);
  const hasDrawn = allSegments.length > 0 || liveSegments.length > 0;

  const serialize = (segs: Segment[]) => JSON.stringify(segs);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const { locationX: x, locationY: y } = e.nativeEvent;
        currentPoints.current = [{ x, y }];
        setLiveSegments([]);
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        currentPoints.current.push({ x, y });
        setLiveSegments(pointsToSegments(currentPoints.current));
      },
      onPanResponderRelease: () => {
        const newSegs = pointsToSegments(currentPoints.current);
        setAllSegments((prev) => {
          const next = [...prev, ...newSegs];
          onChange({
            questionId: question.id,
            value: serialize(next),
            answeredAt: Date.now(),
          });
          return next;
        });
        setLiveSegments([]);
        currentPoints.current = [];
      },
    }),
  ).current;

  const clear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAllSegments([]);
    setLiveSegments([]);
    currentPoints.current = [];
    onChange({ questionId: question.id, value: null, answeredAt: Date.now() });
  };

  return (
    <View style={styles.container}>
      <View
        {...panResponder.panHandlers}
        style={[
          styles.canvas,
          {
            backgroundColor: colors.surface,
            borderColor: hasDrawn ? colors.primary : colors.border,
          },
        ]}
      >
        {!hasDrawn && (
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>
            Firma aqui con tu dedo
          </Text>
        )}
        {allSegments.map((seg, i) => (
          <SegmentLine key={`a-${i}`} seg={seg} color={colors.text} />
        ))}
        {liveSegments.map((seg, i) => (
          <SegmentLine key={`l-${i}`} seg={seg} color={colors.text} />
        ))}
      </View>

      <View style={styles.actions}>
        {hasDrawn && !disabled && (
          <TouchableOpacity
            onPress={clear}
            activeOpacity={0.8}
            style={[
              styles.clearBtn,
              {
                borderColor: colors.error,
                backgroundColor: colors.error + "12",
              },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.clearLabel, { color: colors.error }]}>
              Limpiar
            </Text>
          </TouchableOpacity>
        )}
        {hasDrawn && (
          <View style={styles.confirmedBadge}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={colors.success}
            />
            <Text style={[styles.confirmedText, { color: colors.success }]}>
              Firma capturada
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  canvas: {
    height: 180,
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: { fontSize: 14, fontStyle: "italic" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  clearLabel: { fontSize: 13, fontWeight: "600" },
  confirmedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  confirmedText: { fontSize: 13, fontWeight: "500" },
});

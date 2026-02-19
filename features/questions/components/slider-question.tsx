/**
 * SliderQuestion — custom slider using PanResponder + Animated
 * No external slider package required.
 */
import { useThemeColors } from "@/contexts/theme-context";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { SliderQuestion as SliderQ, QuestionAnswer } from "../types/question-base.types";

interface Props {
  question: SliderQ;
  value?: number;
  onChange: (answer: QuestionAnswer) => void;
  disabled?: boolean;
}

const THUMB_SIZE = 28;

export function SliderQuestion({ question, value, onChange, disabled = false }: Props) {
  const colors = useThemeColors();
  const min = question.min ?? 0;
  const max = question.max ?? 100;
  const step = question.step ?? 1;

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const snap = (v: number) => Math.round((v - min) / step) * step + min;

  const [trackWidth, setTrackWidth] = useState(0);
  const [current, setCurrent] = useState<number>(clamp(value ?? min));
  const posX = useRef(new Animated.Value(0)).current;
  const lastEmitted = useRef<number | null>(null);

  // position → value
  const posToValue = (pos: number) => {
    if (trackWidth === 0) return min;
    const ratio = Math.min(1, Math.max(0, pos / trackWidth));
    return snap(min + ratio * (max - min));
  };

  // value → position
  const valueToPos = (v: number) => {
    if (trackWidth === 0) return 0;
    return ((clamp(v) - min) / (max - min)) * trackWidth;
  };

  // Sync animated position when external value or trackWidth changes
  useEffect(() => {
    const _min = question.min ?? 0;
    const _max = question.max ?? 100;
    const v = Math.min(_max, Math.max(_min, value ?? _min));
    setCurrent(v);
    const pos = trackWidth === 0 ? 0 : ((_max === _min ? 0 : (v - _min) / (_max - _min)) * trackWidth);
    posX.setValue(pos);
  }, [value, trackWidth, question.min, question.max, posX]); // posX is a stable ref

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gs) => {
        // Use total gesture offset from base position
        const pos = Math.min(
          trackWidth,
          Math.max(0, (posX as any)._startingValue + gs.dx),
        );
        posX.setValue(pos);
        const v = posToValue(pos);
        setCurrent(v);
        if (lastEmitted.current !== v) {
          lastEmitted.current = v;
          // throttle haptics
        }
      },
      onPanResponderRelease: (_, gs) => {
        const pos = Math.min(
          trackWidth,
          Math.max(
            0,
            (posX as any)._startingValue != null
              ? (posX as any)._startingValue + gs.dx
              : 0,
          ),
        );
        const v = posToValue(pos);
        const snapped = snap(v);
        setCurrent(snapped);
        posX.setValue(valueToPos(snapped));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onChange({ questionId: question.id, value: snapped, answeredAt: Date.now() });
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width - THUMB_SIZE;
    setTrackWidth(w);
  };

  const thumbLeft = posX.interpolate({
    inputRange: [0, Math.max(trackWidth, 1)],
    outputRange: [0, Math.max(trackWidth, 1)],
    extrapolate: "clamp",
  });

  const fillWidth = posX.interpolate({
    inputRange: [0, Math.max(trackWidth, 1)],
    outputRange: [0, Math.max(trackWidth, 1)],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.container, disabled && { opacity: 0.5 }]}>
      {/* Value label */}
      {question.showValue !== false && (
        <View style={styles.valueRow}>
          <Text style={[styles.minMax, { color: colors.textSecondary }]}>{min}</Text>
          <View style={[styles.valueBadge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.valueText, { color: colors.primary }]}>{current}</Text>
          </View>
          <Text style={[styles.minMax, { color: colors.textSecondary }]}>{max}</Text>
        </View>
      )}

      {/* Track */}
      <View onLayout={onLayout} style={styles.trackWrapper}>
        {/* Background track */}
        <View style={[styles.track, { backgroundColor: colors.border }]} />
        {/* Fill track */}
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              width: fillWidth,
              left: THUMB_SIZE / 2,
            },
          ]}
        />
        {/* Thumb */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.thumb,
            {
              backgroundColor: colors.primary,
              left: thumbLeft,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  minMax: {
    fontSize: 13,
    fontWeight: "500",
  },
  valueBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  valueText: {
    fontSize: 16,
    fontWeight: "700",
  },
  trackWrapper: {
    height: THUMB_SIZE,
    justifyContent: "center",
    paddingHorizontal: THUMB_SIZE / 2,
  },
  track: {
    position: "absolute",
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: 6,
    borderRadius: 3,
  },
  fill: {
    position: "absolute",
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

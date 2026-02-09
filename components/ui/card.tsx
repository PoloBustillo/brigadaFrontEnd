import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: "none" | "small" | "medium" | "large";
}

/**
 * Componente de tarjeta reutilizable
 */
export function Card({
  children,
  padding = "medium",
  style,
  ...props
}: CardProps) {
  return (
    <View style={[styles.card, styles[`${padding}Padding`], style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: 12,
  },
  mediumPadding: {
    padding: 16,
  },
  largePadding: {
    padding: 24,
  },
});

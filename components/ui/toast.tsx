/**
 * Toast Notification Component
 * Alertas modernas y profesionales para reemplazar Alert nativo
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Toast, { ToastConfigParams } from "react-native-toast-message";

/**
 * Toast Custom con Gradiente y Animaciones
 */
const CustomToast = ({
  type,
  text1,
  text2,
  props,
}: {
  type: "success" | "error" | "info" | "warning";
  text1?: string;
  text2?: string;
  props: ToastConfigParams<any>;
}) => {
  const config = {
    success: {
      colors: ["#4ADE80", "#22C55E"] as const, // Verde más claro y vibrante
      icon: "checkmark-circle" as const,
      iconColor: "#FFFFFF",
    },
    error: {
      colors: ["#FF5252", "#D32F2F"] as const,
      icon: "close-circle" as const,
      iconColor: "#FFFFFF",
    },
    info: {
      colors: ["#60A5FA", "#3B82F6"] as const, // Azul más claro
      icon: "information-circle" as const,
      iconColor: "#FFFFFF",
    },
    warning: {
      colors: ["#FBBF24", "#F59E0B"] as const, // Amarillo más vibrante
      icon: "warning" as const,
      iconColor: "#FFFFFF",
    },
  };

  const { colors, icon, iconColor } = config[type];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.customToast}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        {text1 && <Text style={styles.text1}>{text1}</Text>}
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </LinearGradient>
  );
};

/**
 * Configuración de estilos personalizados para Toast
 */
export const toastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <CustomToast
      type="success"
      text1={props.text1}
      text2={props.text2}
      props={props}
    />
  ),
  error: (props: ToastConfigParams<any>) => (
    <CustomToast
      type="error"
      text1={props.text1}
      text2={props.text2}
      props={props}
    />
  ),
  info: (props: ToastConfigParams<any>) => (
    <CustomToast
      type="info"
      text1={props.text1}
      text2={props.text2}
      props={props}
    />
  ),
  warning: (props: ToastConfigParams<any>) => (
    <CustomToast
      type="warning"
      text1={props.text1}
      text2={props.text2}
      props={props}
    />
  ),
};

/**
 * Estilos del Toast Custom
 */
const styles = StyleSheet.create({
  customToast: {
    width: "90%",
    minHeight: 80,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    marginHorizontal: "5%",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  text1: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  text2: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 20,
  },
});

/**
 * Helper functions para mostrar toasts
 */
export const showToast = {
  success: (title: string, message?: string) => {
    Toast.show({
      type: "success",
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  error: (title: string, message?: string) => {
    Toast.show({
      type: "error",
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 4000,
      topOffset: 60,
    });
  },

  info: (title: string, message?: string) => {
    Toast.show({
      type: "info",
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 3000,
      topOffset: 60,
    });
  },

  warning: (title: string, message?: string) => {
    Toast.show({
      type: "warning",
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 3500,
      topOffset: 60,
    });
  },
};

export default Toast;

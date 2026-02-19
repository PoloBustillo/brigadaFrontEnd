/**
 * Welcome Screen - Brigada Digital
 * Diseño minimalista con logo central y características destacadas
 */

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { typography } from "@/constants/typography";
import { useThemeColors } from "@/contexts/theme-context";

// Background decorative elements - Distribuidos estratégicamente con mayor presencia
const DECORATIVE_ELEMENTS = [
  // Esquinas superiores - lejos del centro
  {
    id: 1,
    icon: "document-text-outline",
    top: 40,
    left: 15,
    size: 56,
    opacity: 0.3,
    rotate: -15,
  },
  {
    id: 2,
    icon: "calendar-outline",
    top: 50,
    right: 20,
    size: 60,
    opacity: 0.32,
    rotate: 12,
  },

  // Laterales medios - espaciados del centro
  {
    id: 3,
    icon: "bar-chart-outline",
    top: 200,
    left: 10,
    size: 52,
    opacity: 0.28,
    rotate: -8,
  },
  {
    id: 4,
    icon: "star-outline",
    top: 220,
    right: 15,
    size: 54,
    opacity: 0.29,
    rotate: 20,
  },

  // Laterales inferiores - antes de las features
  {
    id: 5,
    icon: "pie-chart-outline",
    top: 400,
    left: 20,
    size: 58,
    opacity: 0.31,
    rotate: 15,
  },
  {
    id: 6,
    icon: "notifications-outline",
    top: 420,
    right: 18,
    size: 56,
    opacity: 0.3,
    rotate: -10,
  },

  // Esquinas inferiores - debajo del contenido
  {
    id: 7,
    icon: "folder-outline",
    top: 680,
    left: 25,
    size: 52,
    opacity: 0.28,
    rotate: 8,
  },
  {
    id: 8,
    icon: "settings-outline",
    top: 700,
    right: 22,
    size: 54,
    opacity: 0.29,
    rotate: -12,
  },
];

// Decorative Background Element
interface DecorativeElementProps {
  icon: string;
  top: number;
  left?: number;
  right?: number;
  size: number;
  opacity: number;
  rotate: number;
  delay: number;
  color: string;
}

function DecorativeElement({
  icon,
  top,
  left,
  right,
  size,
  opacity,
  rotate,
  delay,
  color,
}: DecorativeElementProps) {
  const elementOpacity = useSharedValue(0);
  const elementRotate = useSharedValue(rotate);
  const scale = useSharedValue(0.7);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Fade in and scale up with bounce
    setTimeout(() => {
      elementOpacity.value = withTiming(opacity, { duration: 1200 });
      scale.value = withSpring(1, { damping: 10, stiffness: 80 });
    }, delay);

    // Combined rotation and floating animation
    setTimeout(() => {
      // Rotation animation
      elementRotate.value = withRepeat(
        withSequence(
          withTiming(rotate + 8, { duration: 3500 }),
          withTiming(rotate - 8, { duration: 3500 }),
        ),
        -1,
        true,
      );

      // Floating animation (up and down)
      translateY.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 3000 }),
          withTiming(0, { duration: 3000 }),
        ),
        -1,
        true,
      );
    }, delay + 800);
  }, [
    delay,
    elementOpacity,
    scale,
    elementRotate,
    translateY,
    opacity,
    rotate,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: elementOpacity.value,
    transform: [
      { scale: scale.value },
      { rotate: `${elementRotate.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  const positionStyle = {
    top,
    ...(left !== undefined ? { left } : {}),
    ...(right !== undefined ? { right } : {}),
  };

  return (
    <Animated.View
      style={[styles.decorativeElement, positionStyle, animatedStyle]}
    >
      <Ionicons name={icon as any} size={size} color={color} />
    </Animated.View>
  );
}

// Feature Item Component
interface FeatureItemProps {
  icon: string;
  text: string;
  iconColor: string;
  textColor: string;
}

function FeatureItem({ icon, text, iconColor, textColor }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={[styles.featureText, { color: textColor }]}>{text}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [buttonPressed, setButtonPressed] = useState(false);

  const buttonScale = useSharedValue(1);
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(40);

  useEffect(() => {
    // Logo entrance
    setTimeout(() => {
      logoScale.value = withSpring(1, { damping: 14, stiffness: 100 });
      logoOpacity.value = withTiming(1, { duration: 800 });
    }, 300);

    // Content entrance animation
    setTimeout(() => {
      contentOpacity.value = withTiming(1, { duration: 700 });
      contentTranslateY.value = withSpring(0, { damping: 15 });
    }, 1200);
  }, [logoScale, logoOpacity, contentOpacity, contentTranslateY]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const handleGetStarted = () => {
    setButtonPressed(true);
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 10 }),
    );

    // Navigate to login after animation
    setTimeout(() => {
      router.push("/(auth)/login-enhanced" as any);
    }, 300);
  };

  const handleActivation = () => {
    router.push("/(auth)/activation" as any);
  };

  // Crear gradiente dinámico desde el color primario
  const gradientColors = [colors.primary, colors.primaryDark, colors.primary];

  const decorativeColor = `${colors.background}99`; // background con 60% opacity

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative Background Elements */}
        {DECORATIVE_ELEMENTS.map((element, index) => (
          <DecorativeElement
            key={element.id}
            icon={element.icon}
            top={element.top}
            left={element.left}
            right={element.right}
            size={element.size}
            opacity={element.opacity}
            rotate={element.rotate}
            delay={200 + index * 100}
            color={decorativeColor}
          />
        ))}

        {/* Main Content Container */}
        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
              <View
                style={[
                  styles.logoBadge,
                  { backgroundColor: colors.background },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={64}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.brandName, { color: colors.background }]}>
                Brigada
              </Text>
              <Text
                style={[styles.brandSubtitle, { color: colors.background }]}
              >
                Digital
              </Text>
            </Animated.View>
          </View>

          {/* Features Section */}
          <Animated.View style={[styles.featuresSection, contentAnimatedStyle]}>
            <View style={styles.featuresGrid}>
              <FeatureItem
                icon="clipboard-outline"
                text="Digitaliza encuestas"
                iconColor="#ffffff"
                textColor={colors.background}
              />
              <FeatureItem
                icon="checkmark-circle-outline"
                text="Valida información"
                iconColor="#ffffff"
                textColor={colors.background}
              />
              <FeatureItem
                icon="sync-outline"
                text="Sincroniza en tiempo real"
                iconColor="#ffffff"
                textColor={colors.background}
              />
              <FeatureItem
                icon="cloud-offline-outline"
                text="Funciona sin internet"
                iconColor="#ffffff"
                textColor={colors.background}
              />
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={[
                styles.ctaButtonContainer,
                buttonPressed && styles.ctaButtonPressed,
              ]}
              onPress={handleGetStarted}
              activeOpacity={0.9}
            >
              <View
                style={[
                  styles.ctaButton,
                  { backgroundColor: colors.background },
                ]}
              >
                <Text style={[styles.ctaButtonText, { color: colors.primary }]}>
                  Iniciar Sesión
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={22}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>

            {/* Activation Button */}
            <TouchableOpacity
              style={[
                styles.activationButton,
                { borderColor: `${colors.background}66` },
              ]}
              onPress={handleActivation}
              activeOpacity={0.8}
            >
              <Ionicons
                name="key-outline"
                size={20}
                color={colors.background}
              />
              <Text
                style={[
                  styles.activationButtonText,
                  { color: colors.background },
                ]}
              >
                Tengo un código de activación
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // Decorative Elements - Fondo
  decorativeElement: {
    position: "absolute",
    zIndex: 1,
  },

  // Main Content Container
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 40,
    paddingHorizontal: 28,
    zIndex: 10,
  },

  // Logo Section
  logoSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  logoWrapper: {
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
    paddingHorizontal: 20,
  },
  logoBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  brandName: {
    fontFamily: "Pacifico",
    fontSize: 42,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  brandSubtitle: {
    fontSize: 18,
    fontWeight: "300",
    letterSpacing: 4,
    marginTop: 4,
  },

  // Features Section
  featuresSection: {
    paddingBottom: 12,
  },
  featuresGrid: {
    gap: 10,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  featureText: {
    ...typography.bodySmall,
    fontWeight: "600",
    flex: 1,
    fontSize: 15,
  },

  // CTA Button
  ctaButtonContainer: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 16,
  },
  ctaButton: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  ctaButtonText: {
    ...typography.button,
    letterSpacing: 1,
    fontSize: 18,
    fontWeight: "700",
  },

  // Activation Button
  activationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  activationButtonText: {
    ...typography.bodySmall,
    fontWeight: "600",
    fontSize: 14,
  },
});

/**
 * Profile Screen - Brigada Digital
 * User profile dashboard (shown when session exists)
 * Based on reference image design
 */

import { Card } from "@/components/ui/card";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  icon: string;
  color: string;
}

const MOCK_EXPERIENCE: ExperienceItem[] = [
  {
    id: "1",
    company: "Airbnb",
    role: "Middle product designer",
    period: "2024 - Present",
    icon: "🏢",
    color: "#FF5A5F",
  },
  {
    id: "2",
    company: "Freelance",
    role: "Design specialist",
    period: "2022 - 2024",
    icon: "💼",
    color: "#6C7A89",
  },
];

export default function ProfileScreen() {
  const router = useRouter();

  const handleEditProfile = () => {
    console.log("Edit profile");
  };

  const handleDownloadCV = () => {
    console.log("Download CV");
  };

  const handleContact = () => {
    console.log("Contact");
  };

  const handleExperienceMenu = (id: string) => {
    console.log("Experience menu:", id);
  };

  const handleThemeSettings = () => {
    router.push("/(tabs)/theme-settings" as any);
  };

  const handleLogout = () => {
    // Clear session
    // await AsyncStorage.removeItem('userToken');
    router.replace("/(auth)/welcome" as any);
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#5B6B8A", "#6B7A9A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My profile</Text>
          <TouchableOpacity
            onPress={handleEditProfile}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card padding="large" style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={60} color="#FF1B8D" />
            </View>
          </View>

          {/* Name and Experience */}
          <Text style={styles.name}>Theresa Peña</Text>
          <Text style={styles.experience}>4 years of experience</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownloadCV}
            >
              <Text style={styles.actionButtonText}>CV • 2.3 Mb</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={handleContact}
            >
              <Text style={styles.actionButtonSecondaryText}>Contact</Text>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>
              Product designer with a passion for creating user-friendly and
              visually appealing digital experiences. Skilled in UX/UI and user
              testing.
            </Text>
          </View>

          {/* Work Experience Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Work experience</Text>

            {MOCK_EXPERIENCE.map((item) => (
              <Card
                key={item.id}
                padding="medium"
                style={styles.experienceCard}
              >
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceLeft}>
                    <View
                      style={[
                        styles.companyIcon,
                        { backgroundColor: item.color },
                      ]}
                    >
                      <Text style={styles.companyIconText}>{item.icon}</Text>
                    </View>
                    <View style={styles.experienceInfo}>
                      <Text style={styles.companyName}>{item.company}</Text>
                      <Text style={styles.period}>{item.period}</Text>
                      <Text style={styles.role}>{item.role}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleExperienceMenu(item.id)}
                    style={styles.menuButton}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={20}
                      color="#6C7A89"
                    />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>

          {/* Theme Settings Button */}
          <TouchableOpacity
            style={styles.themeButton}
            onPress={handleThemeSettings}
          >
            <Ionicons name="color-palette" size={20} color="#FF1B8D" />
            <Text style={styles.themeButtonText}>Personalización</Text>
            <Ionicons name="chevron-forward" size={20} color="#6C7A89" />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#6C7A89" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="search" size={24} color="#6C7A89" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bookmark" size={24} color="#6C7A89" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="person" size={24} color="#FF1B8D" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 80,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    marginTop: -60,
    marginHorizontal: 24,
    borderRadius: 24,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFF0F7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 4,
  },
  experience: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6C7A89",
    textAlign: "center",
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#1A1A2E",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionButtonSecondary: {
    flex: 1,
    height: 48,
    backgroundColor: "#1A1A2E",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6C7A89",
    lineHeight: 22,
  },
  experienceCard: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  experienceLeft: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  companyIconText: {
    fontSize: 24,
  },
  experienceInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A2E",
    marginBottom: 2,
  },
  period: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6C7A89",
    marginBottom: 2,
  },
  role: {
    fontSize: 14,
    fontWeight: "400",
    color: "#1A1A2E",
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  themeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#FFF5F8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE8F0",
  },
  themeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF1B8D",
    flex: 1,
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F44336",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E0E4E8",
    paddingBottom: 20,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navItemActive: {
    // Active state
  },
  navLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF1B8D",
  },
});

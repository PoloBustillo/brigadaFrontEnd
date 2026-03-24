import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { getAdminSurveys } from "@/lib/api/admin";
import {
  BrigadistaForAssignment,
  createAssignment,
  getAvailableBrigadistas,
  inviteBrigadista,
  WhitelistCreatePayload,
} from "@/lib/api/assignments";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Step = "select-survey" | "select-brigadista" | "confirm";
type Mode = "assign" | "invite";

interface AdminSurvey {
  id: number;
  title: string;
  description?: string | null;
  versions?: unknown[];
}

interface SurveySelection extends AdminSurvey {
  selected: boolean;
}

interface BrigadistaSelection extends BrigadistaForAssignment {
  selected: boolean;
}

interface InviteFormData {
  email: string;
  full_name: string;
  phone: string;
}

export default function AssignBrigadistasScreen() {
  const router = useRouter();

  // Mode: assign existing users or invite new ones
  const [mode, setMode] = useState<Mode>("assign");

  // Step management
  const [step, setStep] = useState<Step>("select-survey");

  // Survey selection
  const [surveys, setSurveys] = useState<SurveySelection[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveySelection | null>(
    null,
  );

  // Brigadista selection (for assign mode)
  const [brigadistas, setBrigadistas] = useState<BrigadistaSelection[]>([]);
  const [brigadistasLoading, setBrigadistasLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedBrigadistas, setSelectedBrigadistas] = useState<
    BrigadistaSelection[]
  >([]);

  // Invite form (for invite mode)
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: "",
    full_name: "",
    phone: "",
  });

  // Creating assignment/invite
  const [creating, setCreating] = useState(false);

  // Load available surveys
  useEffect(() => {
    const loadSurveys = async () => {
      try {
        setSurveysLoading(true);
        const data = await getAdminSurveys();
        setSurveys(
          (data as AdminSurvey[]).map((s: AdminSurvey) => ({
            ...s,
            selected: false,
          })),
        );
      } catch (err) {
        console.error("Error loading surveys:", err);
        Alert.alert("Error", "No se pudieron cargar las encuestas");
      } finally {
        setSurveysLoading(false);
      }
    };
    loadSurveys();
  }, []);

  // Load surveysas when step changes to select-brigadista
  useEffect(() => {
    if (step === "select-brigadista" && brigadistas.length === 0) {
      loadBrigadistas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const loadBrigadistas = useCallback(async () => {
    try {
      setBrigadistasLoading(true);
      // Load all brigadistas without search filter (search happens locally below)
      const data = await getAvailableBrigadistas(undefined, 0, 100);
      setBrigadistas(
        data.map((b) => ({
          ...b,
          selected: false,
        })),
      );
    } catch (err) {
      console.error("Error loading brigadistas:", err);
      Alert.alert("Error", "No se pudieron cargar los brigadistas");
    } finally {
      setBrigadistasLoading(false);
    }
  }, []);

  // Filter brigadistas by search
  const filteredBrigadistas = useMemo(() => {
    if (!searchText) return brigadistas;
    return brigadistas.filter(
      (b) =>
        b.full_name.toLowerCase().includes(searchText.toLowerCase()) ||
        b.email.toLowerCase().includes(searchText.toLowerCase()),
    );
  }, [brigadistas, searchText]);

  const handleToggleBrigadista = (brigadista: BrigadistaSelection) => {
    setSelectedBrigadistas((current) => {
      const isSelected = current.some((b) => b.id === brigadista.id);
      if (isSelected) {
        return current.filter((b) => b.id !== brigadista.id);
      } else {
        return [...current, brigadista];
      }
    });
  };

  const handleConfirmAssignments = async () => {
    if (!selectedSurvey) return;

    setStep("confirm");
  };

  const handleCreateAssignments = async () => {
    if (!selectedSurvey || selectedBrigadistas.length === 0) {
      Alert.alert("Error", "Selecciona al menos un brigadista");
      return;
    }

    try {
      setCreating(true);
      const promises = selectedBrigadistas.map((b) =>
        createAssignment({
          user_id: b.id,
          survey_id: selectedSurvey.id,
        }),
      );
      await Promise.all(promises);

      Alert.alert(
        "Éxito",
        `Se asignaron ${selectedBrigadistas.length} brigadista(s) a la encuesta`,
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ],
      );
    } catch (err) {
      console.error("Error creating assignments:", err);
      Alert.alert("Error", "No se pudieron crear las asignaciones");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!selectedSurvey || !inviteForm.email || !inviteForm.full_name) {
      Alert.alert("Error", "Completa: email, nombre y selecciona una encuesta");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      Alert.alert("Error", "Email inválido");
      return;
    }

    try {
      setCreating(true);
      const payload: WhitelistCreatePayload = {
        identifier: inviteForm.email,
        identifier_type: "email",
        full_name: inviteForm.full_name,
        phone: inviteForm.phone || undefined,
        assigned_role: "brigadista",
        assigned_survey_id: selectedSurvey.id,
        notes: "Invitación desde app móvil",
      };
      await inviteBrigadista(payload);

      Alert.alert("Éxito", `Se invitó a ${inviteForm.full_name}`, [
        {
          text: "OK",
          onPress: () => {
            setInviteForm({ email: "", full_name: "", phone: "" });
            setSelectedSurvey(null);
            router.back();
          },
        },
      ]);
    } catch (err) {
      console.error("Error creating invite:", err);
      Alert.alert("Error", "No se pudo enviar la invitación");
    } finally {
      setCreating(false);
    }
  };

  // Step: Select Survey
  if (step === "select-survey") {
    return (
      <ThemedView style={styles.container}>
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === "assign" && styles.modeButtonActive,
            ]}
            onPress={() => {
              setMode("assign");
              setStep("select-survey");
              setInviteForm({ email: "", full_name: "", phone: "" });
            }}
          >
            <Ionicons
              name="person-add"
              size={18}
              color={mode === "assign" ? colors.primary : colors.textSecondary}
            />
            <ThemedText
              style={[
                styles.modeButtonText,
                mode === "assign" && styles.modeButtonTextActive,
              ]}
            >
              Asignar
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === "invite" && styles.modeButtonActive,
            ]}
            onPress={() => {
              setMode("invite");
              setStep("select-survey");
              setSelectedBrigadistas([]);
            }}
          >
            <Ionicons
              name="mail-open"
              size={18}
              color={mode === "invite" ? colors.primary : colors.textSecondary}
            />
            <ThemedText
              style={[
                styles.modeButtonText,
                mode === "invite" && styles.modeButtonTextActive,
              ]}
            >
              Invitar
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {mode === "assign" ? "Asignar Encuesta" : "Invitar Brigadista"}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Paso 1: Selecciona una encuesta
          </ThemedText>
        </View>

        {surveysLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>
              Cargando encuestas...
            </ThemedText>
          </View>
        ) : surveys.length === 0 ? (
          <View style={styles.centerContent}>
            <ThemedText style={styles.emptyText}>
              No hay encuestas disponibles
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={surveys}
            keyExtractor={(item) => `survey-${item.id}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.surveyCard}
                onPress={() => {
                  setSelectedSurvey(item);
                  if (mode === "assign") {
                    setSelectedBrigadistas([]);
                    setStep("select-brigadista");
                  } else {
                    // For invite, go directly to submit
                    setStep("confirm");
                  }
                }}
              >
                <View style={styles.surveyCardHeader}>
                  <ThemedText style={styles.surveyTitle} numberOfLines={2}>
                    {item.title}
                  </ThemedText>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                {item.description && (
                  <ThemedText
                    style={styles.surveyDescription}
                    numberOfLines={2}
                  >
                    {item.description}
                  </ThemedText>
                )}
                <View style={styles.surveyMeta}>
                  <ThemedText style={styles.surveyMetaText}>
                    {item.versions?.length || 0} versiones
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ThemedView>
    );
  }

  // Step: Select Brigadistas
  if (step === "select-brigadista") {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setStep("select-survey")}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
            <ThemedText style={styles.backText}>Atrás</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.title}>Seleccionar Brigadistas</ThemedText>
          <ThemedText style={styles.subtitle}>
            Paso 2: Selecciona quiénes recibirán: {selectedSurvey?.title}
          </ThemedText>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar brigadista..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
            }}
            onBlur={loadBrigadistas}
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText("");
                setBrigadistas([]);
              }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {brigadistasLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText style={styles.loadingText}>
              Cargando brigadistas...
            </ThemedText>
          </View>
        ) : filteredBrigadistas.length === 0 ? (
          <View style={styles.centerContent}>
            <ThemedText style={styles.emptyText}>
              No hay brigadistas disponibles
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredBrigadistas}
            keyExtractor={(item) => `brigadista-${item.id}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.brigadistaCard,
                  selectedBrigadistas.some((b) => b.id === item.id) &&
                    styles.brigadistaCardSelected,
                ]}
                onPress={() => handleToggleBrigadista(item)}
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      selectedBrigadistas.some((b) => b.id === item.id) &&
                        styles.checkboxSelected,
                    ]}
                  >
                    {selectedBrigadistas.some((b) => b.id === item.id) && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </View>
                <View style={styles.brigadistaInfo}>
                  <ThemedText style={styles.brigadistaName}>
                    {item.full_name}
                  </ThemedText>
                  <ThemedText style={styles.brigadistaEmail}>
                    {item.email}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              selectedBrigadistas.length === 0 && styles.buttonDisabled,
            ]}
            onPress={() => {
              setSelectedBrigadistas([]);
              setStep("select-survey");
            }}
          >
            <ThemedText style={styles.cancelButtonText}>
              Cancelar ({selectedBrigadistas.length})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.confirmButton,
              selectedBrigadistas.length === 0 && styles.buttonDisabled,
            ]}
            disabled={selectedBrigadistas.length === 0}
            onPress={handleConfirmAssignments}
          >
            <ThemedText style={styles.confirmButtonText}>Siguiente</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Step: Confirm
  if (step === "confirm") {
    if (mode === "assign") {
      return (
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Confirmar Asignación</ThemedText>
            <ThemedText style={styles.subtitle}>
              Paso 3: Revisa antes de completar
            </ThemedText>
          </View>

          <View style={styles.confirmContent}>
            <View style={styles.confirmSection}>
              <ThemedText style={styles.confirmLabel}>Encuesta:</ThemedText>
              <ThemedText style={styles.confirmValue}>
                {selectedSurvey?.title}
              </ThemedText>
            </View>

            <View style={styles.confirmSection}>
              <ThemedText style={styles.confirmLabel}>
                Brigadistas ({selectedBrigadistas.length}):
              </ThemedText>
              <View style={styles.confirmList}>
                {selectedBrigadistas.map((b) => (
                  <View key={`confirm-${b.id}`} style={styles.confirmItem}>
                    <Ionicons
                      name="person"
                      size={16}
                      color={colors.primary}
                      style={styles.confirmItemIcon}
                    />
                    <View style={styles.confirmItemText}>
                      <ThemedText style={styles.confirmItemName}>
                        {b.full_name}
                      </ThemedText>
                      <ThemedText style={styles.confirmItemEmail}>
                        {b.email}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setStep("select-brigadista")}
              disabled={creating}
            >
              <ThemedText style={styles.cancelButtonText}>Atrás</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                creating && styles.buttonDisabled,
              ]}
              disabled={creating}
              onPress={handleCreateAssignments}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.confirmButtonText}>
                  Confirmar Asignación
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      );
    } else {
      // Invite mode - show form
      return (
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setStep("select-survey");
                setInviteForm({ email: "", full_name: "", phone: "" });
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
              <ThemedText style={styles.backText}>Atrás</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>Invitar Brigadista</ThemedText>
            <ThemedText style={styles.subtitle}>
              Encuesta: {selectedSurvey?.title}
            </ThemedText>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.formContent}
          >
            <View style={styles.formSection}>
              <ThemedText style={styles.formLabel}>Email *</ThemedText>
              <TextInput
                style={styles.formInput}
                placeholder="ejemplo@email.com"
                placeholderTextColor={colors.textSecondary}
                value={inviteForm.email}
                onChangeText={(text) =>
                  setInviteForm({ ...inviteForm, email: text })
                }
                keyboardType="email-address"
                editable={!creating}
              />
            </View>

            <View style={styles.formSection}>
              <ThemedText style={styles.formLabel}>
                Nombre Completo *
              </ThemedText>
              <TextInput
                style={styles.formInput}
                placeholder="Juan Pérez"
                placeholderTextColor={colors.textSecondary}
                value={inviteForm.full_name}
                onChangeText={(text) =>
                  setInviteForm({ ...inviteForm, full_name: text })
                }
                editable={!creating}
              />
            </View>

            <View style={styles.formSection}>
              <ThemedText style={styles.formLabel}>Teléfono</ThemedText>
              <TextInput
                style={styles.formInput}
                placeholder="+52 555 1234567"
                placeholderTextColor={colors.textSecondary}
                value={inviteForm.phone}
                onChangeText={(text) =>
                  setInviteForm({ ...inviteForm, phone: text })
                }
                keyboardType="phone-pad"
                editable={!creating}
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.primary}
              />
              <ThemedText style={styles.infoText}>
                Se enviará un email de invitación con detalles para activarse
              </ThemedText>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setStep("select-survey");
                setInviteForm({ email: "", full_name: "", phone: "" });
              }}
              disabled={creating}
            >
              <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                creating && styles.buttonDisabled,
              ]}
              disabled={creating}
              onPress={handleCreateInvite}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.confirmButtonText}>
                  Enviar Invitación
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      );
    }
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  surveyCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  surveyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  surveyDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  surveyMeta: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  surveyMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    fontSize: 16,
  },
  brigadistaCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  brigadistaCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  brigadistaInfo: {
    flex: 1,
  },
  brigadistaName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  brigadistaEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  confirmContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  confirmSection: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  confirmLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
  },
  confirmList: {
    marginTop: spacing.sm,
  },
  confirmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  confirmItemIcon: {
    marginRight: spacing.md,
  },
  confirmItemText: {
    flex: 1,
  },
  confirmItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  confirmItemEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modeSelector: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  modeButtonActive: {
    borderBottomColor: colors.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  formContent: {
    flex: 1,
  },
  formSection: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  infoBox: {
    backgroundColor: `${colors.primary}15`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
    lineHeight: 18,
  },
});

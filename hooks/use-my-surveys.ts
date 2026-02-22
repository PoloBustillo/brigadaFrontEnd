/**
 * useMysurveys — data-fetching and business logic for the brigadista surveys screen.
 * Extracted from app/(brigadista)/my-surveys.tsx to keep the screen component
 * focused on rendering only.
 */

import { getAssignedSurveys } from "@/lib/api/mobile";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MySurvey {
  id: number;
  title: string;
  description: string;
  encargadoName: string;
  myResponses: number;
  myTarget: number;
  totalResponses: number;
  totalTarget: number;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  assignedAt: string;
  startDate?: string;
  deadline?: string;
  responseStatus?: ResponseStatus;
  allowRejectedEdit?: boolean;
  versionId: number;
  questionsJson: string;
}

export type TimeWindowStatus = "upcoming" | "active" | "expired";
export type ResponseStatus = "draft" | "completed" | "synced" | "rejected";

// ── Config constants ───────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  ACTIVE: { label: "Activa", color: "#06D6A0", icon: "play-circle" as const },
  COMPLETED: {
    label: "Completada",
    color: "#00B4D8",
    icon: "checkmark-circle" as const,
  },
  PAUSED: { label: "Pausada", color: "#FF9F1C", icon: "pause-circle" as const },
};

export const TIME_WINDOW_CONFIG = {
  upcoming: {
    label: "Próximamente",
    color: "#6366F1",
    icon: "time-outline" as const,
    description: "Aún no inicia",
  },
  active: {
    label: "Disponible",
    color: "#06D6A0",
    icon: "checkbox-outline" as const,
    description: "Puedes responder",
  },
  expired: {
    label: "Vencida",
    color: "#EF4444",
    icon: "close-circle-outline" as const,
    description: "Solo lectura",
  },
};

export const RESPONSE_STATUS_CONFIG = {
  draft: {
    label: "Borrador",
    color: "#94A3B8",
    icon: "create-outline" as const,
    description: "Borrador local",
    editable: true,
  },
  completed: {
    label: "Completada",
    color: "#06D6A0",
    icon: "checkmark-done-outline" as const,
    description: "Lista para enviar",
    editable: true,
  },
  synced: {
    label: "Sincronizada",
    color: "#00B4D8",
    icon: "cloud-done-outline" as const,
    description: "Ya enviada",
    editable: false,
  },
  rejected: {
    label: "Rechazada",
    color: "#EF4444",
    icon: "alert-circle-outline" as const,
    description: "Requiere corrección",
    editable: false,
  },
};

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapApiSurvey(
  raw: Awaited<ReturnType<typeof getAssignedSurveys>>[number],
): MySurvey {
  return {
    id: raw.assignment_id,
    title: raw.survey_title,
    description: raw.survey_description ?? "",
    encargadoName: "",
    myResponses: 0,
    myTarget: 1,
    totalResponses: 0,
    totalTarget: 1,
    status: raw.assignment_status === "active" ? "ACTIVE" : "COMPLETED",
    assignedAt: raw.assigned_at,
    versionId: raw.latest_version?.id ?? 0,
    questionsJson: JSON.stringify(
      (raw.latest_version?.questions ?? []).slice().sort((a, b) => a.order - b.order),
    ),
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMysurveys() {
  const router = useRouter();

  const [surveys, setSurveys] = useState<MySurvey[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    active: true,
    upcoming: false,
    expired: false,
  });

  const fetchSurveys = async () => {
    setFetchError(false);
    try {
      const data = await getAssignedSurveys("active");
      setSurveys(data.map(mapApiSurvey));
    } catch (err) {
      console.error("Error fetching assigned surveys:", err);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSurveys();
    setRefreshing(false);
  };

  /** Retry after a fetch error — resets isLoading so the full spinner re-appears */
  const retryLoad = () => {
    setIsLoading(true);
    fetchSurveys();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getTimeWindowStatus = (survey: MySurvey): TimeWindowStatus => {
    const now = new Date();
    if (survey.startDate && new Date(survey.startDate) > now) return "upcoming";
    if (survey.deadline && new Date(survey.deadline) < now) return "expired";
    return "active";
  };

  const canEditResponse = (survey: MySurvey): boolean => {
    if (!survey.responseStatus) return true;
    const { responseStatus: status } = survey;
    if (status === "draft" || status === "completed") return true;
    if (status === "synced") return false;
    if (status === "rejected") return survey.allowRejectedEdit === true;
    return false;
  };

  const visibleSurveys = useMemo(
    () => surveys.filter((s) => s.status === "ACTIVE"),
    [surveys],
  );

  const surveysByTimeWindow = useMemo(
    () => ({
      upcoming: visibleSurveys.filter(
        (s) => getTimeWindowStatus(s) === "upcoming",
      ),
      active: visibleSurveys.filter((s) => getTimeWindowStatus(s) === "active"),
      expired: visibleSurveys.filter(
        (s) => getTimeWindowStatus(s) === "expired",
      ),
    }),
    [visibleSurveys],
  );

  const handleStartSurvey = (
    survey: MySurvey,
    timeWindow: TimeWindowStatus,
  ) => {
    if (timeWindow === "upcoming" || timeWindow === "expired") return;
    if (!canEditResponse(survey)) return;

    router.push({
      pathname: "/(brigadista)/surveys/fill",
      params: {
        surveyTitle: survey.title,
        surveyId: String(survey.id),
        versionId: String(survey.versionId),
        questionsJson: survey.questionsJson,
      },
    });
  };

  return {
    surveys,
    refreshing,
    isLoading,
    fetchError,
    expandedSections,
    surveysByTimeWindow,
    visibleSurveys,
    onRefresh,
    retryLoad,
    toggleSection,
    getTimeWindowStatus,
    canEditResponse,
    handleStartSurvey,
  };
}

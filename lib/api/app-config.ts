import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiClient } from "@/lib/api/client";
import { cacheRepository } from "@/lib/db/repositories/cache.repository";

export type BottomBarMenuIcon =
  | "document-text-outline"
  | "clipboard-outline"
  | "list-outline"
  | "checkmark-circle-outline"
  | "reader-outline";

export interface BottomBarMenuItem {
  survey_id: number;
  title: string;
  icon: BottomBarMenuIcon;
}

export type SocialPlatform =
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "x"
  | "youtube"
  | "tiktok"
  | "telegram"
  | "website"
  | "other";

export interface SocialLinkItem {
  platform: SocialPlatform;
  label: string;
  url: string | null;
  qr_url: string | null;
}

export interface PublicAppConfig {
  id: number;
  app_display_name: string;
  logo_url: string | null;
  default_theme_mode: "light" | "dark" | "auto";
  default_color_scheme: string;
  allow_user_theme_override: boolean;
  splash_gradient_start: string;
  splash_gradient_mid: string;
  splash_gradient_end: string;
  splash_message_color: string;
  splash_font_type: "script" | "system" | "serif" | "mono" | "rounded";
  bottom_bar_survey_ids: number[];
  bottom_bar_menu_items: BottomBarMenuItem[];
  social_links: SocialLinkItem[];
  created_at: string;
  updated_at: string | null;
}

const APP_CONFIG_CACHE_KEY = "@brigada:public_app_config";
const APP_CONFIG_SQLITE_CACHE_KEY = "public_app_config:v1";
const MAX_BOTTOM_BAR_ITEMS = 10;
const DEFAULT_BOTTOM_BAR_ICON: BottomBarMenuIcon = "document-text-outline";

const ALLOWED_BOTTOM_BAR_ICONS: ReadonlySet<BottomBarMenuIcon> = new Set([
  "document-text-outline",
  "clipboard-outline",
  "list-outline",
  "checkmark-circle-outline",
  "reader-outline",
]);

function isBottomBarMenuIcon(value: string): value is BottomBarMenuIcon {
  return ALLOWED_BOTTOM_BAR_ICONS.has(value as BottomBarMenuIcon);
}

function normalizeMenuTitle(title: string | undefined, surveyId: number): string {
  const normalized = title?.trim();
  if (normalized && normalized.length > 0) {
    return normalized;
  }
  return `Encuesta ${surveyId}`;
}

function normalizeMenuItems(items: BottomBarMenuItem[] | undefined): BottomBarMenuItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const deduped = new Map<number, BottomBarMenuItem>();

  for (const item of items) {
    const surveyId = Number(item?.survey_id);
    if (!Number.isInteger(surveyId) || surveyId <= 0) {
      continue;
    }

    if (deduped.has(surveyId)) {
      continue;
    }

    const icon = isBottomBarMenuIcon(item?.icon)
      ? item.icon
      : DEFAULT_BOTTOM_BAR_ICON;

    deduped.set(surveyId, {
      survey_id: surveyId,
      title: normalizeMenuTitle(item?.title, surveyId),
      icon,
    });

    if (deduped.size >= MAX_BOTTOM_BAR_ITEMS) {
      break;
    }
  }

  return Array.from(deduped.values());
}

export function resolveBottomBarMenuItems(
  config: Pick<PublicAppConfig, "bottom_bar_menu_items" | "bottom_bar_survey_ids"> | null | undefined,
): BottomBarMenuItem[] {
  if (!config) return [];

  const explicitItems = normalizeMenuItems(config.bottom_bar_menu_items);
  if (explicitItems.length > 0) {
    return explicitItems;
  }

  if (!Array.isArray(config.bottom_bar_survey_ids)) {
    return [];
  }

  const dedupedIds = new Set<number>();
  const fallbackItems: BottomBarMenuItem[] = [];

  for (const value of config.bottom_bar_survey_ids) {
    const surveyId = Number(value);
    if (!Number.isInteger(surveyId) || surveyId <= 0 || dedupedIds.has(surveyId)) {
      continue;
    }
    dedupedIds.add(surveyId);
    fallbackItems.push({
      survey_id: surveyId,
      title: `Encuesta ${surveyId}`,
      icon: DEFAULT_BOTTOM_BAR_ICON,
    });

    if (fallbackItems.length >= MAX_BOTTOM_BAR_ITEMS) {
      break;
    }
  }

  return fallbackItems;
}

async function persistPublicAppConfig(config: PublicAppConfig): Promise<void> {
  const serialized = JSON.stringify(config);

  await Promise.all([
    AsyncStorage.setItem(APP_CONFIG_CACHE_KEY, serialized),
    cacheRepository.set(APP_CONFIG_SQLITE_CACHE_KEY, config),
  ]);
}

function parsePublicAppConfig(raw: string | null): PublicAppConfig | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicAppConfig;
  } catch {
    return null;
  }
}

export async function fetchPublicAppConfig(): Promise<PublicAppConfig | null> {
  try {
    const response = await apiClient.get<PublicAppConfig>("/public/app-config");
    const config = response.data;
    await persistPublicAppConfig(config);
    return config;
  } catch (error) {
    const cached = await getCachedPublicAppConfig();
    if (!cached) {
      console.warn(
        "[app-config] Could not fetch remote config and no cache available. Verify EXPO_PUBLIC_API_URL points to the same backend as CMS.",
      );
    }
    return cached;
  }
}

export async function getCachedPublicAppConfig(): Promise<PublicAppConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(APP_CONFIG_CACHE_KEY);
    const asyncCached = parsePublicAppConfig(raw);
    if (asyncCached) {
      return asyncCached;
    }

    const sqliteCached = await cacheRepository.get<PublicAppConfig>(
      APP_CONFIG_SQLITE_CACHE_KEY,
      true,
    );

    if (sqliteCached) {
      await AsyncStorage.setItem(
        APP_CONFIG_CACHE_KEY,
        JSON.stringify(sqliteCached),
      );
      return sqliteCached;
    }

    return null;
  } catch (error) {
    return null;
  }
}

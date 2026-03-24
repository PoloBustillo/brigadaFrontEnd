import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiClient } from "@/lib/api/client";

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
  created_at: string;
  updated_at: string | null;
}

const APP_CONFIG_CACHE_KEY = "@brigada:public_app_config";

export async function fetchPublicAppConfig(): Promise<PublicAppConfig | null> {
  try {
    const response = await apiClient.get<PublicAppConfig>("/public/app-config");
    const config = response.data;
    await AsyncStorage.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify(config));
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
    return raw ? (JSON.parse(raw) as PublicAppConfig) : null;
  } catch (error) {
    return null;
  }
}

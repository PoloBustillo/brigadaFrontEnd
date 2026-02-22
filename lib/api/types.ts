/**
 * API Types
 * Type definitions for API requests and responses
 */

import type { UserRole } from "@/types/user";

// Auth API Types
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    nombre: string;
    apellido: string;
    rol: string;
    telefono: string | null;
    activo: boolean;
    created_at: string;
  };
}

// User API Types
export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserUpdateRequest {
  email?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  is_active?: boolean;
}

// Shared mini-types (returned by backend in nested assignment responses)
export interface UserMini {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export interface SurveyMini {
  id: number;
  title: string;
}

/**
 * API Types
 * Type definitions for API requests and responses
 */

import type { UserRole } from "@/types/user";

// Auth API Types
export interface LoginRequest {
  email: string;
  password: string;
}

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

export interface TokenData {
  sub: string; // user_id
  role: UserRole;
  exp: number; // expiration timestamp
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

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
}

export interface UserUpdateRequest {
  email?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  is_active?: boolean;
}

// API Error Types
export interface APIError {
  detail: string;
  status_code: number;
}

export interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

// Generic API Response
export interface APIResponse<T> {
  data?: T;
  error?: APIError;
}

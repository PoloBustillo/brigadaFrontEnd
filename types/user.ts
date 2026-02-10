/**
 * User Types - Brigada Digital
 * TypeScript types for user system
 */

export type UserRole = "ADMIN" | "ENCARGADO" | "BRIGADISTA";

export type UserState = "INVITED" | "PENDING" | "ACTIVE" | "DISABLED";

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  state: UserState;
  created_at: number;
  updated_at: number;
}

export interface WhitelistEntry {
  id: number;
  email: string;
  role: UserRole;
  invitation_code: string | null;
  created_at: number;
  expires_at: number | null;
  used_at: number | null;
  invited_by: number | null;
}

export interface OfflineToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: number;
  created_at: number;
}

export interface AuthError {
  code: string;
  message: string;
}

/**
 * Auth API Service
 * Authentication endpoints and user management
 */

import type { User } from "@/types/user";
import { api, clearTokens, decodeToken, setAccessToken } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  TokenData,
  UserCreateRequest,
  UserResponse,
  UserUpdateRequest,
} from "./types";

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string,
): Promise<{ user: User; token: string }> {
  try {
    // Backend uses OAuth2PasswordRequestForm: must send form-urlencoded with 'username' field
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post<LoginResponse>("/auth/login", formData.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token } = response.data;

    // Store token
    await setAccessToken(access_token);

    // Decode token to get user info
    const tokenData = decodeToken(access_token) as TokenData;

    // Fetch full user profile
    const userResponse = await api.get<UserResponse>("/users/me");
    const userProfile = userResponse.data;

    // Convert API user to app User type
    const user: User = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.full_name,
      phone: userProfile.phone,
      avatar_url: userProfile.avatar_url,
      role: (userProfile.role as string).toUpperCase() as User["role"],
      state: userProfile.is_active ? "ACTIVE" : "DISABLED",
      created_at: new Date(userProfile.created_at).getTime(),
      updated_at: userProfile.updated_at
        ? new Date(userProfile.updated_at).getTime()
        : Date.now(),
    };

    return { user, token: access_token };
  } catch (error: any) {
    console.error("Login error:", error);

    if (error.response?.status === 401) {
      throw new Error("Email o contraseña incorrectos");
    }

    throw new Error(error.response?.data?.detail || "Error al iniciar sesión");
  }
}

/**
 * Logout - clear tokens
 */
export async function logout(): Promise<void> {
  await clearTokens();
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<User> {
  try {
    const response = await api.get<UserResponse>("/users/me");
    const userProfile = response.data;

    const user: User = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.full_name,
      phone: userProfile.phone,
      avatar_url: userProfile.avatar_url,
      role: (userProfile.role as string).toUpperCase() as User["role"],
      state: userProfile.is_active ? "ACTIVE" : "DISABLED",
      created_at: new Date(userProfile.created_at).getTime(),
      updated_at: userProfile.updated_at
        ? new Date(userProfile.updated_at).getTime()
        : Date.now(),
    };

    return user;
  } catch (error: any) {
    console.error("Get current user error:", error);
    throw new Error(error.response?.data?.detail || "Error al obtener perfil");
  }
}

/**
 * Update own profile
 */
export async function updateProfile(
  data: Partial<UserUpdateRequest>,
): Promise<User> {
  try {
    const response = await api.patch<UserResponse>("/users/me", data);
    const userProfile = response.data;

    const user: User = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.full_name,
      phone: userProfile.phone,
      avatar_url: userProfile.avatar_url,
      role: (userProfile.role as string).toUpperCase() as User["role"],
      state: userProfile.is_active ? "ACTIVE" : "DISABLED",
      created_at: new Date(userProfile.created_at).getTime(),
      updated_at: userProfile.updated_at
        ? new Date(userProfile.updated_at).getTime()
        : Date.now(),
    };

    return user;
  } catch (error: any) {
    console.error("Update profile error:", error);
    throw new Error(
      error.response?.data?.detail || "Error al actualizar perfil",
    );
  }
}

/**
 * Upload profile avatar to backend (server handles Cloudinary upload)
 * POST /users/me/avatar
 */
export async function uploadAvatar(imageUri: string): Promise<User> {
  try {
    const filename = imageUri.split("/").pop() || "avatar.jpg";
    const ext = (filename.split(".").pop() || "jpg").toLowerCase();
    const type =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    const formData = new FormData();
    formData.append("file", { uri: imageUri, name: filename, type } as any);

    const response = await api.post<UserResponse>("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const userProfile = response.data;
    const user: User = {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.full_name,
      phone: userProfile.phone,
      avatar_url: userProfile.avatar_url,
      role: (userProfile.role as string).toUpperCase() as User["role"],
      state: userProfile.is_active ? "ACTIVE" : "DISABLED",
      created_at: new Date(userProfile.created_at).getTime(),
      updated_at: userProfile.updated_at
        ? new Date(userProfile.updated_at).getTime()
        : Date.now(),
    };
    return user;
  } catch (error: any) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    throw new Error("No se pudo subir la foto de perfil");
  }
}

/**
 * Create new user (Admin only)
 */
export async function createUser(
  data: UserCreateRequest,
): Promise<UserResponse> {
  try {
    const response = await api.post<UserResponse>("/users", data);
    return response.data;
  } catch (error: any) {
    console.error("Create user error:", error);
    throw new Error(error.response?.data?.detail || "Error al crear usuario");
  }
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers(params?: {
  skip?: number;
  limit?: number;
  role?: string;
  is_active?: boolean;
}): Promise<UserResponse[]> {
  try {
    const response = await api.get<UserResponse[]>("/users", {
      params,
    });
    return response.data;
  } catch (error: any) {
    console.error("Get all users error:", error);
    throw new Error(
      error.response?.data?.detail || "Error al obtener usuarios",
    );
  }
}

/**
 * Update user (Admin only)
 */
export async function updateUser(
  userId: number,
  data: Partial<UserUpdateRequest>,
): Promise<UserResponse> {
  try {
    const response = await api.patch<UserResponse>(`/users/${userId}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Update user error:", error);
    throw new Error(
      error.response?.data?.detail || "Error al actualizar usuario",
    );
  }
}

/**
 * Delete user (Admin only)
 */
export async function deleteUser(userId: number): Promise<void> {
  try {
    await api.delete(`/users/${userId}`);
  } catch (error: any) {
    console.error("Delete user error:", error);
    throw new Error(
      error.response?.data?.detail || "Error al eliminar usuario",
    );
  }
}

// ============================================================================
// Activation (Public endpoints — no auth required)
// ============================================================================

export interface ValidateCodeResult {
  valid: boolean;
  whitelist_entry?: {
    full_name: string;
    assigned_role: string;
    identifier: string;
  };
  remaining_hours?: number;
  error?: string;
}

export interface CompleteActivationResult {
  success: boolean;
  user_id: number;
  access_token: string;
  token_type: string;
  user_info: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  };
}

/**
 * Step 1: Validate a 6-digit activation code
 * POST /public/activate/validate-code
 */
export async function validateActivationCode(
  code: string,
): Promise<ValidateCodeResult> {
  try {
    const response = await api.post<ValidateCodeResult>(
      "/public/activate/validate-code",
      { code },
    );
    return response.data;
  } catch (error: any) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    throw new Error("Error al validar el código de activación");
  }
}

/**
 * Step 2: Complete activation — creates the user account
 * POST /public/activate/complete
 * Automatically stores the returned access token.
 */
export async function completeActivation(data: {
  code: string;
  identifier: string;
  password: string;
  password_confirm: string;
  agree_to_terms: boolean;
}): Promise<CompleteActivationResult> {
  try {
    const response = await api.post<CompleteActivationResult>(
      "/public/activate/complete",
      data,
    );
    const result = response.data;
    if (result.access_token) {
      await setAccessToken(result.access_token);
    }
    return result;
  } catch (error: any) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    throw new Error("Error al completar la activación");
  }
}

/**
 * POST /users/me/change-password
 * Change the currently authenticated user's password.
 * Throws an Error with a Spanish message on failure.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    await api.post("/users/me/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  } catch (error: any) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") throw new Error(detail);
    throw new Error("No se pudo cambiar la contraseña");
  }
}

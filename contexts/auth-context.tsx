/**
 * AuthContext - Brigada Digital
 * Global authentication state management with JWT and RBAC
 * Handles user session, token, and authentication flow
 */

import * as authAPI from "@/lib/api/auth";
import { clearTokens, getAccessToken, isTokenExpired } from "@/lib/api/client";
import { sessionEvents } from "@/lib/session-events";
import type { User, UserRole } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  pendingEmail: string | null;
  setPendingEmail: (email: string | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Storage keys
const STORAGE_KEYS = {
  USER: "@brigada:user",
  PENDING_EMAIL: "@brigada:pending_email",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingEmail, setPendingEmailState] = useState<string | null>(null);

  const clearSession = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      clearTokens(), // Clear JWT tokens from API client
      AsyncStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL),
    ]);
    setUser(null);
    setToken(null);
    setPendingEmailState(null);
  }, [setUser, setToken, setPendingEmailState]);

  const loadSession = async () => {
    // 🧪 MOCK SESSION - Uncomment to test without backend
    // const mockUser: User = {
    //   id: 999,
    //   email: "test@brigada.com",
    //   name: "Test User",
    //   role: "ADMIN", // Change: "ADMIN" | "ENCARGADO" | "BRIGADISTA"
    //   state: "ACTIVE",
    //   created_at: Date.now(),
    //   updated_at: Date.now(),
    // };
    // setUser(mockUser);
    // setToken("mock-token-999");
    // await setAccessToken("mock-token-999");
    // setLoading(false);
    // console.log("🧪 MOCK SESSION loaded:", mockUser.role);
    // return;
    // 🧪 END MOCK SESSION

    try {
      const [storedUser, storedToken, storedPendingEmail] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        getAccessToken(), // Get JWT from API client
        AsyncStorage.getItem(STORAGE_KEYS.PENDING_EMAIL),
      ]);

      // Restore pending email if exists
      if (storedPendingEmail) {
        setPendingEmailState(storedPendingEmail);
      }

      // Check if token exists and is valid
      if (storedUser && storedToken) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log("⏰ JWT token expired, clearing session");
          await clearSession();
        } else {
          // Valid session, restore state
          const parsedUser = JSON.parse(storedUser) as User;

          // Verify user is still active
          if (parsedUser.state === "DISABLED") {
            console.log("❌ User is deactivated, clearing session");
            await clearSession();
          } else {
            setUser(parsedUser);
            setToken(storedToken);
            console.log(
              "✅ Session restored:",
              parsedUser.email,
              parsedUser.role,
            );
          }
        }
      }
    } catch (error) {
      console.error("Error loading session:", error);
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  // Load user session on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Auto-logout when the API client can no longer refresh tokens
  useEffect(() => {
    const handleExpired = () => {
      console.log("⚠️ Session expired — auto-logging out");
      clearSession();
    };
    sessionEvents.on("session:expired", handleExpired);
    return () => sessionEvents.off("session:expired", handleExpired);
  }, [clearSession]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log("🔐 Attempting login for:", email);

      // Call backend API
      const { user, token } = await authAPI.login(email, password);

      // Verify user is active
      if (user.state === "DISABLED") {
        throw new Error(
          "Tu cuenta ha sido desactivada. Contacta al administrador.",
        );
      }

      // Store user data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      // Update state
      setUser(user);
      setToken(token);

      console.log("✅ Login successful:", user.email, "Role:", user.role);
      return user;
    } catch (error: any) {
      console.error("❌ Login error:", error);
      await clearSession();
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("🚪 Logging out user:", user?.email);

      // Call backend logout (if needed)
      await authAPI.logout();

      // Clear local session
      await clearSession();

      console.log("✅ Logout successful");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Force clear session even if API call fails
      await clearSession();
      throw error;
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(updatedUser),
      );
      setUser(updatedUser);
      console.log("User updated:", updatedUser.email);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      console.log("🔄 Refreshing user data from backend");
      const updatedUser = await authAPI.getCurrentUser();

      // Verify user is still active
      if (updatedUser.state === "DISABLED") {
        console.log("❌ User deactivated, logging out");
        await logout();
        throw new Error("Tu cuenta ha sido desactivada");
      }

      await updateUser(updatedUser);
      console.log("✅ User data refreshed");
    } catch (error) {
      console.error("❌ Error refreshing user:", error);
      throw error;
    }
  };

  const setPendingEmail = async (email: string | null) => {
    try {
      if (email) {
        await AsyncStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
      }
      setPendingEmailState(email);
    } catch (error) {
      console.error("Error setting pending email:", error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    pendingEmail,
    setPendingEmail,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// Helper to get user role
export function useUserRole(): UserRole | null {
  const { user } = useAuth();
  return user?.role || null;
}

// Helper to check if user has specific role
export function useHasRole(role: UserRole): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

// Helper to check if user has any of the roles
export function useHasAnyRole(roles: UserRole[]): boolean {
  const { user } = useAuth();
  return user ? roles.includes(user.role) : false;
}

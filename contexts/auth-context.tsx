/**
 * AuthContext - Brigada Digital
 * Global authentication state management
 * Handles user session, token, and authentication flow
 */

import type { User, UserRole } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Storage keys
const STORAGE_KEYS = {
  USER: "@brigada:user",
  TOKEN: "@brigada:token",
  TOKEN_EXPIRY: "@brigada:token_expiry",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY),
    ]);
    setUser(null);
    setToken(null);
  };

  const loadSession = async () => {
    try {
      const [storedUser, storedToken, storedExpiry] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY),
      ]);

      // Check if token exists and is valid
      if (storedUser && storedToken && storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        const now = Date.now();

        // Token expired?
        if (now >= expiryTime) {
          console.log("Token expired, clearing session");
          await clearSession();
        } else {
          // Valid session, restore state
          const parsedUser = JSON.parse(storedUser) as User;
          setUser(parsedUser);
          setToken(storedToken);
          console.log("Session restored for user:", parsedUser.email);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (user: User, token: string) => {
    try {
      // Calculate token expiry (7 days)
      const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

      // Store in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString()),
      ]);

      // Update state
      setUser(user);
      setToken(token);

      console.log("User logged in:", user.email, "Role:", user.role);
    } catch (error) {
      console.error("Error saving session:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearSession();
      console.log("User logged out");
    } catch (error) {
      console.error("Error during logout:", error);
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

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateUser,
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

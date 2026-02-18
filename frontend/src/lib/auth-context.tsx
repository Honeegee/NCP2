"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { api, setTokens, clearTokens, getAccessToken } from "./api-client";

// --- Types ---

export interface AuthUser {
  id: string;
  email: string;
  role: "nurse" | "admin";
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<{ role: string }>;
  register: (data: RegisterData) => Promise<{ user_id: string; profile_id: string }>;
  logout: () => void;
  /** Re-fetch the user profile to update name/picture in the navbar */
  refreshProfile: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  location_type: string;
  professional_status?: string;
  employment_status?: string;
  certifications?: { cert_type: string; cert_number?: string; score?: string }[];
  years_of_experience?: string;
  specialization?: string;
  school_name?: string;
  graduation_year?: string;
  internship_experience?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider ---

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  // Load user from stored token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    // Decode JWT payload to get basic user info
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearTokens();
        setStatus("unauthenticated");
        return;
      }

      setUser({
        id: payload.id,
        email: payload.email,
        role: payload.role,
      });
      setStatus("authenticated");

      // Fetch full profile for name + picture (non-blocking)
      fetchProfile(payload.id, payload.role);
    } catch {
      clearTokens();
      setStatus("unauthenticated");
    }
  }, []);

  async function fetchProfile(userId: string, role: string) {
    if (role !== "nurse") return;
    try {
      const profile = await api.get<{
        first_name: string;
        last_name: string;
        profile_picture_url: string | null;
      }>("/nurses/me");

      setUser((prev) =>
        prev
          ? {
              ...prev,
              firstName: profile.first_name,
              lastName: profile.last_name,
              profilePictureUrl: profile.profile_picture_url || undefined,
            }
          : prev
      );
    } catch {
      // Profile fetch is best-effort — don't break auth
    }
  }

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; email: string; role: string; firstName?: string; lastName?: string };
    }>("/auth/login", { email, password }, { skipAuth: true });

    setTokens(result.accessToken, result.refreshToken);
    setUser({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role as "nurse" | "admin",
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    });
    setStatus("authenticated");

    // Fetch profile picture in background
    if (result.user.role === "nurse") {
      fetchProfile(result.user.id, result.user.role);
    }

    return { role: result.user.role };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const result = await api.post<{
      user_id: string;
      profile_id: string;
      accessToken: string;
      refreshToken: string;
    }>("/auth/register", data, { skipAuth: true });

    setTokens(result.accessToken, result.refreshToken);
    setUser({
      id: result.user_id,
      email: data.email,
      role: "nurse",
      firstName: data.first_name,
      lastName: data.last_name,
    });
    setStatus("authenticated");

    return { user_id: result.user_id, profile_id: result.profile_id };
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setStatus("unauthenticated");
    window.location.href = "/";
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.role);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook ---

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

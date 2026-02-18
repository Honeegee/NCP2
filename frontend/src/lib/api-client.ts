const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

// Token storage keys
const ACCESS_TOKEN_KEY = "ncp_access_token";
const REFRESH_TOKEN_KEY = "ncp_refresh_token";

// --- Token helpers ---

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  // Also set a cookie so middleware.ts can read it server-side
  document.cookie = `ncp_access_token=${accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  document.cookie = "ncp_access_token=; path=/; max-age=0";
}

// --- Error class ---

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- Token refresh logic ---

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Deduplicate concurrent refresh calls
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      throw new ApiError("No refresh token", 401);
    }

    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    

    if (!res.ok) {
      clearTokens();
      throw new ApiError("Session expired. Please log in again.", 401);
    }

    const json = await res.json();
    const { accessToken, refreshToken: newRefresh } = json.data;
    setTokens(accessToken, newRefresh);
    return accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// --- Core fetch wrapper ---

interface RequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...options?.headers,
  };

  // Add auth header unless explicitly skipped
  if (!options?.skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  // Set content-type for JSON bodies (not FormData)
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 — try token refresh once
  if (res.status === 401 && !options?.skipAuth) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;

      const retryRes = await fetch(url, {
        method,
        headers,
        body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      });

      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ error: "Request failed" }));
        throw new ApiError(err.error || "Request failed", retryRes.status, err.code, err.details);
      }

      const retryJson = await retryRes.json();
      return retryJson.data !== undefined ? retryJson.data : retryJson;
    } catch (refreshErr) {
      // Refresh failed — clear auth state and redirect to login
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw refreshErr;
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(err.error || "Request failed", res.status, err.code, err.details);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json();
  // Backend wraps responses in { data: ... } — unwrap automatically
  return json.data !== undefined ? json.data : json;
}

// --- Public API methods ---

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>("PATCH", path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, undefined, options);
  },

  /** Upload file via multipart/form-data */
  upload<T>(path: string, formData: FormData, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, formData, options);
  },
};

// --- Paginated response helper type ---

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Fetch a paginated endpoint — returns both data and meta */
export async function fetchPaginated<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<PaginatedResponse<T>> {
  const query = params
    ? "?" + new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ).toString()
    : "";

  const url = `${API_BASE_URL}${path}${query}`;
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(err.error || "Request failed", res.status, err.code);
  }

  // Paginated endpoints return { data: [...], meta: {...} } at top level
  return res.json();
}

import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/useAuthStore.ts";

/**
 * Determine the API base URL:
 * - Reads API_URL or VITE_API_URL from .env during dev (e.g., http://localhost:8000/api)
 * - Defaults to relative "/api" for unified express-based UI hosting
 */
const getBaseURL = (): string => {
  const envUrl = import.meta.env.API_URL || import.meta.env.VITE_API_URL;
  if (typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "/api";
};

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Injects Bearer token automatically into all outgoing requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catches 401 unauthorized errors to clear stale credentials
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Avoid redirecting if the 401 was just a failed login attempt
      const url = error.config?.url || "";
      if (!url.includes("/auth/login") && !url.includes("/auth/signup")) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;

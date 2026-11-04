import axios from "axios";

export const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production deployments (e.g. Vercel), default to relative /api on the same domain
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "/api";
  }
  return "http://localhost:5000/api";
};

const baseURL = getBaseURL();

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Automatically inject Authorization token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("placeprepToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Standardize response data and handle common errors (such as 401)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid token
      const isAuthRoute = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/register");
      if (!isAuthRoute && localStorage.getItem("placeprepToken")) {
        console.warn("Session expired or token invalid. Clearing credentials.");
        localStorage.removeItem("placeprepToken");
        localStorage.removeItem("placeprepUser");
        window.dispatchEvent(new CustomEvent("placeprep:auth_expired"));
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred.";

    return Promise.reject(new Error(message));
  }
);

export default apiClient;

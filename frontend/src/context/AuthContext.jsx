import { useState, useEffect, useCallback } from "react";
import { getProfile } from "../api/authApi";
import { AuthContext } from "./authContextDef";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("placeprepToken"));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("placeprepUser");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("placeprepToken");
    localStorage.removeItem("placeprepUser");
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem("placeprepToken", newToken);
    if (userData) {
      localStorage.setItem("placeprepUser", JSON.stringify(userData));
    }
    setToken(newToken);
    setUser(userData || null);
  }, []);

  const updateUserProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("placeprepUser", JSON.stringify(updatedUser));
  }, []);

  // Fetch fresh profile on mount if token exists
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const freshProfile = await getProfile();
        if (isMounted) {
          setUser(freshProfile);
          localStorage.setItem("placeprepUser", JSON.stringify(freshProfile));
        }
      } catch (err) {
        console.warn("Could not fetch profile with stored token:", err.message);
        if (err.message.includes("401") || err.message.includes("session")) {
          logout();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener("placeprep:auth_expired", handleAuthExpired);
    return () => {
      isMounted = false;
      window.removeEventListener("placeprep:auth_expired", handleAuthExpired);
    };
  }, [token, logout]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    loading,
    login,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import apiClient from "./client";

export const loginUser = async (credentials) => {
  return apiClient.post("/auth/login", credentials);
};

export const registerUser = async (userData) => {
  return apiClient.post("/auth/register", userData);
};

export const googleLoginUser = async (credential) => {
  return apiClient.post("/auth/google", { credential });
};

export const setPassword = async (passwords) => {
  return apiClient.post("/auth/set-password", passwords);
};

export const getProfile = async () => {
  const data = await apiClient.get("/auth/profile");
  return data.user;
};

export const updateProfile = async (updates) => {
  const data = await apiClient.patch("/auth/profile", updates);
  return data.user;
};

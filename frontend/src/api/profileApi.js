import apiClient from "./client";

export const getProfile = async () => {
  const data = await apiClient.get("/auth/profile");
  return data.user;
};

export const updateProfile = async (updates) => {
  const data = await apiClient.patch("/auth/profile", updates);
  return data.user;
};

import apiClient from "./client";

export const getApplications = async (params = {}) => {
  return apiClient.get("/applications", { params });
};

export const addApplication = async (application) => {
  return apiClient.post("/applications", application);
};

export const updateApplication = async (id, updates) => {
  return apiClient.patch(`/applications/${id}`, updates);
};

export const deleteApplication = async (id) => {
  return apiClient.delete(`/applications/${id}`);
};

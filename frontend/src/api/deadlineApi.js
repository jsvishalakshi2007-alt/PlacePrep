import apiClient from "./client";

export const getDeadlines = async (params = {}) => {
  return apiClient.get("/deadlines", { params });
};

export const addDeadline = async (deadline) => {
  return apiClient.post("/deadlines", deadline);
};

export const updateDeadline = async (id, updates) => {
  return apiClient.patch(`/deadlines/${id}`, updates);
};

export const deleteDeadline = async (id) => {
  return apiClient.delete(`/deadlines/${id}`);
};

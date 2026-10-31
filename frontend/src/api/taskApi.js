import apiClient from "./client";

export const getTasks = async (params = {}) => {
  return apiClient.get("/tasks", { params });
};

export const getStreakSummary = async () => {
  return apiClient.get("/tasks/streak-summary");
};

export const addTask = async (task) => {
  return apiClient.post("/tasks", task);
};

export const updateTask = async (id, updates) => {
  return apiClient.patch(`/tasks/${id}`, updates);
};

export const deleteTask = async (id) => {
  return apiClient.delete(`/tasks/${id}`);
};

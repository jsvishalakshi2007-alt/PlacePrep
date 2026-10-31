import apiClient from "./client";

export const getProblems = async (params = {}) => {
  return apiClient.get("/problems", { params });
};

export const addProblem = async (problem) => {
  return apiClient.post("/problems", problem);
};

export const updateProblem = async (id, updates) => {
  return apiClient.patch(`/problems/${id}`, updates);
};

export const deleteProblem = async (id) => {
  return apiClient.delete(`/problems/${id}`);
};

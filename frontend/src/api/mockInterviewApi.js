import apiClient from "./client";

export const getMockInterviews = async (params = {}) => {
  return apiClient.get("/mock-interviews", { params });
};

export const getMockAnalytics = async () => {
  return apiClient.get("/mock-interviews/analytics");
};

export const addMockInterview = async (interview) => {
  return apiClient.post("/mock-interviews", interview);
};

export const updateMockInterview = async (id, updates) => {
  return apiClient.patch(`/mock-interviews/${id}`, updates);
};

export const deleteMockInterview = async (id) => {
  return apiClient.delete(`/mock-interviews/${id}`);
};

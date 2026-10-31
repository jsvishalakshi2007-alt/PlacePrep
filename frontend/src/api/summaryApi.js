import apiClient from "./client";

export const getDashboardSummary = async () => {
  return apiClient.get("/summary");
};

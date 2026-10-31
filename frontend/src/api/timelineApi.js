import apiClient from "./client";

export const getTimeline = async (params = {}) => {
  return apiClient.get("/timeline", { params });
};

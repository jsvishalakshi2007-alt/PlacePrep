import apiClient from "./client";

export const getSkills = async (params = {}) => {
  return apiClient.get("/skills", { params });
};

export const getSkillsGapAnalysis = async () => {
  return apiClient.get("/skills/gap-analysis");
};

export const addSkill = async (skill) => {
  return apiClient.post("/skills", skill);
};

export const updateSkill = async (id, updates) => {
  return apiClient.patch(`/skills/${id}`, updates);
};

export const deleteSkill = async (id) => {
  return apiClient.delete(`/skills/${id}`);
};

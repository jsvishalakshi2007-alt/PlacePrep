import apiClient from "./client";

export const getCompanies = async (params = {}) => {
  return apiClient.get("/companies", { params });
};

export const getCompanyPresets = async () => {
  return apiClient.get("/companies/presets");
};

export const addCompany = async (company) => {
  return apiClient.post("/companies", company);
};

export const updateCompany = async (id, updates) => {
  return apiClient.patch(`/companies/${id}`, updates);
};

export const deleteCompany = async (id) => {
  return apiClient.delete(`/companies/${id}`);
};

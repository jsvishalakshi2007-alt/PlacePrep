import apiClient from "./client";

export const getResources = async (filters = {}) => {
  return apiClient.get("/resources", { params: filters });
};

export const createResource = async (resource) => {
  return apiClient.post("/resources", resource);
};

export const updateResource = async (id, resource) => {
  return apiClient.put(`/resources/${id}`, resource);
};

export const deleteResource = async (id) => {
  return apiClient.delete(`/resources/${id}`);
};

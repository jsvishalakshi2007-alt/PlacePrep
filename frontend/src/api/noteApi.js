import apiClient from "./client";

export const getNotes = async (filters = {}) => {
  return apiClient.get("/notes", { params: filters });
};

export const createNote = async (note) => {
  return apiClient.post("/notes", note);
};

export const updateNote = async (id, note) => {
  return apiClient.put(`/notes/${id}`, note);
};

export const deleteNote = async (id) => {
  return apiClient.delete(`/notes/${id}`);
};

import apiClient, { getBaseURL } from "./client";

export const getStudyFiles = async () => {
  return apiClient.get("/study-files");
};

export const uploadStudyFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post("/study-files", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const downloadStudyFile = async (id, originalName) => {
  const token = localStorage.getItem("placeprepToken");
  const baseURL = getBaseURL();

  const response = await fetch(`${baseURL}/study-files/${encodeURIComponent(id)}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to download study file.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = originalName || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const deleteStudyFile = async (id) => {
  return apiClient.delete(`/study-files/${id}`);
};

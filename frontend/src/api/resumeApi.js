
import apiClient, { getBaseURL } from "./client";

const baseURL = getBaseURL();

export const getResumes = () => apiClient.get("/resumes");

export const addResume = (resume) =>
  apiClient.post("/resumes", resume);

export const uploadResumeFile = (formData) =>
  apiClient.post("/resumes/upload", formData, {
    headers: {
      "Content-Type": undefined,
    },
    timeout: 60000,
  });

export const replaceResumeFile = (id, formData) =>
  apiClient.post(`/resumes/${id}/replace`, formData, {
    headers: {
      "Content-Type": undefined,
    },
    timeout: 60000,
  });

export const updateResume = (id, updates) =>
  apiClient.patch(`/resumes/${id}`, updates);

export const deleteResume = (id) =>
  apiClient.delete(`/resumes/${id}`);

export const getResumeDownloadUrl = (id) => {
  const token = localStorage.getItem("placeprepToken") || "";
  return `${baseURL}/resumes/${id}/download?token=${encodeURIComponent(token)}`;
};

export const getResumePreviewUrl = (id) => {
  const token = localStorage.getItem("placeprepToken") || "";
  return `${baseURL}/resumes/${id}/preview?token=${encodeURIComponent(token)}`;
};

export const downloadResumeBlob = async (
  id,
  defaultFileName = "resume.pdf"
) => {
  const token = localStorage.getItem("placeprepToken");

  const response = await fetch(`${baseURL}/resumes/${id}/download`, {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to download resume.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = defaultFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

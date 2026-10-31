import apiClient from "./client";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getResumes = async () => {
  return apiClient.get("/resumes");
};

export const addResume = async (resume) => {
  return apiClient.post("/resumes", resume);
};

export const uploadResumeFile = async (formData) => {
  return apiClient.post("/resumes/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const replaceResumeFile = async (id, formData) => {
  return apiClient.post(`/resumes/${id}/replace`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const updateResume = async (id, updates) => {
  return apiClient.patch(`/resumes/${id}`, updates);
};

export const deleteResume = async (id) => {
  return apiClient.delete(`/resumes/${id}`);
};

export const getResumeDownloadUrl = (id) => {
  const token = localStorage.getItem("placeprepToken") || "";
  return `${baseURL}/resumes/${id}/download?token=${encodeURIComponent(token)}`;
};

export const getResumePreviewUrl = (id) => {
  const token = localStorage.getItem("placeprepToken") || "";
  return `${baseURL}/resumes/${id}/preview?token=${encodeURIComponent(token)}`;
};

export const downloadResumeBlob = async (id, defaultFileName = "resume.pdf") => {
  try {
    const token = localStorage.getItem("placeprepToken");
    const response = await fetch(`${baseURL}/resumes/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error("Failed to download file from server.");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", defaultFileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    throw err;
  }
};

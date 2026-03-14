import axios from "axios";

import { CaseResult, CaseSummary, DashboardStats, SettingsSnapshot, UploadImageResponse } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 10000
});

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
}

export async function analyzeCase(payload: Record<string, unknown>) {
  const response = await api.post("/analyze-case", payload);
  return response.data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get("/dashboard/stats");
  return response.data;
}

export async function getCaseProgress(caseId: string) {
  const response = await api.get(`/cases/${caseId}/progress`);
  return response.data;
}

export async function getCaseResult(caseId: string): Promise<CaseResult | null> {
  const response = await api.get(`/cases/${caseId}/result`);
  if (response.data?.result === null || !response.data?.differentials) {
    return null;
  }
  return response.data.result ?? response.data;
}

export async function getCases(): Promise<CaseSummary[]> {
  const response = await api.get("/cases");
  return response.data.cases;
}

export async function getSettingsSnapshot(): Promise<SettingsSnapshot> {
  const response = await api.get("/settings");
  return response.data;
}

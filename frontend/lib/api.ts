import axios from "axios";

import { mockCases, mockProgress, mockResult, mockSettings, mockStats } from "@/lib/mock-data";
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
  try {
    const response = await api.get("/dashboard/stats");
    return response.data;
  } catch {
    return mockStats;
  }
}

export async function getCaseProgress(caseId: string) {
  try {
    const response = await api.get(`/cases/${caseId}/progress`);
    return response.data;
  } catch {
    return { case_id: caseId, status: "running", progress: mockProgress };
  }
}

export async function getCaseResult(caseId: string): Promise<CaseResult> {
  try {
    const response = await api.get(`/cases/${caseId}/result`);
    if (response.data?.result === null || !response.data?.differentials) {
      return { ...mockResult, case_id: caseId, status: response.data?.status ?? "running" };
    }
    return response.data.result ?? response.data;
  } catch {
    return { ...mockResult, case_id: caseId };
  }
}

export async function getCases(): Promise<CaseSummary[]> {
  try {
    const response = await api.get("/cases");
    return response.data.cases;
  } catch {
    return mockCases;
  }
}

export async function getSettingsSnapshot(): Promise<SettingsSnapshot> {
  try {
    const response = await api.get("/settings");
    return response.data;
  } catch {
    return mockSettings;
  }
}

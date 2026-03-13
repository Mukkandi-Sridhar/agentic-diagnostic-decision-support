export type DashboardStats = {
  total_analyses: number;
  completed_analyses: number;
  recent_diagnoses: string[];
  evidence_sources_used: number;
  indexed_documents: number;
};

export type UploadImageResponse = {
  file_token: string;
  filename: string;
  content_type: string;
  size_bytes: number;
};

export type CaseProgressEvent = {
  step: string;
  status: string;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

export type Citation = {
  snippet_id: string;
  pmid: string;
  doi?: string;
  quote: string;
  journal?: string;
  year?: string;
  title?: string;
};

export type Differential = {
  dx: string;
  icd10: string;
  rationale: string;
  support: { snippet_id: string }[];
};

export type Overlay = {
  overlay_id: string;
  type: string;
  coords: number[];
  label?: string;
};

export type CaseResult = {
  case_id: string;
  status: string;
  patient_context: Record<string, unknown>;
  images?: {
    id: string;
    format: string;
    file_token?: string;
  }[];
  imaging_findings: Record<string, unknown>;
  differentials: Differential[];
  red_flags: string[];
  next_steps: string[];
  citations: Citation[];
  overlays: Overlay[];
  diagnostic_summary: string;
  compliance_banner: string;
  disclaimer: string;
  safety_checks: string[];
  rag_stats: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CaseSummary = {
  case_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  result?: {
    differentials?: Differential[];
  };
};

export type SettingsSnapshot = {
  use_remote_models: boolean;
  gemini_configured: boolean;
  openai_fallback_configured: boolean;
  pubmed_email: string;
  vector_store_path: string;
  upload_dir: string;
};

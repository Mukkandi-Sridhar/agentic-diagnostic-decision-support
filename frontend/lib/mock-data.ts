import { CaseProgressEvent, CaseResult, CaseSummary, DashboardStats, SettingsSnapshot } from "@/types";

export const mockStats: DashboardStats = {
  total_analyses: 12,
  completed_analyses: 10,
  recent_diagnoses: ["Right Pneumothorax", "Community-Acquired Pneumonia", "Pulmonary Edema"],
  evidence_sources_used: 48,
  indexed_documents: 126
};

export const mockProgress: CaseProgressEvent[] = [
  {
    step: "queued",
    status: "queued",
    message: "Case accepted for analysis",
    timestamp: new Date().toISOString(),
    metadata: {}
  },
  {
    step: "vision",
    status: "running",
    message: "Vision Agent analyzing X-ray",
    timestamp: new Date().toISOString(),
    metadata: {}
  },
  {
    step: "retrieval",
    status: "running",
    message: "Retrieval Agent searching PubMed",
    timestamp: new Date().toISOString(),
    metadata: {}
  },
  {
    step: "diagnosis",
    status: "running",
    message: "Diagnosis Agent generating differential",
    timestamp: new Date().toISOString(),
    metadata: {}
  }
];

export const mockResult: CaseResult = {
  case_id: "demo-case",
  status: "completed",
  patient_context: {
    age: 64,
    sex: "M",
    chief_complaint: "acute dyspnea",
    vitals: "RR 28, SpO2 89% RA, HR 114",
    history: "COPD history, sudden pleuritic pain"
  },
  images: [
    {
      id: "img1",
      format: "PNG"
    }
  ],
  imaging_findings: {
    pneumothorax: {
      prob: 0.91,
      laterality: "right",
      size: "small"
    }
  },
  differentials: [
    {
      dx: "Right Pneumothorax",
      icd10: "J93.9",
      rationale: "Abrupt dyspnea plus absent peripheral lung markings and apical pleural line suggest pneumothorax.[1]",
      support: [{ snippet_id: "s1" }]
    },
    {
      dx: "Secondary Pneumothorax due to COPD",
      icd10: "J44.9",
      rationale: "Underlying lung disease can predispose to spontaneous pneumothorax and worsen hypoxemia.[2]",
      support: [{ snippet_id: "s2" }]
    },
    {
      dx: "Pulmonary Embolism",
      icd10: "I26.99",
      rationale: "Remains a competing urgent diagnosis if bedside physiology is discordant.[3]",
      support: [{ snippet_id: "s3" }]
    }
  ],
  red_flags: [
    "Escalate urgently if hypotension, severe hypoxemia, or tracheal deviation suggest tension physiology.",
    "Monitor for worsening respiratory distress after transport or positive-pressure ventilation."
  ],
  next_steps: [
    "Obtain immediate bedside reassessment and pulse oximetry trend.",
    "Consider repeat chest imaging or ultrasound if symptoms worsen.",
    "Discuss chest tube versus observation based on size, symptoms, and oxygen needs."
  ],
  citations: [
    {
      snippet_id: "s1",
      pmid: "1010001",
      doi: "10.1056/NEJMra2200001",
      quote: "Spontaneous pneumothorax commonly presents with acute dyspnea and pleuritic chest pain.",
      journal: "New England Journal of Medicine",
      year: "2024",
      title: "Emergency evaluation of spontaneous pneumothorax"
    },
    {
      snippet_id: "s2",
      pmid: "1010002",
      doi: "10.1016/S0140-6736(24)00002-2",
      quote: "Secondary pneumothorax often occurs in patients with underlying chronic lung disease.",
      journal: "The Lancet Respiratory Medicine",
      year: "2024",
      title: "Secondary pneumothorax in chronic lung disease"
    },
    {
      snippet_id: "s3",
      pmid: "1010003",
      doi: "10.1164/rccm.2024.03.1234",
      quote: "A discordance between imaging findings and bedside physiology should trigger reconsideration of the differential diagnosis.",
      journal: "American Journal of Respiratory and Critical Care Medicine",
      year: "2024",
      title: "Radiographic pitfalls in acute dyspnea"
    }
  ],
  overlays: [
    {
      overlay_id: "ovl_001",
      type: "bbox",
      coords: [120, 80, 200, 150],
      label: "Possible right pneumothorax"
    }
  ],
  diagnostic_summary: "Imaging and literature support a pneumothorax-focused differential with urgent escalation triggers.",
  compliance_banner: "Research / Education Only - Not a Medical Device",
  disclaimer: "Prototype decision support output for research and education only.",
  safety_checks: [
    "No direct identifier fields were retained in the generated report.",
    "Every listed diagnosis includes at least one evidence reference."
  ],
  rag_stats: {
    indexed_documents: 126,
    new_documents_added: 4,
    retrieved_candidates: 6,
    query: "acute dyspnea pneumothorax emergency imaging evaluation"
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockCases: CaseSummary[] = [
  {
    case_id: "abc123",
    status: "completed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    result: {
      differentials: [{ dx: "Right Pneumothorax", icd10: "J93.9", rationale: "", support: [] }]
    }
  },
  {
    case_id: "demo002",
    status: "running",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const mockSettings: SettingsSnapshot = {
  use_remote_models: false,
  gemini_configured: false,
  openai_fallback_configured: false,
  pubmed_email: "research@example.com",
  vector_store_path: "data/indexes/medical_index",
  upload_dir: "data/uploads"
};

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { DiagnosisCard } from "@/components/DiagnosisCard";
import { OverlayViewer } from "@/components/OverlayViewer";
import { PortalShell } from "@/components/PortalShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getCaseResult } from "@/lib/api";
import { CaseResult } from "@/types";

export default function ResultsPage() {
  const params = useParams<{ caseId: string }>();
  const [result, setResult] = useState<CaseResult | null>(null);

  useEffect(() => {
    getCaseResult(params.caseId).then(setResult);
  }, [params.caseId]);

  if (!result) {
    return (
      <PortalShell title="Loading Results" description="Fetching the grounded diagnostic report.">
        <Card>Loading case result...</Card>
      </PortalShell>
    );
  }

  const primaryImage = result.images?.[0]?.file_token
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/cases/${result.case_id}/images/${result.images[0].file_token}`
    : "/xray-placeholder.svg";

  return (
    <PortalShell
      title={`Diagnostic Report: ${result.case_id}`}
      description="A simple, grounded summary of the AI analysis for this case."
    >
      <div className="space-y-6">
        <Card className="space-y-4 bg-slate-950 text-white">
          <div>
            <Badge className="border-teal-400/20 bg-teal-400/10 text-teal-200">{result.compliance_banner}</Badge>
            <h2 className="mt-4 text-3xl font-semibold">{result.differentials[0]?.dx ?? "No primary diagnosis"}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{result.diagnostic_summary}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-2xl bg-white/5 px-4 py-3">Status: {result.status}</div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">Evidence: {result.citations.length} sources</div>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <OverlayViewer imageUrl={primaryImage} overlays={result.overlays} />

          <Card className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-950">Next steps</h3>
            <ul className="space-y-3">
              {result.next_steps.map((step) => (
                <li key={step} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  {step}
                </li>
              ))}
            </ul>
            {result.red_flags.length > 0 ? (
              <>
                <h4 className="pt-2 text-sm font-semibold uppercase tracking-[0.18em] text-alert">Warnings</h4>
                <ul className="space-y-3">
                  {result.red_flags.map((flag) => (
                    <li key={flag} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {flag}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>
        </div>

        <Card className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-950">Top diagnoses</h3>
          <div className="space-y-4">
            {result.differentials.map((diagnosis, index) => (
              <DiagnosisCard key={diagnosis.dx} diagnosis={diagnosis} rank={index + 1} />
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h3 className="text-xl font-semibold text-slate-950">Evidence</h3>
          <div className="space-y-3">
            {result.citations.map((citation) => (
              <div key={citation.snippet_id} className="rounded-2xl border border-border bg-slate-50 p-4">
                <p className="font-medium text-slate-950">{citation.title}</p>
                <p className="mt-1 text-sm text-muted">
                  PMID {citation.pmid}
                  {citation.year ? ` · ${citation.year}` : ""}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">{citation.quote}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}

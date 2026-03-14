"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

import { OverlayViewer } from "@/components/OverlayViewer";
import { PortalShell } from "@/components/PortalShell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCaseResult } from "@/lib/api";
import { CaseResult } from "@/types";

export default function ResultsPage() {
  const params = useParams<{ caseId: string }>();
  const [result, setResult] = useState<CaseResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("Fetching the report.");

  useEffect(() => {
    let active = true;

    const loadResult = async () => {
      try {
        const response = await getCaseResult(params.caseId);
        if (!active) return;
        if (!response) {
          setStatusMessage("This analysis is still running or did not produce a final report yet.");
          setResult(null);
          return;
        }
        setResult(response);
      } catch (error) {
        if (!active) return;
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setStatusMessage("No report was found for this case.");
          return;
        }
        setStatusMessage("Unable to load the report right now.");
      }
    };

    loadResult();
    return () => {
      active = false;
    };
  }, [params.caseId]);

  if (!result) {
    return (
      <PortalShell title="Result not ready" description="The report will appear here as soon as the analysis finishes.">
        <Card className="space-y-4">
          <p className="text-sm text-slate-700">{statusMessage}</p>
          <Link className={buttonVariants("outline")} href={`/analysis/${params.caseId}`}>
            View analysis status
          </Link>
        </Card>
      </PortalShell>
    );
  }

  const primaryImage = result.images?.[0]?.file_token
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/cases/${result.case_id}/images/${result.images[0].file_token}`
    : "/xray-placeholder.svg";

  const leadDiagnosis = result.differentials[0];
  const findingLines = formatFindings(result.imaging_findings);

  return (
    <PortalShell title={`Diagnostic Report: ${result.case_id}`} description="Grounded answer from the uploaded image, case details, and retrieved evidence.">
      <div className="space-y-6">
        <Card className="space-y-4 bg-slate-950 text-white">
          <div className="space-y-3">
            <Badge className="border-teal-400/20 bg-teal-400/10 text-teal-200">{result.compliance_banner}</Badge>
            <h2 className="text-3xl font-semibold">{leadDiagnosis?.dx ?? "No primary diagnosis returned"}</h2>
            <p className="max-w-4xl text-sm leading-7 text-slate-300">{result.diagnostic_summary}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-2xl bg-white/5 px-4 py-3">Status: {result.status}</div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">Evidence: {result.citations.length} sources</div>
            {leadDiagnosis?.icd10 ? <div className="rounded-2xl bg-white/5 px-4 py-3">ICD-10: {leadDiagnosis.icd10}</div> : null}
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <OverlayViewer imageUrl={primaryImage} overlays={result.overlays} />

          <Card className="space-y-5">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-950">Answer</h3>
              <p className="text-sm leading-7 text-slate-700">
                {leadDiagnosis?.rationale ?? result.diagnostic_summary}
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-950">Imaging findings</h3>
              {findingLines.length > 0 ? (
                <ul className="space-y-2 text-sm leading-6 text-slate-700">
                  {findingLines.map((line) => (
                    <li key={line} className="rounded-2xl bg-slate-50 px-4 py-3">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-700">No structured findings were returned.</p>
              )}
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-950">What to do next</h3>
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {result.next_steps.map((step) => (
                  <li key={step} className="rounded-2xl bg-slate-50 px-4 py-3">
                    {step}
                  </li>
                ))}
              </ul>
            </section>

            {result.red_flags.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-950">Warnings</h3>
                <ul className="space-y-2 text-sm leading-6 text-amber-900">
                  {result.red_flags.map((flag) => (
                    <li key={flag} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      {flag}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </Card>
        </div>

        <Card className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-950">Other reasonable differentials</h3>
            <div className="space-y-3">
              {result.differentials.map((diagnosis, index) => (
                <div key={diagnosis.dx} className="rounded-2xl border border-border px-4 py-4">
                  <p className="text-sm font-medium text-slate-950">
                    {index + 1}. {diagnosis.dx}
                    {diagnosis.icd10 ? <span className="text-slate-500"> ({diagnosis.icd10})</span> : null}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{diagnosis.rationale}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-950">Evidence</h3>
            <div className="space-y-3">
              {result.citations.map((citation, index) => (
                <div key={citation.snippet_id} className="rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-medium text-slate-950">
                    [{index + 1}] {citation.title || "Supporting citation"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                    PMID {citation.pmid}
                    {citation.year ? ` | ${citation.year}` : ""}
                    {citation.journal ? ` | ${citation.journal}` : ""}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{citation.quote}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="text-xs leading-6 text-slate-500">{result.disclaimer}</p>
        </Card>
      </div>
    </PortalShell>
  );
}

function formatFindings(imagingFindings: Record<string, unknown>) {
  return Object.entries(imagingFindings).map(([key, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return `${humanizeKey(key)}: ${String(value)}`;
    }

    const details = Object.entries(value as Record<string, unknown>)
      .filter(([, itemValue]) => itemValue !== null && itemValue !== "" && itemValue !== "none")
      .map(([itemKey, itemValue]) => {
        if (itemKey === "prob" && typeof itemValue === "number") {
          return `probability ${Math.round(itemValue * 100)}%`;
        }
        return `${humanizeKey(itemKey)} ${String(itemValue)}`;
      });

    return details.length > 0 ? `${humanizeKey(key)}: ${details.join(", ")}` : `${humanizeKey(key)} detected`;
  });
}

function humanizeKey(value: string) {
  return value.replaceAll("_", " ");
}

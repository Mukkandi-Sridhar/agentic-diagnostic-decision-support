"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpenText, FolderClock, Stethoscope } from "lucide-react";

import { PortalShell } from "@/components/PortalShell";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCases, getDashboardStats } from "@/lib/api";
import { CaseSummary, DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);

  useEffect(() => {
    getDashboardStats().then(setStats);
    getCases().then(setCases);
  }, []);

  return (
    <PortalShell
      title="Diagnostic Command Dashboard"
      description="Track recent analyses, monitor system readiness, and inspect retrieval statistics across the multi-agent workflow."
    >
      <div className="grid gap-6 xl:grid-cols-4">
        <StatCard
          label="Total analyses"
          value={stats?.total_analyses ?? "--"}
          icon={<Activity className="h-6 w-6" />}
          detail="All submitted cases across completed and in-flight workflows."
        />
        <StatCard
          label="Completed"
          value={stats?.completed_analyses ?? "--"}
          icon={<Stethoscope className="h-6 w-6" />}
          detail="Final reports with grounded differentials and verified citations."
        />
        <StatCard
          label="Evidence sources"
          value={stats?.evidence_sources_used ?? "--"}
          icon={<BookOpenText className="h-6 w-6" />}
          detail="Supporting snippets, PMIDs, and DOI-linked retrieval results."
        />
        <StatCard
          label="Indexed docs"
          value={stats?.indexed_documents ?? "--"}
          icon={<FolderClock className="h-6 w-6" />}
          detail="Documents embedded into the FAISS-backed retrieval layer."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Recent Cases</h2>
              <p className="mt-1 text-sm text-muted">Open prior analyses and resume active investigations from the history stream.</p>
            </div>
            <Button onClick={() => (window.location.href = "/new-case")}>Run New Analysis</Button>
          </div>
          <div className="space-y-3">
            {cases.map((caseItem) => (
              <div key={caseItem.case_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-950">{caseItem.case_id}</p>
                  <p className="text-sm text-muted">{new Date(caseItem.updated_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{caseItem.status}</Badge>
                  <p className="text-sm text-slate-700">
                    {caseItem.result?.differentials?.[0]?.dx ?? "Awaiting result"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-slate-950 text-white">
            <p className="text-sm uppercase tracking-[0.18em] text-teal-300">System status</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="rounded-2xl bg-white/5 p-4">Vision Agent: ready</div>
              <div className="rounded-2xl bg-white/5 p-4">Retrieval Agent: PubMed online with seed fallback</div>
              <div className="rounded-2xl bg-white/5 p-4">Safety Agent: active</div>
            </div>
          </Card>

          <Card>
            <p className="text-sm uppercase tracking-[0.18em] text-muted">RAG statistics</p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Recent diagnoses: {(stats?.recent_diagnoses ?? []).join(", ") || "Loading"}
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                Indexed document count powers hybrid lexical and vector retrieval for every case.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PortalShell>
  );
}

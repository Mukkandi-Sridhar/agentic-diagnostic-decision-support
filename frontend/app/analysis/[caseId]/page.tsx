"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AgentProgressTimeline } from "@/components/AgentProgressTimeline";
import { PortalShell } from "@/components/PortalShell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCaseProgress } from "@/lib/api";
import { CaseProgressEvent } from "@/types";

export default function AnalysisProgressPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const [status, setStatus] = useState("running");
  const [events, setEvents] = useState<CaseProgressEvent[]>([]);

  useEffect(() => {
    let active = true;

    const fetchProgress = async () => {
      const response = await getCaseProgress(caseId);
      if (!active) return;
      setStatus(response.status);
      setEvents(response.progress);
    };

    fetchProgress();
    const interval = window.setInterval(fetchProgress, 2500);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [caseId]);

  return (
    <PortalShell
      title={`Analysis Progress: ${caseId}`}
      description="Watch the orchestration layer move through imaging analysis, retrieval, reasoning, verification, and safety review."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_340px]">
        <AgentProgressTimeline events={events} />

        <Card className="space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Current status</p>
            <h2 className="mt-2 text-3xl font-semibold capitalize text-slate-950">{status}</h2>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Vision Agent running overlay generation</div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Retrieval Agent querying PubMed and FAISS</div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Diagnosis Agent composing grounded differential</div>
          </div>
          <Link className={buttonVariants("default", "w-full")} href={`/results/${caseId}`}>
            Open Result Page
          </Link>
        </Card>
      </div>
    </PortalShell>
  );
}

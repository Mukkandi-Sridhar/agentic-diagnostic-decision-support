"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import { AgentProgressTimeline } from "@/components/AgentProgressTimeline";
import { PortalShell } from "@/components/PortalShell";
import { Card } from "@/components/ui/card";
import { getCaseProgress } from "@/lib/api";
import { CaseProgressEvent } from "@/types";

export default function AnalysisProgressPage() {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();
  const caseId = params.caseId;
  const [status, setStatus] = useState("running");
  const [events, setEvents] = useState<CaseProgressEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const fetchProgress = async () => {
      try {
        const response = await getCaseProgress(caseId);
        if (!active) return;
        setErrorMessage("");
        setStatus(response.status);
        setEvents(response.progress);
        if (response.status === "completed") {
          router.replace(`/results/${caseId}`);
        }
      } catch (error) {
        if (!active) return;
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setStatus("not found");
          setEvents([]);
          setErrorMessage("This case was not found. Please start a new analysis.");
          return;
        }
        setErrorMessage("The analysis is taking longer than expected. Please wait a moment and refresh if needed.");
      }
    };

    fetchProgress();
    const interval = window.setInterval(fetchProgress, 2500);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [caseId, router]);

  return (
    <PortalShell title="Running analysis" description="Reviewing the image, retrieving evidence, and preparing the final report.">
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">Current status</p>
          <h2 className="text-3xl font-semibold capitalize text-slate-950">{status}</h2>
          <p className="max-w-3xl text-sm text-muted">
            You will be redirected automatically as soon as the final report is ready.
          </p>
        </div>

        {errorMessage ? <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{errorMessage}</p> : null}

        <AgentProgressTimeline events={events} />
      </Card>
    </PortalShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PortalShell } from "@/components/PortalShell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCases } from "@/lib/api";
import { CaseSummary } from "@/types";

export default function HistoryPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);

  useEffect(() => {
    getCases().then(setCases);
  }, []);

  return (
    <PortalShell
      title="Case History"
      description="Browse previously analyzed cases, inspect status, and reopen grounded diagnostic reports."
    >
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.1fr_1fr_1.2fr_180px] gap-4 border-b border-border px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          <span>Case ID</span>
          <span>Date</span>
          <span>Diagnosis Summary</span>
          <span>Action</span>
        </div>
        <div className="divide-y divide-border">
          {cases.map((caseItem) => (
            <div key={caseItem.case_id} className="grid grid-cols-[1.1fr_1fr_1.2fr_180px] gap-4 px-6 py-5 text-sm text-slate-700">
              <div className="font-medium text-slate-950">{caseItem.case_id}</div>
              <div>{new Date(caseItem.updated_at).toLocaleString()}</div>
              <div className="flex items-center gap-3">
                <Badge>{caseItem.status}</Badge>
                <span>{caseItem.result?.differentials?.[0]?.dx ?? "Pending report"}</span>
              </div>
              <div>
                <Link className={buttonVariants("outline")} href={`/results/${caseItem.case_id}`}>
                  Open Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PortalShell>
  );
}

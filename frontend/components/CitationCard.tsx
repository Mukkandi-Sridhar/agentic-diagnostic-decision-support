import { ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Citation } from "@/types";

export function CitationCard({ citation }: { citation: Citation }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">{citation.title}</p>
          <p className="text-sm text-muted">
            {citation.journal} {citation.year ? `· ${citation.year}` : ""}
          </p>
        </div>
        <a
          className="inline-flex items-center gap-1 text-sm font-medium text-accent"
          href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
          rel="noreferrer"
          target="_blank"
        >
          PMID {citation.pmid}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">&ldquo;{citation.quote}&rdquo;</p>
      {citation.doi ? <p className="text-xs uppercase tracking-[0.18em] text-slate-400">DOI {citation.doi}</p> : null}
    </Card>
  );
}


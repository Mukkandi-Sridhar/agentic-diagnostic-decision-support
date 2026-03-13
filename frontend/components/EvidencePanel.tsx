import { CitationCard } from "@/components/CitationCard";
import { Card } from "@/components/ui/card";
import { Citation, Differential } from "@/types";

export function EvidencePanel({
  citations,
  differentials
}: {
  citations: Citation[];
  differentials: Differential[];
}) {
  return (
    <Card className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-slate-950">Explainability and Evidence</h3>
        <p className="mt-1 text-sm text-muted">Each diagnosis is paired to supporting retrieval snippets and source metadata.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          {differentials.map((diagnosis) => (
            <div key={diagnosis.dx} className="rounded-2xl border border-border bg-slate-50 p-4">
              <p className="font-medium text-slate-950">{diagnosis.dx}</p>
              <p className="mt-2 text-sm text-slate-700">{diagnosis.rationale}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {diagnosis.support.map((support) => (
                  <span key={support.snippet_id} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    Supports: {support.snippet_id}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {citations.map((citation) => (
            <CitationCard key={citation.snippet_id} citation={citation} />
          ))}
        </div>
      </div>
    </Card>
  );
}


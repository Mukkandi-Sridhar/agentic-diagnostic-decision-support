import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Differential } from "@/types";

export function DiagnosisCard({ diagnosis, rank }: { diagnosis: Differential; rank: number }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Option {rank}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">{diagnosis.dx}</h3>
        </div>
        <Badge>{diagnosis.icd10}</Badge>
      </div>
      <p className="text-sm leading-6 text-slate-700">{diagnosis.rationale}</p>
      {diagnosis.support.length > 0 ? (
        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
          Supported by {diagnosis.support.map((support) => support.snippet_id).join(", ")}
        </p>
      ) : null}
    </Card>
  );
}

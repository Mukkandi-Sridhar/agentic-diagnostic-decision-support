import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Differential } from "@/types";

export function DiagnosisCard({ diagnosis, rank }: { diagnosis: Differential; rank: number }) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Differential {rank}</p>
          <h3 className="text-xl font-semibold text-slate-950">{diagnosis.dx}</h3>
        </div>
        <Badge>{diagnosis.icd10}</Badge>
      </div>
      <p className="text-sm leading-6 text-slate-700">{diagnosis.rationale}</p>
      <div className="flex flex-wrap gap-2">
        {diagnosis.support.map((support) => (
          <span key={support.snippet_id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Evidence {support.snippet_id}
          </span>
        ))}
      </div>
    </Card>
  );
}


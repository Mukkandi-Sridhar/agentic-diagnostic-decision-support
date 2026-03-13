import { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon,
  detail
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  detail: string;
}) {
  return (
    <Card className="bg-white/90">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-muted">{detail}</p>
        </div>
        <div className="rounded-2xl bg-accentSoft p-3 text-accent">{icon}</div>
      </div>
    </Card>
  );
}

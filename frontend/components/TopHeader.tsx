import { Bell, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function TopHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <Badge>Grounded Imaging AI</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted">
          <Search className="h-4 w-4" />
          Search cases, PMIDs, metrics
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white">
          <Bell className="h-5 w-5 text-slate-700" />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          <ShieldCheck className="h-4 w-4" />
          Safety layer active
        </div>
      </div>
    </header>
  );
}


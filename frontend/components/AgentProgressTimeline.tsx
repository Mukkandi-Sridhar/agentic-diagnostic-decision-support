import { CheckCircle2, Clock3, LoaderCircle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { CaseProgressEvent } from "@/types";

export function AgentProgressTimeline({ events }: { events: CaseProgressEvent[] }) {
  return (
    <Card className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-slate-950">Agent Workflow Timeline</h3>
        <p className="mt-1 text-sm text-muted">Monitor how each specialized agent contributes to the final grounded report.</p>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={`${event.step}-${event.timestamp}`} className="flex gap-4 rounded-2xl border border-border bg-slate-50 p-4">
            <div className="mt-0.5">
              {event.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-accent" />
              ) : event.status === "running" ? (
                <LoaderCircle className="h-5 w-5 animate-spin text-accent" />
              ) : (
                <Clock3 className="h-5 w-5 text-muted" />
              )}
            </div>
            <div>
              <p className="font-medium capitalize text-slate-950">{event.step.replace("_", " ")}</p>
              <p className="text-sm text-muted">{event.message}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}


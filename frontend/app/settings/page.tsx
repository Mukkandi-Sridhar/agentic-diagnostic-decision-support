"use client";

import { useEffect, useState } from "react";

import { PortalShell } from "@/components/PortalShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSettingsSnapshot } from "@/lib/api";
import { SettingsSnapshot } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsSnapshot | null>(null);

  useEffect(() => {
    getSettingsSnapshot().then(setSettings).catch(() => setSettings(null));
  }, []);

  return (
    <PortalShell
      title="System Settings"
      description="Review model routing, RAG storage, and environment-backed configuration."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-950">Model Configuration</h2>
            <Badge>{settings?.use_remote_models ? "Remote mode" : "Local fallback mode"}</Badge>
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">Gemini configured: {String(settings?.gemini_configured ?? false)}</div>
            <div className="rounded-2xl bg-slate-50 p-4">
              OpenAI fallback configured: {String(settings?.openai_fallback_configured ?? false)}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              PubMed email identity: {settings?.pubmed_email ?? "research@example.com"}
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <h2 className="text-2xl font-semibold text-slate-950">RAG and Storage</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl bg-slate-50 p-4">Vector store path: {settings?.vector_store_path ?? "data/indexes/medical_index"}</div>
            <div className="rounded-2xl bg-slate-50 p-4">Upload directory: {settings?.upload_dir ?? "data/uploads"}</div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              Store real API keys in `.env` only. The repository includes `.env.template` and never ships secrets.
            </div>
          </div>
        </Card>
      </div>
    </PortalShell>
  );
}

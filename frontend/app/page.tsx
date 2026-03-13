import Link from "next/link";
import { ArrowRight, BrainCircuit, LibraryBig, ScanLine, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Agentic orchestration",
    description: "CrewAI-style workflow coordinates vision, retrieval, diagnosis, citation verification, and safety agents.",
    icon: BrainCircuit
  },
  {
    title: "Imaging-grounded analysis",
    description: "Chest X-ray uploads drive structured findings, overlay visualization, and explainable evidence panels.",
    icon: ScanLine
  },
  {
    title: "Literature-backed output",
    description: "PubMed retrieval plus FAISS indexing surface supporting snippets, PMIDs, DOIs, and rationale links.",
    icon: LibraryBig
  },
  {
    title: "Safety and compliance",
    description: "The final report adds PHI scrubbing, disclaimers, and a visible research-only compliance banner.",
    icon: ShieldAlert
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 bg-mesh px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 px-8 py-10 backdrop-blur md:px-12 md:py-16">
          <Badge className="border-teal-400/20 bg-teal-400/10 text-teal-200">Research / Education Only</Badge>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_420px]">
            <div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white md:text-6xl">
                Agentic Diagnostic Decision Support System with Imaging
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                A complete prototype for grounded chest X-ray decision support, combining multi-agent reasoning, medical literature retrieval, overlay visualization, and citation-backed reporting in a clinical dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link className={buttonVariants("default", "h-12 px-6 text-base")} href="/dashboard">
                  Start Analysis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link className={buttonVariants("outline", "h-12 px-6 text-base")} href="/new-case">
                  Open New Case
                </Link>
              </div>
            </div>

            <Card className="bg-white/10 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-teal-200">System Snapshot</p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">Primary model</p>
                  <p className="mt-2 text-2xl font-semibold">Gemini API</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">Fallback model</p>
                  <p className="mt-2 text-2xl font-semibold">OpenAI GPT-4o</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-5">
                  <p className="text-sm text-slate-300">Retrieval stack</p>
                  <p className="mt-2 text-2xl font-semibold">PubMed + FAISS RAG</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border-white/10 bg-white/5 text-white">
              <div className="rounded-2xl bg-teal-400/10 p-3 text-teal-200">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}

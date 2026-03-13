"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FilePlus2, FolderClock, Gauge, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/new-case", label: "New Case", icon: FilePlus2 },
  { href: "/history", label: "Case History", icon: FolderClock },
  { href: "/settings", label: "Settings", icon: Settings2 }
];

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col rounded-[2rem] border border-white/60 bg-slate-950 px-5 py-6 text-white shadow-clinical">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20">
          <Activity className="h-6 w-6 text-teal-300" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-teal-300">ADDS</p>
          <h2 className="text-lg font-semibold">Imaging Console</h2>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-teal-300">Research Use</p>
        <p className="mt-2 text-sm text-slate-200">Not a Medical Device. Clinician review required for every result.</p>
      </div>
    </aside>
  );
}


import { ReactNode } from "react";

import { SidebarNavigation } from "@/components/SidebarNavigation";
import { TopHeader } from "@/components/TopHeader";

export function PortalShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background bg-mesh p-4 text-foreground md:p-6">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <SidebarNavigation />
        <main className="space-y-6">
          <TopHeader title={title} description={description} />
          {children}
        </main>
      </div>
    </div>
  );
}


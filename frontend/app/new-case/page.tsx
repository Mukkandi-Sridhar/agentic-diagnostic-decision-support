import { CaseForm } from "@/components/CaseForm";
import { PortalShell } from "@/components/PortalShell";

export default function NewCasePage() {
  return (
    <PortalShell
      title="New Analysis"
      description="Upload a chest X-ray, add the essential clinical details, and generate a grounded diagnostic report."
    >
      <CaseForm />
    </PortalShell>
  );
}

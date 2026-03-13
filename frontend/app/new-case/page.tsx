import { CaseForm } from "@/components/CaseForm";
import { PortalShell } from "@/components/PortalShell";

export default function NewCasePage() {
  return (
    <PortalShell
      title="New Case Intake"
      description="Capture structured clinical information, upload a chest X-ray, and submit the case into the multi-agent diagnostic workflow."
    >
      <CaseForm />
    </PortalShell>
  );
}


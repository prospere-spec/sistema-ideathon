import { PhaseManagementPage } from "@/components/phase-management-page";

export default async function PhasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PhaseManagementPage ideathonId={id} />;
}

import { PhaseIdeasPage } from "@/components/phase-ideas-page";

export default async function PhaseIdeasRoute({ params }: { params: Promise<{ id: string; phaseId: string }> }) {
  const { id, phaseId } = await params;
  return <PhaseIdeasPage ideathonId={id} phaseId={phaseId} />;
}

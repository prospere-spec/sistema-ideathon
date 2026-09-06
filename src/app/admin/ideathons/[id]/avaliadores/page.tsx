import { EvaluatorManagementPage } from "@/components/evaluator-management-page";

export default async function EvaluatorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EvaluatorManagementPage ideathonId={id} />;
}

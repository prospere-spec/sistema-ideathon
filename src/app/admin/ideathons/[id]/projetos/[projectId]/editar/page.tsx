import { ProjectFormPage } from "@/components/project-form-page";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string; projectId: string }> }) {
  const { id, projectId } = await params;
  return <ProjectFormPage mode="edit" ideathonId={id} ideaId={projectId} />;
}

import { ProjectFormPage } from "@/components/project-form-page";

export default async function NewProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectFormPage mode="create" ideathonId={id} />;
}

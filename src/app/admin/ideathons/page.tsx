import { IdeathonsListPage } from "@/components/ideathons-list-page";

export default async function IdeathonsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  return <IdeathonsListPage initialSearch={params.q || ""} />;
}
